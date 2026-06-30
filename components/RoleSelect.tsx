"use client";

import { updateUserRoleAction } from "@/app/admin/users/actions";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

/** Super-admin-only role picker. Submits on change. */
export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  return (
    <form action={updateUserRoleAction}>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-cri-border bg-white px-2.5 py-1.5 text-sm font-medium text-cri-charcoal focus:border-cri-green focus:outline-none focus:ring-1 focus:ring-cri-green"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
