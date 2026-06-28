import type { CompanyAtom, AtomCompany } from "@/lib/level2/atom";

type LoadState = "loading" | "error" | "done";

const CX = 180;
const CY = 100;
const RX = 150;
const RY = 62;
const MAX_NODES = 10;

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

function nodePos(i: number, n: number) {
  // Even spread starting at top; alternate two ellipse radii for an orbital feel.
  const angle = (-90 + (360 / Math.max(n, 1)) * i) * (Math.PI / 180);
  const rx = i % 2 === 0 ? RX : RX * 0.74;
  const ry = i % 2 === 0 ? RY : RY * 1.18;
  return { x: CX + rx * Math.cos(angle), y: CY + ry * Math.sin(angle) };
}

function nucleusLabel(name: string): string {
  const trimmed = name.replace(/\b(LIMITED|LTD|GROUP|PLC|LLP)\b/gi, "").trim();
  return (trimmed || name).slice(0, 16);
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

  return (
    <div>
      <div className="rounded-xl border border-cri-border bg-cri-bg/50 p-2">
        <svg viewBox="0 0 360 200" className="mx-auto w-full max-w-[360px]" role="img" aria-label="Connected companies diagram">
          {/* decorative orbits */}
          <g stroke="#E5E7EB" fill="none" strokeWidth="1">
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} transform={`rotate(18 ${CX} ${CY})`} />
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} transform={`rotate(-18 ${CX} ${CY})`} />
          </g>

          {/* connectors + electrons */}
          {nodes.map((c, i) => {
            const p = nodePos(i, nodes.length);
            return (
              <g key={c.number}>
                <line x1={CX} y1={CY} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#E5E7EB" strokeWidth="1" />
                <circle
                  cx={p.x.toFixed(1)}
                  cy={p.y.toFixed(1)}
                  r="9"
                  fill={statusColor(c.statusLabel)}
                  stroke={c.viaOwner ? "#1F2933" : "none"}
                  strokeWidth={c.viaOwner ? "1.5" : "0"}
                />
              </g>
            );
          })}

          {/* nucleus */}
          <circle cx={CX} cy={CY} r="30" fill="#344E41" />
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10" fontWeight="500" fill="#FFFFFF">
            {nucleusLabel(companyName)}
          </text>
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
                style={{ backgroundColor: statusColor(c.statusLabel) }}
                aria-hidden
              />
              <span className="truncate font-medium text-cri-charcoal">{c.name}</span>
              <span className="ml-auto shrink-0 text-xs text-cri-steel">{c.statusLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
