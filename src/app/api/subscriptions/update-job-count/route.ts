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
    const { userId, jobId } = await request.json();

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "userId and jobId are required" },
        { status: 400 }
      );
    }

    console.log("Updating job count for user:", userId, "job:", jobId);

    // Get the user's active subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if user can post more jobs
    if (
      subscription.plan_type !== "unlimited" &&
      subscription.jobs_posted >= subscription.job_limit
    ) {
      return NextResponse.json(
        { error: "Job limit reached for current subscription" },
        { status: 403 }
      );
    }

    // Update the job count
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        jobs_posted: subscription.jobs_posted + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Error updating job count:", updateError);
      return NextResponse.json(
        { error: "Failed to update job count" },
        { status: 500 }
      );
    }

    // Create a job posting record for tracking
    const { error: jobRecordError } = await supabaseAdmin
      .from("job_postings")
      .update({
        subscription_id: subscription.id,
        posted_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobRecordError) {
      console.error("Error updating job record:", jobRecordError);
      // Don't fail the whole request if this fails
    }

    console.log("Job count updated successfully");

    return NextResponse.json({
      success: true,
      newJobCount: subscription.jobs_posted + 1,
      remainingJobs:
        subscription.plan_type === "unlimited"
          ? -1
          : Math.max(
              0,
              subscription.job_limit - (subscription.jobs_posted + 1)
            ),
    });
  } catch (error) {
    console.error("Error in update-job-count route:", error);
    return NextResponse.json(
      { error: "Failed to update job count" },
      { status: 500 }
    );
  }
}

