"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { RiskBadge } from "./RiskBadge";
import { EvidenceBadge } from "./EvidenceBadge";
import { VisibilityBadge } from "./VisibilityBadge";
import {
  ShieldCheckIcon,
  PoundIcon,
  ChatIcon,
  ArrowRightIcon,
  BuildingIcon,
  ClipboardIcon,
  UsersIcon,
} from "./Icons";

type IconProps = { className?: string };

function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Single semicircular gauge tile (red -> amber -> green) with a needle.
 * Needle angle is derived from the score so the tile is reusable.
 */
function GaugeTile({
  score,
  label,
  icon,
}: {
  score: number;
  label: string;
  icon: React.ReactNode;
}) {
  const rad = ((180 - (score / 10) * 180) * Math.PI) / 180;
  const x2 = (80 + 46 * Math.cos(rad)).toFixed(1);
  const y2 = (80 - 46 * Math.sin(rad)).toFixed(1);

  return (
    <div className="rounded-lg border border-cri-border bg-cri-bg p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-cri-steel">
        {icon} {label}
      </div>
      <svg
        viewBox="0 0 160 90"
        className="mx-auto mt-1 w-full max-w-[130px]"
        role="img"
        aria-label={`${label} ${score.toFixed(1)} out of 10`}
      >
        <path d="M22 80 A58 58 0 0 1 51 29.8" fill="none" stroke="#C0392B" strokeWidth={11} />
        <path d="M51 29.8 A58 58 0 0 1 109 29.8" fill="none" stroke="#D99A21" strokeWidth={11} />
        <path d="M109 29.8 A58 58 0 0 1 138 80" fill="none" stroke="#4A6B58" strokeWidth={11} />
        <line x1={80} y1={80} x2={x2} y2={y2} stroke="#1F2933" strokeWidth={3} strokeLinecap="round" />
        <circle cx={80} cy={80} r={5} fill="#1F2933" />
      </svg>
      <p className="-mt-1 text-xl font-bold text-cri-charcoal">
        {score.toFixed(1)}
        <span className="text-sm font-normal text-cri-steel">/10</span>
      </p>
    </div>
  );
}

const LINKED_COMPANIES = [
  { name: "Northline Build", status: "Active", color: "#4A6B58" },
  { name: "Meridian QS Ltd", status: "Active", color: "#4A6B58" },
  { name: "Crownstone Ltd", status: "Administration", color: "#D99A21" },
  { name: "Apex Contractors", status: "Dissolved", color: "#6B7280" },
  { name: "Vertex Build", status: "Dissolved", color: "#6B7280" },
  { name: "Summit Projects", status: "In liquidation", color: "#C0392B" },
];

/** Revealed "atom": director at the nucleus, linked companies orbiting + named list. */
function ConnectionsAtom() {
  return (
    <div className="rounded-lg bg-cri-bg p-3">
      <svg viewBox="0 0 320 150" className="mx-auto block w-full max-w-[280px]" role="img" aria-label="Connections map: director linked to six companies">
        <ellipse cx={160} cy={80} rx={120} ry={52} fill="none" stroke="#6B7280" strokeWidth={1} opacity={0.3} />
        <ellipse cx={160} cy={80} rx={120} ry={52} fill="none" stroke="#6B7280" strokeWidth={1} opacity={0.2} transform="rotate(35 160 80)" />
        <circle cx={280} cy={80} r={8} fill="#4A6B58" />
        <circle cx={220} cy={125} r={8} fill="#C0392B" />
        <circle cx={100} cy={125} r={8} fill="#6B7280" />
        <circle cx={40} cy={80} r={8} fill="#4A6B58" />
        <circle cx={100} cy={35} r={8} fill="#6B7280" />
        <circle cx={220} cy={35} r={8} fill="#D99A21" />
        <circle cx={160} cy={80} r={22} fill="#344E41" />
        <text x={160} y={84} textAnchor="middle" fontSize={10} fill="#FFFFFF">Director</text>
      </svg>
      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {LINKED_COMPANIES.map((c) => (
          <li key={c.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
            <span className="font-medium text-cri-charcoal">{c.name}</span>
            <span className="text-cri-steel">· {c.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHead({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-cri-steel">{icon}</span>
      <span className="text-sm font-semibold text-cri-charcoal">{children}</span>
    </div>
  );
}

/** Full sample report — the post-purchase view a buyer gets after unlocking. */
function SampleReportModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-cri-charcoal/50 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Sample company risk report"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-xl rounded-2xl border border-cri-border bg-white shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-cri-border p-5">
          <div>
            <h3 className="text-lg font-semibold text-cri-charcoal">Northline Build Group</h3>
            <p className="mt-0.5 text-xs text-cri-steel">Company no. 09421765 · Manchester</p>
            <span className="mt-2 inline-block rounded-md border border-cri-border px-2 py-0.5 text-[11px] text-cri-steel">
              Sample report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap rounded-md bg-cri-green/10 px-2.5 py-1 text-xs font-medium text-cri-green">
              Active
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sample report"
              className="rounded-md p-1.5 text-cri-steel transition-colors hover:bg-cri-bg"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Snapshot */}
        <div className="grid grid-cols-3 border-b border-cri-border bg-cri-bg">
          <div className="border-r border-cri-border p-3">
            <p className="text-xs text-cri-steel">Overall risk</p>
            <p className="text-base font-semibold text-cri-amber">Medium–high</p>
          </div>
          <div className="border-r border-cri-border p-3">
            <p className="text-xs text-cri-steel">Reviews</p>
            <p className="text-base font-semibold text-cri-charcoal">4</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-cri-steel">Linked companies</p>
            <p className="text-base font-semibold text-cri-charcoal">6</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 p-5">
          {/* D — Contractor reviews */}
          <div>
            <SectionHead icon={<ChatIcon className="h-4 w-4" />}>Contractor reviews</SectionHead>
            <div className="grid grid-cols-2 gap-3">
              <GaugeTile score={3.2} label="Payment Score" icon={<PoundIcon className="h-3.5 w-3.5" />} />
              <GaugeTile score={4.1} label="Communication" icon={<ChatIcon className="h-3.5 w-3.5" />} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <RiskBadge level="HIGH" label="Variation" />
              <RiskBadge level="MEDIUM" label="Dispute" />
            </div>
            <p className="mt-2 text-[11px] text-cri-steel">
              Based on 4 reports · contractor-submitted, not CTX&rsquo;s opinion.
            </p>
          </div>

          {/* B — Connections (revealed) */}
          <div>
            <SectionHead icon={<UsersIcon className="h-4 w-4" />}>Connections</SectionHead>
            <ConnectionsAtom />
          </div>

          {/* A — Company details */}
          <div>
            <SectionHead icon={<BuildingIcon className="h-4 w-4" />}>Company details</SectionHead>
            <dl className="text-sm text-cri-charcoal">
              <div className="flex justify-between border-b border-cri-border py-1.5">
                <dt className="text-cri-steel">Incorporated</dt>
                <dd>14 Mar 2019</dd>
              </div>
              <div className="flex justify-between border-b border-cri-border py-1.5">
                <dt className="text-cri-steel">Type</dt>
                <dd>Private limited</dd>
              </div>
              <div className="flex justify-between border-b border-cri-border py-1.5">
                <dt className="text-cri-steel">Industry (SIC)</dt>
                <dd>41201 · Construction</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-cri-steel">Registered office</dt>
                <dd>Manchester, M3</dd>
              </div>
            </dl>
          </div>

          {/* C — Filing health */}
          <div>
            <SectionHead icon={<ClipboardIcon className="h-4 w-4" />}>Filing health</SectionHead>
            <dl className="text-sm text-cri-charcoal">
              <div className="flex items-center justify-between border-b border-cri-border py-1.5">
                <dt className="text-cri-steel">Accounts</dt>
                <dd className="rounded-md bg-[#C0392B]/10 px-2 py-0.5 text-xs text-[#C0392B]">Overdue</dd>
              </div>
              <div className="flex items-center justify-between border-b border-cri-border py-1.5">
                <dt className="text-cri-steel">Confirmation statement</dt>
                <dd className="text-xs text-cri-green-light">Up to date</dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-cri-steel">Charges / mortgages</dt>
                <dd>1 registered</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Marketing footer (post-purchase view — no paywall) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cri-border bg-cri-bg p-5">
          <div>
            <p className="text-sm font-medium text-cri-charcoal">This is a full sample report</p>
            <p className="mt-0.5 text-[11px] text-cri-steel">Real company reports from £2.99</p>
          </div>
          <Link
            href="/search"
            onClick={onClose}
            className="rounded-lg bg-cri-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cri-green-dark"
          >
            Search the database
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero "Project Risk Report" preview card. Illustrative sample only — fixed
 * values, not from the database. Opens a full sample report in a modal.
 */
export function DashboardPreview() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-cri-border bg-white p-5 shadow-card-hover">
      <div className="flex items-center justify-between border-b border-cri-border pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cri-steel">
            Project Risk Report
          </p>
          <p className="text-sm font-semibold text-cri-charcoal">Sample preview</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cri-green/10 text-cri-green">
          <ShieldCheckIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <GaugeTile score={3.2} label="Payment Score" icon={<PoundIcon className="h-3.5 w-3.5" />} />
        <GaugeTile score={4.1} label="Communication" icon={<ChatIcon className="h-3.5 w-3.5" />} />
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
          <dt className="text-cri-steel">Connections</dt>
          <dd className="text-xs text-cri-steel">6 linked · 3 dissolved</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-cri-steel">Visibility</dt>
          <dd>
            <VisibilityBadge visibility="VERIFIED_CONTRACTORS_ONLY" />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cri-border bg-white px-4 py-2.5 text-sm font-semibold text-cri-green transition-colors hover:bg-cri-bg"
      >
        View full sample report
        <ArrowRightIcon className="h-4 w-4" />
      </button>

      {mounted && open && createPortal(<SampleReportModal onClose={() => setOpen(false)} />, document.body)}
    </div>
  );
}
