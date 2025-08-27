import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-config";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/stripe-client-config";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("Stripe checkout route called");

    // Parse request body
    const { planType, userId } = await request.json();
    console.log("Request data:", { planType, userId });

    if (!planType || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[planType as PlanType];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    console.log("Plan validated:", plan.name);

    // Instead of querying employer_profiles (which has RLS),
    // let's get the user's email from the auth context
    // For now, let's create a checkout session without the user details
    // and handle the user lookup on the frontend

    console.log("Creating Stripe checkout session...");

    // Create the Stripe checkout session
    const stripe = getStripe();
    let session;

    if (planType === "one_off") {
      // Create one-time payment session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: plan.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/employer/dashboard?success=true&plan=${planType}`,
        cancel_url: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/pricing?canceled=true`,
        metadata: {
          userId,
          planType,
          type: "one_off",
        },
        // We'll get the email from the frontend instead
        // customer_email: userData.business_email,
      });
    } else {
      // Create subscription session
      let priceId: string;

      switch (planType) {
        case "starter":
          priceId = process.env.STRIPE_PRICE_ID_STARTER!;
          break;
        case "growth":
          priceId = process.env.STRIPE_PRICE_ID_GROWTH!;
          break;
        case "unlimited":
          priceId = process.env.STRIPE_PRICE_ID_UNLIMITED!;
          break;
        default:
          return NextResponse.json(
            { error: "Invalid plan type for subscription" },
            { status: 400 }
          );
      }

      if (!priceId) {
        return NextResponse.json(
          { error: `Price ID not configured for ${planType} plan` },
          { status: 500 }
        );
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/employer/dashboard?success=true&plan=${planType}`,
        cancel_url: `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/pricing?canceled=true`,
        metadata: {
          userId,
          planType,
          type: "subscription",
        },
        // We'll get the email from the frontend instead
        // customer_email: userData.business_email,
        subscription_data: {
          metadata: {
            userId,
            planType,
          },
        },
        allow_promotion_codes: true,
      });
    }

    console.log("Stripe session created successfully:", session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error in stripe checkout route:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
