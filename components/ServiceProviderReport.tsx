"use client";

import { useEffect, useState } from "react";
import { Speedometer } from "./Speedometer";
import { AtomGraphic } from "./AtomGraphic";
import type { SpAggregate } from "@/lib/level2/serviceProvider";
import { SP_CONFIGS, type SpEntityType } from "@/lib/spScores";
import type { CompanyFacts } from "@/lib/companiesHouse";
import type { CompanyAtom } from "@/lib/level2/atom";
import { formatMonthYear } from "@/lib/format";

function isoDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function gbp(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-cri-border/60 py-2 text-sm last:border-0">
      <span className="text-cri-steel">{label}</span>
      <span className={`text-right font-medium ${valueClass || "text-cri-charcoal"}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mt-7 mb-2 text-sm font-semibold uppercase tracking-wide text-cri-charcoal">{children}</p>;
}

export function ServiceProviderReport({
  number,
  entityType,
  aggregate: a,
  facts,
  comments,
}: {
  number: string;
  entityType: SpEntityType;
  aggregate: SpAggregate;
  facts: CompanyFacts | null;
  comments: { text: string; date: Date | null }[];
}) {
  const config = SP_CONFIGS[entityType];
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

  const n = a.totalReports;
  const has = n > 0;
  const name = facts?.name ?? `Company ${number}`;
  const linked = atomState === "done" ? String(atom?.connected.length ?? 0) : "—";

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
              {config.title} · Company no. {number}
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
              <p className="text-xs text-cri-steel">Overall score</p>
              <p className="mt-1 text-lg font-bold text-cri-charcoal">
                {has ? `${a.overall.toFixed(1)} / 10` : "No rating yet"}
              </p>
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

          {/* Headline */}
          {!has ? (
            <div className="mb-4 rounded-xl border border-cri-amber-light bg-cri-amber-light/50 p-4">
              <p className="text-sm font-semibold text-cri-amber-dark">No reviews yet</p>
              <p className="mt-1 text-sm text-cri-steel">
                No one has reported on this {config.title.toLowerCase()} yet — but here&apos;s information
                about the company below. Reviews will appear here as contractors submit them.
              </p>
            </div>
          ) : null}
          <SectionTitle>{config.title} reviews</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Speedometer
              label="Overall score"
              value={has ? a.overall : null}
              footnote={
                has && a.wouldRecommend != null
                  ? `Would work with them again: ${a.wouldRecommend.toFixed(1)}/10 avg`
                  : undefined
              }
            />
          </div>
          <p className="mt-2 flex gap-1.5 text-xs text-cri-steel">
            <span aria-hidden>ⓘ</span>
            <span>
              {has
                ? `Based on ${n} report${n === 1 ? "" : "s"} · contractor-submitted, not CIX's opinion. Scores use a neutral 5/10 baseline a single report can't swing.`
                : "No reviews yet — this is the report a buyer sees once contractors submit. Scores will fill in as reports arrive."}
            </span>
          </p>

          {/* Score detail — full question on the left, small gauge with the answer on the right, row by row */}
          <SectionTitle>Score detail</SectionTitle>
          <div className="divide-y divide-cri-border/60">
            {config.scores.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4 py-2">
                <p className="flex-1 text-sm text-cri-charcoal">{s.label}</p>
                <div className="w-[92px] shrink-0">
                  <Speedometer
                    size="xs"
                    showLabel={false}
                    label={s.label}
                    value={has ? (a.byScore[s.key] ?? null) : null}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Project value & disputes — hard facts from the reviews */}
          <SectionTitle>Project &amp; disputes</SectionTitle>
          <Row
            label="Total project value"
            value={
              has && a.contractValueReports > 0
                ? `${gbp(a.contractValueTotalGbp)} across ${a.contractValueReports} review${a.contractValueReports === 1 ? "" : "s"}`
                : "Not reported yet"
            }
          />
          <Row
            label="Court action / dispute"
            value={
              has
                ? a.formalDisputeReports > 0
                  ? `${a.formalDisputeReports} of ${n} review${n === 1 ? "" : "s"}`
                  : "None reported"
                : "No record yet"
            }
            valueClass={has && a.formalDisputeReports > 0 ? "font-bold text-[#D64545]" : ""}
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

        {comments.length > 0 ? (
          <div className="border-t border-cri-border px-6 py-5 sm:px-8">
            <SectionTitle>What reporters said</SectionTitle>
            <div className="mt-3 space-y-3">
              {comments.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-cri-border bg-cri-bg/40 px-4 py-3"
                >
                  <p className="text-sm text-cri-charcoal">{c.text}</p>
                  {c.date ? (
                    <p className="mt-1 text-xs text-cri-steel">
                      {formatMonthYear(c.date)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="border-t border-cri-border bg-cri-bg/60 px-6 py-4 text-xs text-cri-steel sm:px-8">
          Reports are moderated and contractor-submitted — they reflect reporters&apos; experiences, not
          CIX&apos;s opinion. Company facts come from Companies House.
        </div>
      </div>
    </div>
  );
}
