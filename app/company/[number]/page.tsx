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

// Roles we can render a public report for, in display order.
const RENDER_ORDER: EntityType[] = [
  "MAIN_CONTRACTOR",
  "COMMERCIAL_CLIENT",
  "PROJECT_MANAGER",
  "QUANTITY_SURVEYOR",
  "ARCHITECT_PM",
];

function inScope(t: string): t is EntityType {
  return (RENDER_ORDER as string[]).includes(t);
}

export default async function CompanyReportPage({
  params,
  searchParams,
}: {
  params: { number: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const number = decodeURIComponent(params.number).trim();
  if (!number) notFound();

  const roleRaw = searchParams?.role;
  const role = typeof roleRaw === "string" && inScope(roleRaw) ? roleRaw : undefined;

  const [types, facts] = await Promise.all([
    getCompanyEntityTypes(number),
    getCompanyProfile(number),
  ]);

  const present = types
    .map((t) => t.entityType)
    .filter(inScope)
    .sort((a, b) => RENDER_ORDER.indexOf(a) - RENDER_ORDER.indexOf(b));

  // Role picked in search -> render exactly that role (empty shell + Companies
  // House data if it has no reviews yet). Direct link with no role -> render
  // whatever roles already have reports.
  let toRender: EntityType[] = role ? [role] : present;

  // Show the report whenever we have *something* worth selling: either real
  // Companies House facts, or at least one approved review for a chosen role.
  const hasContent = !!facts || toRender.some((t) => present.includes(t));
  if (!hasContent) notFound();

  // Direct link, no reviews, but the company is real -> default to a contractor
  // shell so the buyer still gets the Companies House intelligence.
  if (toRender.length === 0) toRender = ["MAIN_CONTRACTOR"];

  const sections: React.ReactNode[] = [];
  for (const et of toRender) {
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
