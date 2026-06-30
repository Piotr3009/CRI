"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { isSuperAdmin } from "@/lib/auth";
import { getCurrentUser, updateUserRole } from "@/lib/user";

const ROLE_VALUES: UserRole[] = ["CONTRACTOR", "ADMIN", "SUPER_ADMIN"];

/**
 * Change a user's role. Super-admin only. A super-admin cannot change their own
 * role (prevents accidental self-lockout / removing the last super-admin).
 */
export async function updateUserRoleAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) redirect("/admin");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !ROLE_VALUES.includes(role as UserRole)) return;

  // Self-lockout guard.
  if (me && userId === me.id) return;

  await updateUserRole(userId, role as UserRole);
  revalidatePath("/admin/users");
}
