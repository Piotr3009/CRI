"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  countApprovedCompanyReports,
  createPendingAccess,
  grantAccessFromSession,
  tierForApprovedCount,
} from "@/lib/purchases";
import { getCompanyProfile } from "@/lib/companiesHouse";

/** Best-effort site origin for Stripe redirect URLs. */
function requestOrigin(): string {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.SITE_URL ?? "https://cixcheck.com";
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Starts a Stripe Checkout for 30-day access to one company's report.
 * Price tier is decided server-side from the approved-review count — the
 * client never chooses the amount.
 */
export async function createReportCheckout(
  input: unknown,
): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to buy a report." };
  }
  if (!isStripeConfigured) {
    return { ok: false, error: "Payments are not available right now." };
  }

  const number = typeof input === "string" ? input.trim() : "";
  if (!number || number.length > 20) {
    return { ok: false, error: "Invalid company number." };
  }

  try {
    const [approvedCount, facts] = await Promise.all([
      countApprovedCompanyReports(number),
      getCompanyProfile(number).catch(() => null),
    ]);
    const { tier, amountPence } = tierForApprovedCount(approvedCount);

    const origin = requestOrigin();
    const companyLabel = facts?.name ?? `Company ${number}`;
    const description =
      tier === "WITH_REPORTS"
        ? `30-day access · includes ${approvedCount} contractor report${approvedCount === 1 ? "" : "s"}`
        : "30-day access · company intelligence (no contractor reviews yet)";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amountPence,
            product_data: {
              name: `CIX company risk report — ${companyLabel}`,
              description,
            },
          },
        },
      ],
      // VAT: enable Stripe Tax in the dashboard, then set
      // STRIPE_AUTOMATIC_TAX=true on Vercel to add VAT at checkout.
      ...(process.env.STRIPE_AUTOMATIC_TAX === "true"
        ? { automatic_tax: { enabled: true } }
        : {}),
      customer_email: user.email,
      metadata: {
        userId: user.id,
        companiesHouseNumber: number,
        tier,
      },
      success_url: `${origin}/company/${encodeURIComponent(number)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/company/${encodeURIComponent(number)}`,
    });

    if (!session.url) {
      return { ok: false, error: "Could not start checkout. Please try again." };
    }

    await createPendingAccess({
      userId: user.id,
      companiesHouseNumber: number,
      tier,
      amountPence,
      stripeSessionId: session.id,
    });

    return { ok: true, url: session.url };
  } catch (error) {
    console.error("Failed to create report checkout", error);
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
}

/**
 * Success-redirect fallback: verifies the session directly with Stripe and
 * grants access if paid and owned by this user. The webhook is the primary
 * path; this covers webhook delays so the buyer sees the report immediately.
 */
export async function confirmCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  if (!isStripeConfigured || !sessionId) return;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== userId) return;
    await grantAccessFromSession(session);
  } catch (error) {
    console.error("Failed to confirm checkout session", error);
  }
}
