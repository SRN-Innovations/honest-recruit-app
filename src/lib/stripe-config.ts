import Stripe from "stripe";

// Stripe configuration - only initialize on server side
export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
};

// Plan configurations
export const SUBSCRIPTION_PLANS = {
  one_off: {
    name: "One-Off Job Post",
    price: 15000, // £150.00 in pence
    price_display: "£150",
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
    price: 24999, // £249.99 in pence
    price_display: "249.99",
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

// Stripe product IDs (you'll need to create these in your Stripe dashboard)
export const STRIPE_PRODUCT_IDS = {
  one_off: "prod_one_off_job_post",
  starter: "prod_starter_plan",
  growth: "prod_growth_plan",
  unlimited: "prod_unlimited_plan",
} as const;

// Stripe price IDs (you'll need to create these in your Stripe dashboard)
export const STRIPE_PRICE_IDS = {
  one_off: "price_one_off_job_post",
  starter: "price_starter_plan_monthly",
  growth: "price_growth_plan_monthly",
  unlimited: "price_unlimited_plan_monthly",
} as const;

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
