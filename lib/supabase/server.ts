import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both Supabase env vars are present (mirrors the browser flag). */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Server-side Supabase client. Reads/writes the session cookie via next/headers.
 * In a pure Server Component cookie writes are a no-op (read-only context); the
 * middleware refreshes the session cookie there instead.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(url as string, anonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}
