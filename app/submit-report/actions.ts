"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createRiskReport } from "@/lib/reports";

// ---------------------------------------------------------------------------
// Validation — all client input is untrusted and re-validated here (Zod).
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

const privateClientSchema = z.object({
  // Reporter (manual for now; will be pulled from the account once auth ships).
  reporterCompanyName: z.string().trim().min(1).max(200),
  reporterContactName: z.string().trim().min(1).max(200),
  reporterEmail: z.string().trim().email().max(200),
  reporterPhone: z.string().trim().max(50).optional().or(z.literal("")),
  reporterTradeType: z.string().trim().min(1).max(120),

  // Entity — private residential client (initials only, never a full name).
  clientInitials: z.string().trim().min(1).max(12),
  projectPostcode: z.string().trim().min(2).max(12),
  projectType: projectTypeEnum,
  contractValueRange: z.string().trim().max(40).optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
  projectStatus: projectStatusEnum,

  // Payments — at least 1, at most 20. daysLate = 0 means on time / early.
  payments: z.array(paymentSchema).min(1).max(20),

  // Abandoned invoices (> 60 days unpaid) — optional, counted separately.
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

  // Behaviour — all 6 required (raw TAK / CZASAMI / NIE).
  behaviourExtraWorkNoCost: behaviour,
  behaviourAskedCostUpfront: behaviour,
  behaviourExpectedFreeLogistics: behaviour,
  behaviourKeptAgreements: behaviour,
  behaviourCommunicationSmooth: behaviour,
  behaviourWouldRecommend: behaviour,

  // Narrative (optional, private) + evidence types claimed.
  issueDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  evidenceTypes: z.array(z.string().trim().max(40)).max(10),

  // Consents — every one must be ticked (true).
  consents: z.object({
    realExperience: z.literal(true),
    canProvide: z.literal(true),
    allowModeration: z.literal(true),
    notAutoPublished: z.literal(true),
    notRevenge: z.literal(true),
  }),
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

// ---------------------------------------------------------------------------
// Action
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

  // Derive Level-1 values from the raw facts the reporter gave us.
  const avgDelay =
    d.payments.reduce((sum, p) => sum + p.daysLate, 0) / d.payments.length;
  const paymentScore = scoreFromDelay(avgDelay);
  const communicationScore = commScoreFromAnswer(d.behaviourCommunicationSmooth);
  const variationRisk = variationRiskFromAnswer(d.behaviourExtraWorkNoCost);
  const disputeRisk = (d.abandonedInvoicesCount ?? 0) > 0 ? "HIGH" : "LOW";
  const publicArea = outwardCode(d.projectPostcode);

  const parsedStart = d.startDate ? new Date(d.startDate) : null;
  const startDate =
    parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : null;

  const extras =
    d.behaviourExtraWorkNoCost === "YES"
      ? "YES"
      : d.behaviourExtraWorkNoCost === "NO"
        ? "NO"
        : "NOT_SURE";

  try {
    await createRiskReport({
      // Reporter (private)
      reporterCompanyName: d.reporterCompanyName,
      reporterContactName: d.reporterContactName,
      reporterEmail: d.reporterEmail,
      reporterPhone: d.reporterPhone || null,
      reporterTradeType: d.reporterTradeType,

      // Entity — private residential client
      entityType: "RESIDENTIAL_CLIENT",
      entityName: null,
      clientInitials: d.clientInitials,
      isResidential: true,
      projectPostcode: d.projectPostcode,
      publicArea,

      // Project
      projectType: d.projectType,
      contractValueRange: d.contractValueRange || null,
      startDate,
      projectStatus: d.projectStatus,

      // Risk scoring (computed from raw facts)
      paymentScore,
      communicationScore,
      variationRisk,
      disputeRisk,
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

      // Governance — residential defaults to restricted; moderation gates all.
      visibility: "VERIFIED_CONTRACTORS_ONLY",

      // Payment child rows
      payments: {
        create: d.payments.map((p, i) => ({
          position: i + 1,
          daysLate: p.daysLate,
          amountGbp: p.amountGbp ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to create private client report", error);
    return {
      ok: false,
      formError: "Something went wrong saving your report. Please try again.",
    };
  }

  // redirect throws a control-flow signal by design — keep it outside try/catch.
  redirect("/submit-report/success");
}
