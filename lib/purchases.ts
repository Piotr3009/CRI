/**
 * Pay-per-report purchases: pricing tiers, access checks, and marking
 * purchases paid from Stripe events. One purchase = 30-day access to one
 * company's full risk report for one user.
 */
import type Stripe from "stripe";
import { prisma } from "./db";

/** How long a purchase unlocks the company report for. */
export const REPORT_ACCESS_DAYS = 30;

/** Net prices in pence (VAT handled by Stripe when enabled). */
export const PRICE_BASIC_PENCE = 299;
export const PRICE_WITH_REPORTS_PENCE = 499;

export type AccessTier = "BASIC" | "WITH_REPORTS";

/**
 * Approved, non-admin-only reviews for a company — the count that decides the
 * price tier. Mirrors the visibility filter used by the public company page.
 */
export async function countApprovedCompanyReports(
  companiesHouseNumber: string,
): Promise<number> {
  return prisma.riskReport.count({
    where: {
      companiesHouseNumber,
      moderationStatus: "APPROVED",
      visibility: { not: "ADMIN_ONLY" },
    },
  });
}

/** BASIC (£2.99) with no approved reviews; WITH_REPORTS (£4.99) with ≥ 1. */
export function tierForApprovedCount(approvedCount: number): {
  tier: AccessTier;
  amountPence: number;
} {
  return approvedCount > 0
    ? { tier: "WITH_REPORTS", amountPence: PRICE_WITH_REPORTS_PENCE }
    : { tier: "BASIC", amountPence: PRICE_BASIC_PENCE };
}

/** Display label, e.g. "£4.99". VAT is added by Stripe Checkout when enabled. */
export function formatPricePence(amountPence: number): string {
  return `£${(amountPence / 100).toFixed(2)}`;
}

/** True when the user holds unexpired, paid access to this company's report. */
export async function hasCompanyAccess(
  userId: string,
  companiesHouseNumber: string,
): Promise<boolean> {
  const found = await prisma.reportAccess.findFirst({
    where: {
      userId,
      companiesHouseNumber,
      status: "PAID",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return Boolean(found);
}

/** A user's paid purchases, newest first (for the My Account page). */
export async function getUserPurchases(userId: string) {
  return prisma.reportAccess.findMany({
    where: { userId, status: "PAID" },
    orderBy: { createdAt: "desc" },
  });
}

/** Record the purchase attempt when a Checkout session is created. */
export async function createPendingAccess(input: {
  userId: string;
  companiesHouseNumber: string;
  tier: AccessTier;
  amountPence: number;
  stripeSessionId: string;
}): Promise<void> {
  await prisma.reportAccess.create({
    data: { ...input, status: "PENDING" },
  });
}

function accessExpiry(): Date {
  return new Date(Date.now() + REPORT_ACCESS_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Grant access for a completed, paid Checkout session. Idempotent: called by
 * both the Stripe webhook and the success-redirect fallback, whichever lands
 * first wins and the other is a no-op. If the PENDING row is missing (edge
 * case), the row is recreated from session metadata.
 */
export async function grantAccessFromSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.payment_status !== "paid") return;

  const updated = await prisma.reportAccess.updateMany({
    where: { stripeSessionId: session.id, status: "PENDING" },
    data: { status: "PAID", expiresAt: accessExpiry() },
  });
  if (updated.count > 0) return;

  const existing = await prisma.reportAccess.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) return; // already PAID — nothing to do

  // PENDING row lost (e.g. DB hiccup at checkout creation) — rebuild from
  // metadata so a paid customer is never locked out.
  const userId = session.metadata?.userId;
  const companiesHouseNumber = session.metadata?.companiesHouseNumber;
  const tier = session.metadata?.tier;
  if (!userId || !companiesHouseNumber) return;

  await prisma.reportAccess.create({
    data: {
      userId,
      companiesHouseNumber,
      tier: tier === "WITH_REPORTS" ? "WITH_REPORTS" : "BASIC",
      amountPence: session.amount_subtotal ?? 0,
      stripeSessionId: session.id,
      status: "PAID",
      expiresAt: accessExpiry(),
    },
  });
}
