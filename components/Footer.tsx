import Link from "next/link";
import { ShieldIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-cri-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cri-green text-white">
                <ShieldIcon className="h-4 w-4" />
              </span>
              <span className="text-base font-bold text-cri-charcoal">CRI</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cri-steel">
              Construction Risk Intelligence. Evidence-backed client, payment and
              project risk reports for UK contractors. Know the risk before you
              price the job.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cri-charcoal">
              Platform
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-cri-steel">
              <li>
                <Link href="/search" className="hover:text-cri-green">
                  Search Risk
                </Link>
              </li>
              <li>
                <Link href="/submit-report" className="hover:text-cri-green">
                  Submit Report
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-cri-green">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-cri-green">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cri-charcoal">
              Governance
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-cri-steel">
              <li>
                <Link href="/legal" className="hover:text-cri-green">
                  Legal &amp; Data Protection
                </Link>
              </li>
              <li>
                <Link href="/legal#right-to-reply" className="hover:text-cri-green">
                  Right to Reply
                </Link>
              </li>
              <li>
                <Link href="/legal#removal" className="hover:text-cri-green">
                  Removal / Review Requests
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-cri-border pt-6">
          <p className="text-xs leading-relaxed text-cri-steel">
            CRI reports indicate contractor-submitted risk patterns and moderated
            experiences. CRI does not make legal findings of wrongdoing and is not
            a blacklist. This platform does not provide legal advice.
          </p>
          <p className="mt-3 text-xs text-cri-steel">
            © {new Date().getFullYear()} CRI — Construction Risk Intelligence.
            Demo / MVP build.
          </p>
        </div>
      </div>
    </footer>
  );
}
