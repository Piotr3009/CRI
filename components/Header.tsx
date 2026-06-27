import Link from "next/link";
import { ShieldIcon, ArrowRightIcon } from "./Icons";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/search", label: "Search Risk" },
  { href: "/submit-report", label: "Submit Report" },
  { href: "/pricing", label: "Pricing" },
  { href: "/legal", label: "Legal" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cri-green text-white">
        <ShieldIcon className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-tight text-cri-charcoal">
          CIX
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-wider text-cri-steel">
          Construction Information Exchange
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cri-border bg-cri-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cri-charcoal transition-colors hover:text-cri-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link href="/pricing" className="btn-primary">
            Join as Verified Contractor
          </Link>
        </div>

        {/* Mobile menu (JS-free disclosure) */}
        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-cri-border bg-white text-cri-charcoal [&::-webkit-details-marker]:hidden">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-xl border border-cri-border bg-white p-2 shadow-card-hover">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-cri-charcoal hover:bg-cri-bg"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-cri-green px-3 py-2 text-sm font-semibold text-white"
            >
              Join as Verified Contractor
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
