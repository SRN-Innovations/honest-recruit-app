"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserSubscriptionStatus,
  SubscriptionStatus,
} from "@/lib/subscription-middleware";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/stripe-client-config";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SubscriptionManager() {
  const { isLoggedIn } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      checkSubscription();
    }
  }, [isLoggedIn]);

  const checkSubscription = async () => {
    if (!isLoggedIn) return;

    try {
      // Get current user ID from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const status = await getUserSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionStatus?.stripe_subscription_id) return;

    setCanceling(true);
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscriptionStatus.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success(
        "Subscription will be cancelled at the end of the current period"
      );
      await checkSubscription(); // Refresh status
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscriptionStatus?.stripe_subscription_id) return;

    try {
      const response = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscriptionStatus.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      toast.success("Subscription reactivated successfully");
      await checkSubscription(); // Refresh status
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have an active subscription. Subscribe to a plan to start
            posting jobs.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const plan = subscriptionStatus.planType
    ? SUBSCRIPTION_PLANS[subscriptionStatus.planType]
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Subscription Details
        </h3>
        <Link
          href="/pricing"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Change Plan
        </Link>
      </div>

      <div className="space-y-4">
        {/* Plan Information */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Plan
          </span>
          <span className="text-sm text-gray-900 dark:text-white">
            {plan?.name}
          </span>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              subscriptionStatus.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : subscriptionStatus.status === "cancelled"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}
          >
            {subscriptionStatus.status.charAt(0).toUpperCase() +
              subscriptionStatus.status.slice(1)}
          </span>
        </div>

        {/* Job Usage */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Jobs Posted
          </span>
          <span className="text-sm text-gray-900 dark:text-white">
            {subscriptionStatus.jobsPosted}/
            {subscriptionStatus.jobLimit === -1
              ? "∞"
              : subscriptionStatus.jobLimit}
          </span>
        </div>

        {/* Remaining Slots */}
        {subscriptionStatus.remainingSlots >= 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Remaining Slots
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {subscriptionStatus.remainingSlots === -1
                ? "∞"
                : subscriptionStatus.remainingSlots}
            </span>
          </div>
        )}

        {/* Next Billing */}
        {subscriptionStatus.currentPeriodEnd && (
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {subscriptionStatus.cancelAtPeriodEnd
                ? "Subscription Ends"
                : "Next Billing"}
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {new Date(
                subscriptionStatus.currentPeriodEnd
              ).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-3">
          {subscriptionStatus.status === "active" &&
            !subscriptionStatus.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="w-full px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 dark:bg-gray-700 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
              >
                {canceling ? "Canceling..." : "Cancel Subscription"}
              </button>
            )}

          {subscriptionStatus.cancelAtPeriodEnd && (
            <button
              onClick={handleReactivateSubscription}
              className="w-full px-4 py-2 border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 dark:bg-gray-700 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              Reactivate Subscription
            </button>
          )}

          {subscriptionStatus.status === "active" && (
            <Link
              href="/pricing"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
