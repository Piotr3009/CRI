import Link from "next/link";
import type { RiskReport } from "@prisma/client";
import {
  ENTITY_TYPE_LABELS,
  MODERATION_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { calculateOverallRisk, isResidentialEntity } from "@/lib/privacy";
import { RiskBadge } from "./RiskBadge";
import { EvidenceBadge } from "./EvidenceBadge";
import { VisibilityBadge } from "./VisibilityBadge";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-cri-amber-light text-cri-amber-dark border-cri-amber/30",
  APPROVED: "bg-cri-green/10 text-cri-green border-cri-green/25",
  REJECTED: "bg-cri-charcoal/5 text-cri-charcoal border-cri-charcoal/15",
  DISPUTED: "bg-[#F4DFB6] text-cri-amber-dark border-cri-amber-dark/40",
};

function adminLabel(r: RiskReport): string {
  if (isResidentialEntity(r)) {
    return `Residential — ${r.clientInitials ?? "—"}`;
  }
  return r.entityName ?? ENTITY_TYPE_LABELS[r.entityType];
}

export function AdminReportTable({ reports }: { reports: RiskReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-cri-steel shadow-card">
        No reports in this category.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto shadow-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-cri-border text-xs uppercase tracking-wide text-cri-steel">
            <th className="px-4 py-3 font-medium">Entity</th>
            <th className="px-4 py-3 font-medium">Area</th>
            <th className="px-4 py-3 font-medium">Scores</th>
            <th className="px-4 py-3 font-medium">Overall</th>
            <th className="px-4 py-3 font-medium">Evidence</th>
            <th className="px-4 py-3 font-medium">Visibility</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              className="border-b border-cri-border last:border-0 hover:bg-cri-bg/60"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-cri-charcoal">{adminLabel(r)}</p>
                <p className="text-xs text-cri-steel">
                  {ENTITY_TYPE_LABELS[r.entityType]}
                </p>
              </td>
              <td className="px-4 py-3 text-cri-steel">{r.publicArea}</td>
              <td className="px-4 py-3 text-cri-charcoal">
                <span title="Payment">{r.paymentScore.toFixed(1)}</span>
                {" / "}
                <span title="Communication">
                  {r.communicationScore.toFixed(1)}
                </span>
              </td>
              <td className="px-4 py-3">
                <RiskBadge level={calculateOverallRisk(r)} />
              </td>
              <td className="px-4 py-3">
                <EvidenceBadge status={r.evidenceStatus} />
              </td>
              <td className="px-4 py-3">
                <VisibilityBadge visibility={r.visibility} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                    STATUS_STYLES[r.moderationStatus]
                  }`}
                >
                  {MODERATION_STATUS_LABELS[r.moderationStatus]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-cri-steel">
                {formatDate(r.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="font-semibold text-cri-green hover:underline"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
