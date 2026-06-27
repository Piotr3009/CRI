/**
 * Zod validation schemas. Used for SERVER-SIDE validation of untrusted form
 * input (the source of truth) and to derive form value types on the client.
 *
 * Note: this module intentionally has NO runtime dependency on @prisma/client
 * so it is safe to import from client components for typing.
 */

import { z } from "zod";

// Enum value lists (mirror the Prisma enums / String-backed fields).
const ENTITY_TYPES = [
  "RESIDENTIAL_CLIENT",
  "COMMERCIAL_CLIENT",
  "DEVELOPER",
  "MAIN_CONTRACTOR",
  "PROJECT_MANAGER",
  "QUANTITY_SURVEYOR",
  "MANAGEMENT_COMPANY",
  "HOUSING_ASSOCIATION",
] as const;

const PROJECT_TYPES = [
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
] as const;

const PROJECT_STATUSES = [
  "COMPLETED",
  "ONGOING",
  "CANCELLED",
  "DISPUTED",
] as const;

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

const RESPONSE_TIMES = [
  "UNDER_24H",
  "ONE_TO_THREE_DAYS",
  "THREE_TO_SEVEN_DAYS",
  "ONE_TO_TWO_WEEKS",
  "MORE_THAN_TWO_WEEKS",
] as const;

const CONTRACT_VALUE_RANGES = [
  "UNDER_5K",
  "5K_10K",
  "10K_25K",
  "25K_50K",
  "50K_100K",
  "100K_PLUS",
] as const;

const YES_NO_UNSURE = ["YES", "NO", "NOT_SURE"] as const;
const PAYMENT_LATE = ["YES", "NO", "PARTIALLY"] as const;

// Coerce empty strings (from form fields) to undefined so `.optional()` works.
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional(),
);

// Required confirmation checkbox: HTML checkboxes submit "on" when ticked.
const requiredCheckbox = (message: string) =>
  z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.literal(true, { errorMap: () => ({ message }) }),
  );

const score = z.coerce
  .number({ invalid_type_error: "Enter a number between 0 and 10" })
  .min(0, "Minimum is 0")
  .max(10, "Maximum is 10");

export const submitReportSchema = z
  .object({
    // Reporter details (private)
    reporterCompanyName: z.string().trim().min(1, "Company name is required"),
    reporterContactName: z.string().trim().min(1, "Contact name is required"),
    reporterEmail: z.string().trim().email("Enter a valid email address"),
    reporterPhone: optionalString,
    reporterTradeType: z.string().trim().min(1, "Trade type is required"),

    // Entity being reported
    entityType: z.enum(ENTITY_TYPES, {
      errorMap: () => ({ message: "Select an entity type" }),
    }),
    entityName: optionalString,
    clientInitials: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(10, "Use initials only, e.g. C.A.")
        .optional(),
    ),
    isResidential: z
      .enum(["yes", "no"], {
        errorMap: () => ({ message: "Please select yes or no" }),
      })
      .transform((v) => v === "yes"),
    projectAddressLine1: optionalString,
    projectCity: optionalString,
    projectPostcode: optionalString,
    publicArea: z
      .string()
      .trim()
      .min(1, "Public area is required (e.g. SW19, NW London, Manchester)")
      .max(60),

    // Project details
    projectType: z.enum(PROJECT_TYPES, {
      errorMap: () => ({ message: "Select a project type" }),
    }),
    contractValueRange: z.preprocess(
      emptyToUndefined,
      z.enum(CONTRACT_VALUE_RANGES).optional(),
    ),
    startDate: z.preprocess(
      emptyToUndefined,
      z.coerce.date().optional(),
    ),
    projectStatus: z.enum(PROJECT_STATUSES, {
      errorMap: () => ({ message: "Select a project status" }),
    }),

    // Risk scoring
    paymentScore: score,
    communicationScore: score,
    variationRisk: z.enum(RISK_LEVELS, {
      errorMap: () => ({ message: "Select a variation risk level" }),
    }),
    disputeRisk: z.enum(RISK_LEVELS, {
      errorMap: () => ({ message: "Select a dispute risk level" }),
    }),
    averageResponseTime: z.preprocess(
      emptyToUndefined,
      z.enum(RESPONSE_TIMES).optional(),
    ),
    extrasRequestedWithoutApprovedCost: z.preprocess(
      emptyToUndefined,
      z.enum(YES_NO_UNSURE).optional(),
    ),
    paymentLate: z.preprocess(
      emptyToUndefined,
      z.enum(PAYMENT_LATE).optional(),
    ),
    paymentDelayDays: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).max(3650).optional(),
    ),
    amountUnpaid: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).optional(),
    ),
    formalDispute: z.preprocess(
      emptyToUndefined,
      z.enum(YES_NO_UNSURE).optional(),
    ),

    // Narrative
    issueDescription: z
      .string()
      .trim()
      .min(20, "Please give at least a short description (20+ characters)")
      .max(5000, "Please keep this under 5000 characters"),
    publicSummary: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(600, "Keep the public summary under 600 characters").optional(),
    ),
    evidenceDescription: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(2000).optional(),
    ),

    // Confirmations
    confirmRealExperience: requiredCheckbox(
      "Please confirm this is based on your real business experience",
    ),
    confirmCanProvideEvidence: requiredCheckbox(
      "Please confirm you can provide evidence if requested",
    ),
    confirmModeration: requiredCheckbox(
      "Please acknowledge that CTX may moderate this report",
    ),
    confirmNotAutomatic: requiredCheckbox(
      "Please acknowledge that this report is not published automatically",
    ),
  })
  .superRefine((data, ctx) => {
    const residential =
      data.isResidential || data.entityType === "RESIDENTIAL_CLIENT";

    if (residential && !data.clientInitials) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientInitials"],
        message: "Initials are required for residential clients (e.g. C.A.)",
      });
    }

    if (!residential && !data.entityName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entityName"],
        message: "Company / entity name is required for non-residential reports",
      });
    }
  });

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

export const rightToReplySchema = z.object({
  riskReportId: z.string().trim().min(1),
  responderName: z.string().trim().min(2, "Please enter your name"),
  responderEmail: z.string().trim().email("Enter a valid email address"),
  responseText: z
    .string()
    .trim()
    .min(20, "Please provide a little more detail (20+ characters)")
    .max(5000, "Please keep your response under 5000 characters"),
});

export type RightToReplyInput = z.infer<typeof rightToReplySchema>;
