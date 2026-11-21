import { createBrowserClient } from "@supabase/ssr";

function cleanEnvValue(raw: string | undefined): string {
  return (raw || "").trim().replace(/^["']|["']$/g, "");
}

export const DEFAULT_SUPABASE_URL = "https://cokkdjkdudeedknjwmzh.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_OwzQUJsjKUDnO4JIbCvmIQ_OLidVyee";

const envUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const envAnonKey = cleanEnvValue(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

function isRealVal(val: string): boolean {
  return Boolean(
    val &&
      !val.includes("placeholder") &&
      !val.includes("your-project") &&
      !val.includes("your_")
  );
}

const supabaseUrl = isRealVal(envUrl) ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = isRealVal(envAnonKey) ? envAnonKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    (supabaseUrl.startsWith("https://") || supabaseUrl.startsWith("http://"))
);

/**
 * Browser Supabase client using @supabase/ssr (supports both sb_publishable_ and legacy anon keys).
 * Falls back safely to default project credentials when environment variables are not injected.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
