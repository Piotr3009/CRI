import type { ReactNode } from "react";
import { RiskBadge } from "./RiskBadge";
import type { McAggregate } from "@/lib/level2/mainContractor";
import type { CompanyFacts } from "@/lib/companiesHouse";

function gbp(n: number | null): string {
  return n == null ? "—" : "£" + n.toLocaleString("en-GB");
}

function monthYear(d: Date | null): string {
  return d ? d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—";
}

function pctOf(count: number, total: number): string {
  if (total === 0) return "0";
  return `${count} of ${total} (${Math.round((count / total) * 100)}%)`;
}

function Gauge({
  label,
  value,
  suffix,
  muted = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-cri-bg p-4 ${muted ? "opacity-60" : ""}`}>
      <p className="text-sm text-cri-steel">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-cri-charcoal">
        {value}
        {suffix ? <span className="text-sm font-normal text-cri-steel">{suffix}</span> : null}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between border-b border-cri-border/60 py-1.5 text-sm last:border-0">
      <span className="text-cri-steel">{label}</span>
      <span className={`font-medium text-cri-charcoal ${valueClass}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <p className="mt-5 text-sm font-semibold text-cri-charcoal">
      {children}
      {note ? <span className="ml-1 text-xs font-normal text-cri-steel">· {note}</span> : null}
    </p>
  );
}

function statusClass(status: string): string {
  const warn = [
    "dissolved",
    "liquidation",
    "administration",
    "insolvency-proceedings",
    "receivership",
    "voluntary-arrangement",
  ];
  if (status === "active") return "text-cri-green";
  if (warn.includes(status)) return "text-cri-amber-dark";
  return "text-cri-charcoal";
}

function isoDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CompanyFactsBlock({ facts }: { facts: CompanyFacts | null }) {
  if (!facts) {
    return (
      <>
        <SectionTitle note="from Companies House">Company facts</SectionTitle>
        <p className="mt-2 text-sm text-cri-steel">Company facts are unavailable right now.</p>
      </>
    );
  }
  const ageStr =
    facts.ageYears == null
      ? "—"
      : facts.ageYears < 1
        ? "under 1 year old"
        : `${facts.ageYears} year${facts.ageYears === 1 ? "" : "s"} old`;
  const incYear = facts.incorporatedOn ? facts.incorporatedOn.slice(0, 4) : "—";

  const accountsValue = facts.accountsOverdue
    ? facts.accountsNextDue
      ? `Overdue (was due ${isoDate(facts.accountsNextDue)})`
      : "Overdue"
    : facts.accountsNextDue
      ? `Next due ${isoDate(facts.accountsNextDue)}`
      : "Up to date";

  return (
    <>
      <SectionTitle note="from Companies House (always available)">Company facts</SectionTitle>
      <div className="mt-2">
        <Row label="Company status" value={facts.statusLabel} valueClass={statusClass(facts.status)} />
        <Row
          label="Insolvency history"
          value={facts.hasInsolvencyHistory ? "Yes" : "No"}
          valueClass={facts.hasInsolvencyHistory ? "text-cri-amber-dark" : "text-cri-green"}
        />
        <Row
          label="Outstanding charges (secured debt)"
          value={facts.hasCharges ? "Yes" : "No"}
          valueClass={facts.hasCharges ? "text-cri-amber-dark" : "text-cri-green"}
        />
        <Row label="Company type" value={facts.companyTypeLabel} />
        <Row
          label="Nature of business"
          value={facts.sicLabels.length ? facts.sicLabels.join(" · ") : "—"}
        />
        <Row
          label="Incorporated"
          value={`${incYear} · ${ageStr}`}
          valueClass={facts.ageYears != null && facts.ageYears < 1 ? "text-cri-amber-dark" : ""}
        />
        <Row
          label="Accounts"
          value={accountsValue}
          valueClass={facts.accountsOverdue ? "text-cri-amber-dark" : "text-cri-green"}
        />
        <Row
          label="Confirmation statement"
          value={facts.confirmationOverdue ? "Overdue" : "Up to date"}
          valueClass={facts.confirmationOverdue ? "text-cri-amber-dark" : "text-cri-green"}
        />
        <Row
          label="Previous names"
          value={facts.previousNames.length ? facts.previousNames.join(", ") : "None"}
        />
        {facts.registeredAddress ? (
          <Row label="Registered address" value={facts.registeredAddress} />
        ) : null}
      </div>
    </>
  );
}

function AtomPlaceholder() {
  return (
    <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-dashed border-cri-border px-4 py-3 text-sm text-cri-steel">
      <span aria-hidden>◇</span>
      <span>Connected companies (atom) — added later</span>
    </div>
  );
}

export function CompanyReport({
  number,
  aggregate,
  totalReports,
  facts,
}: {
  number: string;
  aggregate: McAggregate;
  totalReports: number;
  facts: CompanyFacts | null;
}) {
  const n = aggregate.reportCount;
  const name = facts?.name ?? `Company ${number}`;

  const subtitle =
    n > 0
      ? `${n} report${n === 1 ? "" : "s"} · ${monthYear(aggregate.dateFrom)} – ${monthYear(aggregate.dateTo)}`
      : totalReports > 0
        ? "reports of another type on file"
        : "0 reports";

  const riskPill =
    aggregate.overallRisk != null ? (
      <RiskBadge level={aggregate.overallRisk} />
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cri-border bg-cri-bg px-2.5 py-1 text-xs font-medium text-cri-steel">
        <span className="h-1.5 w-1.5 rounded-full bg-cri-steel" aria-hidden />
        {n === 0 ? "No rating yet" : "Provisional"}
      </span>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <a href="/search" className="text-sm font-medium text-cri-green hover:underline">
        ← Back to search
      </a>

      <div className="mt-4 rounded-xl border border-cri-border bg-white p-6 shadow-card sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-cri-steel">Main contractor</p>
            <h1 className="mt-1 text-2xl font-bold text-cri-charcoal">{name}</h1>
            <p className="mt-1 text-sm text-cri-steel">
              Companies House {number} · {subtitle}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cri-steel">Overall risk</p>
            <div className="mt-1">{riskPill}</div>
          </div>
        </div>

        {/* Body */}
        {n === 0 ? (
          totalReports > 0 ? (
            <p className="mt-5 rounded-lg bg-cri-bg px-4 py-3 text-sm text-cri-steel">
              {totalReports} report{totalReports === 1 ? "" : "s"} exist for this company, but the
              aggregated report for this company type is coming soon.
            </p>
          ) : (
            <>
              <p className="mt-5 rounded-lg bg-cri-bg px-4 py-3 text-sm text-cri-steel">
                No reports yet — the indicators sit at a neutral baseline. This is{" "}
                <strong className="font-semibold">not</strong> a good score, it means unrated.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Gauge label="Payment reliability" value="5.0" suffix="/10" muted />
                <Gauge label="Communication" value="5.0" suffix="/10" muted />
                <Gauge label="Would work again" value="—" muted />
              </div>
            </>
          )
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Gauge
                label="Payment reliability"
                value={aggregate.paymentReliability.toFixed(1)}
                suffix="/10"
              />
              <Gauge label="Communication" value={aggregate.communication.toFixed(1)} suffix="/10" />
              <Gauge
                label="Would work again"
                value={aggregate.wouldWorkAgainPct == null ? "—" : String(aggregate.wouldWorkAgainPct)}
                suffix={aggregate.wouldWorkAgainPct == null ? undefined : "%"}
              />
            </div>
            <p className="mt-2.5 flex gap-1.5 text-xs text-cri-steel">
              <span aria-hidden>ⓘ</span>
              <span>
                Scores use a Bayesian average — a neutral 5/10 baseline that a single report can&apos;t
                swing. The more reports, the more the score reflects reality.
              </span>
            </p>
            {aggregate.overallRisk == null ? (
              <p className="mt-2 text-xs text-cri-amber-dark">
                Provisional — a Low / Medium / High risk rating appears once there are 3 or more
                reports.
              </p>
            ) : null}
          </>
        )}

        {/* Company facts — always shown */}
        <CompanyFactsBlock facts={facts} />

        {/* Full breakdown — only when there are reports of this type */}
        {n > 0 ? (
          <>
            <div className="mt-6 mb-1 flex items-center gap-2 text-xs text-cri-steel">
              <span>Full breakdown</span>
              <div className="h-px flex-1 bg-cri-border" />
            </div>

            <SectionTitle note="raw figures, not smoothed">Payment behaviour</SectionTitle>
            <div className="mt-2">
              <Row
                label="Average payment delay"
                value={aggregate.avgPaymentDelayDays == null ? "—" : `${aggregate.avgPaymentDelayDays} days`}
              />
              <Row label="Reports saying paid late" value={pctOf(aggregate.reportsPaidLate, n)} />
              <Row
                label="Abandoned invoices (>60 days)"
                value={`${aggregate.abandonedInvoicesReports} report${
                  aggregate.abandonedInvoicesReports === 1 ? "" : "s"
                } · ${gbp(aggregate.abandonedInvoicesTotalGbp)}`}
              />
            </div>

            <SectionTitle>Deductions &amp; retention</SectionTitle>
            <div className="mt-2">
              <Row
                label="Back-charges reported"
                value={
                  aggregate.backChargesReports === 0
                    ? "0"
                    : `${aggregate.backChargesReports} of ${n} · avg ${gbp(aggregate.backChargesAvgGbp)}`
                }
              />
              <Row label="Retention not returned" value={pctOf(aggregate.retentionNotReturnedReports, n)} />
              <Row label="Variations without paperwork" value={pctOf(aggregate.variationsNoPaperReports, n)} />
            </div>

            <SectionTitle>Disputes &amp; evidence base</SectionTitle>
            <div className="mt-2">
              <Row label="Formal dispute raised" value={pctOf(aggregate.formalDisputeReports, n)} />
              <Row
                label="Contract value range"
                value={
                  aggregate.contractValueMinGbp == null
                    ? "—"
                    : `${gbp(aggregate.contractValueMinGbp)} – ${gbp(aggregate.contractValueMaxGbp)}`
                }
              />
              <Row
                label="Project areas"
                value={aggregate.areas.length ? aggregate.areas.join(" · ") : "—"}
              />
            </div>
          </>
        ) : null}

        <AtomPlaceholder />
      </div>
    </div>
  );
}
