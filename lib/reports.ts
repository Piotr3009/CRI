/**
 * Data-access helpers for risk reports.
 *
 * Public-facing helpers (`getApprovedReports`, `getPublicRiskReportById`)
 * return `PublicReport` projections only. Admin helpers return full rows and
 * must only be called from authenticated admin server code.
 */

import { Prisma } from "@prisma/client";
import type {
  EntityType,
  EvidenceStatus,
  ModerationStatus,
  RiskReport,
  Visibility,
} from "@prisma/client";
import { prisma } from "./db";
import { toPublicReport, type PublicReport } from "./privacy";
import type { McReportRow } from "./level2/mainContractor";
import type { SpReportRow } from "./level2/serviceProvider";

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a risk report. Moderation is always gated: regardless of caller input,
 * a new report is PENDING with UNVERIFIED evidence and is not published.
 */
export async function createRiskReport(
  data: Omit<
    Prisma.RiskReportUncheckedCreateInput,
    "moderationStatus" | "evidenceStatus"
  >,
): Promise<RiskReport> {
  return prisma.riskReport.create({
    data: {
      ...data,
      moderationStatus: "PENDING",
      evidenceStatus: "UNVERIFIED",
    },
  });
}

// ---------------------------------------------------------------------------
// Public reads (APPROVED only, ADMIN_ONLY excluded, privacy-mapped)
// ---------------------------------------------------------------------------

export type PublicSearchFilters = {
  query?: string;
  entityType?: EntityType;
  evidenceStatus?: EvidenceStatus;
  residential?: "RESIDENTIAL" | "COMMERCIAL";
  area?: string;
};

export async function getApprovedReports(
  filters: PublicSearchFilters = {},
): Promise<PublicReport[]> {
  const and: Prisma.RiskReportWhereInput[] = [
    { moderationStatus: "APPROVED" },
    // Admin-only records must never surface in public search.
    { visibility: { not: "ADMIN_ONLY" } },
  ];

  if (filters.entityType) and.push({ entityType: filters.entityType });
  if (filters.evidenceStatus)
    and.push({ evidenceStatus: filters.evidenceStatus });

  if (filters.residential === "RESIDENTIAL") {
    and.push({
      OR: [{ isResidential: true }, { entityType: "RESIDENTIAL_CLIENT" }],
    });
  } else if (filters.residential === "COMMERCIAL") {
    and.push({ isResidential: false, entityType: { not: "RESIDENTIAL_CLIENT" } });
  }

  if (filters.area) {
    and.push({
      OR: [
        { publicArea: { contains: filters.area, mode: "insensitive" } },
        { projectPostcode: { contains: filters.area, mode: "insensitive" } },
      ],
    });
  }

  if (filters.query) {
    const q = filters.query;
    and.push({
      OR: [
        { entityName: { contains: q, mode: "insensitive" } },
        { publicArea: { contains: q, mode: "insensitive" } },
        { projectPostcode: { contains: q, mode: "insensitive" } },
        { projectCity: { contains: q, mode: "insensitive" } },
        { clientInitials: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const reports = await prisma.riskReport.findMany({
    where: { AND: and },
    orderBy: { createdAt: "desc" },
  });

  return reports.map(toPublicReport);
}

export async function getPublicRiskReportById(
  id: string,
): Promise<PublicReport | null> {
  const report = await prisma.riskReport.findFirst({
    where: {
      id,
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
    },
  });
  return report ? toPublicReport(report) : null;
}

/**
 * Compute an entity-level report count for each public report in a list.
 * Reports are grouped by a privacy-safe key (display name + area + type).
 */
export function withReportCounts(
  reports: PublicReport[],
): Array<PublicReport & { reportCount: number }> {
  const counts = new Map<string, number>();
  const key = (r: PublicReport) =>
    `${r.entityType}|${r.publicDisplayName}|${r.initials ?? ""}|${r.area}`;
  for (const r of reports) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
  return reports.map((r) => ({ ...r, reportCount: counts.get(key(r)) ?? 1 }));
}

/**
 * Count approved, publicly-visible reports for the same entity (privacy-safe
 * match). Used for the "Report count" shown on a public report page.
 */
export async function countApprovedForPublicReport(
  report: PublicReport,
): Promise<number> {
  return prisma.riskReport.count({
    where: {
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
      entityType: report.entityType,
      publicArea: report.area,
      ...(report.isResidential
        ? { clientInitials: report.initials ?? undefined }
        : { entityName: report.publicDisplayName }),
    },
  });
}

// ---------------------------------------------------------------------------
// Admin reads (full rows — call only from authenticated admin code)
// ---------------------------------------------------------------------------

export async function getAdminReports(status?: ModerationStatus) {
  return prisma.riskReport.findMany({
    where: status ? { moderationStatus: status } : {},
    orderBy: { createdAt: "desc" },
    include: { evidence: true, rightToReplies: true },
  });
}

export async function getAdminReportById(id: string) {
  return prisma.riskReport.findUnique({
    where: { id },
    include: {
      evidence: true,
      rightToReplies: true,
      payments: { orderBy: { position: "asc" } },
    },
  });
}

export async function getAdminReportCounts(): Promise<
  Record<ModerationStatus, number>
> {
  const grouped = await prisma.riskReport.groupBy({
    by: ["moderationStatus"],
    _count: { _all: true },
  });
  const counts: Record<ModerationStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    DISPUTED: 0,
  };
  for (const g of grouped) counts[g.moderationStatus] = g._count._all;
  return counts;
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

export async function updateReportModerationStatus(
  id: string,
  moderationStatus: ModerationStatus,
) {
  return prisma.riskReport.update({ where: { id }, data: { moderationStatus } });
}

export async function updateReportVisibility(id: string, visibility: Visibility) {
  return prisma.riskReport.update({ where: { id }, data: { visibility } });
}

export async function updateReportEvidenceStatus(
  id: string,
  evidenceStatus: EvidenceStatus,
) {
  return prisma.riskReport.update({ where: { id }, data: { evidenceStatus } });
}

export async function updateReportPublicSummary(
  id: string,
  publicSummary: string,
) {
  return prisma.riskReport.update({ where: { id }, data: { publicSummary } });
}

// ---------------------------------------------------------------------------
// Right to reply
// ---------------------------------------------------------------------------

export async function createRightToReply(data: {
  riskReportId: string;
  responderName: string;
  responderEmail: string;
  responseText: string;
}) {
  return prisma.rightToReply.create({ data });
}

// ---------------------------------------------------------------------------
// Level-2 (final report) reads — aggregate by Companies House number
// ---------------------------------------------------------------------------

/**
 * Raw rows a MAIN_CONTRACTOR final report needs, for one CH number. Selects
 * ONLY scoring/fact fields (no reporter PII) — privacy-safe by construction.
 * APPROVED + non-admin-only only.
 */
export async function getMainContractorReportRows(
  chNumber: string,
  entityType: EntityType = "MAIN_CONTRACTOR",
): Promise<McReportRow[]> {
  const rows = await prisma.riskReport.findMany({
    where: {
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
      entityType,
      companiesHouseNumber: chNumber,
    },
    select: {
      createdAt: true,
      paymentScore: true,
      communicationScore: true,
      behaviourExtraWorkNoCost: true,
      behaviourAskedCostUpfront: true,
      behaviourExpectedFreeLogistics: true,
      behaviourKeptAgreements: true,
      behaviourRespondedOnTime: true,
      behaviourProvidedAccess: true,
      behaviourCommunicationSmooth: true,
      behaviourWouldRecommend: true,
      avgPaymentDelayDays: true,
      abandonedInvoicesCount: true,
      abandonedInvoicesTotalGbp: true,
      backChargesUnagreed: true,
      backChargesAmountGbp: true,
      variationsNoPaper: true,
      retentionStatus: true,
      formalDispute: true,
      projectReadinessScore: true,
      contractValueGbp: true,
      publicArea: true,
      payments: { select: { daysLate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    createdAt: r.createdAt,
    paymentScore: r.paymentScore,
    communicationScore: r.communicationScore,
    behaviourExtraWorkNoCost: r.behaviourExtraWorkNoCost,
    behaviourAskedCostUpfront: r.behaviourAskedCostUpfront,
    behaviourExpectedFreeLogistics: r.behaviourExpectedFreeLogistics,
    behaviourKeptAgreements: r.behaviourKeptAgreements,
    behaviourRespondedOnTime: r.behaviourRespondedOnTime,
    behaviourProvidedAccess: r.behaviourProvidedAccess,
    behaviourCommunicationSmooth: r.behaviourCommunicationSmooth,
    behaviourWouldRecommend: r.behaviourWouldRecommend,
    avgPaymentDelayDays: r.avgPaymentDelayDays,
    abandonedInvoicesCount: r.abandonedInvoicesCount,
    abandonedInvoicesTotalGbp: r.abandonedInvoicesTotalGbp,
    backChargesUnagreed: r.backChargesUnagreed,
    backChargesAmountGbp: r.backChargesAmountGbp,
    variationsNoPaper: r.variationsNoPaper,
    retentionStatus: r.retentionStatus as McReportRow["retentionStatus"],
    formalDispute: r.formalDispute,
    projectReadinessScore: r.projectReadinessScore,
    contractValueGbp: r.contractValueGbp,
    publicArea: r.publicArea,
    paymentCount: r.payments.length,
    paymentDelaySum: r.payments.reduce((sum, p) => sum + p.daysLate, 0),
  }));
}

/** Count of ALL approved (non-admin-only) reports for a CH number, any type. */
export async function countApprovedReportsForCompany(
  chNumber: string,
): Promise<number> {
  return prisma.riskReport.count({
    where: {
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
      companiesHouseNumber: chNumber,
    },
  });
}

/** Approved, public rows for a service-provider company (PM / QS / Architect). */
export async function getServiceProviderReportRows(
  chNumber: string,
  entityType: EntityType,
): Promise<SpReportRow[]> {
  const rows = await prisma.riskReport.findMany({
    where: {
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
      entityType,
      companiesHouseNumber: chNumber,
    },
    select: {
      pmScheduleScore: true,
      pmTenderDistribScore: true,
      pmDtmProfessionalScore: true,
      pmImpartialScore: true,
      pmDecisionsScore: true,
      pmFragmentationScore: true,
      pmCommunicationScore: true,
      pmRealisticScore: true,
      pmDtmFairnessScore: true,
      pmWouldRecommendScore: true,
      qsFairTenderScore: true,
      qsTenderDocsScore: true,
      qsPriceChallengeScore: true,
      qsOpenToExplanationScore: true,
      qsMeasurementScore: true,
      qsVariationPricingScore: true,
      qsClaimsScore: true,
      qsVariationAcceptanceScore: true,
      qsCertTimingScore: true,
      qsUnfairDeductionsScore: true,
      qsFinalAccountScore: true,
      qsImpartialScore: true,
      qsCommunicationScore: true,
      qsWouldRecommendScore: true,
      arDrawingsAccurateScore: true,
      arCompletenessScore: true,
      arCoordinationScore: true,
      arErrorFreeScore: true,
      arTimelinessScore: true,
      arFewChangesScore: true,
      arBuildabilityScore: true,
      arImpartialScore: true,
      arWouldRecommendScore: true,
      formalDispute: true,
      contractValueGbp: true,
    },
  });
  return rows;
}

/** Which entity types have approved, public reports for this company (with counts). */
export async function getCompanyEntityTypes(
  chNumber: string,
): Promise<{ entityType: EntityType; count: number }[]> {
  const grouped = await prisma.riskReport.groupBy({
    by: ["entityType"],
    where: {
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
      companiesHouseNumber: chNumber,
    },
    _count: { _all: true },
  });
  return grouped.map((g) => ({ entityType: g.entityType, count: g._count._all }));
}
