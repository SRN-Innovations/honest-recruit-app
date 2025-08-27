import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing user tables for data...");

    // Check different tables that might contain user data
    const tables = [
      "user_profiles",
      "candidate_profiles",
      "employer_profiles",
      "auth.users",
    ];

    const results: any = {};

    for (const tableName of tables) {
      try {
        if (tableName === "auth.users") {
          // Special handling for auth.users
          const { data, error } = await supabase.auth.admin.listUsers();
          if (error) {
            results[tableName] = { exists: false, error: error.message };
          } else {
            results[tableName] = {
              exists: true,
              count: data.users?.length || 0,
              sampleUsers:
                data.users
                  ?.slice(0, 2)
                  .map((u) => ({ id: u.id, email: u.email })) || [],
            };
          }
        } else {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .limit(5);

          if (error) {
            results[tableName] = { exists: false, error: error.message };
          } else {
            results[tableName] = {
              exists: true,
              count: data?.length || 0,
              columns: data && data.length > 0 ? Object.keys(data[0]) : [],
              sampleData: data?.slice(0, 2) || [],
            };
          }
        }
      } catch (e) {
        results[tableName] = { exists: false, error: String(e) };
      }
    }

    return NextResponse.json({
      success: true,
      message: "User tables check completed",
      tables: results,
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
