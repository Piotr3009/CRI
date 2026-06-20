import { CheckIcon } from "./Icons";

type Plan = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "£0",
    description: "Get started and contribute to the risk database.",
    features: ["Submit reports", "Basic search", "Limited public risk view"],
  },
  {
    name: "Verified Contractor",
    price: "£29",
    cadence: "/month",
    description: "For individual contractors who price jobs regularly.",
    highlighted: true,
    features: [
      "View deeper verified reports",
      "Access restricted residential risk details where legally permitted",
      "Save a watchlist",
      "Submit evidence",
      "Receive risk alerts",
    ],
  },
  {
    name: "Company",
    price: "£99",
    cadence: "/month",
    description: "For teams running multiple projects and tenders.",
    features: [
      "Multiple users",
      "Advanced search",
      "Company dashboard",
      "Project risk checks",
      "Priority moderation",
    ],
  },
];

export function PricingCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-card ${
            plan.highlighted
              ? "border-cri-green ring-1 ring-cri-green"
              : "border-cri-border"
          }`}
        >
          {plan.highlighted ? (
            <span className="absolute -top-3 left-6 rounded-full bg-cri-green px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
          ) : null}

          <h3 className="text-lg font-semibold text-cri-charcoal">
            {plan.name}
          </h3>
          <p className="mt-1 text-sm text-cri-steel">{plan.description}</p>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-cri-charcoal">
              {plan.price}
            </span>
            {plan.cadence ? (
              <span className="text-sm text-cri-steel">{plan.cadence}</span>
            ) : null}
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm text-cri-charcoal">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cri-green" />
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-lg border border-cri-border bg-cri-bg px-5 py-2.5 text-sm font-semibold text-cri-steel"
            title="Payments coming soon"
          >
            Payments coming soon
          </button>
        </div>
      ))}
    </div>
  );
}
