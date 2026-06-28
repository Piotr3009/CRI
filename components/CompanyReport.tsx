"use client";

import { useEffect, useState } from "react";
import type { RiskLevel } from "@prisma/client";
import { RiskBadge } from "./RiskBadge";
import { Speedometer } from "./Speedometer";
import { AtomGraphic } from "./AtomGraphic";
import type { McAggregate } from "@/lib/level2/mainContractor";
import type { CompanyFacts } from "@/lib/companiesHouse";
import type { CompanyAtom } from "@/lib/level2/atom";

const RISK_TEXT: Record<RiskLevel, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

function gbp(n: number | null): string {
  return n == null ? "—" : "£" + n.toLocaleString("en-GB");
}
function isoDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function pctOf(count: number, total: number): string {
  return total === 0 ? "—" : `${count} of ${total} (${Math.round((count / total) * 100)}%)`;
}
function level(ratio: number, hi: number, mid: number): RiskLevel {
  if (ratio >= hi) return "HIGH";
  if (ratio >= mid) return "MEDIUM";
  return "LOW";
}

function NoRecordPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cri-border bg-cri-bg px-2.5 py-1 text-xs font-medium text-cri-steel">
      <span className="h-1.5 w-1.5 rounded-full bg-cri-steel" aria-hidden />
      No record yet
    </span>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-cri-border/60 py-2 text-sm last:border-0">
      <span className="text-cri-steel">{label}</span>
      <span className={`text-right font-medium text-cri-charcoal ${valueClass}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="mt-7 mb-2 text-sm font-semibold uppercase tracking-wide text-cri-charcoal">{children}</p>;
}

export function CompanyReport({
  number,
  aggregate: a,
  totalReports,
  facts,
}: {
  number: string;
  aggregate: McAggregate;
  totalReports: number;
  facts: CompanyFacts | null;
}) {
  const [atom, setAtom] = useState<CompanyAtom | null>(null);
  const [atomState, setAtomState] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/companies/atom?number=${encodeURIComponent(number)}`);
        if (!res.ok) {
          if (live) setAtomState("error");
          return;
        }
        const data = (await res.json()) as CompanyAtom;
        if (live) {
          setAtom(data);
          setAtomState("done");
        }
      } catch {
        if (live) setAtomState("error");
      }
    })();
    return () => {
      live = false;
    };
  }, [number]);

  const n = a.reportCount;
  const has = n > 0;
  const name = facts?.name ?? `Company ${number}`;
  const linked = atomState === "done" ? String(atom?.connected.length ?? 0) : "—";

  const riskLabel = a.overallRisk ? RISK_TEXT[a.overallRisk] : n === 0 ? "No rating yet" : "Provisional";
  const riskClass = !a.overallRisk
    ? "text-cri-steel"
    : a.overallRisk === "LOW"
      ? "text-cri-green"
      : "text-cri-amber-dark";

  const variation: RiskLevel | null = has ? level(a.variationsNoPaperReports / n, 0.4, 0.15) : null;
  const dispute: RiskLevel | null = has ? level(a.formalDisputeReports / n, 0.3, 0.1) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <a href="/search" className="text-sm font-medium text-cri-green hover:underline">
        ← Back to search
      </a>

      <div className="mt-4 overflow-hidden rounded-2xl border border-cri-border bg-white shadow-card">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cri-border px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-cri-charcoal">{name}</h1>
            <p className="mt-1 text-sm text-cri-steel">
              Company no. {number}
              {facts?.registeredAddress ? ` · ${facts.registeredAddress.split(",").slice(-2).join(",").trim()}` : ""}
            </p>
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

        <div className="px-6 py-6 sm:px-8">
          {/* Counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-cri-bg p-4">
              <p className="text-xs text-cri-steel">Overall risk</p>
              <p className={`mt-1 text-lg font-bold ${riskClass}`}>{riskLabel}</p>
            </div>
            <div className="rounded-xl bg-cri-bg p-4">
              <p className="text-xs text-cri-steel">Reviews</p>
              <p className="mt-1 text-lg font-bold text-cri-charcoal">{n}</p>
            </div>
            <div className="rounded-xl bg-cri-bg p-4">
              <p className="text-xs text-cri-steel">Linked companies</p>
              <p className="mt-1 text-lg font-bold text-cri-charcoal">{linked}</p>
            </div>
          </div>

          {/* Contractor reviews */}
          <SectionTitle>Contractor reviews</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Speedometer
              label="Payment score"
              value={has ? a.paymentReliability : null}
              footnote={
                has && a.totalPayments > 0
                  ? `Based on ${a.totalPayments} payment${a.totalPayments === 1 ? "" : "s"} from ${n} subcontractor${n === 1 ? "" : "s"} · ${a.avgPaymentDelayDays === 0 ? "all on time" : `avg ${a.avgPaymentDelayDays} days late`}`
                  : undefined
              }
            />
            <Speedometer label="Communication" value={has ? a.communication : null} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {variation ? <RiskBadge level={variation} label="Variation" /> : <NoRecordPill />}
            {dispute ? <RiskBadge level={dispute} label="Dispute" /> : <NoRecordPill />}
          </div>
          <p className="mt-2 flex gap-1.5 text-xs text-cri-steel">
            <span aria-hidden>ⓘ</span>
            <span>
              {has
                ? `Based on ${n} report${n === 1 ? "" : "s"} · contractor-submitted, not CIX's opinion. Scores use a neutral 5/10 baseline a single report can't swing.`
                : "No reviews yet — this is the report a buyer sees once contractors submit. Scores will fill in as reports arrive."}
            </span>
          </p>

          {/* Full breakdown — always shown */}
          <SectionTitle>Payment behaviour</SectionTitle>
          <Row label="Average payment delay" value={has && a.avgPaymentDelayDays != null ? `${a.avgPaymentDelayDays} days` : "No record yet"} />
          <Row label="Reports saying paid late" value={has ? pctOf(a.reportsPaidLate, n) : "No record yet"} />
          <Row
            label="Abandoned invoices (>60 days)"
            value={has ? `${a.abandonedInvoicesReports} · ${gbp(a.abandonedInvoicesTotalGbp)}` : "No record yet"}
          />

          <SectionTitle>Deductions &amp; retention</SectionTitle>
          <Row
            label="Back-charges reported"
            value={has ? (a.backChargesReports === 0 ? "0" : `${a.backChargesReports} of ${n} · avg ${gbp(a.backChargesAvgGbp)}`) : "No record yet"}
          />
          <Row label="Retention not returned" value={has ? pctOf(a.retentionNotReturnedReports, n) : "No record yet"} />
          <Row label="Variations without paperwork" value={has ? pctOf(a.variationsNoPaperReports, n) : "No record yet"} />

          <SectionTitle>Disputes</SectionTitle>
          <Row label="Formal dispute raised" value={has ? pctOf(a.formalDisputeReports, n) : "No record yet"} />
          <Row label="Contract value range" value={has && a.contractValueMinGbp != null ? `${gbp(a.contractValueMinGbp)} – ${gbp(a.contractValueMaxGbp)}` : "No record yet"} />
          <Row label="Project areas" value={has && a.areas.length ? a.areas.join(" · ") : "No record yet"} />

          {/* Connections (atom) */}
          <SectionTitle>Connections</SectionTitle>
          <AtomGraphic atom={atom} state={atomState} companyName={name} />

          {/* Company details (Companies House) */}
          <SectionTitle>Company details</SectionTitle>
          {facts ? (
            <>
              <Row label="Incorporated" value={`${isoDate(facts.incorporatedOn)}${facts.ageYears != null ? ` · ${facts.ageYears < 1 ? "under 1 year" : `${facts.ageYears} years`} old` : ""}`} valueClass={facts.ageYears != null && facts.ageYears < 1 ? "text-cri-amber-dark" : ""} />
              <Row label="Type" value={facts.companyTypeLabel} />
              <Row label="Nature of business (SIC)" value={facts.sicLabels.length ? facts.sicLabels.join(" · ") : "—"} />
              <Row label="Previous names" value={facts.previousNames.length ? facts.previousNames.join(", ") : "None"} />
              <Row label="Registered office" value={facts.registeredAddress ?? "—"} />
            </>
          ) : (
            <p className="py-2 text-sm text-cri-steel">Company details are unavailable right now.</p>
          )}

          {/* Filing health (Companies House) */}
          <SectionTitle>Filing health</SectionTitle>
          {facts ? (
            <>
              <Row
                label="Accounts"
                value={facts.accountsOverdue ? (facts.accountsNextDue ? `Overdue (was due ${isoDate(facts.accountsNextDue)})` : "Overdue") : facts.accountsNextDue ? `Next due ${isoDate(facts.accountsNextDue)}` : "Up to date"}
                valueClass={facts.accountsOverdue ? "text-cri-amber-dark" : "text-cri-green"}
              />
              <Row label="Confirmation statement" value={facts.confirmationOverdue ? "Overdue" : "Up to date"} valueClass={facts.confirmationOverdue ? "text-cri-amber-dark" : "text-cri-green"} />
              <Row label="Charges / mortgages" value={facts.hasCharges ? "Registered" : "None"} valueClass={facts.hasCharges ? "text-cri-amber-dark" : "text-cri-green"} />
              <Row label="Insolvency history" value={facts.hasInsolvencyHistory ? "Yes" : "No"} valueClass={facts.hasInsolvencyHistory ? "text-cri-amber-dark" : "text-cri-green"} />
            </>
          ) : (
            <p className="py-2 text-sm text-cri-steel">Filing health is unavailable right now.</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-cri-border bg-cri-bg/60 px-6 py-4 text-xs text-cri-steel sm:px-8">
          Reports are moderated and contractor-submitted — they reflect reporters&apos; experiences, not
          CIX&apos;s opinion. Company facts come from Companies House.
        </div>
      </div>
    </div>
  );
}
