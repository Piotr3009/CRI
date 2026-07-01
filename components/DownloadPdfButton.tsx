"use client";

/**
 * Opens the browser's print dialog for the current report. Every modern
 * browser (desktop and mobile) offers "Save as PDF" there, which produces a
 * pixel-faithful copy of the on-screen report. Hidden in the printout itself.
 */
export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-cri-border bg-white px-3 py-1.5 text-sm font-semibold text-cri-charcoal transition-colors hover:border-cri-green hover:text-cri-green print:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      Download PDF
    </button>
  );
}
