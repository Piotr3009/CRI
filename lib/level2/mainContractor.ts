/**
 * Level-2 (final report) aggregation for MAIN_CONTRACTOR.
 *
 * Pure, dependency-free: takes the raw Level-1 report rows for ONE company
 * (already filtered to entityType = MAIN_CONTRACTOR and grouped by Companies
 * House number) and returns the computed figures the report renders.
 *
 * Scoring rules agreed with the product owner:
 *   - 0–10 scores use a BAYESIAN average with a neutral 5/10 prior of strength
 *     3, so a single report can't swing a company to the extremes. At n=0 the
 *     score sits at exactly 5.0 ("no rating yet"); more reports pull it toward
 *     the real mean.
 *   - Raw facts (delays, £ amounts, counts) are reported UN-smoothed.
 *   - The categorical risk verdict (LOW/MEDIUM/HIGH) is withheld until there
 *     are at least MIN_REPORTS_FOR_RISK reports; below that it is null.
 *
 * These three constants are the tuning knobs — safe to change later.
 */

export const PRIOR_MEAN = 5;
export const PRIOR_STRENGTH = 3;
export const MIN_REPORTS_FOR_RISK = 3;

export type Tri = "YES" | "SOMETIMES" | "NO";
export type RetentionStatus = "NOT_RETURNED" | "RETURNED" | "WITHIN_TERM";

/** The subset of RiskReport fields the MAIN_CONTRACTOR report needs. */
export type McReportRow = {
  createdAt: Date;
  paymentScore: number; // 0–10 (Level-1, from scoreFromDelay)
  communicationScore: number; // 0–10 (Level-1, from commScoreFromAnswer)
  behaviourWouldRecommend: Tri | null;
  avgPaymentDelayDays: number | null;
  paymentCount: number; // number of individual payments listed in this report
  paymentDelaySum: number; // sum of daysLate across this report's payments
  abandonedInvoicesCount: number | null;
  abandonedInvoicesTotalGbp: number | null;
  backChargesAmountGbp: number | null;
  variationsNoPaper: Tri | null;
  retentionStatus: RetentionStatus | null;
  formalDispute: "YES" | "NO" | "NOT_SURE" | null;
  projectReadinessScore: number | null; // 1–10
  contractValueGbp: number | null;
  publicArea: string;
};

export type McAggregate = {
  reportCount: number;
  dateFrom: Date | null;
  dateTo: Date | null;

  // Bayesian-smoothed 0–10 scores (always present; 5.0 at n=0).
  paymentReliability: number;
  communication: number;
  projectReadiness: number; // also smoothed; 5.0 at n=0

  // Proportion 0–100, or null when nobody answered.
  wouldWorkAgainPct: number | null;

  // Raw, un-smoothed facts.
  avgPaymentDelayDays: number | null;
  totalPayments: number; // pooled count of every individual payment across all reports
  reportsPaidLate: number;
  abandonedInvoicesReports: number;
  abandonedInvoicesTotalGbp: number;
  backChargesReports: number;
  backChargesAvgGbp: number | null;
  retentionNotReturnedReports: number;
  variationsNoPaperReports: number;
  formalDisputeReports: number;

  contractValueMinGbp: number | null;
  contractValueMaxGbp: number | null;
  areas: string[];

  // Categorical verdict — null when reportCount < MIN_REPORTS_FOR_RISK.
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | null;
};

/** Bayesian average of 0–10 scores against the neutral prior. n=0 -> 5.0. */
export function bayesianScore(scores: number[]): number {
  const sum = scores.reduce((acc, s) => acc + s, 0);
  const value = (PRIOR_STRENGTH * PRIOR_MEAN + sum) / (PRIOR_STRENGTH + scores.length);
  return Math.round(value * 10) / 10;
}

/**
 * Average payment delay (days) -> 0–10 score. Never 0 — 0 would read as a
 * verdict. Single source of truth: used at submit time (per report) AND by the
 * aggregate (on the pooled average). Thresholds are a product decision.
 */
export function scoreFromDelay(avgDays: number): number {
  if (avgDays <= 3) return 10;
  if (avgDays <= 7) return 7;
  if (avgDays <= 14) return 5;
  if (avgDays <= 21) return 3;
  return 1; // 22+ days
}

/**
 * Smooth a raw 0–10 score toward the neutral prior (5) with a strength of
 * PRIOR_STRENGTH "virtual payments", weighted by how many real payments back it.
 * At evidence=0 -> 5.0; the prior is meaningful at a handful of payments and
 * vanishes by the hundreds (e.g. 300 payments ≈ the raw score).
 */
function smoothByEvidence(rawScore: number, evidence: number): number {
  const value =
    (PRIOR_STRENGTH * PRIOR_MEAN + evidence * rawScore) / (PRIOR_STRENGTH + evidence);
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function aggregateMainContractor(rows: McReportRow[]): McAggregate {
  const n = rows.length;

  const communication = bayesianScore(rows.map((r) => r.communicationScore));
  const projectReadiness = bayesianScore(
    rows.filter((r) => r.projectReadinessScore != null).map((r) => r.projectReadinessScore as number),
  );

  // Would work again — only rows that actually answered count.
  const answered = rows.filter((r) => r.behaviourWouldRecommend != null);
  const wouldWorkAgainPct =
    answered.length === 0
      ? null
      : Math.round(
          (answered.filter((r) => r.behaviourWouldRecommend === "YES").length / answered.length) *
            100,
        );

  // Payment delay — POOLED across every individual approved payment: total days
  // late / total payments. Hard, verifiable math (each payment is certified by a
  // QS or a written authorisation), so the average defends itself legally and
  // there is no disputed relationship to discount.
  const totalPayments = rows.reduce((sum, r) => sum + r.paymentCount, 0);
  const totalDelaySum = rows.reduce((sum, r) => sum + r.paymentDelaySum, 0);
  const avgPaymentDelayDays =
    totalPayments > 0 ? Math.round((totalDelaySum / totalPayments) * 10) / 10 : null;

  // Payment SCORE — the pooled average delay mapped via scoreFromDelay, then
  // smoothed toward the neutral prior by payment count. Each approved payment
  // counts once, so the volume of late payments to a single subcontractor does
  // pull the score (fair, since payments are verifiable facts, not opinions).
  // The prior (3 virtual payments at 5/10) cushions a verdict at a handful of
  // payments and is negligible by the hundreds. Display + verdict use the same
  // pooled figure, so the gauge and the line beneath it agree.
  const paymentReliability =
    avgPaymentDelayDays == null
      ? PRIOR_MEAN
      : smoothByEvidence(scoreFromDelay(avgPaymentDelayDays), totalPayments);

  const reportsPaidLate = rows.filter((r) => (r.avgPaymentDelayDays ?? 0) > 0).length;

  const abandonedInvoicesReports = rows.filter((r) => (r.abandonedInvoicesCount ?? 0) > 0).length;
  const abandonedInvoicesTotalGbp = rows.reduce(
    (sum, r) => sum + (r.abandonedInvoicesTotalGbp ?? 0),
    0,
  );

  const backChargeAmounts = rows
    .map((r) => r.backChargesAmountGbp)
    .filter((a): a is number => a != null && a > 0);
  const backChargesReports = backChargeAmounts.length;
  const backChargesAvgMean = mean(backChargeAmounts);
  const backChargesAvgGbp = backChargesAvgMean == null ? null : Math.round(backChargesAvgMean);

  const retentionNotReturnedReports = rows.filter((r) => r.retentionStatus === "NOT_RETURNED").length;
  const variationsNoPaperReports = rows.filter((r) => r.variationsNoPaper === "YES").length;
  const formalDisputeReports = rows.filter((r) => r.formalDispute === "YES").length;

  const values = rows.map((r) => r.contractValueGbp).filter((v): v is number => v != null);
  const contractValueMinGbp = values.length ? Math.min(...values) : null;
  const contractValueMaxGbp = values.length ? Math.max(...values) : null;

  const areas = Array.from(new Set(rows.map((r) => r.publicArea).filter(Boolean)));

  const times = rows.map((r) => r.createdAt.getTime());
  const dateFrom = times.length ? new Date(Math.min(...times)) : null;
  const dateTo = times.length ? new Date(Math.max(...times)) : null;

  return {
    reportCount: n,
    dateFrom,
    dateTo,
    paymentReliability,
    communication,
    projectReadiness,
    wouldWorkAgainPct,
    avgPaymentDelayDays,
    totalPayments,
    reportsPaidLate,
    abandonedInvoicesReports,
    abandonedInvoicesTotalGbp,
    backChargesReports,
    backChargesAvgGbp,
    retentionNotReturnedReports,
    variationsNoPaperReports,
    formalDisputeReports,
    contractValueMinGbp,
    contractValueMaxGbp,
    areas,
    overallRisk: computeOverallRisk(n, {
      avgPaymentDelayDays,
      reportsPaidLate,
      abandonedInvoicesReports,
      retentionNotReturnedReports,
      variationsNoPaperReports,
      formalDisputeReports,
    }),
  };
}

/**
 * First-pass, transparent risk rule (TUNABLE — product decision).
 * Driven by RAW facts, not the smoothed display score: the Bayesian score is
 * deliberately conservative for display, so feeding it back into the verdict
 * would double-count that conservatism and flag clean low-volume companies as
 * MEDIUM. Returns null below the minimum report count (no verdict yet).
 */
function computeOverallRisk(
  n: number,
  f: {
    avgPaymentDelayDays: number | null;
    reportsPaidLate: number;
    abandonedInvoicesReports: number;
    retentionNotReturnedReports: number;
    variationsNoPaperReports: number;
    formalDisputeReports: number;
  },
): "LOW" | "MEDIUM" | "HIGH" | null {
  if (n < MIN_REPORTS_FOR_RISK) return null;

  const latePct = f.reportsPaidLate / n;
  const disputePct = f.formalDisputeReports / n;
  const retentionPct = f.retentionNotReturnedReports / n;
  const variationsPct = f.variationsNoPaperReports / n;
  const delay = f.avgPaymentDelayDays ?? 0;

  if (delay > 21 || f.abandonedInvoicesReports > 0 || disputePct >= 0.3 || latePct >= 0.6) {
    return "HIGH";
  }
  if (delay > 7 || retentionPct >= 0.3 || variationsPct >= 0.4 || latePct >= 0.3) {
    return "MEDIUM";
  }
  return "LOW";
}
