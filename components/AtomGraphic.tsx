"use client";

import { useState } from "react";
import type { CompanyAtom, AtomCompany } from "@/lib/level2/atom";

type LoadState = "loading" | "error" | "done";

const CX = 180;
const CY = 105;
const ORX = 158;
const ORY = 64;
const TILT = 22;
const NUCLEUS_R = 46;
const MAX_NODES = 12;

const TITLE_RE = /\b(MR|MRS|MS|MISS|DR|PROF|SIR|DAME|LORD|LADY|REV|MX)\b/gi;

function statusColor(statusLabel: string): string {
  switch (statusLabel) {
    case "Active":
      return "#4A6B58";
    case "In administration":
    case "Voluntary arrangement":
      return "#D99A21";
    case "In liquidation":
    case "Insolvency proceedings":
    case "In receivership":
      return "#D64545";
    default:
      return "#9CA3AF";
  }
}

/** "TARASEK, Piotr" -> "Piotr Tarasek" (full, no truncation). */
function fullName(raw: string): string {
  let s = raw.replace(TITLE_RE, " ").replace(/\s+/g, " ").trim();
  if (s.includes(",")) {
    const [sur, ...rest] = s.split(",");
    s = `${rest.join(" ").trim()} ${sur.trim()}`.trim();
  }
  return s.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, sp, c) => sp + c.toUpperCase());
}

/** Short form for the small nucleus circle, where long names don't fit. */
function displayName(raw: string): string {
  const s = fullName(raw);
  return s.length > 16 ? `${s.slice(0, 15)}…` : s;
}

function nucleusLinesFor(names: string[]): string[] {
  const unique = Array.from(new Set(names.map(displayName)));
  if (unique.length === 0) return ["Owners"];
  const shown = unique.slice(0, 2);
  if (unique.length > 2) shown.push(`+${unique.length - 2} more`);
  return shown;
}

function insolvencyVerdict(
  count: number,
): { label: string; color: string; bg: string } | null {
  if (count >= 3)
    return { label: `Phoenix pattern — ${count} linked companies failed`, color: "#FFFFFF", bg: "#D64545" };
  if (count === 2)
    return { label: "Concern — 2 linked companies have insolvency history", color: "#B27C14", bg: "#FBF1DD" };
  if (count === 1)
    return { label: "Watch — 1 linked company has insolvency history", color: "#B27C14", bg: "#FBF1DD" };
  return { label: "No insolvencies among linked companies", color: "#344E41", bg: "#EAF0EC" };
}

function nodePos(i: number, n: number) {
  const tiltDeg = i % 2 === 0 ? TILT : -TILT;
  const t = ((-90 + (360 / Math.max(n, 1)) * i) * Math.PI) / 180;
  const ex = ORX * Math.cos(t);
  const ey = ORY * Math.sin(t);
  const r = (tiltDeg * Math.PI) / 180;
  return {
    x: CX + ex * Math.cos(r) - ey * Math.sin(r),
    y: CY + ex * Math.sin(r) + ey * Math.cos(r),
  };
}

export function AtomGraphic({
  atom,
  state,
  companyName,
}: {
  atom: CompanyAtom | null;
  state: LoadState;
  companyName: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const core = atom?.core ?? [];
  const allConnected = atom?.connected ?? [];

  // People who actually link to at least one connected company.
  const linkers = core.filter((p) => allConnected.some((c) => c.people.includes(p.name)));
  const showChips = state === "done" && linkers.length >= 2;
  const sel = selected && linkers.some((p) => p.name === selected) ? selected : null;

  const connected = sel ? allConnected.filter((c) => c.people.includes(sel)) : allConnected;
  const nodes = connected.slice(0, MAX_NODES);

  const ownerNames = core.filter((p) => p.isOwner).map((p) => p.name);
  const nucleusNames = sel ? [sel] : ownerNames.length ? ownerNames : core.map((p) => p.name);
  const lines = state === "done" ? nucleusLinesFor(nucleusNames) : ["Owners"];
  const lineH = 12.5;
  const firstY = CY - ((lines.length - 1) * lineH) / 2 + 3.5;

  const insolvencyCount = connected.filter((c) => c.insolvent).length;
  const verdict = state === "done" && connected.length > 0 ? insolvencyVerdict(insolvencyCount) : null;

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
      active
        ? "bg-cri-green text-white"
        : "border border-cri-border bg-white text-cri-charcoal hover:border-cri-green"
    }`;

  return (
    <div>
      {showChips ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-cri-steel">Show:</span>
          <button type="button" onClick={() => setSelected(null)} className={chip(!sel)}>
            All
          </button>
          {linkers.map((p) => (
            <button key={p.name} type="button" onClick={() => setSelected(p.name)} className={chip(sel === p.name)}>
              {fullName(p.name)}
            </button>
          ))}
        </div>
      ) : null}

      {verdict ? (
        <div
          className="mb-3 rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ backgroundColor: verdict.bg, color: verdict.color }}
        >
          {verdict.label}
        </div>
      ) : null}

      <div className="rounded-xl border border-cri-border bg-cri-bg/50 p-2">
        <svg viewBox="0 0 360 215" className="mx-auto w-full max-w-[380px]" role="img" aria-label={`Companies connected to ${companyName}`}>
          <g fill="none" stroke="#8A9097" strokeOpacity="0.55" strokeWidth="1.4">
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${TILT} ${CX} ${CY})`} />
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${-TILT} ${CX} ${CY})`} />
          </g>

          {nodes.map((c, i) => {
            const p = nodePos(i, nodes.length);
            return (
              <circle
                key={c.number}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="11"
                fill={c.insolvent ? "#D64545" : statusColor(c.statusLabel)}
                stroke={c.viaOwner ? "#1F2933" : "#FFFFFF"}
                strokeWidth={c.viaOwner ? "2.5" : "2"}
              />
            );
          })}

          <circle cx={CX} cy={CY} r={NUCLEUS_R} fill="#344E41" stroke="#FFFFFF" strokeWidth="2" />
          {lines.map((line, i) => (
            <text
              key={i}
              x={CX}
              y={(firstY + i * lineH).toFixed(1)}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill="#FFFFFF"
            >
              {line}
            </text>
          ))}
        </svg>
      </div>

      {state === "done" && nucleusNames.length > 0 ? (
        <p className="mt-2 text-center text-sm">
          <span className="text-cri-steel">{sel ? "Showing " : ownerNames.length ? "Owners: " : "People: "}</span>
          <span className="font-medium text-cri-charcoal">
            {Array.from(new Set(nucleusNames.map(fullName))).join(", ")}
          </span>
        </p>
      ) : null}

      {state === "loading" ? (
        <p className="mt-2 text-sm text-cri-steel">Loading connections from Companies House…</p>
      ) : state === "error" ? (
        <p className="mt-2 text-sm text-cri-steel">Couldn&apos;t load connections right now.</p>
      ) : connected.length === 0 ? (
        <p className="mt-2 text-sm text-cri-steel">No connected companies on record.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {connected.map((c: AtomCompany) => (
            <a
              key={c.number}
              href={`/company/${c.number}`}
              className="-mx-1 flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-cri-bg"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.insolvent ? "#D64545" : statusColor(c.statusLabel) }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-cri-charcoal">{c.name}</span>
                <span className="block font-mono text-xs text-cri-steel">{c.number}</span>
              </span>
              <span className="ml-auto shrink-0 text-xs" style={{ color: c.insolvent ? "#D64545" : "#6B7280" }}>
                {c.insolvent ? "Insolvency" : c.statusLabel}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
