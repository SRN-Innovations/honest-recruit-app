import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing employer_profiles schema...");
    
    // First, let's see what columns exist by trying to select specific columns
    const { data: allData, error: allError } = await supabase
      .from("employer_profiles")
      .select("*");
    
    if (allError) {
      console.error("Schema error:", allError);
      return NextResponse.json({ 
        success: false, 
        error: allError.message,
        details: allError
      }, { status: 500 });
    }
    
    // Get the first row to see the structure
    const firstRow = allData && allData.length > 0 ? allData[0] : null;
    const columns = firstRow ? Object.keys(firstRow) : [];
    
    // Try to query specific columns to see what exists
    let companyNameTest = null;
    let emailTest = null;
    
    try {
      const { data: companyData } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .limit(1);
      companyNameTest = companyData;
    } catch (e) {
      companyNameTest = { error: String(e) };
    }
    
    try {
      const { data: emailData } = await supabase
        .from("employer_profiles")
        .select("email")
        .limit(1);
      emailTest = emailData;
    } catch (e) {
      emailTest = { error: String(e) };
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Schema check successful",
      columns: columns,
      sampleData: firstRow,
      totalRows: allData?.length || 0,
      companyNameTest: companyNameTest,
      emailTest: emailTest
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
