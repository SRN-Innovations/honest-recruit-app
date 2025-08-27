"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSubscription } from "@/lib/use-subscription";
import {
  CreditCard,
  Calendar,
  Briefcase,
  Settings,
  ChevronDown,
  Crown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface SubscriptionDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function SubscriptionDropdown({
  isOpen,
  onToggle,
  onClose,
}: SubscriptionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    subscription,
    remainingJobs,
    canPostJobs,
    planDisplayName,
    planPrice,
  } = useSubscription();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!subscription) return null;

  const getStatusColor = () => {
    switch (subscription.status) {
      case "active":
        return "text-green-600";
      case "past_due":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (subscription.status) {
      case "active":
        return <Crown className="w-4 h-4 text-green-600" />;
      case "past_due":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getNextResetDate = () => {
    if (subscription.plan_type === "one_off") return null;

    const lastReset = subscription.last_reset_date
      ? new Date(subscription.last_reset_date)
      : new Date(subscription.created_at);

    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);

    return nextReset;
  };

  const getDaysUntilReset = () => {
    const nextReset = getNextResetDate();
    if (!nextReset) return 0;

    return Math.ceil(
      (nextReset.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const nextReset = getNextResetDate();
  const daysUntilReset = getDaysUntilReset();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <CreditCard className="w-5 h-5" />
        <span className="hidden sm:inline">Subscription</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-4 z-50">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Subscription
              </h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{planDisplayName}</p>
            <p className="text-lg font-bold text-gray-900">{planPrice}</p>
          </div>

          {/* Plan Details */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Job Limit</p>
                  <p className="text-sm font-medium text-gray-900">
                    {subscription.plan_type === "unlimited"
                      ? "∞"
                      : subscription.job_limit}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-sm font-medium text-gray-900">
                    {remainingJobs === -1 ? "∞" : remainingJobs}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {subscription.plan_type !== "unlimited" && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Used: {subscription.jobs_posted}</span>
                  <span>Limit: {subscription.job_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (subscription.jobs_posted / subscription.job_limit) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Started</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(subscription.created_at)}
                  </p>
                </div>
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Next Billing</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Reset Info */}
            {subscription.plan_type !== "one_off" && nextReset && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Next Reset</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(nextReset.toISOString())}
                    </p>
                    <p className="text-xs text-blue-600">
                      {daysUntilReset} days until reset
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3">
            <div className="space-y-2">
              <Link
                href="/pricing"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Manage Plan</span>
              </Link>

              {!canPostJobs && (
                <div className="text-center">
                  <p className="text-xs text-red-600 font-medium">
                    Job limit reached. Upgrade your plan to post more jobs.
                  </p>
                </div>
              )}

              {subscription.plan_type !== "one_off" && daysUntilReset <= 7 && (
                <div className="text-center">
                  <p className="text-xs text-blue-600 font-medium">
                    Job count resets in {daysUntilReset} days
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
