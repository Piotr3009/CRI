"use client";

import { useState } from "react";
import { createEvidenceDownloadUrl } from "@/app/admin/actions";

/**
 * Admin-only download button. On click it asks the server for a short-lived
 * signed URL (the bucket is private) and navigates the browser to it, which
 * triggers a download.
 */
export function EvidenceDownloadButton({ evidenceId }: { evidenceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await createEvidenceDownloadUrl(evidenceId);
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setError(res.error);
      }
    } catch {
      setError("Download failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-cri-border bg-white px-3 py-1.5 text-xs font-semibold text-cri-charcoal transition-colors hover:border-cri-green hover:text-cri-green disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Download"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
