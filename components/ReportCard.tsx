import Link from "next/link";
import type { PublicReport } from "@/lib/privacy";
import {
  ENTITY_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/constants";
import { RiskBadge } from "./RiskBadge";
import { EvidenceBadge } from "./EvidenceBadge";
import { VisibilityBadge } from "./VisibilityBadge";
import { LockIcon, ArrowRightIcon } from "./Icons";

export function ReportCard({
  report,
}: {
  report: PublicReport & { reportCount?: number };
}) {
  const count = report.reportCount ?? 1;

  return (
    <Link
      href={`/reports/${report.id}`}
      className="group flex flex-col rounded-xl border border-cri-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cri-steel">
            {ENTITY_TYPE_LABELS[report.entityType]}
          </span>
          <h3 className="mt-1 text-base font-semibold text-cri-charcoal">
            {report.publicDisplayName}
            {report.initials ? (
              <span className="text-cri-steel"> — {report.initials}</span>
            ) : null}
          </h3>
          <p className="text-sm text-cri-steel">
            {report.area} · {PROJECT_TYPE_LABELS[report.projectType]}
          </p>
        </div>
        <RiskBadge level={report.overallRisk} label="Overall" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-cri-border bg-cri-bg px-3 py-2">
          <p className="text-xs text-cri-steel">Payment Score</p>
          <p className="text-lg font-bold text-cri-charcoal">
            {report.paymentScore.toFixed(1)}
            <span className="text-xs font-normal text-cri-steel">/10</span>
          </p>
        </div>
        <div className="rounded-lg border border-cri-border bg-cri-bg px-3 py-2">
          <p className="text-xs text-cri-steel">Communication</p>
          <p className="text-lg font-bold text-cri-charcoal">
            {report.communicationScore.toFixed(1)}
            <span className="text-xs font-normal text-cri-steel">/10</span>
          </p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-cri-steel">
        Contractor-submitted, not CTX&rsquo;s opinion.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <RiskBadge level={report.variationRisk} label="Variation" />
        <RiskBadge level={report.disputeRisk} label="Dispute" />
        <EvidenceBadge status={report.evidenceStatus} />
      </div>

      {report.restrictedDetails ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-cri-steel">
          <LockIcon className="h-3.5 w-3.5" />
          Full details restricted to verified contractors.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-cri-border pt-3">
        <div className="flex items-center gap-3 text-xs text-cri-steel">
          <span>
            {count} {count === 1 ? "report" : "reports"}
          </span>
          <VisibilityBadge visibility={report.visibility} />
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-cri-green">
          View report
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}