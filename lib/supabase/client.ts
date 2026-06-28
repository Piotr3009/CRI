import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both Supabase env vars are present. Lets the UI fall back to a
 * non-auth state instead of crashing if the app is deployed before the env is
 * configured on Vercel.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Browser-side Supabase client (anon key — safe to expose). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(url as string, anonKey as string);
}
