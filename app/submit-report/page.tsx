import type { Metadata } from "next";
import { SubmitReportFlow } from "@/components/SubmitReportFlow";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { getCurrentUser } from "@/lib/user";

export const metadata: Metadata = {
  title: "Submit a Construction Risk Report",
  description:
    "Submit an evidence-backed, moderated construction risk report. Reports default to pending and are reviewed before any publication.",
};

export const dynamic = "force-dynamic";

export default async function SubmitReportPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Submit Report
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Submit a construction risk report
        </h1>
        <p className="mt-3 text-cri-steel">
          Share your real, first-hand business experience. Reports are moderated
          before publication, sensitive residential data is restricted, and the
          entity has a right to reply.
        </p>
      </div>

      <div className="mt-6">
        <LegalDisclaimer />
      </div>

      <div className="mt-8">
        {user ? (
          <SubmitReportFlow
            reporterCompanyName={user.companyName ?? ""}
            reporterEmail={user.email}
            reporterPhone={user.phone ?? ""}
            reporterTradeType={user.tradeType ?? ""}
            defaultContactName={user.name ?? ""}
          />
        ) : (
          <div className="rounded-xl border border-cri-border bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-bold text-cri-charcoal">
              Sign in to submit a report
            </h2>
            <p className="mt-2 text-sm text-cri-steel">
              To keep every report genuine, accurate and trustworthy, you must
              create an account to submit. Your details are visible to CIX
              only — the company you report never sees who filed it. A
              company&apos;s overall report is the average of all individual
              reports.
            </p>
            <p className="mt-3 text-sm font-medium text-cri-charcoal">
              Use the account menu in the top bar to sign in or create an
              account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
