import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-config";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Create a service role client for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Processing checkout session completed:", session.id);

  const { userId, planType, type } = session.metadata;
  console.log("Session metadata:", { userId, planType, type });

  if (type === "one_off") {
    // Handle one-off purchase
    console.log("Processing one-off purchase");

    const { error: oneOffError } = await supabaseAdmin
      .from("one_off_purchases")
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        amount: session.amount_total,
        status: "completed",
        created_at: new Date().toISOString(),
      });

    if (oneOffError) {
      console.error("Error inserting one-off purchase:", oneOffError);
      throw oneOffError;
    }

    // Create a temporary subscription for the one-off purchase
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_type: planType,
        status: "active",
        job_limit: 1,
        jobs_posted: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (subError) {
      console.error("Error inserting one-off subscription:", subError);
      throw subError;
    }

    console.log("One-off purchase and subscription created successfully");
  } else {
    // Handle subscription
    console.log("Processing subscription purchase");

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    console.log("Retrieved subscription:", subscription.id);

    const { error } = await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      plan_type: planType,
      status: subscription.status,
      current_period_start: convertStripeTimestamp(
        subscription.current_period_start
      ),
      current_period_end: convertStripeTimestamp(
        subscription.current_period_end
      ),
      job_limit: getJobLimit(planType),
      jobs_posted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error inserting subscription:", error);
      throw error;
    }

    console.log("Subscription created successfully in database");
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("Processing invoice payment succeeded:", invoice.id);

  if (invoice.subscription) {
    const stripe = getStripe();
    const subscriptionResponse = await stripe.subscriptions.retrieve(
      invoice.subscription
    );
    const subscription = subscriptionResponse as any;

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_start: convertStripeTimestamp(
          subscription.current_period_start
        ),
        current_period_end: convertStripeTimestamp(
          subscription.current_period_end
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription);

    if (error) {
      console.error("Error updating subscription from invoice:", error);
      throw error;
    }

    console.log("Subscription updated from invoice payment");
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log("Processing invoice payment failed:", invoice.id);

  if (invoice.subscription) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription);

    if (error) {
      console.error("Error updating subscription status to past_due:", error);
      throw error;
    }

    console.log("Subscription status updated to past_due");
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("Processing subscription updated:", subscription.id);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: convertStripeTimestamp(
        subscription.current_period_start
      ),
      current_period_end: convertStripeTimestamp(
        subscription.current_period_end
      ),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }

  console.log("Subscription updated successfully");
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Processing subscription deleted:", subscription.id);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription to cancelled:", error);
    throw error;
  }

  console.log("Subscription marked as cancelled");
}

// Helper function to safely convert Stripe timestamps
function convertStripeTimestamp(
  timestamp: number | null | undefined
): string | null {
  if (!timestamp) return null;

  try {
    // Stripe timestamps are in seconds, convert to milliseconds
    const date = new Date(timestamp * 1000);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid timestamp received:", timestamp);
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.error("Error converting timestamp:", timestamp, error);
    return null;
  }
}

function getJobLimit(planType: string): number {
  switch (planType) {
    case "starter":
      return 3;
    case "growth":
      return 10;
    case "unlimited":
      return -1;
    default:
      return 1;
  }
}
