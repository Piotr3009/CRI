import type { RiskLevel } from "@prisma/client";
import { RISK_LEVEL_LABELS } from "@/lib/constants";

/**
 * Risk level badge.
 *  Low    = calm green tone
 *  Medium = amber tone
 *  High   = stronger / dark amber warning tone
 */
const STYLES: Record<RiskLevel, { wrap: string; dot: string }> = {
  LOW: {
    wrap: "bg-cri-green/10 text-cri-green border-cri-green/25",
    dot: "bg-cri-green",
  },
  MEDIUM: {
    wrap: "bg-cri-amber-light text-cri-amber-dark border-cri-amber/40",
    dot: "bg-cri-amber",
  },
  HIGH: {
    wrap: "bg-[#F4DFB6] text-cri-amber-dark border-cri-amber-dark/40 font-semibold",
    dot: "bg-cri-amber-dark",
  },
};

export function RiskBadge({
  level,
  label,
  className = "",
}: {
  level: RiskLevel;
  /** Optional prefix, e.g. "Variation Risk". */
  label?: string;
  className?: string;
}) {
  const s = STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.wrap} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {label ? <span className="font-normal opacity-80">{label}:</span> : null}
      {RISK_LEVEL_LABELS[level]}
    </span>
  );
}
