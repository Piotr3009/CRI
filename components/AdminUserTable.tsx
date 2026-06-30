import type { UserRole, VerifiedStatus } from "@prisma/client";
import { formatDate } from "@/lib/format";
import type { UserWithReportCount } from "@/lib/user";
import { RoleSelect } from "./RoleSelect";

const ROLE_LABELS: Record<UserRole, string> = {
  CONTRACTOR: "Contractor",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

const ROLE_STYLES: Record<UserRole, string> = {
  CONTRACTOR: "bg-cri-bg text-cri-steel border-cri-border",
  ADMIN: "bg-cri-green/10 text-cri-green border-cri-green/25",
  SUPER_ADMIN: "bg-[#D64545]/10 text-[#D64545] border-[#D64545]/30",
};

const VERIFIED_LABELS: Record<VerifiedStatus, string> = {
  UNVERIFIED: "Unverified",
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const VERIFIED_STYLES: Record<VerifiedStatus, string> = {
  UNVERIFIED: "bg-cri-bg text-cri-steel border-cri-border",
  PENDING: "bg-cri-amber-light text-cri-amber-dark border-cri-amber/30",
  VERIFIED: "bg-cri-green/10 text-cri-green border-cri-green/25",
  REJECTED: "bg-cri-charcoal/5 text-cri-charcoal border-cri-charcoal/15",
};

export function AdminUserTable({
  users,
  canManageRoles,
  currentUserId,
}: {
  users: UserWithReportCount[];
  canManageRoles: boolean;
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-cri-steel shadow-card">
        No registered users yet.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto shadow-card">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead>
          <tr className="border-b border-cri-border text-xs uppercase tracking-wide text-cri-steel">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Name / Company</th>
            <th className="px-4 py-3 font-medium">Trade</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Verified</th>
            <th className="px-4 py-3 font-medium">Registered</th>
            <th className="px-4 py-3 font-medium">Reports</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr
                key={u.id}
                className="border-b border-cri-border last:border-0 hover:bg-cri-bg/60"
              >
                <td className="px-4 py-3 text-cri-charcoal">{u.email}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-cri-charcoal">
                    {u.companyName ?? "—"}
                  </p>
                  <p className="text-xs text-cri-steel">{u.name ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-cri-steel">
                  {u.tradeType ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {canManageRoles && !isSelf ? (
                    <RoleSelect userId={u.id} role={u.role} />
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_STYLES[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                      {isSelf ? (
                        <span className="text-cri-steel">(you)</span>
                      ) : null}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${VERIFIED_STYLES[u.verifiedStatus]}`}
                  >
                    {VERIFIED_LABELS[u.verifiedStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-cri-steel">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-cri-charcoal">
                  {u._count.reports}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
