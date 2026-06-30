/**
 * Admin access control, backed by real Supabase accounts and the User.role enum.
 *
 * A user reaches the moderation area only if their application `User` row has
 * role ADMIN or SUPER_ADMIN. SUPER_ADMIN additionally unlocks owner-only data
 * (e.g. pay-per-report revenue) — gate those bits with `isSuperAdmin()`.
 *
 * Promoting the first SUPER_ADMIN is a manual database step (see
 * migration-super-admin.sql):
 *   UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';
 */

import type { User } from "@prisma/client";
import { getCurrentUser } from "@/lib/user";

/** True for any admin tier (ADMIN or SUPER_ADMIN). */
export function isAdminRole(role: User["role"]): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** True only for the owner tier. */
export function isSuperAdmin(
  user: Pick<User, "role"> | null | undefined,
): boolean {
  return user?.role === "SUPER_ADMIN";
}

/**
 * The signed-in user if they may access the admin area, else null.
 *
 * Returns null both when nobody is signed in and when the signed-in user lacks
 * an admin role — callers that need to tell those apart (e.g. to show "sign in"
 * vs "no access") should call getCurrentUser() themselves and use isAdminRole().
 */
export async function getAdminUser(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return isAdminRole(user.role) ? user : null;
}
