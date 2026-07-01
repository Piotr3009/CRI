import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/Icons";
import {
  PRICE_BASIC_PENCE,
  PRICE_WITH_REPORTS_PENCE,
  REPORT_ACCESS_DAYS,
  formatPricePence,
} from "@/lib/purchases";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay per company report. No subscription — one-off payment for 30-day access to a full construction risk report.",
};

const SHARED_FEATURES = [
  "Companies House intelligence: status, age, filing health, previous names",
  "Director connections — including dissolved and liquidated companies",
  `Full report access for ${REPORT_ACCESS_DAYS} days, updated as new reviews are approved`,
  "Secure one-off payment by Stripe — no subscription, no auto-renewal",
];

function Tier({
  name,
  price,
  tagline,
  highlight,
}: {
  name: string;
  price: string;
  tagline: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card flex h-full flex-col p-6 shadow-card ${
        highlight ? "border-2 border-cri-green" : ""
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-cri-steel">
        {name}
      </p>
      <p className="mt-3 text-4xl font-bold text-cri-charcoal">
        {price}
        <span className="text-base font-normal text-cri-steel"> + VAT</span>
      </p>
      <p className="mt-2 text-sm text-cri-steel">{tagline}</p>
      <ul className="mt-5 flex-1 space-y-2">
        {SHARED_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-cri-steel">
            <span className="mt-0.5 text-cri-green">
              <CheckIcon className="h-4 w-4" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/search"
        className={`mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
          highlight
            ? "bg-cri-green text-white hover:bg-cri-green-dark"
            : "border border-cri-border bg-white text-cri-charcoal hover:bg-cri-bg"
        }`}
      >
        Search a company
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Pay per report. No subscription.
        </h1>
        <p className="mt-3 text-cri-steel">
          One-off payment unlocks a company&rsquo;s full risk report for{" "}
          {REPORT_ACCESS_DAYS} days. The price depends on whether contractors
          have already reported on the company.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
        <Tier
          name="Company intelligence"
          price={formatPricePence(PRICE_BASIC_PENCE)}
          tagline="No contractor reviews yet — Companies House data and director connections."
        />
        <Tier
          name="Full risk report"
          price={formatPricePence(PRICE_WITH_REPORTS_PENCE)}
          tagline="Includes contractor reviews: payment, behaviour, variation and dispute scores."
          highlight
        />
      </div>

      <p className="mt-8 text-center text-xs text-cri-steel">
        Prices in GBP, excluding VAT. Submitting reports is free.
      </p>
    </div>
  );
}
