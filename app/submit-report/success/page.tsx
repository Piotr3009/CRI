import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheckIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Report submitted",
  robots: { index: false, follow: false },
};

export default function SubmitSuccessPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <div className="card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cri-green/10 text-cri-green">
          <ShieldCheckIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-cri-charcoal">
          Report submitted for moderation
        </h1>
        <p className="mt-3 text-cri-steel">
          Your report has been submitted for moderation. It will not be published
          until reviewed. Our team may contact you to request supporting
          evidence.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/search" className="btn-primary">
            Search the risk database
          </Link>
          <Link href="/submit-report" className="btn-secondary">
            Submit another report
          </Link>
        </div>
      </div>
    </div>
  );
}
