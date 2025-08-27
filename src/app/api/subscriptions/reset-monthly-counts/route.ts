import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin operations
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
  try {
    console.log("Starting monthly job count reset...");

    // Get all active recurring subscriptions (not one_off)
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .neq("plan_type", "one_off")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active recurring subscriptions found");
      return NextResponse.json({
        success: true,
        message: "No subscriptions to reset",
        resetCount: 0,
      });
    }

    let resetCount = 0;
    const errors: string[] = [];

    // Reset job counts for each subscription
    for (const subscription of subscriptions) {
      try {
        // Check if it's time to reset (monthly billing cycle)
        const lastReset = subscription.last_reset_date
          ? new Date(subscription.last_reset_date)
          : new Date(subscription.created_at);

        const now = new Date();
        const monthsSinceReset =
          (now.getFullYear() - lastReset.getFullYear()) * 12 +
          (now.getMonth() - lastReset.getMonth());

        // Reset if it's been a month or more
        if (monthsSinceReset >= 1) {
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              jobs_posted: 0,
              last_reset_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);

          if (updateError) {
            console.error(
              `Error resetting subscription ${subscription.id}:`,
              updateError
            );
            errors.push(`Failed to reset subscription ${subscription.id}`);
          } else {
            console.log(`Reset job count for subscription ${subscription.id}`);
            resetCount++;
          }
        }
      } catch (error) {
        console.error(
          `Error processing subscription ${subscription.id}:`,
          error
        );
        errors.push(`Error processing subscription ${subscription.id}`);
      }
    }

    console.log(`Monthly reset completed. Reset ${resetCount} subscriptions.`);

    return NextResponse.json({
      success: true,
      message: `Monthly reset completed successfully`,
      resetCount,
      totalSubscriptions: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in monthly reset route:", error);
    return NextResponse.json(
      { error: "Failed to perform monthly reset" },
      { status: 500 }
    );
  }
}

// Also provide a GET endpoint to check when the next reset will happen
export async function GET() {
  try {
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, plan_type, jobs_posted, job_limit, last_reset_date, created_at"
      )
      .eq("status", "active")
      .neq("plan_type", "one_off")
      .order("last_reset_date", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    const resetInfo = subscriptions?.map((sub) => {
      const lastReset = sub.last_reset_date
        ? new Date(sub.last_reset_date)
        : new Date(sub.created_at);

      const nextReset = new Date(lastReset);
      nextReset.setMonth(nextReset.getMonth() + 1);

      return {
        subscriptionId: sub.id,
        userId: sub.user_id,
        planType: sub.plan_type,
        jobsPosted: sub.jobs_posted,
        jobLimit: sub.job_limit,
        lastReset: lastReset.toISOString(),
        nextReset: nextReset.toISOString(),
        daysUntilReset: Math.ceil(
          (nextReset.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    });

    return NextResponse.json({
      success: true,
      subscriptions: resetInfo || [],
    });
  } catch (error) {
    console.error("Error in GET monthly reset route:", error);
    return NextResponse.json(
      { error: "Failed to fetch reset information" },
      { status: 500 }
    );
  }
}

