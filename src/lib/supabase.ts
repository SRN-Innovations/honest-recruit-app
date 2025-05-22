import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL available:", !!supabaseUrl);
console.log("Supabase Anon Key available:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

console.log("Initializing Supabase client with:", {
  url: supabaseUrl.substring(0, 10) + "...",
  keyLength: supabaseAnonKey.length,
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase
  .from("user_profiles")
  .select("*")
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error("Supabase connection test failed:", error);
    } else {
      console.log("Supabase connection test successful");
    }
  });
