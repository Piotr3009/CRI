/**
 * Single source of truth for service-provider quality scores (1–10).
 *
 * Used by the submit form, the public final report, and the admin detail view
 * so all three use the same questions/labels and the same ordering.
 *
 * Every score is phrased so 10 is good. `label` is the full question (form +
 * admin); `gaugeLabel` is the short label under a gauge on the public report.
 */

export type PmKey =
  | "pmScheduleScore"
  | "pmTenderDistribScore"
  | "pmDtmProfessionalScore"
  | "pmImpartialScore"
  | "pmDecisionsScore"
  | "pmFragmentationScore"
  | "pmCommunicationScore"
  | "pmRealisticScore"
  | "pmDtmFairnessScore"
  | "pmWouldRecommendScore";

export type QsKey =
  | "qsFairTenderScore"
  | "qsTenderDocsScore"
  | "qsPriceChallengeScore"
  | "qsOpenToExplanationScore"
  | "qsMeasurementScore"
  | "qsVariationPricingScore"
  | "qsClaimsScore"
  | "qsVariationAcceptanceScore"
  | "qsCertTimingScore"
  | "qsUnfairDeductionsScore"
  | "qsFinalAccountScore"
  | "qsImpartialScore"
  | "qsCommunicationScore"
  | "qsWouldRecommendScore";

export type ArKey =
  | "arDrawingsAccurateScore"
  | "arCompletenessScore"
  | "arCoordinationScore"
  | "arErrorFreeScore"
  | "arTimelinessScore"
  | "arFewChangesScore"
  | "arBuildabilityScore"
  | "arImpartialScore"
  | "arWouldRecommendScore";

export type SpScoreKey = PmKey | QsKey | ArKey;

export type SpScore<K extends string = SpScoreKey> = {
  key: K;
  label: string;
  gaugeLabel: string;
};

export const PM_SCORES: SpScore<PmKey>[] = [
  { key: "pmScheduleScore", label: "How well-prepared and realistic was the programme / schedule?", gaugeLabel: "Realistic schedule" },
  { key: "pmTenderDistribScore", label: "Did the PM ensure all tender documents reached every bidder fairly and on time?", gaugeLabel: "Fair tendering" },
  { key: "pmDtmProfessionalScore", label: "How professionally were design team meetings (DTMs) run?", gaugeLabel: "DTMs run well" },
  { key: "pmImpartialScore", label: "Was the PM fair and impartial, rather than always siding with the client?", gaugeLabel: "Impartial" },
  { key: "pmDecisionsScore", label: "Did the PM make and communicate decisions on time, without blocking delays?", gaugeLabel: "Timely decisions" },
  { key: "pmFragmentationScore", label: "Did the PM break work into sensible packages, rather than fragmenting it in a way that caused you losses?", gaugeLabel: "Sensible packaging" },
  { key: "pmCommunicationScore", label: "Was communication clear, specific and responsive?", gaugeLabel: "Communication" },
  { key: "pmRealisticScore", label: "Were the PM's instructions and expectations realistic and achievable?", gaugeLabel: "Realistic asks" },
  { key: "pmDtmFairnessScore", label: "On DTMs, did the PM fairly assign responsibility and hold everyone (not just the contractor) accountable?", gaugeLabel: "Fair accountability" },
  { key: "pmWouldRecommendScore", label: "Would you work with this PM again?", gaugeLabel: "Would work again" },
];

export const QS_SCORES: SpScore<QsKey>[] = [
  { key: "qsFairTenderScore", label: "Were all bidders given the exact same spec and scope to price (a fair like-for-like tender)?", gaugeLabel: "Like-for-like tender" },
  { key: "qsTenderDocsScore", label: "Were the tender documents complete and clear enough to price properly?", gaugeLabel: "Clear tender docs" },
  { key: "qsPriceChallengeScore", label: "When they challenged your price as too high, was it backed by a proper like-for-like check, not guesswork?", gaugeLabel: "Evidenced challenges" },
  { key: "qsOpenToExplanationScore", label: "Were they open to your explanation of where the price came from, rather than assuming you'd inflated it?", gaugeLabel: "Open to explanation" },
  { key: "qsMeasurementScore", label: "Were their measurements accurate (not under-measured to cut your figure)?", gaugeLabel: "Accurate measurement" },
  { key: "qsVariationPricingScore", label: "Did they price variations fairly (reasonable rates, not deflated)?", gaugeLabel: "Fair variation pricing" },
  { key: "qsClaimsScore", label: "Did they acknowledge legitimate claims, rather than rejecting everything by default?", gaugeLabel: "Acknowledged claims" },
  { key: "qsVariationAcceptanceScore", label: "How fair and realistic was it to get a legitimate variation accepted?", gaugeLabel: "Fair on variations" },
  { key: "qsCertTimingScore", label: "Were payment certificates / valuations issued on time?", gaugeLabel: "Certificates on time" },
  { key: "qsUnfairDeductionsScore", label: "Were the certificates free of unfair deductions?", gaugeLabel: "No unfair deductions" },
  { key: "qsFinalAccountScore", label: "Was the final account fair and settled in good time?", gaugeLabel: "Fair final account" },
  { key: "qsImpartialScore", label: "Were they impartial, rather than always acting in the client's favour against you?", gaugeLabel: "Impartial" },
  { key: "qsCommunicationScore", label: "Was communication clear, specific and timely?", gaugeLabel: "Communication" },
  { key: "qsWouldRecommendScore", label: "Would you work with this QS again?", gaugeLabel: "Would work again" },
];

export const AR_SCORES: SpScore<ArKey>[] = [
  { key: "arDrawingsAccurateScore", label: "Were the drawings accurate (dimensions matched reality)?", gaugeLabel: "Accurate drawings" },
  { key: "arCompletenessScore", label: "Was the documentation complete (everything you needed to build)?", gaugeLabel: "Complete docs" },
  { key: "arCoordinationScore", label: "Were the drawings coordinated across disciplines (architecture / structure / services didn't clash)?", gaugeLabel: "Coordinated drawings" },
  { key: "arErrorFreeScore", label: "Was the design free of errors that forced rework?", gaugeLabel: "Error-free design" },
  { key: "arTimelinessScore", label: "Did they deliver information, drawings, RFI answers and design changes on time, without blocking the works?", gaugeLabel: "On-time info" },
  { key: "arFewChangesScore", label: "Were design changes reasonably limited (not constantly changing their mind)?", gaugeLabel: "Few changes" },
  { key: "arBuildabilityScore", label: "Were they open to the contractor's buildability suggestions?", gaugeLabel: "Open to buildability" },
  { key: "arImpartialScore", label: "Were they impartial and fair, rather than protecting themselves / the client at your expense?", gaugeLabel: "Impartial" },
  { key: "arWouldRecommendScore", label: "Would you work with this architect again?", gaugeLabel: "Would work again" },
];

export type SpEntityType =
  | "PROJECT_MANAGER"
  | "QUANTITY_SURVEYOR"
  | "ARCHITECT_PM";

export type SpConfig = {
  title: string;
  scores: SpScore[];
  recommendKey: SpScoreKey;
};

export const SP_CONFIGS: Record<SpEntityType, SpConfig> = {
  PROJECT_MANAGER: { title: "Project manager", scores: PM_SCORES, recommendKey: "pmWouldRecommendScore" },
  QUANTITY_SURVEYOR: { title: "Quantity surveyor", scores: QS_SCORES, recommendKey: "qsWouldRecommendScore" },
  ARCHITECT_PM: { title: "Architect / PM", scores: AR_SCORES, recommendKey: "arWouldRecommendScore" },
};

export const SP_ENTITY_TYPES: SpEntityType[] = [
  "PROJECT_MANAGER",
  "QUANTITY_SURVEYOR",
  "ARCHITECT_PM",
];

export function isSpEntityType(t: string): t is SpEntityType {
  return t === "PROJECT_MANAGER" || t === "QUANTITY_SURVEYOR" || t === "ARCHITECT_PM";
}
