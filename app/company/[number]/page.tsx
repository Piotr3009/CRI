import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMainContractorReportRows,
  getServiceProviderReportRows,
  getCompanyEntityTypes,
} from "@/lib/reports";
import { aggregateMainContractor } from "@/lib/level2/mainContractor";
import { aggregateServiceProvider } from "@/lib/level2/serviceProvider";
import { getCompanyProfile } from "@/lib/companiesHouse";
import { CompanyReport } from "@/components/CompanyReport";
import { ServiceProviderReport } from "@/components/ServiceProviderReport";
import { SP_CONFIGS, isSpEntityType } from "@/lib/spScores";
import type { EntityType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Company risk report",
  description: "Aggregated, evidence-backed risk report for a UK construction company.",
};

// Reads the live database and Companies House per request.
export const dynamic = "force-dynamic";

// Render order when a company has reports under more than one role.
const RENDER_ORDER: EntityType[] = [
  "MAIN_CONTRACTOR",
  "COMMERCIAL_CLIENT",
  "PROJECT_MANAGER",
  "QUANTITY_SURVEYOR",
  "ARCHITECT_PM",
];

export default async function CompanyReportPage({
  params,
}: {
  params: { number: string };
}) {
  const number = decodeURIComponent(params.number).trim();
  if (!number) notFound();

  const [types, facts] = await Promise.all([
    getCompanyEntityTypes(number),
    getCompanyProfile(number),
  ]);

  const present = types
    .map((t) => t.entityType)
    .filter((t) => RENDER_ORDER.includes(t))
    .sort((a, b) => RENDER_ORDER.indexOf(a) - RENDER_ORDER.indexOf(b));

  if (present.length === 0) notFound();

  const sections: React.ReactNode[] = [];
  for (const et of present) {
    if (et === "MAIN_CONTRACTOR" || et === "COMMERCIAL_CLIENT") {
      const rows = await getMainContractorReportRows(number, et);
      sections.push(
        <CompanyReport
          key={et}
          number={number}
          aggregate={aggregateMainContractor(rows)}
          totalReports={rows.length}
          facts={facts}
          kind={et === "COMMERCIAL_CLIENT" ? "commercial" : "contractor"}
        />,
      );
    } else if (isSpEntityType(et)) {
      const config = SP_CONFIGS[et];
      const rows = await getServiceProviderReportRows(number, et);
      sections.push(
        <ServiceProviderReport
          key={et}
          number={number}
          entityType={et}
          aggregate={aggregateServiceProvider(
            rows,
            config.scores.map((s) => s.key),
            config.recommendKey,
          )}
          facts={facts}
        />,
      );
    }
  }

  return <>{sections}</>;
}
