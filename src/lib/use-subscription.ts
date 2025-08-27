import { useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: "one_off" | "starter" | "growth" | "unlimited";
  status: "active" | "cancelled" | "past_due" | "unpaid";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  job_limit: number;
  jobs_posted: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  remainingJobs: number;
  canPostJobs: boolean;
}

export const useSubscription = () => {
  const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    // Wait for auth to fully load and user to be available
    if (authLoading || !isLoggedIn || !currentUserId) {
      console.log(
        "useSubscription: Waiting for auth to load or user not available",
        {
          authLoading,
          isLoggedIn,
          hasUserId: !!currentUserId,
        }
      );
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log(
        "useSubscription: Fetching subscription for user:",
        currentUserId
      );
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      console.log("useSubscription: Query result:", {
        data,
        error: fetchError,
      });

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      console.log("useSubscription: Setting subscription:", data);
      setSubscription(data);
    } catch (err) {
      console.error("useSubscription: Error fetching subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when auth is fully loaded and user is available
    if (!authLoading && isLoggedIn && currentUserId) {
      fetchSubscription();
    } else if (!authLoading && !isLoggedIn) {
      // User is not logged in, clear subscription
      setSubscription(null);
      setIsLoading(false);
    }
  }, [authLoading, isLoggedIn, currentUserId]);

  const refreshSubscription = () => {
    fetchSubscription();
  };

  const getRemainingJobs = (): number => {
    if (!subscription) return 0;
    if (subscription.plan_type === "unlimited") return -1; // Unlimited
    return Math.max(0, subscription.job_limit - subscription.jobs_posted);
  };

  const canPostJobs = (): boolean => {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    if (subscription.plan_type === "unlimited") return true;
    return subscription.jobs_posted < subscription.job_limit;
  };

  const getPlanDisplayName = (): string => {
    if (!subscription) return "No Plan";

    const planNames = {
      one_off: "One-Off Job Post",
      starter: "Starter Plan",
      growth: "Growth Plan",
      unlimited: "Unlimited Plan",
    };

    return planNames[subscription.plan_type];
  };

  const getPlanPrice = (): string => {
    if (!subscription) return "";

    const planPrices = {
      one_off: "£149.99",
      starter: "£249.99/month",
      growth: "£400.00/month",
      unlimited: "£749.99/month",
    };

    return planPrices[subscription.plan_type];
  };

  return {
    subscription,
    isLoading: isLoading || authLoading, // Include auth loading state
    error,
    hasSubscription: !!subscription,
    remainingJobs: getRemainingJobs(),
    canPostJobs: canPostJobs(),
    planDisplayName: getPlanDisplayName(),
    planPrice: getPlanPrice(),
    refreshSubscription,
  };
};
