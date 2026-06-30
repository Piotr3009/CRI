import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True only when the service-role key is present (server env). */
export const isAdminClientConfigured = Boolean(url && serviceKey);

/**
 * Service-role Supabase client — bypasses RLS and can manage auth users.
 * SERVER ONLY. Never import into client code; the service key must never reach
 * the browser. Used for GDPR account deletion (removing the Supabase auth user).
 */
export function createSupabaseAdminClient() {
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
