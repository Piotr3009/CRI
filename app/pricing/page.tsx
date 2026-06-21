import type { Metadata } from "next";
import { PricingCards } from "@/components/PricingCards";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple plans for UK contractors. Submit reports for free, or upgrade for deeper verified risk reports, watchlists and alerts. Payments coming soon.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Plans for contractors and teams
        </h1>
        <p className="mt-3 text-cri-steel">
          Start free. Upgrade for deeper verified reports, restricted residential
          risk details where legally permitted, watchlists and risk alerts.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-cri-amber/40 bg-cri-amber-light px-3 py-1 text-xs font-medium text-cri-amber-dark">
          Payments coming soon
        </p>
      </div>

      <div className="mt-10">
        <PricingCards />
      </div>

      <p className="mt-8 text-center text-xs text-cri-steel">
        Prices shown in GBP. Billing is not yet enabled in this MVP.
      </p>
    </div>
  );
}
