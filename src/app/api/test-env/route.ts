import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envVars = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
        ? "Set (length: " + process.env.STRIPE_SECRET_KEY.length + ")"
        : "Not set",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
        ? "Set (length: " + process.env.STRIPE_PUBLISHABLE_KEY.length + ")"
        : "Not set",
      STRIPE_PRICE_ID_STARTER: process.env.STRIPE_PRICE_ID_STARTER || "Not set",
      STRIPE_PRICE_ID_GROWTH: process.env.STRIPE_PRICE_ID_GROWTH || "Not set",
      STRIPE_PRICE_ID_UNLIMITED:
        process.env.STRIPE_PRICE_ID_UNLIMITED || "Not set",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Set"
        : "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Set"
        : "Not set",
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
      },
      { status: 500 }
    );
  }
}
