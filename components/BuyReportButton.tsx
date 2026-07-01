"use client";

import { useState } from "react";
import { createReportCheckout } from "@/app/company/[number]/actions";

/** Starts Stripe Checkout for this company and redirects the browser to it. */
export function BuyReportButton({
  companyNumber,
  label,
}: {
  companyNumber: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await createReportCheckout(companyNumber);
      if (res.ok) {
        window.location.href = res.url;
        return;
      }
      setError(res.error);
    } catch {
      setError("Could not start checkout. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-cri-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cri-green-dark disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Opening secure checkout…" : label}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
