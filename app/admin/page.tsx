import type { Metadata } from "next";
import Link from "next/link";
import type { ModerationStatus } from "@prisma/client";
import { isAdminRole } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user";
import {
  getAdminReports,
  getAdminReportCounts,
} from "@/lib/reports";
import { getVisitStats } from "@/lib/visits";
import { MODERATION_STATUS_LABELS } from "@/lib/constants";
import { AdminReportTable } from "@/components/AdminReportTable";
import { ShieldIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Admin — Moderation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS: ModerationStatus[] = [
  "PENDING",
  "APPROVED",
  "DISPUTED",
  "REJECTED",
];

function AccessScreen({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="card p-8 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cri-green text-white">
            <ShieldIcon className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold text-cri-charcoal">
            Admin moderation
          </h1>
        </div>

        {signedIn ? (
          <>
            <p className="mt-3 text-sm text-cri-steel">
              Your account doesn&apos;t have moderation access.
            </p>
            <p className="mt-2 text-sm text-cri-steel">
              If this is a mistake, ask the site owner to grant your account an
              admin role.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-cri-steel">
              Restricted area. Sign in with an authorised account using the
              account menu in the top bar, then return to this page.
            </p>
            <Link href="/" className="btn-primary mt-5 inline-flex">
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminRole(currentUser.role)) {
    return <AccessScreen signedIn={!!currentUser} />;
  }

  const activeStatus: ModerationStatus = TABS.includes(
    searchParams.status as ModerationStatus,
  )
    ? (searchParams.status as ModerationStatus)
    : "PENDING";

  const [reports, counts, visits] = await Promise.all([
    getAdminReports(activeStatus),
    getAdminReportCounts(),
    getVisitStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cri-charcoal">
            Moderation dashboard
          </h1>
          <p className="mt-1 text-sm text-cri-steel">
            Review, score and control the visibility of submitted reports.
          </p>
        </div>
      </div>

      {/* Visit stats */}
      <div className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-cri-steel">Total visits</p>
              <p className="text-2xl font-bold text-cri-charcoal">
                {visits.total.toLocaleString("en-GB")}
              </p>
            </div>
            <div>
              <p className="text-xs text-cri-steel">Today</p>
              <p className="text-2xl font-bold text-cri-charcoal">
                {visits.today.toLocaleString("en-GB")}
              </p>
            </div>
          </div>
          {visits.recent.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {visits.recent.map((r) => (
                <div key={r.day} className="text-right">
                  <p className="text-[11px] text-cri-steel">{r.day.slice(5)}</p>
                  <p className="text-sm font-semibold text-cri-charcoal">{r.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-cri-steel">No visits recorded yet.</p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((status) => {
          const active = status === activeStatus;
          return (
            <Link
              key={status}
              href={`/admin?status=${status}`}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-cri-green bg-cri-green text-white"
                  : "border-cri-border bg-white text-cri-charcoal hover:bg-cri-bg"
              }`}
            >
              {MODERATION_STATUS_LABELS[status]}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-white/20" : "bg-cri-bg text-cri-steel"
                }`}
              >
                {counts[status]}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <AdminReportTable reports={reports} />
      </div>
    </div>
  );
}