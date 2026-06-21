import type { Visibility } from "@prisma/client";
import { VISIBILITY_LABELS } from "@/lib/constants";
import { LockIcon } from "./Icons";

const STYLES: Record<Visibility, string> = {
  PUBLIC: "bg-cri-green/10 text-cri-green border-cri-green/25",
  VERIFIED_CONTRACTORS_ONLY:
    "bg-cri-amber-light text-cri-amber-dark border-cri-amber/30",
  ADMIN_ONLY: "bg-cri-charcoal/5 text-cri-charcoal border-cri-charcoal/15",
};

export function VisibilityBadge({
  visibility,
  className = "",
}: {
  visibility: Visibility;
  className?: string;
}) {
  const restricted = visibility !== "PUBLIC";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[visibility]} ${className}`}
    >
      {restricted ? <LockIcon className="h-3.5 w-3.5" /> : null}
      {VISIBILITY_LABELS[visibility]}
    </span>
  );
}
