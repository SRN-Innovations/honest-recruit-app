import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-config";

export async function GET() {
  try {
    console.log("Testing Stripe connection...");

    // Test Stripe initialization
    const stripe = getStripe();
    console.log("Stripe initialized successfully");

    // Test a simple Stripe API call
    const account = await stripe.accounts.retrieve();
    console.log("Stripe account retrieved:", account.id);

    return NextResponse.json({
      success: true,
      message: "Stripe connection successful",
      accountId: account.id,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Stripe connection failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
