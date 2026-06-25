import Link from "next/link";
import { DashboardPreview } from "./DashboardPreview";
import { SearchIcon, ClipboardIcon, ShieldCheckIcon } from "./Icons";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-cri-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cri-border bg-white px-3 py-1 text-xs font-medium text-cri-steel">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-cri-green" />
            Professional construction risk intelligence — not a blacklist
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-cri-charcoal sm:text-5xl">
            Know the risk before you price the job.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-cri-steel">
            CRI helps UK contractors check payment, client, main contractor,
            developer, PM, QS and project risk before accepting work.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className="btn-primary gap-2">
              <SearchIcon className="h-4 w-4" />
              Search Risk Database
            </Link>
            <Link href="/submit-report" className="btn-secondary gap-2">
              <ClipboardIcon className="h-4 w-4" />
              Submit Risk Report
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-cri-border pt-6">
            <div>
              <dt className="text-xs text-cri-steel">Evidence-backed</dt>
              <dd className="text-sm font-semibold text-cri-charcoal">
                Moderated reports
              </dd>
            </div>
            <div>
              <dt className="text-xs text-cri-steel">Privacy-first</dt>
              <dd className="text-sm font-semibold text-cri-charcoal">
                Restricted data
              </dd>
            </div>
            <div>
              <dt className="text-xs text-cri-steel">Right to reply</dt>
              <dd className="text-sm font-semibold text-cri-charcoal">
                Built in
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-center lg:justify-end">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}