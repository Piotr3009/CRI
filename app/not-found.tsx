import Link from "next/link";
import { ShieldIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cri-green/10 text-cri-green">
        <ShieldIcon className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-cri-charcoal">
        Page not found
      </h1>
      <p className="mt-3 text-cri-steel">
        This page may have moved, or the report is not publicly available. Only
        moderated, approved reports can be viewed publicly.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/search" className="btn-secondary">
          Search the risk database
        </Link>
      </div>
    </div>
  );
}
