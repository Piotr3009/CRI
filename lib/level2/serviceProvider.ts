/**
 * Level-2 aggregation for service providers (PM / QS / Architect).
 *
 * Each quality score (1–10) is Bayesian-smoothed against a neutral 3×5 prior,
 * exactly like the main-contractor behaviour gauges, so a single review can't
 * swing a company's headline. The headline `overall` is the plain average of
 * the per-score gauges.
 *
 * Pure module (no Prisma) so it runs under --experimental-strip-types in tests.
 */

import type { SpScoreKey } from "@/lib/spScores";

const PRIOR_MEAN = 5;
const PRIOR_STRENGTH = 3;

export type SpReportRow = Partial<Record<SpScoreKey, number | null>> & {
  formalDispute?: "YES" | "NO" | "NOT_SURE" | null;
  contractValueGbp?: number | null;
  createdAt?: Date;
  publicSummary?: string | null;
};

export type SpAggregate = {
  totalReports: number;
  /** Average of the per-score gauges (0–10). 5.0 at n=0. */
  overall: number;
  /** Per-score Bayesian gauge, keyed by score key. */
  byScore: Record<string, number>;
  /** Gauge for the "would work again" score, or null when nobody answered. */
  wouldRecommend: number | null;
  /** Reviews that reported a formal dispute / court action. */
  formalDisputeReports: number;
  /** Sum of project values across reviews that provided one. */
  contractValueTotalGbp: number;
  /** How many reviews provided a project value (denominator for the sum). */
  contractValueReports: number;
};

function bayesian(scores: number[]): number {
  const sum = scores.reduce((a, b) => a + b, 0);
  const value = (PRIOR_STRENGTH * PRIOR_MEAN + sum) / (PRIOR_STRENGTH + scores.length);
  return Math.round(value * 10) / 10;
}

export function aggregateServiceProvider(
  rows: SpReportRow[],
  scoreKeys: string[],
  recommendKey: string,
): SpAggregate {
  const byScore: Record<string, number> = {};
  for (const key of scoreKeys) {
    const vals = rows
      .map((r) => (r as Record<string, number | null | undefined>)[key])
      .filter((v): v is number => typeof v === "number");
    byScore[key] = bayesian(vals);
  }

  const gauges = scoreKeys.map((k) => byScore[k]);
  const overall = gauges.length
    ? Math.round((gauges.reduce((a, b) => a + b, 0) / gauges.length) * 10) / 10
    : PRIOR_MEAN;

  const recVals = rows
    .map((r) => (r as Record<string, number | null | undefined>)[recommendKey])
    .filter((v): v is number => typeof v === "number");
  const wouldRecommend = recVals.length ? (byScore[recommendKey] ?? null) : null;

  const formalDisputeReports = rows.filter((r) => r.formalDispute === "YES").length;
  const contractValues = rows
    .map((r) => r.contractValueGbp)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const contractValueTotalGbp = contractValues.reduce((a, b) => a + b, 0);
  const contractValueReports = contractValues.length;

  return {
    totalReports: rows.length,
    overall,
    byScore,
    wouldRecommend,
    formalDisputeReports,
    contractValueTotalGbp,
    contractValueReports,
  };
}
