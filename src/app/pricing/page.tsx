"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/stripe-client-config";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import { Toaster } from "react-hot-toast";

// Declare Stripe as a global variable
declare global {
  interface Window {
    Stripe: any;
  }
}

export default function PricingPage() {
  const { isLoggedIn, userType } = useAuth();
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Load Stripe from CDN
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Stripe) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => {
        setStripeLoaded(true);
        console.log("Stripe loaded from CDN");
      };
      script.onerror = () => {
        console.error("Failed to load Stripe from CDN");
      };
      document.head.appendChild(script);
    } else if (window.Stripe) {
      setStripeLoaded(true);
    }
  }, []);

  const handleSubscribe = async (planType: PlanType) => {
    if (!isLoggedIn) {
      toast.error("Please sign in to subscribe");
      return;
    }

    if (userType !== "employer") {
      toast.error("Only employers can subscribe to plans");
      return;
    }

    if (!stripeLoaded) {
      toast.error("Stripe is still loading, please try again");
      return;
    }

    setLoading(planType);

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User session not found");
        return;
      }

      console.log("Calling API with user ID:", user.id);

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          userId: user.id,
        }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(
          `Failed to create checkout session: ${response.status} ${errorText}`
        );
      }

      const { sessionId } = await response.json();
      console.log("Got session ID:", sessionId);

      // Use Stripe from CDN
      const stripe = window.Stripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription process");
    } finally {
      setLoading(null);
    }
  };

  const isPopular = (planType: PlanType) => planType === "growth";

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />

      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
                Choose Your Plan
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Find the perfect plan for your recruitment needs. Scale up or
                down at your convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(SUBSCRIPTION_PLANS).map(([planType, plan]) => (
              <div
                key={planType}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                  isPopular(planType as PlanType)
                    ? "border-blue-500 dark:border-blue-400 scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {isPopular(planType as PlanType) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {plan.description}
                    </p>

                    <div className="mb-8">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price_display}
                      </span>
                      {planType !== "one_off" && (
                        <span className="text-gray-600 dark:text-gray-400">
                          /month
                        </span>
                      )}
                    </div>

                    <div className="mb-8">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.job_limit === -1
                          ? "Unlimited"
                          : `Up to ${plan.job_limit}`}{" "}
                        job postings
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(planType as PlanType)}
                    disabled={loading === planType || userType !== "employer"}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                      isPopular(planType as PlanType)
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"
                    } ${
                      loading === planType || userType !== "employer"
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                  >
                    {loading === planType ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </div>
                    ) : planType === "one_off" ? (
                      "Buy Now"
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>

                  {userType !== "employer" && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                      Only employers can subscribe
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I change my plan at any time?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, you can upgrade or downgrade your subscription at any
                  time. Changes will take effect at the start of your next
                  billing cycle.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What happens if I exceed my job limit?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You&apos;ll need to upgrade your plan or wait until your next
                  billing cycle. Existing job postings will remain active until
                  they expire.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  How long do job postings stay active?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Job postings remain active for 30 days from the date of
                  posting. You can renew them before expiration to keep them
                  active.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Is there a setup fee?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No setup fees. You only pay for the plan you choose. The
                  one-off job post is a single payment with no recurring
                  charges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
      <Toaster position="top-right" />
    </div>
  );
}
