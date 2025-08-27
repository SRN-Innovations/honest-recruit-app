import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing Supabase connection details...");

    // Get connection info
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Test a simple query to see what we can access
    const { data: testData, error: testError } = await supabase
      .from("employer_profiles")
      .select("count(*)")
      .limit(1);

    // Try to get the actual count
    const { count, error: countError } = await supabase
      .from("employer_profiles")
      .select("*", { count: "exact", head: true });

    // Try to bypass RLS by using a different approach
    const { data: allData, error: allError } = await supabase
      .from("employer_profiles")
      .select("*")
      .limit(10);

    return NextResponse.json({
      success: true,
      message: "Connection test completed",
      connection: {
        url: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "Not set",
        keyLength: supabaseKey ? supabaseKey.length : 0,
      },
      testQuery: {
        data: testData,
        error: testError,
      },
      countQuery: {
        count: count,
        error: countError,
      },
      allDataQuery: {
        data: allData,
        error: allError,
        recordCount: allData?.length || 0,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
