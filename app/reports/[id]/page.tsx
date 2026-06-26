import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicRiskReportById,
  countApprovedForPublicReport,
} from "@/lib/reports";
import {
  ENTITY_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  CONTRACT_VALUE_LABELS,
  MODERATION_STATUS_LABELS,
} from "@/lib/constants";
import { publicLabel } from "@/lib/privacy";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { RiskBadge } from "@/components/RiskBadge";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { PoundIcon, ChatIcon, LockIcon, ArrowRightIcon } from "@/components/Icons";
import { RightToReplyForm } from "./RightToReplyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const report = await getPublicRiskReportById(params.id);
  if (!report) return { title: "Risk report not found" };

  // Only allow indexing of fully public (non-residential, public) reports.
  const indexable = report.visibility === "PUBLIC" && !report.isResidential;
  return {
    title: `Risk Report — ${publicLabel(report)}`,
    description: report.publicSummary
      ? report.publicSummary.slice(0, 155)
      : "Moderated construction risk report on CRI.",
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-cri-steel">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-cri-charcoal">{value}</dd>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getPublicRiskReportById(params.id);
  if (!report) notFound();

  const reportCount = await countApprovedForPublicReport(report);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm font-medium text-cri-steel hover:text-cri-green"
      >
        ← Back to search
      </Link>

      {/* Header */}
      <div className="mt-4 card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cri-steel">
              {ENTITY_TYPE_LABELS[report.entityType]}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cri-charcoal">
              {report.publicDisplayName}
              {report.initials ? (
                <span className="text-cri-steel"> — {report.initials}</span>
              ) : null}
            </h1>
            <p className="mt-1 text-sm text-cri-steel">
              {report.area} · {PROJECT_TYPE_LABELS[report.projectType]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={report.overallRisk} label="Overall" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cri-green/25 bg-cri-green/10 px-2.5 py-1 text-xs font-medium text-cri-green">
              {MODERATION_STATUS_LABELS[report.moderationStatus]}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <RiskScoreCard
            label="Payment Score"
            score={report.paymentScore}
            icon={<PoundIcon className="h-4 w-4" />}
          />
          <RiskScoreCard
            label="Communication Score"
            score={report.communicationScore}
            icon={<ChatIcon className="h-4 w-4" />}
          />
        </div>

        <p className="mt-2 text-xs text-cri-steel">
          Based on {reportCount} contractor{" "}
          {reportCount === 1 ? "report" : "reports"}. Scores are
          contractor-submitted, not CRI&rsquo;s opinion.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <RiskBadge level={report.variationRisk} label="Variation Risk" />
          <RiskBadge level={report.disputeRisk} label="Dispute Risk" />
          <EvidenceBadge status={report.evidenceStatus} />
          <VisibilityBadge visibility={report.visibility} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-cri-border pt-5 sm:grid-cols-3">
          <DetailItem
            label="Entity Type"
            value={ENTITY_TYPE_LABELS[report.entityType]}
          />
          <DetailItem label="Area" value={report.area} />
          <DetailItem
            label="Project Type"
            value={PROJECT_TYPE_LABELS[report.projectType]}
          />
          <DetailItem
            label="Project Status"
            value={PROJECT_STATUS_LABELS[report.projectStatus]}
          />
          {report.contractValueRange ? (
            <DetailItem
              label="Contract Value"
              value={CONTRACT_VALUE_LABELS[report.contractValueRange] ?? "—"}
            />
          ) : null}
          <DetailItem
            label="Report Count"
            value={`${reportCount} ${reportCount === 1 ? "report" : "reports"}`}
          />
        </dl>
      </div>

      {/* Restricted-data notice for residential / restricted reports */}
      {report.restrictedDetails ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-cri-amber/30 bg-cri-amber-light p-4">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-cri-amber-dark" />
          <div className="text-sm text-cri-amber-dark">
            <p className="font-semibold">Restricted details</p>
            <p className="mt-0.5">
              {report.isResidential
                ? "This is a residential record. The full name, exact address and contact details are never shown publicly. Full details are restricted to verified contractors."
                : "Full details for this report are restricted to verified contractors."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Public summary */}
      <div className="mt-6 card p-6 shadow-card">
        <h2 className="text-base font-semibold text-cri-charcoal">
          Public Summary
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-cri-charcoal">
          {report.publicSummary
            ? report.publicSummary
            : "No public summary has been published for this report."}
        </p>
        <div className="mt-5">
          <LegalDisclaimer />
        </div>
      </div>

      {/* Right to reply */}
      <div id="right-to-reply" className="mt-6 card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cri-green/10 text-cri-green">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-cri-charcoal">
              Are you connected to this report?
            </h2>
            <p className="mt-1 text-sm text-cri-steel">
              You can request a review or submit a right to reply. Submissions are
              reviewed by our moderation team.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <RightToReplyForm reportId={report.id} />
        </div>
      </div>
    </div>
  );
}