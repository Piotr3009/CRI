"use server";

import { redirect } from "next/navigation";
import { submitReportSchema } from "@/lib/validation";
import { createRiskReport } from "@/lib/reports";
import { prisma } from "@/lib/db";

export type SubmitReportState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
};

/**
 * Server action for the public "Submit Report" form.
 *
 * Treats all input as untrusted: validates with Zod server-side, derives the
 * residential flag + default restricted visibility, and persists via
 * `createRiskReport` (which always forces PENDING moderation).
 */
export async function submitReportAction(
  _prevState: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = submitReportSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      formError: "Please correct the highlighted fields and try again.",
    };
  }

  const d = parsed.data;
  const residential =
    d.isResidential || d.entityType === "RESIDENTIAL_CLIENT";

  // Residential / sensitive records default to restricted visibility.
  // Non-residential default to PUBLIC. Either way moderation gates publication.
  const visibility = residential ? "VERIFIED_CONTRACTORS_ONLY" : "PUBLIC";

  try {
    const report = await createRiskReport({
      // Reporter (private)
      reporterCompanyName: d.reporterCompanyName,
      reporterContactName: d.reporterContactName,
      reporterEmail: d.reporterEmail,
      reporterPhone: d.reporterPhone,
      reporterTradeType: d.reporterTradeType,

      // Entity
      entityType: d.entityType,
      entityName: residential ? d.entityName ?? null : d.entityName,
      clientInitials: d.clientInitials,
      isResidential: residential,
      projectAddressLine1: d.projectAddressLine1,
      projectCity: d.projectCity,
      projectPostcode: d.projectPostcode,
      publicArea: d.publicArea,

      // Project
      projectType: d.projectType,
      contractValueRange: d.contractValueRange,
      startDate: d.startDate,
      projectStatus: d.projectStatus,

      // Risk
      paymentScore: d.paymentScore,
      communicationScore: d.communicationScore,
      variationRisk: d.variationRisk,
      disputeRisk: d.disputeRisk,
      averageResponseTime: d.averageResponseTime,
      extrasRequestedWithoutApprovedCost: d.extrasRequestedWithoutApprovedCost,
      paymentLate: d.paymentLate,
      paymentDelayDays: d.paymentDelayDays,
      amountUnpaid: d.amountUnpaid,
      formalDispute: d.formalDispute,

      // Narrative
      issueDescription: d.issueDescription,
      publicSummary: d.publicSummary,

      // Governance
      visibility,
    });

    // Optional text-based evidence (file upload is a future feature).
    if (d.evidenceDescription) {
      await prisma.evidence.create({
        data: {
          riskReportId: report.id,
          type: "DESCRIPTION",
          description: d.evidenceDescription,
          status: "PENDING",
        },
      });
    }
  } catch (error) {
    console.error("Failed to create risk report", error);
    return {
      ok: false,
      formError:
        "Something went wrong saving your report. Please try again shortly.",
    };
  }

  // Outside the try/catch: redirect throws a control-flow signal by design.
  redirect("/submit-report/success");
}
