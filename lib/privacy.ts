/**
 * Privacy boundary.
 *
 * Public pages (home, search, /reports/[id]) must ONLY ever receive a
 * `PublicReport`. `toPublicReport()` is the single chokepoint that strips every
 * private / admin-only field from a database `RiskReport` before it can reach a
 * client component. If a field is not present on `PublicReport`, it cannot leak.
 *
 * Rules enforced here:
 *  - Residential full names are never exposed (initials only).
 *  - Exact residential addresses / postcodes are never exposed (area / prefix).
 *  - Reporter contact details are never exposed.
 *  - Free-text issue descriptions are never exposed (only the moderated summary).
 */

import type {
  RiskReport,
  EntityType,
  ProjectType,
  ProjectStatus,
  RiskLevel,
  EvidenceStatus,
  ModerationStatus,
  Visibility,
} from "@prisma/client";
import { ENTITY_TYPE_LABELS } from "./constants";
import { postcodePrefix } from "./format";

export type PublicReport = {
  id: string;
  entityType: EntityType;
  isResidential: boolean;
  /** Safe display name: "Residential Client" or a company / professional name. */
  publicDisplayName: string;
  /** Residential initials (e.g. "C.A."), otherwise null. */
  initials: string | null;
  /** Public area or postcode outward code only. */
  area: string;
  projectType: ProjectType;
  contractValueRange: string | null;
  projectStatus: ProjectStatus;
  paymentScore: number;
  communicationScore: number;
  variationRisk: RiskLevel;
  disputeRisk: RiskLevel;
  overallRisk: RiskLevel;
  evidenceStatus: EvidenceStatus;
  moderationStatus: ModerationStatus;
  visibility: Visibility;
  publicSummary: string | null;
  /** True when full details are held back (residential or non-public report). */
  restrictedDetails: boolean;
  createdAt: string;
};

/** A residential record is anything flagged residential or typed as such. */
export function isResidentialEntity(
  report: Pick<RiskReport, "isResidential" | "entityType">,
): boolean {
  return report.isResidential || report.entityType === "RESIDENTIAL_CLIENT";
}

/**
 * Overall risk band derived from scores + variation/dispute risk.
 * Lower payment/communication scores increase risk. Deterministic and simple.
 */
export function calculateOverallRisk(input: {
  paymentScore: number;
  communicationScore: number;
  variationRisk: RiskLevel;
  disputeRisk: RiskLevel;
}): RiskLevel {
  let points = 0;

  const avgScore = (input.paymentScore + input.communicationScore) / 2;
  if (avgScore < 4) points += 2;
  else if (avgScore < 7) points += 1;

  const levelPoints = (level: RiskLevel) =>
    level === "HIGH" ? 2 : level === "MEDIUM" ? 1 : 0;
  points += levelPoints(input.variationRisk);
  points += levelPoints(input.disputeRisk);

  if (points >= 4) return "HIGH";
  if (points >= 2) return "MEDIUM";
  return "LOW";
}

function publicDisplayName(report: RiskReport): string {
  if (isResidentialEntity(report)) return "Residential Client";
  return report.entityName?.trim() || ENTITY_TYPE_LABELS[report.entityType];
}

/**
 * Map a full database report to its public-safe projection.
 * NEVER add private fields (reporter*, issueDescription, exact address) here.
 */
export function toPublicReport(report: RiskReport): PublicReport {
  const residential = isResidentialEntity(report);
  const area = report.publicArea?.trim() || postcodePrefix(report.projectPostcode) || "Undisclosed area";

  return {
    id: report.id,
    entityType: report.entityType,
    isResidential: residential,
    publicDisplayName: publicDisplayName(report),
    initials: residential ? report.clientInitials?.trim() || null : null,
    area,
    projectType: report.projectType,
    contractValueRange: report.contractValueRange ?? null,
    projectStatus: report.projectStatus,
    paymentScore: report.paymentScore,
    communicationScore: report.communicationScore,
    variationRisk: report.variationRisk,
    disputeRisk: report.disputeRisk,
    overallRisk: calculateOverallRisk(report),
    evidenceStatus: report.evidenceStatus,
    moderationStatus: report.moderationStatus,
    visibility: report.visibility,
    publicSummary: report.publicSummary ?? null,
    restrictedDetails: residential || report.visibility !== "PUBLIC",
    createdAt: report.createdAt.toISOString(),
  };
}

/**
 * A short label for a public report, e.g.
 * "Residential Client — C.A. — SW19" or "Northline Build Group — Manchester".
 */
export function publicLabel(report: PublicReport): string {
  const parts: string[] = [report.publicDisplayName];
  if (report.initials) parts.push(report.initials);
  parts.push(report.area);
  return parts.join(" — ");
}
