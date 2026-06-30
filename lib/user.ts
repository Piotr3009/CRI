import type { User, UserRole } from "@prisma/client";
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

/** A user row plus how many reports they have submitted. */
export type UserWithReportCount = User & { _count: { reports: number } };

/** All registered users, newest first, with their report counts. Admin-only. */
export async function getAllUsers(): Promise<UserWithReportCount[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reports: true } } },
  });
}

/**
 * Set a user's role. Caller MUST verify the actor is a SUPER_ADMIN first — this
 * function does not check permissions itself.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

/** Reports submitted by this user, newest first. */
export async function getReportsByUser(userId: string) {
  return prisma.riskReport.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * GDPR erasure of the application data for a user:
 *  - anonymises their submitted reports (keeps the report content/scores, strips
 *    the reporter's personal details), then
 *  - deletes the User row (reporterId on their reports auto-nulls via SetNull).
 *
 * Deleting the Supabase auth account is done separately by the caller (needs the
 * service-role client).
 */
export async function anonymiseAndDeleteUser(userId: string): Promise<void> {
  await prisma.riskReport.updateMany({
    where: { reporterId: userId },
    data: {
      reporterCompanyName: "Anonymised",
      reporterContactName: "Anonymised",
      reporterEmail: "anonymised@redacted.invalid",
      reporterPhone: null,
    },
  });
  await prisma.user.delete({ where: { id: userId } });
}
