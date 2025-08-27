import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing available tables...");
    
    // Try to query different tables to see what exists
    const tables = [
      'employer_profiles',
      'user_profiles', 
      'candidate_profiles',
      'subscriptions',
      'one_off_purchases'
    ];
    
    const results: any = {};
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          results[tableName] = { exists: false, error: error.message };
        } else {
          results[tableName] = { 
            exists: true, 
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            count: data?.length || 0
          };
        }
      } catch (e) {
        results[tableName] = { exists: false, error: String(e) };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Table check completed",
      tables: results
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
