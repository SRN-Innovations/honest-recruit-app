import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter required" },
        { status: 400 }
      );
    }

    console.log("Debugging subscription for user:", userId);

    // Check ALL subscriptions for this user (not just active ones)
    const { data: allSubscriptions, error: allSubsError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (allSubsError) {
      console.error("Error fetching all subscriptions:", allSubsError);
      return NextResponse.json(
        { error: allSubsError.message },
        { status: 500 }
      );
    }

    // Check active subscriptions specifically
    const { data: activeSubscriptions, error: activeSubsError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

    if (activeSubsError) {
      console.error("Error fetching active subscriptions:", activeSubsError);
      return NextResponse.json(
        { error: activeSubsError.message },
        { status: 500 }
      );
    }

    // Check one_off_purchases
    const { data: oneOffs, error: oneOffError } = await supabaseAdmin
      .from("one_off_purchases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (oneOffError) {
      console.error("Error fetching one-off purchases:", oneOffError);
      return NextResponse.json({ error: oneOffError.message }, { status: 500 });
    }

    console.log("Debug data retrieved successfully");

    return NextResponse.json({
      success: true,
      userId,
      allSubscriptions: {
        count: allSubscriptions?.length || 0,
        data: allSubscriptions || [],
      },
      activeSubscriptions: {
        count: activeSubscriptions?.length || 0,
        data: activeSubscriptions || [],
      },
      oneOffPurchases: {
        count: oneOffs?.length || 0,
        data: oneOffs || [],
      },
    });
  } catch (error) {
    console.error("Error in debug-subscription route:", error);
    return NextResponse.json(
      { error: "Failed to debug subscription" },
      { status: 500 }
    );
  }
}
