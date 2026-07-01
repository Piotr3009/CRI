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
import { CompanyPaywall } from "@/components/CompanyPaywall";
import { SP_CONFIGS, isSpEntityType } from "@/lib/spScores";
import { getCurrentUser } from "@/lib/user";
import { isAdminRole } from "@/lib/auth";
import {
  countApprovedCompanyReports,
  hasCompanyAccess,
  tierForApprovedCount,
} from "@/lib/purchases";
import { confirmCheckoutSession } from "./actions";
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

// Moderated reporter comments for a set of report rows (only those a moderator
// chose to publish via publicSummary), newest first by virtue of the query order.
function toComments(
  rows: { publicSummary?: string | null; createdAt?: Date | null }[],
) {
  return rows
    .filter((r) => r.publicSummary && r.publicSummary.trim())
    .map((r) => ({ text: r.publicSummary!.trim(), date: r.createdAt ?? null }));
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

  // ---------------------------------------------------------------------
  // Pay-per-report gate. Admins always pass; buyers pass while their 30-day
  // access is live. Returning from Stripe, the session_id fallback grants
  // access immediately even if the webhook hasn't landed yet.
  // ---------------------------------------------------------------------
  const user = await getCurrentUser();

  const sessionIdRaw = searchParams?.session_id;
  if (user && typeof sessionIdRaw === "string" && sessionIdRaw) {
    await confirmCheckoutSession(sessionIdRaw, user.id);
  }

  const isAdmin = user ? isAdminRole(user.role) : false;
  const unlocked =
    isAdmin || (user ? await hasCompanyAccess(user.id, number) : false);

  if (!unlocked) {
    const approvedCount = await countApprovedCompanyReports(number);
    const { amountPence } = tierForApprovedCount(approvedCount);
    return (
      <CompanyPaywall
        number={number}
        facts={facts}
        approvedCount={approvedCount}
        amountPence={amountPence}
        signedIn={Boolean(user)}
      />
    );
  }

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
          comments={toComments(rows)}
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
          comments={toComments(rows)}
        />,
      );
    }
  }

  return <>{sections}</>;
}
