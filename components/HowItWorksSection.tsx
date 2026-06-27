import { ClipboardIcon, ShieldCheckIcon, ChartIcon, LockIcon } from "./Icons";

const STEPS = [
  {
    n: 1,
    title: "Contractor submits report",
    text: "A verified contractor records their real business experience on a project.",
  },
  {
    n: 2,
    title: "Evidence is uploaded or requested",
    text: "Supporting evidence is attached, or requested during moderation.",
  },
  {
    n: 3,
    title: "CIX moderates the report",
    text: "Each report is reviewed before publication — nothing goes live automatically.",
  },
  {
    n: 4,
    title: "Risk score is calculated",
    text: "Payment, communication, variation and dispute risk form an overall picture.",
  },
  {
    n: 5,
    title: "Sensitive personal data is restricted",
    text: "Residential names and exact addresses are never published publicly.",
  },
  {
    n: 6,
    title: "Verified contractors access deeper reports",
    text: "Restricted detail is available to verified contractors where legally appropriate.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
            Moderated, evidence-led, privacy-first
          </h2>
          <p className="mt-3 text-cri-steel">
            Every report follows the same governed process before it can be seen.
          </p>
        </div>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="card relative p-5 shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cri-green/10 text-sm font-bold text-cri-green">
                {step.n}
              </span>
              <h3 className="mt-3 font-semibold text-cri-charcoal">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cri-steel">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cri-steel">
          <span className="inline-flex items-center gap-2">
            <ClipboardIcon className="h-4 w-4 text-cri-green" /> Contractor-submitted
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-cri-green" /> Moderated
          </span>
          <span className="inline-flex items-center gap-2">
            <ChartIcon className="h-4 w-4 text-cri-green" /> Risk-scored
          </span>
          <span className="inline-flex items-center gap-2">
            <LockIcon className="h-4 w-4 text-cri-green" /> Restricted visibility
          </span>
        </div>
      </div>
    </section>
  );
}
