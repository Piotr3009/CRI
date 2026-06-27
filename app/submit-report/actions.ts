"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createRiskReport } from "@/lib/reports";

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
  amountGbp: z.number().int().min(0).max(100000000).nullable().optional(),
});

const reporterShape = {
  reporterCompanyName: z.string().trim().min(1).max(200),
  reporterContactName: z.string().trim().min(1).max(200),
  reporterEmail: z.string().trim().email().max(200),
  reporterPhone: z.string().trim().max(50).optional().or(z.literal("")),
  reporterTradeType: z.string().trim().min(1).max(120),
};

const projectShape = {
  projectPostcode: z.string().trim().min(2).max(12),
  projectType: projectTypeEnum,
  contractValueRange: z.string().trim().max(40).optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
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
  }),
};

const commonShape = {
  ...reporterShape,
  ...projectShape,
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

// Commercial client → a company (public). Full name + address allowed.
const commercialClientSchema = z.object({
  ...commonShape,
  entityName: z.string().trim().min(1).max(200),
  projectAddressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  projectCity: z.string().trim().min(1).max(120),
  courtDispute: z.enum(["YES", "NO"]),
});

export type SubmitState = { ok: boolean; formError?: string };

// ---------------------------------------------------------------------------
// Scoring helpers — Level 1 only (this single contract). Aggregation across
// many reports (Level 2 / final report) happens later, after Companies House.
// ---------------------------------------------------------------------------

type Tri = "YES" | "SOMETIMES" | "NO";

/** Average payment delay (days) -> score. Never 0 — 0 would read as a verdict. */
function scoreFromDelay(avgDays: number): number {
  if (avgDays <= 3) return 10;
  if (avgDays <= 7) return 7;
  if (avgDays <= 14) return 5;
  if (avgDays <= 21) return 3;
  return 1; // 22+ days
}

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

    // Project
    projectType: d.projectType,
    contractValueRange: d.contractValueRange || null,
    startDate,
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
        amountGbp: p.amountGbp ?? null,
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
      projectPostcode: d.projectPostcode,
      publicArea: outwardCode(d.projectPostcode),
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
      projectAddressLine1: d.projectAddressLine1 || null,
      projectCity: d.projectCity,
      projectPostcode: d.projectPostcode,
      // Company address is public — show the full postcode.
      publicArea: d.projectPostcode.trim().toUpperCase(),
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
