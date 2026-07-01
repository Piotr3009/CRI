import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

/** True only when the Stripe secret key is present (server env). */
export const isStripeConfigured = Boolean(secretKey);

/**
 * Stripe server client. SERVER ONLY — the secret key must never reach the
 * browser. Throws when the key is missing; callers should check
 * `isStripeConfigured` first and degrade gracefully.
 */
export function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(secretKey);
}
