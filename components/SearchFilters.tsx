import Link from "next/link";
import {
  ENTITY_TYPE_LABELS,
  EVIDENCE_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  optionsFromLabels,
} from "@/lib/constants";
import { SearchIcon } from "./Icons";

export type SearchValues = {
  query?: string;
  entityType?: string;
  riskLevel?: string;
  evidenceStatus?: string;
  residential?: string;
  area?: string;
};

/**
 * Search + filter form. Plain GET form so it works without client JS — the
 * /search server component reads these as searchParams and re-renders.
 *
 * Note: the brief lists several name fields (company / developer / main
 * contractor / PM / QS). These are unified into one keyword field that matches
 * the entity name, combined with the "Entity type" filter to narrow by role.
 */
export function SearchFilters({ values }: { values: SearchValues }) {
  const entityOptions = optionsFromLabels(ENTITY_TYPE_LABELS);
  const riskOptions = optionsFromLabels(RISK_LEVEL_LABELS);
  const evidenceOptions = optionsFromLabels(EVIDENCE_STATUS_LABELS);

  return (
    <form
      method="get"
      action="/search"
      className="card p-5 shadow-card"
      aria-label="Search risk database"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="query" className="label">
            Search by name, company, postcode or area
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cri-steel" />
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={values.query ?? ""}
              placeholder="e.g. Northline Build Group, SW19, Manchester"
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <label htmlFor="entityType" className="label">
            Entity type
          </label>
          <select
            id="entityType"
            name="entityType"
            defaultValue={values.entityType ?? ""}
            className="input"
          >
            <option value="">All entity types</option>
            {entityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="residential" className="label">
            Commercial / Residential
          </label>
          <select
            id="residential"
            name="residential"
            defaultValue={values.residential ?? ""}
            className="input"
          >
            <option value="">All</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RESIDENTIAL">Residential</option>
          </select>
        </div>

        <div>
          <label htmlFor="riskLevel" className="label">
            Risk level
          </label>
          <select
            id="riskLevel"
            name="riskLevel"
            defaultValue={values.riskLevel ?? ""}
            className="input"
          >
            <option value="">Any risk level</option>
            {riskOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="evidenceStatus" className="label">
            Evidence status
          </label>
          <select
            id="evidenceStatus"
            name="evidenceStatus"
            defaultValue={values.evidenceStatus ?? ""}
            className="input"
          >
            <option value="">Any evidence status</option>
            {evidenceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="area" className="label">
            Area / postcode
          </label>
          <input
            id="area"
            name="area"
            type="text"
            defaultValue={values.area ?? ""}
            placeholder="e.g. SW19, NW London, Manchester"
            className="input"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary gap-2">
          <SearchIcon className="h-4 w-4" />
          Search risk database
        </button>
        <Link href="/search" className="btn-ghost">
          Clear filters
        </Link>
      </div>
    </form>
  );
}
