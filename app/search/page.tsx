import type { Metadata } from "next";
import { CompanySearch } from "@/components/CompanySearch";

export const metadata: Metadata = {
  title: "Search a company's risk report",
  description:
    "Look up any UK construction company by name or director and open its aggregated, evidence-backed risk report.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Search Risk
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Look up a company
        </h1>
        <p className="mt-3 text-cri-steel">
          Search by company name, or switch to director name when the trading name
          isn&apos;t the registered one. Pick a company to open its risk report.
        </p>
      </div>

      <div className="mt-8">
        <CompanySearch />
      </div>
    </div>
  );
}
