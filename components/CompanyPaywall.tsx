import type { CompanyFacts } from "@/lib/companiesHouse";
import { formatPricePence, REPORT_ACCESS_DAYS } from "@/lib/purchases";
import { BuyReportButton } from "./BuyReportButton";
import { LegalDisclaimer } from "./LegalDisclaimer";
import { CheckIcon } from "./Icons";

const INCLUDED = [
  "Companies House intelligence: status, age, filing health, previous names",
  "Director connections — including dissolved and liquidated companies",
  "Contractor reviews: payment, behaviour, variation and dispute scores",
  "Abandoned-invoice red flags and moderated reporter comments",
];

/**
 * Shown on /company/[number] when the visitor has no active purchase.
 * Free preview: company identity + how many approved reviews exist. Everything
 * else sits behind the buy button (30-day access, tier priced server-side).
 */
export function CompanyPaywall({
  number,
  facts,
  approvedCount,
  amountPence,
  signedIn,
}: {
  number: string;
  facts: CompanyFacts | null;
  approvedCount: number;
  amountPence: number;
  signedIn: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card overflow-hidden shadow-card">
        <div className="flex items-start justify-between gap-3 border-b border-cri-border bg-cri-bg px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-cri-charcoal">
              {facts?.name ?? `Company ${number}`}
            </h1>
            <p className="mt-1 text-sm text-cri-steel">Company no. {number}</p>
          </div>
          {facts ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                facts.status === "active"
                  ? "bg-cri-green/10 text-cri-green"
                  : "bg-cri-amber-light text-cri-amber-dark"
              }`}
            >
              {facts.statusLabel}
            </span>
          ) : null}
        </div>

        <div className="px-6 py-6">
          <p className="text-sm font-semibold text-cri-charcoal">
            {approvedCount > 0
              ? `${approvedCount} approved contractor report${approvedCount === 1 ? "" : "s"} on file`
              : "No contractor reviews yet — company intelligence only"}
          </p>

          <ul className="mt-4 space-y-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-cri-steel">
                <span className="mt-0.5 text-cri-green">
                  <CheckIcon className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-cri-bg p-5 text-center">
            <p className="text-3xl font-bold text-cri-charcoal">
              {formatPricePence(amountPence)}
              <span className="text-base font-normal text-cri-steel"> + VAT</span>
            </p>
            <p className="mt-1 text-xs text-cri-steel">
              One-off payment · full report access for {REPORT_ACCESS_DAYS} days
            </p>
            <div className="mt-4">
              {signedIn ? (
                <BuyReportButton
                  companyNumber={number}
                  label="Unlock full report"
                />
              ) : (
                <p className="text-sm font-medium text-cri-charcoal">
                  Sign in (top right) to unlock this report.
                </p>
              )}
            </div>
            <p className="mt-3 text-[11px] text-cri-steel">
              Secure payment by Stripe. Reports update as new reviews are
              approved during your access period.
            </p>
          </div>

          <div className="mt-6">
            <LegalDisclaimer variant="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
