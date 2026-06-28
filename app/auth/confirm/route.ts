import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Landing for the email-confirmation link Supabase sends at sign-up.
 * Verifies the token, which signs the user in, then redirects home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (isSupabaseConfigured && tokenHash && type) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
