import type { Metadata } from "next";
import { SubmitReportForm } from "@/components/SubmitReportForm";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

export const metadata: Metadata = {
  title: "Submit a Construction Risk Report",
  description:
    "Submit an evidence-backed, moderated construction risk report. Reports default to pending and are reviewed before any publication.",
};

export default function SubmitReportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
          Submit Report
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
          Submit a construction risk report
        </h1>
        <p className="mt-3 text-cri-steel">
          Share your real, first-hand business experience. Reports are moderated
          before publication, sensitive residential data is restricted, and the
          entity has a right to reply.
        </p>
      </div>

      <div className="mt-6">
        <LegalDisclaimer />
      </div>

      <div className="mt-8">
        <SubmitReportForm />
      </div>
    </div>
  );
}
