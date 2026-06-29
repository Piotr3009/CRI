"use client";

import { useState } from "react";
import { CompanySearch } from "./CompanySearch";

type Tile = { value: string; title: string; subtitle: string; active: boolean };

// Mirrors the report subject types from the submit form. Only Main contractor
// has a built report; the rest are locked until their report engine is added.
const TILES: Tile[] = [
  { value: "RESIDENTIAL_CLIENT", title: "Private client", subtitle: "individual", active: false },
  { value: "COMMERCIAL_CLIENT", title: "Commercial client", subtitle: "company / investor", active: true },
  { value: "MAIN_CONTRACTOR", title: "Main contractor", subtitle: "pays subcontractors", active: true },
  { value: "PROJECT_MANAGER", title: "Project manager", subtitle: "service provider", active: true },
  { value: "QUANTITY_SURVEYOR", title: "Quantity surveyor", subtitle: "service provider", active: true },
  { value: "ARCHITECT_PM", title: "Architect / PM", subtitle: "service provider", active: true },
];

export function SearchTypeGate() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const selected = TILES.find((t) => t.value === selectedType) ?? null;

  // Step 2 — a type is chosen: reveal the company search.
  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedType(null)}
          className="text-sm font-medium text-cri-green hover:underline"
        >
          ← Change type
        </button>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-cri-green bg-white p-4 shadow-card ring-1 ring-cri-green">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cri-green/10 text-sm font-semibold text-cri-green">
            {selected.title.charAt(0)}
          </span>
          <div>
            <p className="font-semibold text-cri-charcoal">{selected.title}</p>
            <p className="text-xs text-cri-steel">{selected.subtitle}</p>
          </div>
        </div>

        <div className="mt-6">
          <CompanySearch />
        </div>
      </div>
    );
  }

  // Step 1 — choose a type first.
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-cri-charcoal">
        Choose the role you want a report on
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TILES.map((t) =>
          t.active ? (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedType(t.value)}
              className="rounded-xl border border-cri-border bg-white p-4 text-left shadow-sm transition hover:border-cri-green hover:ring-1 hover:ring-cri-green"
            >
              <div className="flex items-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cri-green/10 text-xs font-semibold text-cri-green">
                  {t.title.charAt(0)}
                </span>
                <span className="ml-auto text-xs font-semibold text-cri-green">Available →</span>
              </div>
              <p className="mt-3 font-semibold text-cri-charcoal">{t.title}</p>
              <p className="text-xs text-cri-steel">{t.subtitle}</p>
            </button>
          ) : (
            <div
              key={t.value}
              aria-disabled="true"
              className="cursor-not-allowed rounded-xl border border-cri-border bg-cri-bg p-4 text-left opacity-70"
            >
              <div className="flex items-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-xs font-semibold text-gray-400">
                  {t.title.charAt(0)}
                </span>
                <span className="ml-auto rounded-full bg-cri-amber-light px-2 py-0.5 text-[10px] font-semibold text-cri-amber-dark">
                  Coming soon
                </span>
              </div>
              <p className="mt-3 font-semibold text-cri-steel">{t.title}</p>
              <p className="text-xs text-cri-steel">{t.subtitle}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
