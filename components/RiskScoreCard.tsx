import type { ReactNode } from "react";
import { formatScore } from "@/lib/format";

/**
 * Score panel for a 0–10 metric (e.g. Payment Score, Communication Score).
 * Higher score = better behaviour, so the bar/colour trend upward is positive.
 */
function band(score: number): { bar: string; text: string; word: string } {
  if (score >= 7)
    return { bar: "bg-cri-green", text: "text-cri-green", word: "Lower risk" };
  if (score >= 4)
    return {
      bar: "bg-cri-amber",
      text: "text-cri-amber-dark",
      word: "Moderate",
    };
  return {
    bar: "bg-cri-amber-dark",
    text: "text-cri-amber-dark",
    word: "Higher risk",
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
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

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
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-cri-charcoal">
          {score.toFixed(1)}
        </span>
        <span className="text-sm text-cri-steel">/10</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cri-border">
        <div
          className={`h-full rounded-full ${b.bar}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-label={`${label} ${formatScore(score)}`}
        />
      </div>
    </div>
  );
}
