import { supabase } from "./supabase";
import {
  canPostJob,
  getRemainingJobSlots,
  SUBSCRIPTION_PLANS,
  PlanType,
} from "./stripe-config";

export interface SubscriptionStatus {
  isActive: boolean;
  planType: PlanType | null;
  jobLimit: number;
  jobsPosted: number;
  remainingSlots: number;
  canPostJob: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripe_subscription_id?: string;
}

export async function getUserSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  try {
    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !subscription) {
      return {
        isActive: false,
        planType: null,
        jobLimit: 0,
        jobsPosted: 0,
        remainingSlots: 0,
        canPostJob: false,
        status: "no_subscription",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Check if subscription is expired
    if (
      subscription.current_period_end &&
      new Date(subscription.current_period_end) < new Date()
    ) {
      return {
        isActive: false,
        planType: subscription.plan_type as PlanType,
        jobLimit: subscription.job_limit,
        jobsPosted: subscription.jobs_posted,
        remainingSlots: 0,
        canPostJob: false,
        status: "expired",
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    }

    const canPost = canPostJob(
      subscription.jobs_posted,
      subscription.plan_type as PlanType
    );
    const remainingSlots = getRemainingJobSlots(
      subscription.jobs_posted,
      subscription.plan_type as PlanType
    );

    return {
      isActive: true,
      planType: subscription.plan_type as PlanType,
      jobLimit: subscription.job_limit,
      jobsPosted: subscription.jobs_posted,
      remainingSlots,
      canPostJob: canPost,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripe_subscription_id: subscription.stripe_subscription_id,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return {
      isActive: false,
      planType: null,
      jobLimit: 0,
      jobsPosted: 0,
      remainingSlots: 0,
      canPostJob: false,
      status: "error",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
}

export async function incrementJobCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ jobs_posted: supabase.rpc("increment_jobs_posted") })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error incrementing job count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing job count:", error);
    return false;
  }
}

export async function decrementJobCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ jobs_posted: supabase.rpc("decrement_jobs_posted") })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error decrementing job count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error decrementing job count:", error);
    return false;
  }
}

export async function checkJobPostingPermission(userId: string): Promise<{
  canPost: boolean;
  reason?: string;
  subscriptionStatus: SubscriptionStatus;
}> {
  const subscriptionStatus = await getUserSubscriptionStatus(userId);

  if (!subscriptionStatus.isActive) {
    return {
      canPost: false,
      reason:
        "No active subscription found. Please subscribe to a plan to post jobs.",
      subscriptionStatus,
    };
  }

  if (!subscriptionStatus.canPostJob) {
    const plan = SUBSCRIPTION_PLANS[subscriptionStatus.planType!];
    return {
      canPost: false,
      reason: `You have reached your job limit (${plan.job_limit} jobs). Please upgrade your plan or wait until your next billing cycle.`,
      subscriptionStatus,
    };
  }

  return {
    canPost: true,
    subscriptionStatus,
  };
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  if (!status.isActive) {
    return "No active subscription";
  }

  const plan = SUBSCRIPTION_PLANS[status.planType!];
  if (status.jobLimit === -1) {
    return `${plan.name} - Unlimited jobs (${status.jobsPosted} posted)`;
  }

  return `${plan.name} - ${status.jobsPosted}/${status.jobLimit} jobs posted`;
}
