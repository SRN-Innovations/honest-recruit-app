// Client-side Stripe configuration (safe for browser)
// This file only exports plan information and constants

// Plan configurations
export const SUBSCRIPTION_PLANS = {
  one_off: {
    name: "One-Off Job Post",
    price: 14999, // £149.99 in pence
    price_display: "£149.99",
    job_limit: 1,
    description: "Post a single job listing",
    features: [
      "Single job posting",
      "Valid for 30 days",
      "No recurring charges",
      "Full job management tools",
    ],
  },
  starter: {
    name: "Starter Plan",
    price: 25000, // £250.00 in pence
    price_display: "£250.00",
    job_limit: 3,
    description: "Perfect for small recruitment agencies",
    features: [
      "Up to 3 active job postings",
      "Monthly billing",
      "Priority support",
      "Advanced analytics",
    ],
  },
  growth: {
    name: "Growth Plan",
    price: 40000, // £400.00 in pence
    price_display: "£400",
    job_limit: 10,
    description: "Ideal for growing businesses",
    features: [
      "Up to 10 active job postings",
      "Monthly billing",
      "Priority support",
      "Advanced analytics",
      "Custom branding options",
    ],
  },
  unlimited: {
    name: "Unlimited Plan",
    price: 80000, // £800.00 in pence
    price_display: "£800",
    job_limit: -1, // -1 indicates unlimited
    description: "For large-scale recruitment operations",
    features: [
      "Unlimited job postings",
      "Monthly billing",
      "Priority support",
      "Advanced analytics",
      "Custom branding options",
      "API access",
      "Dedicated account manager",
    ],
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// Helper function to get plan details
export const getPlanDetails = (planType: PlanType) => {
  return SUBSCRIPTION_PLANS[planType];
};

// Helper function to check if user can post more jobs
export const canPostJob = (
  currentJobs: number,
  planType: PlanType
): boolean => {
  const plan = SUBSCRIPTION_PLANS[planType];
  if (plan.job_limit === -1) return true; // Unlimited plan
  return currentJobs < plan.job_limit;
};

// Helper function to get remaining job slots
export const getRemainingJobSlots = (
  currentJobs: number,
  planType: PlanType
): number => {
  const plan = SUBSCRIPTION_PLANS[planType];
  if (plan.job_limit === -1) return -1; // Unlimited plan
  return Math.max(0, plan.job_limit - currentJobs);
};
