"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCompanyRoles, type CompanyRole } from "@/app/search/actions";
import type { Company } from "@/components/CompanyAutocomplete";

// Display-only price tags. Billing is not wired up yet (MVP) — these are
// placeholders so the layout is final before a real paywall is added.
const PRICE_WITH_REPORTS = "£4.99";
const PRICE_CH_ONLY = "£2.99";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; roles: CompanyRole[] };

export function CompanyRolePicker({ company }: { company: Company }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getCompanyRoles(company.number)
      .then((roles) => {
        if (!cancelled) setState({ status: "ready", roles });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [company.number]);

  if (state.status === "loading") {
    return (
      <div className="mt-6 rounded-xl border border-cri-border bg-white p-6 text-sm text-cri-steel shadow-card">
        Checking what we hold on this company…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-6 rounded-xl border border-cri-border bg-white p-6 shadow-card">
        <p className="text-sm text-cri-amber-dark">
          Couldn&apos;t load this company&apos;s reports right now. Please try
          again.
        </p>
      </div>
    );
  }

  const { roles } = state;

  // No community reports yet — still sellable on Companies House data alone.
  if (roles.length === 0) {
    const href = `/company/${encodeURIComponent(company.number)}`;
    return (
      <div className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card sm:p-6">
        <p className="text-xs uppercase tracking-wider text-cri-steel">
          Risk report
        </p>
        <p className="mt-2 font-semibold text-cri-charcoal">
          No community reports yet for this company.
        </p>
        <p className="mt-1 text-sm text-cri-steel">
          You still get full Companies House intelligence — directors,
          connections and filing health.
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-cri-charcoal">
            {PRICE_CH_ONLY}
          </span>
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-lg bg-cri-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cri-green-dark"
          >
            Open report →
          </Link>
        </div>
      </div>
    );
  }

  // One card per role the company actually has reports in.
  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-medium text-cri-charcoal">
        We hold reports on this company in{" "}
        {roles.length === 1 ? "this role" : "these roles"}:
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {roles.map((r) => {
          const href = `/company/${encodeURIComponent(company.number)}?role=${encodeURIComponent(r.value)}`;
          return (
            <Link
              key={r.value}
              href={href}
              className="flex flex-col rounded-xl border border-cri-border bg-white p-5 shadow-card transition hover:border-cri-green hover:ring-1 hover:ring-cri-green"
            >
              <div className="flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cri-green/10 text-sm font-semibold text-cri-green">
                  {r.title.charAt(0)}
                </span>
                <span className="ml-auto text-xs font-semibold text-cri-steel">
                  {r.count} {r.count === 1 ? "review" : "reviews"}
                </span>
              </div>
              <p className="mt-3 font-semibold text-cri-charcoal">{r.title}</p>
              <p className="text-xs text-cri-steel">{r.subtitle}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-cri-charcoal">
                  {PRICE_WITH_REPORTS}
                </span>
                <span className="text-sm font-semibold text-cri-green">
                  Open report →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
