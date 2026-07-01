import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { grantAccessFromSession } from "@/lib/purchases";

/**
 * Stripe webhook — primary path for granting report access after payment.
 * Configure in the Stripe dashboard: endpoint {site}/api/stripe/webhook,
 * event `checkout.session.completed`, and put the signing secret in
 * STRIPE_WEBHOOK_SECRET on Vercel.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured || !webhookSecret) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  // Raw body is required for signature verification — do not JSON-parse first.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await grantAccessFromSession(session);
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
