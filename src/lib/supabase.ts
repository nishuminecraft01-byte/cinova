import { createBrowserClient } from "@supabase/ssr";

function cleanEnvValue(raw: string | undefined): string {
  return (raw || "").trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnvValue(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    (supabaseUrl.startsWith("https://") || supabaseUrl.startsWith("http://")) &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseAnonKey.includes("placeholder") &&
    !supabaseAnonKey.includes("your_")
);

/**
 * Browser Supabase client using @supabase/ssr (supports both sb_publishable_ and legacy anon keys).
 * Falls back safely when credentials are not configured yet.
 */
export const supabase = createBrowserClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-domain-cinova.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-key"
);
