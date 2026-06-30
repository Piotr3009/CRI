"use client";

import { useEffect, useState } from "react";
import type { RiskLevel } from "@prisma/client";
import { RiskBadge } from "./RiskBadge";
import { Speedometer } from "./Speedometer";
import { AtomGraphic } from "./AtomGraphic";
import type { McAggregate } from "@/lib/level2/mainContractor";
import { BEHAVIOUR_QUESTIONS } from "@/lib/behaviourQuestions";
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
  kind = "contractor",
}: {
  number: string;
  aggregate: McAggregate;
  totalReports: number;
  facts: CompanyFacts | null;
  kind?: "contractor" | "commercial";
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
          {!has ? (
            <div className="mb-4 rounded-xl border border-cri-amber-light bg-cri-amber-light/50 p-4">
              <p className="text-sm font-semibold text-cri-amber-dark">No contractor reviews yet</p>
              <p className="mt-1 text-sm text-cri-steel">
                No one has reported on this company yet — but here&apos;s information about the company
                below. Reviews will appear here as contractors submit them.
              </p>
            </div>
          ) : null}
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
            <Speedometer label="Behaviour" value={has ? a.behaviour : null} />
          </div>
          <p className="mt-2 flex gap-1.5 text-xs text-cri-steel">
            <span aria-hidden>ⓘ</span>
            <span>
              {has
                ? `Based on ${n} report${n === 1 ? "" : "s"} · contractor-submitted, not CIX's opinion. Scores use a neutral 5/10 baseline a single report can't swing.`
                : "No reviews yet — this is the report a buyer sees once contractors submit. Scores will fill in as reports arrive."}
            </span>
          </p>

          {/* Abandoned invoices — the single most serious payment signal, shown
              prominently. Deliberately OUTSIDE the payment score: that gauge
              measures lateness, not whether an invoice was paid at all. */}
          {has && a.abandonedInvoicesCount > 0 ? (
            <div className="mt-4 rounded-xl border-2 border-[#D64545] bg-[#D64545]/[0.06] p-4">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-base text-[#D64545]">⚠</span>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D64545]">
                  Abandoned invoices
                </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-[#D64545]">
                {a.abandonedInvoicesCount} invoice{a.abandonedInvoicesCount === 1 ? "" : "s"} ·{" "}
                {gbp(a.abandonedInvoicesTotalGbp)}
              </p>
              <p className="mt-1 text-sm text-cri-steel">
                Reported unpaid (60+ days) across {a.abandonedInvoicesReports} report
                {a.abandonedInvoicesReports === 1 ? "" : "s"}. Not part of the payment score — that gauge
                measures lateness, not non-payment.
              </p>
            </div>
          ) : has ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-cri-green">
              <span aria-hidden>✓</span> No abandoned invoices reported.
            </p>
          ) : null}

          {/* Behaviour detail — full question on the left, small gauge with the answer on the right, row by row */}
          <SectionTitle>Behaviour detail</SectionTitle>
          <div className="divide-y divide-cri-border/60">
            {BEHAVIOUR_QUESTIONS.map((q) => (
              <div key={q.key} className="flex items-center justify-between gap-4 py-2">
                <p className="flex-1 text-sm text-cri-charcoal">{q.label}</p>
                <div className="w-[92px] shrink-0">
                  <Speedometer
                    size="xs"
                    showLabel={false}
                    label={q.label}
                    value={has ? a.behaviourByQuestion[q.key] : null}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Site readiness — about the site/project, separate from client behaviour and not in the behaviour average */}
          {kind === "contractor" ? (
            <>
              <SectionTitle>Site readiness</SectionTitle>
              <div className="flex items-center justify-between gap-4 py-2">
                <p className="flex-1 text-sm text-cri-charcoal">Was the site ready for your stage of works?</p>
                <div className="w-[92px] shrink-0">
                  <Speedometer
                    size="xs"
                    showLabel={false}
                    label="Site readiness"
                    value={has ? a.projectReadiness : null}
                  />
                </div>
              </div>
              <p className="mt-1.5 flex gap-1.5 text-xs text-cri-steel">
                <span aria-hidden>ⓘ</span>
                <span>About the site/project, not the client — separate from how the client behaved, and not part of the behaviour score.</span>
              </p>
            </>
          ) : null}

          {/* Full breakdown — always shown */}
          <SectionTitle>Payment behaviour</SectionTitle>
          <Row label="Average payment delay" value={has && a.avgPaymentDelayDays != null ? `${a.avgPaymentDelayDays} days` : "No record yet"} />

          {kind === "contractor" ? (
            <>
              <SectionTitle>Deductions &amp; retention</SectionTitle>
              {/* Back-charges — full question, count of reports + total deducted (no gauge: the £ is what matters) */}
              <Row
                label="Did the client deduct from your invoices for defects you didn't agree?"
                value={
                  has
                    ? a.backChargesReports > 0
                      ? `Yes — ${a.backChargesReports} report${a.backChargesReports === 1 ? "" : "s"}${a.backChargesTotalGbp > 0 ? ` · ${gbp(a.backChargesTotalGbp)} deducted` : ""}`
                      : "No"
                    : "No record yet"
                }
                valueClass={has && a.backChargesReports > 0 ? "text-cri-amber-dark" : ""}
              />
              {/* Retention — full question, three states (within-term is NOT a red flag) */}
              <Row
                label="Did the client return your retention?"
                value={
                  has
                    ? `Returned ${a.retentionReturnedReports} · Not returned ${a.retentionNotReturnedReports} · Still within term ${a.retentionWithinTermReports}`
                    : "No record yet"
                }
                valueClass={has && a.retentionNotReturnedReports > 0 ? "text-cri-amber-dark" : ""}
              />
              {/* Variations — full (positive) question + gauge, high = confirmed in writing */}
              <div className="flex items-center justify-between gap-4 py-2">
                <p className="flex-1 text-sm text-cri-charcoal">Did the client confirm variations in writing?</p>
                <div className="w-[92px] shrink-0">
                  <Speedometer
                    size="xs"
                    showLabel={false}
                    label="Variations confirmed in writing"
                    value={has ? a.variationsConfirmedScore : null}
                  />
                </div>
              </div>
            </>
          ) : null}

          <SectionTitle>Disputes</SectionTitle>
          <div className="mb-2">
            {dispute ? <RiskBadge level={dispute} label="Dispute risk" /> : <NoRecordPill />}
          </div>
          <Row
            label="Court action / formal dispute"
            value={
              has
                ? a.formalDisputeReports > 0
                  ? `${a.formalDisputeReports} of ${n} report${n === 1 ? "" : "s"}`
                  : "None reported"
                : "No record yet"
            }
            valueClass={has && a.formalDisputeReports > 0 ? "font-bold text-[#D64545]" : ""}
          />
          <Row
            label="Total contract value"
            value={has && a.contractValueTotalGbp > 0 ? `${gbp(a.contractValueTotalGbp)} across ${n} report${n === 1 ? "" : "s"}` : "No record yet"}
          />


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
                valueClass={facts.accountsOverdue ? "font-bold text-[#D64545]" : "text-cri-green"}
              />
              <Row label="Confirmation statement" value={facts.confirmationOverdue ? "Overdue" : "Up to date"} valueClass={facts.confirmationOverdue ? "font-bold text-[#D64545]" : "text-cri-green"} />
              <Row label="Charges / mortgages" value={facts.hasCharges ? "Registered" : "None"} valueClass={facts.hasCharges ? "text-cri-amber-dark" : "text-cri-green"} />
              <Row label="Insolvency history" value={facts.hasInsolvencyHistory ? "Yes" : "No"} valueClass={facts.hasInsolvencyHistory ? "font-bold text-[#D64545]" : "text-cri-green"} />
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
