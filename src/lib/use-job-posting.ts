import { useState } from "react";
import { useAuth } from "./auth-context";
import { useSubscription } from "./use-subscription";

export const useJobPosting = () => {
  const { currentUserId } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPostJob = (): boolean => {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    if (subscription.plan_type === "unlimited") return true;
    return subscription.jobs_posted < subscription.job_limit;
  };

  const trackJobPosting = async (jobId: string): Promise<boolean> => {
    if (!currentUserId || !subscription) {
      setError("No active subscription found");
      return false;
    }

    if (!canPostJob()) {
      setError("Job limit reached for current subscription");
      return false;
    }

    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/update-job-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          jobId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update job count");
      }

      const result = await response.json();

      // Refresh subscription data to show updated counts
      await refreshSubscription();

      console.log("Job posting tracked successfully:", result);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to track job posting";
      setError(errorMessage);
      console.error("Error tracking job posting:", err);
      return false;
    } finally {
      setIsPosting(false);
    }
  };

  const getRemainingJobs = (): number => {
    if (!subscription) return 0;
    if (subscription.plan_type === "unlimited") return -1; // Unlimited
    return Math.max(0, subscription.job_limit - subscription.jobs_posted);
  };

  const getNextResetDate = (): Date | null => {
    if (!subscription || subscription.plan_type === "one_off") return null;

    const lastReset = subscription.last_reset_date
      ? new Date(subscription.last_reset_date)
      : new Date(subscription.created_at);

    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);

    return nextReset;
  };

  const getDaysUntilReset = (): number => {
    const nextReset = getNextResetDate();
    if (!nextReset) return 0;

    return Math.ceil(
      (nextReset.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return {
    canPostJob: canPostJob(),
    trackJobPosting,
    isPosting,
    error,
    remainingJobs: getRemainingJobs(),
    nextResetDate: getNextResetDate(),
    daysUntilReset: getDaysUntilReset(),
    clearError: () => setError(null),
  };
};

