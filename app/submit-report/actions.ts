"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createRiskReport } from "@/lib/reports";
import { scoreFromDelay } from "@/lib/level2/mainContractor";

// ---------------------------------------------------------------------------
// Shared validation pieces — all client input is untrusted (Zod re-validates).
// ---------------------------------------------------------------------------

const behaviour = z.enum(["YES", "SOMETIMES", "NO"]);

const projectTypeEnum = z.enum([
  "REFURBISHMENT",
  "EXTENSION",
  "JOINERY",
  "WINDOWS_AND_DOORS",
  "ELECTRICAL",
  "PLUMBING",
  "ROOFING",
  "DECORATION",
  "NEW_BUILD",
  "OTHER",
]);

const projectStatusEnum = z.enum([
  "COMPLETED",
  "ONGOING",
  "CANCELLED",
  "DISPUTED",
]);

const paymentSchema = z.object({
  daysLate: z.number().int().min(0).max(3650),
  amountGbp: z.number().int().min(0).max(100000000),
});

const reporterShape = {
  reporterCompanyName: z.string().trim().min(1).max(200),
  reporterContactName: z.string().trim().min(1).max(200),
  reporterEmail: z.string().trim().email().max(200),
  reporterPhone: z.string().trim().max(50).optional().or(z.literal("")),
  reporterTradeType: z.string().trim().min(1).max(120),
};

const projectShape = {
  projectAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  projectCity: z.string().trim().min(1).max(120),
  projectPostcode: z.string().trim().min(2).max(12),
  projectType: projectTypeEnum,
  contractValueGbp: z.number().int().min(0).max(1000000000),
  contractLength: z.string().trim().min(1).max(40),
  startDate: z.string().trim().optional().or(z.literal("")),
  finishDate: z.string().trim().optional().or(z.literal("")),
  projectStatus: projectStatusEnum,
};

const paymentsDebtsShape = {
  payments: z.array(paymentSchema).min(1).max(20),
  abandonedInvoicesCount: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .nullable()
    .optional(),
  abandonedInvoicesTotalGbp: z
    .number()
    .int()
    .min(0)
    .max(100000000)
    .nullable()
    .optional(),
};

const behaviourShape = {
  behaviourExtraWorkNoCost: behaviour,
  behaviourAskedCostUpfront: behaviour,
  behaviourExpectedFreeLogistics: behaviour,
  behaviourKeptAgreements: behaviour,
  behaviourRespondedOnTime: behaviour,
  behaviourProvidedAccess: behaviour,
  behaviourCommunicationSmooth: behaviour,
  behaviourWouldRecommend: behaviour,
};

const tailShape = {
  issueDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  evidenceTypes: z.array(z.string().trim().max(40)).max(10),
  consents: z.object({
    realExperience: z.literal(true),
    canProvide: z.literal(true),
    allowModeration: z.literal(true),
    notAutoPublished: z.literal(true),
    notRevenge: z.literal(true),
    allPaymentsDeclared: z.literal(true),
  }),
};

// Optional UK company registration number (CRN) of the reported company.
// Never collected for residential clients (individuals have none). Optional
// everywhere until the Companies House autocomplete lands and can validate it.
const companiesHouseNumberField = z
  .string()
  .trim()
  .max(20)
  .optional()
  .or(z.literal(""));

const commonShape = {
  ...reporterShape,
  ...projectShape,
  companiesHouseNumber: companiesHouseNumberField,
  ...paymentsDebtsShape,
  ...behaviourShape,
  ...tailShape,
};

const commonSchema = z.object(commonShape);
type CommonInput = z.infer<typeof commonSchema>;

// Private client → initials only (osoba fizyczna, RODO).
const privateClientSchema = z.object({
  ...commonShape,
  clientInitials: z.string().trim().min(1).max(12),
});

// Commercial client → a company (public). Full name allowed; address internal.
const commercialClientSchema = z.object({
  ...commonShape,
  entityName: z.string().trim().min(1).max(200),
  courtDispute: z.enum(["YES", "NO"]),
});

const optionalAmount = z
  .number()
  .int()
  .min(0)
  .max(100000000)
  .nullable()
  .optional();

// Main contractor → company (like commercial) + chain-specific questions.
const mainContractorSchema = z.object({
  ...commonShape,
  entityName: z.string().trim().min(1).max(200),
  courtDispute: z.enum(["YES", "NO"]),
  // Chain-specific
  backChargesUnagreed: behaviour,
  backChargesAmountGbp: optionalAmount,
  variationsNoPaper: behaviour,
  retentionStatus: z.enum(["NOT_RETURNED", "RETURNED", "WITHIN_TERM"]),
  retentionAmountGbp: optionalAmount,
  projectReadinessScore: z.number().int().min(1).max(10),
});

export type SubmitState = { ok: boolean; formError?: string };

// ---------------------------------------------------------------------------
// Scoring helpers — Level 1 only (this single contract). Aggregation across
// many reports (Level 2 / final report) happens later, after Companies House.
// ---------------------------------------------------------------------------

type Tri = "YES" | "SOMETIMES" | "NO";

/** "Communication smooth?" is a positive question -> YES is good. */
function commScoreFromAnswer(a: Tri): number {
  if (a === "YES") return 10;
  if (a === "SOMETIMES") return 5;
  return 1;
}

/** "Extra work without approved cost?" -> YES is bad. */
function variationRiskFromAnswer(a: Tri): "LOW" | "MEDIUM" | "HIGH" {
  if (a === "YES") return "HIGH";
  if (a === "SOMETIMES") return "MEDIUM";
  return "LOW";
}

/** Outward code from a UK postcode, e.g. "SW19 3AB" -> "SW19". */
function outwardCode(postcode: string): string {
  const pc = postcode.trim().toUpperCase().replace(/\s+/g, " ");
  if (pc.includes(" ")) return pc.split(" ")[0];
  return pc.length > 3 ? pc.slice(0, pc.length - 3) : pc; // UK inward is 3 chars
}

/**
 * Compute the Level-1 fields shared by every "paying" report type
 * (private client, commercial client, …). Entity-specific fields and
 * visibility are added by each caller.
 */
function commonComputed(d: CommonInput) {
  const avgDelay =
    d.payments.reduce((sum, p) => sum + p.daysLate, 0) / d.payments.length;

  const parsedStart = d.startDate ? new Date(d.startDate) : null;
  const startDate =
    parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : null;

  const parsedFinish = d.finishDate ? new Date(d.finishDate) : null;
  const finishDate =
    parsedFinish && !Number.isNaN(parsedFinish.getTime()) ? parsedFinish : null;

  const extras: "YES" | "NO" | "NOT_SURE" =
    d.behaviourExtraWorkNoCost === "YES"
      ? "YES"
      : d.behaviourExtraWorkNoCost === "NO"
        ? "NO"
        : "NOT_SURE";

  return {
    // Reporter (private)
    reporterCompanyName: d.reporterCompanyName,
    reporterContactName: d.reporterContactName,
    reporterEmail: d.reporterEmail,
    reporterPhone: d.reporterPhone || null,
    reporterTradeType: d.reporterTradeType,

    // Reported company CRN — optional; null for residential or when left blank.
    companiesHouseNumber: d.companiesHouseNumber?.trim() || null,

    // Project — address is INTERNAL (never shown publicly; privacy.ts
    // only ever exposes publicArea, which is the outward code / region).
    projectAddressLine1: d.projectAddressLine1 || null,
    projectCity: d.projectCity,
    projectPostcode: d.projectPostcode,
    publicArea: outwardCode(d.projectPostcode),
    projectType: d.projectType,
    contractValueGbp: d.contractValueGbp,
    contractLength: d.contractLength,
    startDate,
    finishDate,
    projectStatus: d.projectStatus,

    // Risk scoring (computed from raw facts)
    paymentScore: scoreFromDelay(avgDelay),
    communicationScore: commScoreFromAnswer(d.behaviourCommunicationSmooth),
    variationRisk: variationRiskFromAnswer(d.behaviourExtraWorkNoCost),
    disputeRisk: (d.abandonedInvoicesCount ?? 0) > 0 ? ("HIGH" as const) : ("LOW" as const),
    avgPaymentDelayDays: Math.round(avgDelay * 10) / 10,
    extrasRequestedWithoutApprovedCost: extras,

    // Abandoned invoices (> 60 days)
    abandonedInvoicesCount: d.abandonedInvoicesCount ?? null,
    abandonedInvoicesTotalGbp: d.abandonedInvoicesTotalGbp ?? null,

    // Behaviour (raw answers)
    behaviourExtraWorkNoCost: d.behaviourExtraWorkNoCost,
    behaviourAskedCostUpfront: d.behaviourAskedCostUpfront,
    behaviourExpectedFreeLogistics: d.behaviourExpectedFreeLogistics,
    behaviourKeptAgreements: d.behaviourKeptAgreements,
    behaviourRespondedOnTime: d.behaviourRespondedOnTime,
    behaviourProvidedAccess: d.behaviourProvidedAccess,
    behaviourCommunicationSmooth: d.behaviourCommunicationSmooth,
    behaviourWouldRecommend: d.behaviourWouldRecommend,

    // Narrative + evidence + consents
    issueDescription: (d.issueDescription || "").trim(),
    evidenceTypes: d.evidenceTypes.length ? d.evidenceTypes.join(",") : null,
    consentsAcceptedAt: new Date(),

    // Payment child rows
    payments: {
      create: d.payments.map((p, i) => ({
        position: i + 1,
        daysLate: p.daysLate,
        amountGbp: p.amountGbp,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function submitPrivateClientReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = privateClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;

  try {
    await createRiskReport({
      ...commonComputed(d),
      entityType: "RESIDENTIAL_CLIENT",
      entityName: null,
      clientInitials: d.clientInitials,
      isResidential: true,
      // Residential defaults to restricted; moderation gates publication.
      visibility: "VERIFIED_CONTRACTORS_ONLY",
    });
  } catch (error) {
    console.error("Failed to create private client report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}

export async function submitCommercialClientReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = commercialClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;

  try {
    await createRiskReport({
      ...commonComputed(d),
      entityType: "COMMERCIAL_CLIENT",
      entityName: d.entityName,
      clientInitials: null,
      isResidential: false,
      // Court dispute reuses the existing formalDispute field (YES / NO).
      formalDispute: d.courtDispute,
      // Companies are public; moderation still gates publication.
      visibility: "PUBLIC",
    });
  } catch (error) {
    console.error("Failed to create commercial client report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}

export async function submitMainContractorReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = mainContractorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;

  try {
    await createRiskReport({
      ...commonComputed(d),
      entityType: "MAIN_CONTRACTOR",
      entityName: d.entityName,
      clientInitials: null,
      isResidential: false,
      formalDispute: d.courtDispute,
      visibility: "PUBLIC",
      // Chain-specific
      backChargesUnagreed: d.backChargesUnagreed,
      backChargesAmountGbp: d.backChargesAmountGbp ?? null,
      variationsNoPaper: d.variationsNoPaper,
      retentionStatus: d.retentionStatus,
      retentionAmountGbp: d.retentionAmountGbp ?? null,
      projectReadinessScore: d.projectReadinessScore,
    });
  } catch (error) {
    console.error("Failed to create main contractor report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}

// ===========================================================================
// Service providers (PM / QS / Architect-PM) — they do NOT pay the contractor,
// so there are no payments / debts / contract value. Quality is rated 1–10.
// The legacy payment-centric NOT-NULL fields are filled with neutral
// placeholders; proper service-provider display comes with the admin rebuild.
// ===========================================================================

const score1to10 = z.number().int().min(1).max(10);

const pmScoresRequired = {
  pmScheduleScore: score1to10,
  pmTenderDistribScore: score1to10,
  pmDtmProfessionalScore: score1to10,
  pmImpartialScore: score1to10,
  pmDecisionsScore: score1to10,
  pmFragmentationScore: score1to10,
  pmCommunicationScore: score1to10,
  pmRealisticScore: score1to10,
  pmDtmFairnessScore: score1to10,
  pmWouldRecommendScore: score1to10,
};

const pmScoreKeys = Object.keys(pmScoresRequired) as (keyof typeof pmScoresRequired)[];

const pmScoresOptional = {
  pmScheduleScore: score1to10.nullable().optional(),
  pmTenderDistribScore: score1to10.nullable().optional(),
  pmDtmProfessionalScore: score1to10.nullable().optional(),
  pmImpartialScore: score1to10.nullable().optional(),
  pmDecisionsScore: score1to10.nullable().optional(),
  pmFragmentationScore: score1to10.nullable().optional(),
  pmCommunicationScore: score1to10.nullable().optional(),
  pmRealisticScore: score1to10.nullable().optional(),
  pmDtmFairnessScore: score1to10.nullable().optional(),
  pmWouldRecommendScore: score1to10.nullable().optional(),
};

const arScoresRequired = {
  arDrawingsAccurateScore: score1to10,
  arCompletenessScore: score1to10,
  arCoordinationScore: score1to10,
  arErrorFreeScore: score1to10,
  arTimelinessScore: score1to10,
  arFewChangesScore: score1to10,
  arBuildabilityScore: score1to10,
  arImpartialScore: score1to10,
  arWouldRecommendScore: score1to10,
};

const serviceProviderConsents = z.object({
  realExperience: z.literal(true),
  canProvide: z.literal(true),
  allowModeration: z.literal(true),
  notAutoPublished: z.literal(true),
  notRevenge: z.literal(true),
});

const qsScoresRequired = {
  qsFairTenderScore: score1to10,
  qsTenderDocsScore: score1to10,
  qsPriceChallengeScore: score1to10,
  qsOpenToExplanationScore: score1to10,
  qsMeasurementScore: score1to10,
  qsVariationPricingScore: score1to10,
  qsClaimsScore: score1to10,
  qsVariationAcceptanceScore: score1to10,
  qsCertTimingScore: score1to10,
  qsUnfairDeductionsScore: score1to10,
  qsFinalAccountScore: score1to10,
  qsImpartialScore: score1to10,
  qsCommunicationScore: score1to10,
  qsWouldRecommendScore: score1to10,
};

const qsScoreKeys = Object.keys(qsScoresRequired) as (keyof typeof qsScoresRequired)[];

const qsScoresOptional = {
  qsFairTenderScore: score1to10.nullable().optional(),
  qsTenderDocsScore: score1to10.nullable().optional(),
  qsPriceChallengeScore: score1to10.nullable().optional(),
  qsOpenToExplanationScore: score1to10.nullable().optional(),
  qsMeasurementScore: score1to10.nullable().optional(),
  qsVariationPricingScore: score1to10.nullable().optional(),
  qsClaimsScore: score1to10.nullable().optional(),
  qsVariationAcceptanceScore: score1to10.nullable().optional(),
  qsCertTimingScore: score1to10.nullable().optional(),
  qsUnfairDeductionsScore: score1to10.nullable().optional(),
  qsFinalAccountScore: score1to10.nullable().optional(),
  qsImpartialScore: score1to10.nullable().optional(),
  qsCommunicationScore: score1to10.nullable().optional(),
  qsWouldRecommendScore: score1to10.nullable().optional(),
};

const projectManagerSchema = z
  .object({
    ...reporterShape,
    entityName: z.string().trim().min(1).max(200),
    companiesHouseNumber: companiesHouseNumberField,
    spReporterRole: z.string().trim().min(1).max(120),
    projectAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
    projectCity: z.string().trim().min(1).max(120),
    projectPostcode: z.string().trim().min(2).max(12),
    projectType: projectTypeEnum,
    ...pmScoresRequired,
    // Optional QS block — required only if this PM also acted as the QS.
    alsoActedAsQs: z.boolean(),
    ...qsScoresOptional,
    issueDescription: z.string().trim().max(1000).optional().or(z.literal("")),
    evidenceTypes: z.array(z.string().trim().max(40)).max(10),
    consents: serviceProviderConsents,
  })
  .superRefine((d, ctx) => {
    if (d.alsoActedAsQs) {
      for (const k of qsScoreKeys) {
        const v = (d as Record<string, unknown>)[k];
        if (typeof v !== "number") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pick 1–10",
            path: [k],
          });
        }
      }
    }
  });

export async function submitProjectManagerReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = projectManagerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;

  const scores = [
    d.pmScheduleScore,
    d.pmTenderDistribScore,
    d.pmDtmProfessionalScore,
    d.pmImpartialScore,
    d.pmDecisionsScore,
    d.pmFragmentationScore,
    d.pmCommunicationScore,
    d.pmRealisticScore,
    d.pmDtmFairnessScore,
    d.pmWouldRecommendScore,
  ];
  const overall = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);

  try {
    await createRiskReport({
      reporterCompanyName: d.reporterCompanyName,
      reporterContactName: d.reporterContactName,
      reporterEmail: d.reporterEmail,
      reporterPhone: d.reporterPhone || null,
      reporterTradeType: d.reporterTradeType,

      entityType: "PROJECT_MANAGER",
      entityName: d.entityName,
      companiesHouseNumber: d.companiesHouseNumber?.trim() || null,
      clientInitials: null,
      isResidential: false,

      projectAddressLine1: d.projectAddressLine1 || null,
      projectCity: d.projectCity,
      projectPostcode: d.projectPostcode,
      publicArea: outwardCode(d.projectPostcode),
      projectType: d.projectType,

      // Legacy payment-centric fields — neutral placeholders (SP doesn't pay).
      paymentScore: overall,
      communicationScore: d.pmCommunicationScore,
      variationRisk: "LOW",
      disputeRisk: "LOW",

      issueDescription: (d.issueDescription || "").trim(),
      evidenceTypes: d.evidenceTypes.length ? d.evidenceTypes.join(",") : null,
      consentsAcceptedAt: new Date(),

      // Service-provider role + PM scores
      spReporterRole: d.spReporterRole,
      pmScheduleScore: d.pmScheduleScore,
      pmTenderDistribScore: d.pmTenderDistribScore,
      pmDtmProfessionalScore: d.pmDtmProfessionalScore,
      pmImpartialScore: d.pmImpartialScore,
      pmDecisionsScore: d.pmDecisionsScore,
      pmFragmentationScore: d.pmFragmentationScore,
      pmCommunicationScore: d.pmCommunicationScore,
      pmRealisticScore: d.pmRealisticScore,
      pmDtmFairnessScore: d.pmDtmFairnessScore,
      pmWouldRecommendScore: d.pmWouldRecommendScore,

      // QS block — only when this PM also acted as the QS.
      alsoActedAsQs: d.alsoActedAsQs,
      ...(d.alsoActedAsQs ? qsColumns(d as Record<string, unknown>) : {}),

      visibility: "PUBLIC",
    });
  } catch (error) {
    console.error("Failed to create project manager report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}

// ---------------------------------------------------------------------------
// Quantity surveyor
// ---------------------------------------------------------------------------

/** Pull the 14 QS score columns from a parsed object (null when absent). */
function qsColumns(d: Record<string, unknown>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const k of qsScoreKeys) {
    const v = d[k];
    out[k] = typeof v === "number" ? v : null;
  }
  return out;
}

const quantitySurveyorSchema = z.object({
  ...reporterShape,
  entityName: z.string().trim().min(1).max(200),
  companiesHouseNumber: companiesHouseNumberField,
  spReporterRole: z.string().trim().min(1).max(120),
  projectAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  projectCity: z.string().trim().min(1).max(120),
  projectPostcode: z.string().trim().min(2).max(12),
  projectType: projectTypeEnum,
  ...qsScoresRequired,
  issueDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  evidenceTypes: z.array(z.string().trim().max(40)).max(10),
  consents: serviceProviderConsents,
});

export async function submitQuantitySurveyorReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = quantitySurveyorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;

  const cols = qsColumns(d as Record<string, unknown>);
  const scores = qsScoreKeys.map((k) => cols[k] ?? 0);
  const overall = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);

  try {
    await createRiskReport({
      reporterCompanyName: d.reporterCompanyName,
      reporterContactName: d.reporterContactName,
      reporterEmail: d.reporterEmail,
      reporterPhone: d.reporterPhone || null,
      reporterTradeType: d.reporterTradeType,

      entityType: "QUANTITY_SURVEYOR",
      entityName: d.entityName,
      companiesHouseNumber: d.companiesHouseNumber?.trim() || null,
      clientInitials: null,
      isResidential: false,

      projectAddressLine1: d.projectAddressLine1 || null,
      projectCity: d.projectCity,
      projectPostcode: d.projectPostcode,
      publicArea: outwardCode(d.projectPostcode),
      projectType: d.projectType,

      // Legacy payment-centric fields — neutral placeholders.
      paymentScore: overall,
      communicationScore: d.qsCommunicationScore,
      variationRisk: "LOW",
      disputeRisk: "LOW",

      issueDescription: (d.issueDescription || "").trim(),
      evidenceTypes: d.evidenceTypes.length ? d.evidenceTypes.join(",") : null,
      consentsAcceptedAt: new Date(),

      spReporterRole: d.spReporterRole,
      ...cols,

      visibility: "PUBLIC",
    });
  } catch (error) {
    console.error("Failed to create quantity surveyor report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}

// ---------------------------------------------------------------------------
// Architect-PM (design role; may also have acted as PM and/or QS)
// ---------------------------------------------------------------------------

const arScoreKeys = Object.keys(arScoresRequired) as (keyof typeof arScoresRequired)[];

/** Pull the 10 PM score columns from a parsed object (null when absent). */
function pmColumns(d: Record<string, unknown>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const k of pmScoreKeys) {
    const v = d[k];
    out[k] = typeof v === "number" ? v : null;
  }
  return out;
}

/** Pull the 9 architect score columns from a parsed object. */
function arColumns(d: Record<string, unknown>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const k of arScoreKeys) {
    const v = d[k];
    out[k] = typeof v === "number" ? v : null;
  }
  return out;
}

const architectPmSchema = z
  .object({
    ...reporterShape,
    entityName: z.string().trim().min(1).max(200),
    companiesHouseNumber: companiesHouseNumberField,
    spReporterRole: z.string().trim().min(1).max(120),
    projectAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
    projectCity: z.string().trim().min(1).max(120),
    projectPostcode: z.string().trim().min(2).max(12),
    projectType: projectTypeEnum,
    ...arScoresRequired,
    alsoActedAsPm: z.boolean(),
    ...pmScoresOptional,
    alsoActedAsQs: z.boolean(),
    ...qsScoresOptional,
    issueDescription: z.string().trim().max(1000).optional().or(z.literal("")),
    evidenceTypes: z.array(z.string().trim().max(40)).max(10),
    consents: serviceProviderConsents,
  })
  .superRefine((d, ctx) => {
    const dd = d as Record<string, unknown>;
    if (d.alsoActedAsPm) {
      for (const k of pmScoreKeys) {
        if (typeof dd[k] !== "number") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pick 1–10", path: [k] });
        }
      }
    }
    if (d.alsoActedAsQs) {
      for (const k of qsScoreKeys) {
        if (typeof dd[k] !== "number") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pick 1–10", path: [k] });
        }
      }
    }
  });

export async function submitArchitectPmReport(
  input: unknown,
): Promise<SubmitState> {
  const parsed = architectPmSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Please complete all required fields correctly.",
    };
  }
  const d = parsed.data;
  const dd = d as Record<string, unknown>;

  const ar = arColumns(dd);
  const arScores = arScoreKeys.map((k) => ar[k] ?? 0);
  const overall = Math.round(arScores.reduce((s, n) => s + n, 0) / arScores.length);

  try {
    await createRiskReport({
      reporterCompanyName: d.reporterCompanyName,
      reporterContactName: d.reporterContactName,
      reporterEmail: d.reporterEmail,
      reporterPhone: d.reporterPhone || null,
      reporterTradeType: d.reporterTradeType,

      entityType: "ARCHITECT_PM",
      entityName: d.entityName,
      companiesHouseNumber: d.companiesHouseNumber?.trim() || null,
      clientInitials: null,
      isResidential: false,

      projectAddressLine1: d.projectAddressLine1 || null,
      projectCity: d.projectCity,
      projectPostcode: d.projectPostcode,
      publicArea: outwardCode(d.projectPostcode),
      projectType: d.projectType,

      // Legacy payment-centric fields — neutral placeholders.
      paymentScore: overall,
      communicationScore: overall,
      variationRisk: "LOW",
      disputeRisk: "LOW",

      issueDescription: (d.issueDescription || "").trim(),
      evidenceTypes: d.evidenceTypes.length ? d.evidenceTypes.join(",") : null,
      consentsAcceptedAt: new Date(),

      spReporterRole: d.spReporterRole,
      ...ar,
      alsoActedAsPm: d.alsoActedAsPm,
      ...(d.alsoActedAsPm ? pmColumns(dd) : {}),
      alsoActedAsQs: d.alsoActedAsQs,
      ...(d.alsoActedAsQs ? qsColumns(dd) : {}),

      visibility: "PUBLIC",
    });
  } catch (error) {
    console.error("Failed to create architect-PM report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  redirect("/submit-report/success");
}
