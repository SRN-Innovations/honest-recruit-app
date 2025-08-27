import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET() {
  try {
    console.log("Testing subscription data...");

    // Check subscriptions table
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // Check one_off_purchases table
    const { data: oneOffs, error: oneOffError } = await supabaseAdmin
      .from("one_off_purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (oneOffError) {
      console.error("Error fetching one-off purchases:", oneOffError);
      return NextResponse.json({ error: oneOffError.message }, { status: 500 });
    }

    console.log("Subscription data retrieved successfully");

    return NextResponse.json({
      success: true,
      subscriptions: {
        count: subscriptions?.length || 0,
        data: subscriptions || [],
      },
      oneOffPurchases: {
        count: oneOffs?.length || 0,
        data: oneOffs || [],
      },
    });
  } catch (error) {
    console.error("Error in test-subscriptions route:", error);
    return NextResponse.json(
      { error: "Failed to test subscriptions" },
      { status: 500 }
    );
  }
}
