import { RiskBadge } from "./RiskBadge";
import { EvidenceBadge } from "./EvidenceBadge";
import { VisibilityBadge } from "./VisibilityBadge";
import { ShieldCheckIcon, PoundIcon, ChatIcon } from "./Icons";

/**
 * Static hero "Project Risk Report" preview card. Illustrative sample only —
 * fixed values matching the marketing spec (not pulled from the database).
 */
export function DashboardPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-cri-border bg-white p-5 shadow-card-hover">
      <div className="flex items-center justify-between border-b border-cri-border pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cri-steel">
            Project Risk Report
          </p>
          <p className="text-sm font-semibold text-cri-charcoal">
            Sample preview
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cri-green/10 text-cri-green">
          <ShieldCheckIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-cri-border bg-cri-bg p-3">
          <div className="flex items-center gap-1.5 text-xs text-cri-steel">
            <PoundIcon className="h-3.5 w-3.5" /> Payment Score
          </div>
          <p className="mt-1 text-xl font-bold text-cri-charcoal">
            3.2<span className="text-sm font-normal text-cri-steel">/10</span>
          </p>
        </div>
        <div className="rounded-lg border border-cri-border bg-cri-bg p-3">
          <div className="flex items-center gap-1.5 text-xs text-cri-steel">
            <ChatIcon className="h-3.5 w-3.5" /> Communication
          </div>
          <p className="mt-1 text-xl font-bold text-cri-charcoal">
            4.1<span className="text-sm font-normal text-cri-steel">/10</span>
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-cri-steel">Variation Risk</dt>
          <dd>
            <RiskBadge level="HIGH" />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-cri-steel">Dispute Risk</dt>
          <dd>
            <RiskBadge level="MEDIUM" />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-cri-steel">Evidence Status</dt>
          <dd>
            <EvidenceBadge status="VERIFIED_EVIDENCE" />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-cri-steel">Visibility</dt>
          <dd>
            <VisibilityBadge visibility="VERIFIED_CONTRACTORS_ONLY" />
          </dd>
        </div>
      </dl>
    </div>
  );
}
