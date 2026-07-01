import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { RiskBadge } from "@/components/RiskBadge";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import {
  UsersIcon,
  PoundIcon,
  ClipboardIcon,
  ScaleIcon,
  ChartIcon,
  ShieldCheckIcon,
  AlertIcon,
  SearchIcon,
} from "@/components/Icons";

const TRACKS = [
  {
    icon: UsersIcon,
    title: "Client Risk",
    text: "How a client behaves through a project — decision-making, fairness and reliability.",
  },
  {
    icon: PoundIcon,
    title: "Payment Behaviour",
    text: "Patterns around on-time payment, retentions, delays and unpaid balances.",
  },
  {
    icon: ClipboardIcon,
    title: "PM Risk",
    text: "Project management quality — instructions, sign-offs, scheduling and coordination.",
  },
  {
    icon: ScaleIcon,
    title: "QS Risk",
    text: "Quantity surveying fairness — valuations, deductions and contract administration.",
  },
  {
    icon: ChartIcon,
    title: "Project Risk",
    text: "Overall delivery risk — variations, scope creep and the likelihood of disputes.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Evidence Level",
    text: "How well a report is supported — from basic notes to documented, verified evidence.",
  },
];

const PROBLEMS = [
  "Late payments destroy cash flow.",
  "Poor QS decisions kill profit.",
  "Slow communication delays projects.",
  "Unapproved extras become disputes.",
  "Contractors usually find out too late.",
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* C. Problem section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-cri-charcoal">
                Clients check contractors. Contractors should check clients too.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-cri-steel">
                Late payments, poor communication, unfair QS decisions and
                unapproved extras can destroy profit before a project even
                starts.
              </p>
              <p className="mt-3 text-lg leading-relaxed text-cri-steel">
                Construction loses more companies to insolvency than any other
                UK sector — around 4,000 firms a year — and late payment is
                the most common trigger.
              </p>
            </div>
            <ul className="space-y-3">
              {PROBLEMS.map((problem) => (
                <li
                  key={problem}
                  className="flex items-center gap-3 rounded-lg border border-cri-border bg-white p-4 shadow-card"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cri-amber-light text-cri-amber-dark">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-cri-charcoal">
                    {problem}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto mt-14 max-w-3xl border-t border-cri-border pt-10 text-center">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-cri-charcoal sm:text-3xl">
              Every contractor learns the same lesson separately.{" "}
              <span className="text-cri-green">
                CIX helps the industry learn together.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* D. What CIX tracks */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
              What CIX tracks
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
              Six dimensions of project risk
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              return (
                <div key={track.title} className="card p-5 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cri-green/10 text-cri-green">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold text-cri-charcoal">
                    {track.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cri-steel">
                    {track.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* F. How It Works */}
      <HowItWorksSection />

      {/* G. Example Risk Report */}
      <section id="example-report" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
              Example risk report
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
              What a moderated report looks like
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="card overflow-hidden shadow-card">
                <div className="flex items-center justify-between border-b border-cri-border bg-cri-bg px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cri-steel">
                      Main Contractor
                    </p>
                    <p className="text-lg font-bold text-cri-charcoal">
                      Northline Build Group Ltd
                    </p>
                  </div>
                  <EvidenceBadge status="BASIC_EVIDENCE" />
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <RiskScoreCard label="Payment Score" score={2.8} />
                  <RiskScoreCard label="Behaviour" score={4.1} />
                </div>

                <div className="flex flex-wrap gap-2 px-5">
                  <RiskBadge level="HIGH" label="Overall Risk" />
                  <RiskBadge level="HIGH" label="Variation Risk" />
                  <RiskBadge level="MEDIUM" label="Dispute Risk" />
                </div>

                <div className="mx-5 mt-4 flex items-start gap-3 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/5 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#C0392B]/10 text-[#C0392B]">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#C0392B]">
                      Abandoned invoices
                    </p>
                    <p className="text-xs text-cri-steel">
                      2 reported · £46,500 unpaid for over 60 days
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
                  <div>
                    <dt className="text-cri-steel">Company No.</dt>
                    <dd className="font-medium text-cri-charcoal">09421765</dd>
                  </div>
                  <div>
                    <dt className="text-cri-steel">Region</dt>
                    <dd className="font-medium text-cri-charcoal">
                      Manchester
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cri-steel">Avg payment delay</dt>
                    <dd className="font-medium text-cri-charcoal">24 days</dd>
                  </div>
                  <div>
                    <dt className="text-cri-steel">Retention returned</dt>
                    <dd className="font-medium text-cri-charcoal">
                      Not returned · 1 of 4
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cri-steel">Court / formal dispute</dt>
                    <dd className="font-medium text-cri-charcoal">
                      1 of 4 reports
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cri-steel">Total contract value</dt>
                    <dd className="font-medium text-cri-charcoal">£2.4m</dd>
                  </div>
                </dl>

                <div className="border-t border-cri-border px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cri-steel">
                    Public Summary
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-cri-charcoal">
                    &ldquo;Subcontractors report late payment, deductions that
                    were not agreed, and extra work requested before costs were
                    approved.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card h-full p-6 shadow-card">
                <h3 className="font-semibold text-cri-charcoal">
                  How to read this
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cri-steel">
                  Scores summarise what subcontractors reported: payment gauges
                  are built from real invoice delays, behaviour from contract
                  conduct. Two or more abandoned invoices with a low payment
                  score force the overall risk to High &mdash; and the evidence
                  badge shows how well the reports are supported.
                </p>
                <div className="mt-5">
                  <LegalDisclaimer variant="compact" />
                </div>
                <p className="mt-4 text-xs text-cri-steel">
                  Example only. Fictional data for illustration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* G2. Why report — reciprocity, phoenix, positive reports */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-cri-charcoal">
              Warn others — and others will warn you.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-cri-steel">
              Every project teaches you something about a client: who pays on
              time, who buries you in unapproved extras, who keeps their word.
              Right now that knowledge dies with the project. Share it &mdash;
              the next contractor won&rsquo;t walk into the same trap, and
              someone else&rsquo;s report may save you from yours.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-xl border border-cri-border bg-white p-5 text-left shadow-card">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cri-amber-light text-cri-amber-dark">
              <UsersIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-cri-charcoal">
                Changed the company name, left the debts behind?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-cri-steel">
                CIX links directors to their dissolved and liquidated companies
                &mdash; so a &ldquo;brand-new&rdquo; firm with an old track
                record can&rsquo;t hide it.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-cri-steel">
              And report the good ones too. A client who pays in 14 days
              deserves to be found. Good payers win better subcontractors, good
              subcontractors win better clients &mdash; that&rsquo;s how the
              industry gets fairer, one honest report at a time.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/submit-report"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cri-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cri-green-dark"
              >
                Submit your first report
              </Link>
              <a
                href="#example-report"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cri-border bg-white px-5 py-2.5 text-sm font-semibold text-cri-charcoal transition-colors hover:bg-cri-bg"
              >
                See a sample report
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* H. CTA section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl bg-cri-green px-6 py-12 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white">
              Before you take the job, check the risk.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-cri-green hover:bg-cri-bg"
              >
                <SearchIcon className="h-4 w-4" />
                Search Risk Database
              </Link>
              <Link
                href="/submit-report"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Submit Your First Report
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}