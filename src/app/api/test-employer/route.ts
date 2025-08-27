import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing employer_profiles data...");

    // Get all records from employer_profiles
    const { data, error } = await supabase
      .from("employer_profiles")
      .select("*");

    if (error) {
      console.error("Error querying employer_profiles:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    // Get the first few records to see the structure
    const sampleRecords = data?.slice(0, 3) || [];
    const allColumns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      success: true,
      message: "Employer profiles data retrieved",
      totalRecords: data?.length || 0,
      columns: allColumns,
      sampleRecords: sampleRecords,
      allRecords: data,
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
