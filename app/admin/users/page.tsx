import type { Metadata } from "next";
import Link from "next/link";
import { isAdminRole, isSuperAdmin } from "@/lib/auth";
import { getCurrentUser, getAllUsers } from "@/lib/user";
import { AdminUserTable } from "@/components/AdminUserTable";

export const metadata: Metadata = {
  title: "Admin — Users",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me || !isAdminRole(me.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-cri-steel">This area is restricted.</p>
        <Link href="/admin" className="btn-primary mt-4">
          Go to admin
        </Link>
      </div>
    );
  }

  const canManageRoles = isSuperAdmin(me);
  const users = await getAllUsers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-medium text-cri-steel hover:text-cri-green"
      >
        ← Back to moderation
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cri-charcoal">
            Registered users
          </h1>
          <p className="mt-1 text-sm text-cri-steel">
            {canManageRoles
              ? "Everyone who has signed up. You can change roles here."
              : "Everyone who has signed up."}
          </p>
        </div>
        <p className="text-sm text-cri-steel">
          {users.length} {users.length === 1 ? "user" : "users"}
        </p>
      </div>

      <div className="mt-6">
        <AdminUserTable
          users={users}
          canManageRoles={canManageRoles}
          currentUserId={me.id}
        />
      </div>
    </div>
  );
}
