/**
 * Semicircular 0–10 gauge: red → amber → green arc with a needle. When `value`
 * is null the gauge is greyed and the needle sits at the neutral midpoint with a
 * "No record yet" readout — so the buyer can see what the metric will look like.
 */

const CX = 100;
const CY = 100;
const R = 78;

function polar(value: number, radius: number) {
  // value 0 -> 180° (left), 10 -> 0° (right); standard math angle, SVG y flipped.
  const deg = 180 - (value / 10) * 180;
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function arc(v1: number, v2: number): string {
  const p1 = polar(v1, R);
  const p2 = polar(v2, R);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

const SIZES = {
  xs: { pad: "p-2", label: "text-[10px] leading-tight", svg: "max-w-[88px]", value: "text-sm", unit: "text-[10px]", nodata: "text-[11px]" },
  sm: { pad: "p-3", label: "text-[11px] leading-tight", svg: "max-w-[116px]", value: "text-lg", unit: "text-xs", nodata: "text-xs" },
  md: { pad: "p-4", label: "text-xs", svg: "max-w-[200px]", value: "text-2xl", unit: "text-sm", nodata: "text-sm" },
} as const;

export function Speedometer({
  label,
  value,
  icon,
  footnote,
  size = "md",
  showLabel = true,
}: {
  label: string;
  value: number | null; // 0–10 or null (no data)
  icon?: string;
  footnote?: string; // small descriptive line under the value (e.g. payment depth)
  size?: "xs" | "sm" | "md";
  showLabel?: boolean; // hide the label when the caption is shown beside the gauge
}) {
  const v = value ?? 5;
  const tip = polar(v, R - 14);
  const hasData = value != null;
  const s = SIZES[size];

  return (
    <div className={`rounded-xl border border-cri-border bg-cri-bg/60 text-center ${s.pad}`}>
      {showLabel ? (
        <p className={`mb-1 font-medium text-cri-steel ${s.label}`}>
          {icon ? <span className="mr-1">{icon}</span> : null}
          {label}
        </p>
      ) : null}
      <svg viewBox="0 0 200 124" className={`mx-auto w-full ${s.svg}`} role="img" aria-label={`${label}: ${hasData ? value : "no record yet"}`}>
        {hasData ? (
          <>
            <path d={arc(0, 4)} fill="none" stroke="#D64545" strokeWidth="13" strokeLinecap="round" />
            <path d={arc(4, 7)} fill="none" stroke="#D99A21" strokeWidth="13" strokeLinecap="round" />
            <path d={arc(7, 10)} fill="none" stroke="#4A6B58" strokeWidth="13" strokeLinecap="round" />
          </>
        ) : (
          <path d={arc(0, 10)} fill="none" stroke="#D1D5DB" strokeWidth="13" strokeLinecap="round" />
        )}
        <line
          x1={CX}
          y1={CY}
          x2={tip.x.toFixed(2)}
          y2={tip.y.toFixed(2)}
          stroke={hasData ? "#1F2933" : "#9CA3AF"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="6" fill={hasData ? "#1F2933" : "#9CA3AF"} />
      </svg>
      {hasData ? (
        <p className={`-mt-1 font-bold text-cri-charcoal ${s.value}`}>
          {value!.toFixed(1)}
          <span className={`font-normal text-cri-steel ${s.unit}`}>/10</span>
        </p>
      ) : (
        <p className={`-mt-1 font-medium text-cri-steel ${s.nodata}`}>No record yet</p>
      )}
      {footnote ? (
        <p className="mt-1 text-xs leading-snug text-cri-steel">{footnote}</p>
      ) : null}
    </div>
  );
}
