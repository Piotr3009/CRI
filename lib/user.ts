import type { User } from "@prisma/client";
import { prisma } from "./db";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "./supabase/server";

function metaString(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Returns the application `User` row for the currently signed-in Supabase user,
 * creating / syncing it on first call. Returns null when nobody is signed in.
 *
 * Linking is by email (unique on both sides). Registration details are passed
 * through Supabase user_metadata at sign-up and mirrored here.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const email = data.user.email;
  if (!email) return null;

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const companyName = metaString(meta, "companyName");
  const name = metaString(meta, "contactName");
  const tradeType = metaString(meta, "tradeType");
  const companyNumber = metaString(meta, "companyNumber");
  const phone = metaString(meta, "phone");

  return prisma.user.upsert({
    where: { email },
    update: {
      ...(companyName ? { companyName } : {}),
      ...(name ? { name } : {}),
      ...(tradeType ? { tradeType } : {}),
      ...(companyNumber ? { companyNumber } : {}),
      ...(phone ? { phone } : {}),
    },
    create: {
      email,
      companyName,
      name,
      tradeType,
      companyNumber,
      phone,
      role: "CONTRACTOR",
      verifiedStatus: "UNVERIFIED",
    },
  });
}
