import type { CompanyAtom, AtomCompany } from "@/lib/level2/atom";

type LoadState = "loading" | "error" | "done";

const CX = 180;
const CY = 105;
const ORX = 158; // orbit radius x
const ORY = 64; // orbit radius y
const TILT = 22; // orbit tilt in degrees
const NUCLEUS_R = 46;
const MAX_NODES = 12;

const TITLE_RE = /\b(MR|MRS|MS|MISS|DR|PROF|SIR|DAME|LORD|LADY|REV|MX)\b/gi;

function statusColor(statusLabel: string): string {
  switch (statusLabel) {
    case "Active":
      return "#4A6B58"; // green
    case "In administration":
    case "Voluntary arrangement":
      return "#D99A21"; // amber
    case "In liquidation":
    case "Insolvency proceedings":
    case "In receivership":
      return "#D64545"; // red
    default:
      return "#9CA3AF"; // dissolved / closed / unknown — grey
  }
}

/** "TARASEK, Piotr" -> "Piotr Tarasek"; strips titles, title-cases, truncates. */
function displayName(raw: string): string {
  let s = raw.replace(TITLE_RE, " ").replace(/\s+/g, " ").trim();
  if (s.includes(",")) {
    const [sur, ...rest] = s.split(",");
    s = `${rest.join(" ").trim()} ${sur.trim()}`.trim();
  }
  s = s.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, sp, c) => sp + c.toUpperCase());
  return s.length > 16 ? `${s.slice(0, 15)}…` : s;
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

/** Owner names go in the nucleus (electrons orbit the owners, not the company). */
function nucleusLines(atom: CompanyAtom | null, state: LoadState): string[] {
  if (state !== "done" || !atom) return ["Owners"];
  const owners = atom.core.filter((p) => p.isOwner).map((p) => p.name);
  const base = (owners.length ? owners : atom.core.map((p) => p.name)).map(displayName);
  const unique = Array.from(new Set(base));
  if (unique.length === 0) return ["Owners"];
  const shown = unique.slice(0, 2);
  if (unique.length > 2) shown.push(`+${unique.length - 2} more`);
  return shown;
}

/** Place node i (of n) on one of two tilted ellipses so electrons sit ON the orbits. */
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
  const connected = atom?.connected ?? [];
  const nodes = connected.slice(0, MAX_NODES);
  const lines = nucleusLines(atom, state);
  const lineH = 12.5;
  const firstY = CY - ((lines.length - 1) * lineH) / 2 + 3.5;
  const verdict =
    state === "done" && connected.length > 0 ? insolvencyVerdict(atom?.insolvencyCount ?? 0) : null;

  return (
    <div>
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
          {/* orbits */}
          <g fill="none" stroke="#8A9097" strokeOpacity="0.55" strokeWidth="1.4">
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${TILT} ${CX} ${CY})`} />
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${-TILT} ${CX} ${CY})`} />
          </g>

          {/* electrons */}
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

          {/* nucleus — owner names */}
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

      {/* legend / states */}
      {state === "loading" ? (
        <p className="mt-2 text-sm text-cri-steel">Loading connections from Companies House…</p>
      ) : state === "error" ? (
        <p className="mt-2 text-sm text-cri-steel">Couldn&apos;t load connections right now.</p>
      ) : connected.length === 0 ? (
        <p className="mt-2 text-sm text-cri-steel">No connected companies on record.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {connected.map((c: AtomCompany) => (
            <div key={c.number} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.insolvent ? "#D64545" : statusColor(c.statusLabel) }}
                aria-hidden
              />
              <span className="truncate font-medium text-cri-charcoal">{c.name}</span>
              <span
                className="ml-auto shrink-0 text-xs"
                style={{ color: c.insolvent ? "#D64545" : "#6B7280" }}
              >
                {c.insolvent ? "Insolvency" : c.statusLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
