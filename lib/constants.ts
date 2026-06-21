/**
 * Centralised, human-readable labels and form option lists.
 *
 * Keeping all enum -> label mappings here means the UI never hard-codes copy
 * and the public/admin/forms stay consistent. The string values mirror the
 * Prisma enums (and the small set of String-backed fields).
 */

import type {
  EntityType,
  ProjectType,
  ProjectStatus,
  RiskLevel,
  AverageResponseTime,
  EvidenceStatus,
  ModerationStatus,
  Visibility,
} from "@prisma/client";

export type Option<T extends string = string> = { value: T; label: string };

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  RESIDENTIAL_CLIENT: "Residential Client",
  COMMERCIAL_CLIENT: "Commercial Client",
  DEVELOPER: "Developer",
  MAIN_CONTRACTOR: "Main Contractor",
  PROJECT_MANAGER: "Project Manager",
  QUANTITY_SURVEYOR: "Quantity Surveyor",
  MANAGEMENT_COMPANY: "Management Company",
  HOUSING_ASSOCIATION: "Housing Association",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  REFURBISHMENT: "Refurbishment",
  EXTENSION: "Extension",
  JOINERY: "Joinery",
  WINDOWS_AND_DOORS: "Windows and doors",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  ROOFING: "Roofing",
  DECORATION: "Decoration",
  NEW_BUILD: "New build",
  OTHER: "Other",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const RESPONSE_TIME_LABELS: Record<AverageResponseTime, string> = {
  UNDER_24H: "Under 24 hours",
  ONE_TO_THREE_DAYS: "1–3 days",
  THREE_TO_SEVEN_DAYS: "3–7 days",
  ONE_TO_TWO_WEEKS: "1–2 weeks",
  MORE_THAN_TWO_WEEKS: "More than 2 weeks",
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  UNVERIFIED: "Unverified",
  BASIC_EVIDENCE: "Basic Evidence",
  VERIFIED_EVIDENCE: "Verified Evidence",
  LEGAL_EVIDENCE: "Legal Evidence",
};

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISPUTED: "Disputed",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "Public",
  VERIFIED_CONTRACTORS_ONLY: "Verified Contractors Only",
  ADMIN_ONLY: "Admin Only",
};

// String-backed field: contract value range.
export const CONTRACT_VALUE_RANGES: Option[] = [
  { value: "UNDER_5K", label: "Under £5k" },
  { value: "5K_10K", label: "£5k–£10k" },
  { value: "10K_25K", label: "£10k–£25k" },
  { value: "25K_50K", label: "£25k–£50k" },
  { value: "50K_100K", label: "£50k–£100k" },
  { value: "100K_PLUS", label: "£100k+" },
];

export const CONTRACT_VALUE_LABELS: Record<string, string> = Object.fromEntries(
  CONTRACT_VALUE_RANGES.map((o) => [o.value, o.label]),
);

export const YES_NO_UNSURE: Option[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NOT_SURE", label: "Not sure" },
];

export const PAYMENT_LATE_OPTIONS: Option[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "PARTIALLY", label: "Partially" },
];

export const YES_NO_UNSURE_LABELS: Record<string, string> = {
  YES: "Yes",
  NO: "No",
  NOT_SURE: "Not sure",
  PARTIALLY: "Partially",
};

// Helpers to render <select> options from a label record.
export function optionsFromLabels<T extends string>(
  labels: Record<T, string>,
): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));
}
