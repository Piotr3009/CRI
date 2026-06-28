import type { CompanyAtom, AtomCompany } from "@/lib/level2/atom";

type LoadState = "loading" | "error" | "done";

const CX = 180;
const CY = 105;
const ORX = 150; // orbit radius x
const ORY = 56; // orbit radius y
const TILT = 22; // orbit tilt in degrees
const MAX_NODES = 12;

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

/** Place node i (of n) on one of two tilted ellipses so electrons sit ON the orbits. */
function nodePos(i: number, n: number) {
  const tiltDeg = i % 2 === 0 ? TILT : -TILT;
  const t = ((-90 + (360 / Math.max(n, 1)) * i) * Math.PI) / 180; // parametric angle
  const ex = ORX * Math.cos(t);
  const ey = ORY * Math.sin(t);
  const r = (tiltDeg * Math.PI) / 180;
  return {
    x: CX + ex * Math.cos(r) - ey * Math.sin(r),
    y: CY + ex * Math.sin(r) + ey * Math.cos(r),
  };
}

function nucleusLines(name: string): string[] {
  const cleaned = name.replace(/\b(LIMITED|LTD|PLC|LLP|GROUP|THE)\b/gi, "").trim();
  const words = (cleaned || name).split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => (w.length > 9 ? w.slice(0, 9) : w));
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
  const lines = nucleusLines(companyName);

  return (
    <div>
      <div className="rounded-xl border border-cri-border bg-cri-bg/50 p-2">
        <svg viewBox="0 0 360 210" className="mx-auto w-full max-w-[380px]" role="img" aria-label="Connected companies diagram">
          {/* orbits — clearly visible */}
          <g fill="none" stroke="#8A9097" strokeOpacity="0.55" strokeWidth="1.4">
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${TILT} ${CX} ${CY})`} />
            <ellipse cx={CX} cy={CY} rx={ORX} ry={ORY} transform={`rotate(${-TILT} ${CX} ${CY})`} />
          </g>

          {/* electrons (on the orbits) */}
          {nodes.map((c, i) => {
            const p = nodePos(i, nodes.length);
            return (
              <circle
                key={c.number}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r="11"
                fill={statusColor(c.statusLabel)}
                stroke={c.viaOwner ? "#1F2933" : "#FFFFFF"}
                strokeWidth={c.viaOwner ? "2.5" : "2"}
              />
            );
          })}

          {/* nucleus */}
          <circle cx={CX} cy={CY} r="36" fill="#344E41" stroke="#FFFFFF" strokeWidth="2" />
          {lines.length === 1 ? (
            <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#FFFFFF">
              {lines[0]}
            </text>
          ) : (
            <>
              <text x={CX} y={CY - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF">
                {lines[0]}
              </text>
              <text x={CX} y={CY + 11} textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF">
                {lines[1]}
              </text>
            </>
          )}
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
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: statusColor(c.statusLabel) }} aria-hidden />
              <span className="truncate font-medium text-cri-charcoal">{c.name}</span>
              <span className="ml-auto shrink-0 text-xs text-cri-steel">{c.statusLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
