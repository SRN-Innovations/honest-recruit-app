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

interface SubscriptionCheckProps {
  onSubscriptionValid: (status: SubscriptionStatus) => void;
  showUpgradePrompt?: boolean;
}

export default function SubscriptionCheck({
  onSubscriptionValid,
  showUpgradePrompt = true,
}: SubscriptionCheckProps) {
  const { isLoggedIn } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
      onSubscriptionValid(status);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const plan = subscriptionStatus.planType
    ? SUBSCRIPTION_PLANS[subscriptionStatus.planType]
    : null;

  if (subscriptionStatus.isActive && subscriptionStatus.canPostJob) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Subscription Active
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>
                {plan?.name} - {subscriptionStatus.jobsPosted}/
                {subscriptionStatus.jobLimit === -1
                  ? "∞"
                  : subscriptionStatus.jobLimit}{" "}
                jobs posted
              </p>
              {subscriptionStatus.remainingSlots > 0 && (
                <p className="mt-1">
                  You can post {subscriptionStatus.remainingSlots} more job
                  {subscriptionStatus.remainingSlots !== 1 ? "s" : ""}.
                </p>
              )}
              {subscriptionStatus.currentPeriodEnd && (
                <p className="mt-1">
                  Next billing:{" "}
                  {new Date(
                    subscriptionStatus.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {subscriptionStatus.isActive
              ? "Job Limit Reached"
              : "Subscription Required"}
          </h3>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            {subscriptionStatus.isActive ? (
              <p>
                You have reached your job limit ({subscriptionStatus.jobLimit}{" "}
                jobs).
                {subscriptionStatus.currentPeriodEnd && (
                  <span>
                    {" "}
                    Your limit will reset on{" "}
                    {new Date(
                      subscriptionStatus.currentPeriodEnd
                    ).toLocaleDateString()}
                    .
                  </span>
                )}
              </p>
            ) : (
              <p>You need an active subscription to post jobs.</p>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
