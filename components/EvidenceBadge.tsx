import type { EvidenceStatus } from "@prisma/client";
import { EVIDENCE_STATUS_LABELS } from "@/lib/constants";
import { ShieldCheckIcon, ShieldIcon } from "./Icons";

const STYLES: Record<EvidenceStatus, string> = {
  UNVERIFIED: "bg-cri-bg text-cri-steel border-cri-border",
  BASIC_EVIDENCE: "bg-cri-amber-light text-cri-amber-dark border-cri-amber/30",
  VERIFIED_EVIDENCE: "bg-cri-green/10 text-cri-green border-cri-green/25",
  LEGAL_EVIDENCE: "bg-cri-green text-white border-cri-green",
};

export function EvidenceBadge({
  status,
  className = "",
}: {
  status: EvidenceStatus;
  className?: string;
}) {
  const verified = status === "VERIFIED_EVIDENCE" || status === "LEGAL_EVIDENCE";
  const Icon = verified ? ShieldCheckIcon : ShieldIcon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[status]} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {EVIDENCE_STATUS_LABELS[status]}
    </span>
  );
}
