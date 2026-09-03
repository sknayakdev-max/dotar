import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Supabase environment variables are missing! Check your .env.local file."
    );
  }

  return createBrowserClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder"
  );
}

// Optional export if your app imports `supabase` directly
export const supabase = createClient();