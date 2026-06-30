import type { Metadata } from "next";
import Link from "next/link";
import {
  ENTITY_TYPE_LABELS,
  MODERATION_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getCurrentUser, getReportsByUser } from "@/lib/user";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-cri-border py-2.5 last:border-0">
      <span className="text-sm text-cri-steel">{label}</span>
      <span className="text-right text-sm font-medium text-cri-charcoal">
        {value}
      </span>
    </div>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-xl font-bold text-cri-charcoal">My account</h1>
        <p className="mt-2 text-sm text-cri-steel">
          Sign in to view your account. Use the account menu in the top bar.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          Go home
        </Link>
      </div>
    );
  }

  const reports = await getReportsByUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-cri-charcoal">
        My account
      </h1>

      {/* Your details */}
      <section className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cri-steel">
          Your details
        </h2>
        <div className="mt-3">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Company / business" value={user.companyName ?? "—"} />
          <DetailRow
            label="Companies House number"
            value={user.companyNumber ?? "—"}
          />
          <DetailRow label="Name" value={user.name ?? "—"} />
          <DetailRow label="Phone" value={user.phone ?? "—"} />
          <DetailRow label="Trade type" value={user.tradeType ?? "—"} />
          <DetailRow label="Member since" value={formatDate(user.createdAt)} />
        </div>
        <p className="mt-3 text-xs text-cri-steel">
          Your details stay private and are never shown publicly.
        </p>
      </section>

      {/* Your reports */}
      <section className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cri-steel">
          Your reports
        </h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-cri-steel">
            You haven&apos;t submitted any reports yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-cri-border">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-cri-charcoal">
                    {ENTITY_TYPE_LABELS[r.entityType]} · {r.publicArea}
                  </p>
                  <p className="text-xs text-cri-steel">
                    Submitted {formatDate(r.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-cri-border bg-cri-bg px-2.5 py-1 text-xs font-medium text-cri-steel">
                  {MODERATION_STATUS_LABELS[r.moderationStatus]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Purchases (placeholder until billing exists) */}
      <section className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cri-steel">
          Purchases
        </h2>
        <p className="mt-3 text-sm text-cri-steel">
          Your purchased reports will appear here once paid reports go live.
        </p>
      </section>

      {/* Delete account */}
      <section className="mt-6 rounded-xl border border-[#D64545]/30 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#D64545]">
          Delete account
        </h2>
        <p className="mt-2 text-sm text-cri-steel">
          Remove your account and personal data under your right to erasure.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
