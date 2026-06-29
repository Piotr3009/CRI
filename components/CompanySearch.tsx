"use client";

import { useState } from "react";
import Link from "next/link";
import { CompanyAutocomplete, type Company } from "@/components/CompanyAutocomplete";

export function CompanySearch({ role }: { role?: string }) {
  const [selected, setSelected] = useState<Company | null>(null);

  const reportHref = selected
    ? `/company/${encodeURIComponent(selected.number)}${role ? `?role=${encodeURIComponent(role)}` : ""}`
    : "#";

  return (
    <div>
      <CompanyAutocomplete
        name={selected?.name ?? ""}
        number={selected?.number ?? ""}
        onSelect={(c) => setSelected(c)}
        onClear={() => setSelected(null)}
        placeholder="Search a company by name (or by director name)…"
      />

      {selected ? (
        <div className="mt-6 rounded-xl border border-cri-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-cri-steel">Risk report</p>
              <p className="mt-1 truncate text-lg font-semibold text-cri-charcoal">
                {selected.name}
              </p>
              <p className="mt-0.5 text-sm text-cri-steel">
                Companies House {selected.number}
              </p>
            </div>
            <Link
              href={reportHref}
              className="inline-flex items-center gap-2 rounded-lg bg-cri-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cri-green-dark"
            >
              Open report →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
