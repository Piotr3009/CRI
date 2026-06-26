import type { ReactNode } from "react";
import { formatScore } from "@/lib/format";

/**
 * Score panel for a 0–10 metric (e.g. Payment Score, Communication Score).
 * Higher score = better behaviour, shown as a red→amber→green gauge with a needle.
 */
function band(score: number): { text: string; word: string } {
  if (score >= 7) return { text: "text-cri-green", word: "Lower risk" };
  if (score >= 4) return { text: "text-cri-amber-dark", word: "Moderate" };
  return { text: "text-cri-amber-dark", word: "Higher risk" };
}

/** Needle endpoint for a 0–10 score on a 180°→0° semicircle gauge. */
function needleTip(score: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(10, score));
  const angle = ((180 - (clamped / 10) * 180) * Math.PI) / 180;
  return {
    x: 80 + 46 * Math.cos(angle),
    y: 80 - 46 * Math.sin(angle),
  };
}

export function RiskScoreCard({
  label,
  score,
  icon,
  showBand = true,
}: {
  label: string;
  score: number;
  icon?: ReactNode;
  showBand?: boolean;
}) {
  const b = band(score);
  const tip = needleTip(score);

  return (
    <div className="rounded-lg border border-cri-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-cri-steel">
          {icon ? <span className="text-cri-green">{icon}</span> : null}
          {label}
        </div>
        {showBand ? (
          <span className={`text-xs font-medium ${b.text}`}>{b.word}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-center">
        <svg
          viewBox="0 0 160 92"
          className="w-full max-w-[160px]"
          role="img"
          aria-label={`${label} ${formatScore(score)}`}
        >
          <path
            d="M22 80 A58 58 0 0 1 51 29.8"
            fill="none"
            stroke="#C0392B"
            strokeWidth={11}
          />
          <path
            d="M51 29.8 A58 58 0 0 1 109 29.8"
            fill="none"
            stroke="#D99A21"
            strokeWidth={11}
          />
          <path
            d="M109 29.8 A58 58 0 0 1 138 80"
            fill="none"
            stroke="#4A6B58"
            strokeWidth={11}
          />
          <line
            x1={80}
            y1={80}
            x2={Number(tip.x.toFixed(1))}
            y2={Number(tip.y.toFixed(1))}
            stroke="#1F2933"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={80} cy={80} r={5} fill="#1F2933" />
        </svg>
        <div className="-mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-cri-charcoal">
            {score.toFixed(1)}
          </span>
          <span className="text-sm text-cri-steel">/10</span>
        </div>
      </div>
    </div>
  );
}