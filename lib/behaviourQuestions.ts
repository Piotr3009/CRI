/**
 * Single source of truth for the MAIN_CONTRACTOR "behaviour" questions.
 *
 * Used by the submit form, the public (aggregate) company report, and the
 * admin per-report view — so all three ask/show the EXACT same set, in the
 * same order. Change a question here and every surface updates.
 *
 * Polarity: every question is phrased so that YES is the good answer
 * (YES = 10, SOMETIMES = 5, NO = 1). There are no reverse-scored questions —
 * that is deliberate, so the behaviour score is a plain average with no
 * per-question inversion to get wrong.
 */

export type BehaviourKey =
  | "behaviourExtraWorkNoCost"
  | "behaviourAskedCostUpfront"
  | "behaviourExpectedFreeLogistics"
  | "behaviourKeptAgreements"
  | "behaviourRespondedOnTime"
  | "behaviourProvidedAccess"
  | "behaviourCommunicationSmooth"
  | "behaviourWouldRecommend";

export type BehaviourQuestion = {
  key: BehaviourKey;
  /** Full question shown in the submit form and the admin detail view. */
  label: string;
  /** Short label shown under the small gauge on the public report. */
  gaugeLabel: string;
};

export const BEHAVIOUR_QUESTIONS: BehaviourQuestion[] = [
  {
    key: "behaviourExtraWorkNoCost",
    label: "Did the client agree extra costs before requesting more work?",
    gaugeLabel: "Costs agreed upfront",
  },
  {
    key: "behaviourAskedCostUpfront",
    label: "Did the client ask the price before ordering work?",
    gaugeLabel: "Price asked first",
  },
  {
    key: "behaviourExpectedFreeLogistics",
    label: "Did the client pay fairly for logistics and coordination?",
    gaugeLabel: "Fair on logistics",
  },
  {
    key: "behaviourKeptAgreements",
    label: "Did the client stick to what was agreed?",
    gaugeLabel: "Kept agreements",
  },
  {
    key: "behaviourRespondedOnTime",
    label: "Did the client reply on time?",
    gaugeLabel: "Replied on time",
  },
  {
    key: "behaviourProvidedAccess",
    label: "Did the client give site access as agreed?",
    gaugeLabel: "Site access",
  },
  {
    key: "behaviourCommunicationSmooth",
    label: "Did communication run smoothly?",
    gaugeLabel: "Communication",
  },
  {
    key: "behaviourWouldRecommend",
    label: "Would you recommend this client?",
    gaugeLabel: "Would recommend",
  },
];

/** Ordered list of just the keys — handy for iteration in the aggregate. */
export const BEHAVIOUR_KEYS: BehaviourKey[] = BEHAVIOUR_QUESTIONS.map((q) => q.key);

/** Human labels for the raw Yes / Sometimes / No answers (admin display). */
export const BEHAVIOUR_ANSWER_LABELS: Record<"YES" | "SOMETIMES" | "NO", string> = {
  YES: "Yes",
  SOMETIMES: "Sometimes",
  NO: "No",
};
