import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getMainContractorReportRows,
  countApprovedReportsForCompany,
} from "@/lib/reports";
import { aggregateMainContractor } from "@/lib/level2/mainContractor";
import { getCompanyProfile } from "@/lib/companiesHouse";
import { CompanyReport } from "@/components/CompanyReport";

export const metadata: Metadata = {
  title: "Company risk report",
  description: "Aggregated, evidence-backed risk report for a UK construction company.",
};

// Reads the live database and Companies House per request.
export const dynamic = "force-dynamic";

export default async function CompanyReportPage({
  params,
}: {
  params: { number: string };
}) {
  const number = decodeURIComponent(params.number).trim();
  if (!number) notFound();

  const [rows, totalReports, facts] = await Promise.all([
    getMainContractorReportRows(number),
    countApprovedReportsForCompany(number),
    getCompanyProfile(number),
  ]);

  const aggregate = aggregateMainContractor(rows);

  return (
    <CompanyReport
      number={number}
      aggregate={aggregate}
      totalReports={totalReports}
      facts={facts}
    />
  );
}
