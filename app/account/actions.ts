"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, anonymiseAndDeleteUser } from "@/lib/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseAdminClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";

/**
 * GDPR account deletion. Anonymises the user's reports, deletes their app row,
 * removes the Supabase auth account (if the service-role key is configured),
 * then signs out and returns home.
 */
export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const authUserId = data.user?.id;

  // 1. App data: anonymise reports + delete the User row.
  await anonymiseAndDeleteUser(user.id);

  // 2. Auth account (best effort — needs service-role key on the server).
  if (authUserId && isAdminClientConfigured) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.auth.admin.deleteUser(authUserId);
    } catch {
      // If this fails, app data is already gone; the auth shell can be removed
      // manually in Supabase. Don't block the user's deletion on it.
    }
  }

  // 3. End the session and leave.
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
