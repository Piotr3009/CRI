import type { Metadata } from "next";
import type { EntityType, EvidenceStatus } from "@prisma/client";
import { getApprovedReports, withReportCounts } from "@/lib/reports";
import {
  ENTITY_TYPE_LABELS,
  EVIDENCE_STATUS_LABELS,
  RISK_LEVEL_LABELS,
} from "@/lib/constants";
import { SearchFilters } from "@/components/SearchFilters";
import { ReportCard } from "@/components/ReportCard";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Search Construction Risk Reports",
  description:
    "Search moderated, evidence-backed construction risk reports by company, area, entity type, risk level and evidence status.",
};

// Reads the live database per request — never statically generated.
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

function str(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Only allow values that exist in `allowed`, otherwise drop the filter. */
function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = str(searchParams.query);
  const area = str(searchParams.area);
  const entityType = oneOf(
    str(searchParams.entityType),
    Object.keys(ENTITY_TYPE_LABELS) as EntityType[],
  );
  const evidenceStatus = oneOf(
    str(searchParams.evidenceStatus),
    Object.keys(EVIDENCE_STATUS_LABELS) as EvidenceStatus[],
  );
  const residential = oneOf(str(searchParams.residential), [
    "RESIDENTIAL",
    "COMMERCIAL",
  ] as const);
  const riskLevel = oneOf(
    str(searchParams.riskLevel),
    Object.keys(RISK_LEVEL_LABELS) as Array<keyof typeof RISK_LEVEL_LABELS>,
  );

  const approved = await getApprovedReports({
    query,
    area,
    entityType,
    evidenceStatus,
    residential,
  });

  // Overall risk is derived, so the risk-level filter is applied in memory.
  let results = withReportCounts(approved);
  if (riskLevel) results = results.filter((r) => r.overallRisk === riskLevel);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Search Risk
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Search the risk database
        </h1>
        <p className="mt-3 text-cri-steel">
          Only moderated, approved reports are shown. Residential records display
          initials and area only.
        </p>
      </div>

      <div className="mt-8">
        <SearchFilters
          values={{
            query,
            area,
            entityType,
            evidenceStatus,
            residential,
            riskLevel,
          }}
        />
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm text-cri-steel">
          {results.length}{" "}
          {results.length === 1 ? "verified record" : "verified records"} found
        </p>

        {results.length === 0 ? (
          <EmptyState
            title="No verified risk records found yet."
            description="Try a broader search, or be the first to submit a moderated report for this area or entity."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
