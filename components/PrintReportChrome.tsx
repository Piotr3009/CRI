import { formatDate } from "@/lib/format";

/**
 * Print-only report header: appears at the top of the saved PDF, invisible on
 * screen. Identifies the document, the company, when it was generated and who
 * it was prepared for.
 */
export function PrintReportHeader({
  companyName,
  companyNumber,
  preparedFor,
}: {
  companyName: string;
  companyNumber: string;
  preparedFor?: string | null;
}) {
  return (
    <div className="mb-4 hidden border-b-2 border-cri-green pb-3 print:block">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-bold text-cri-charcoal">
          CIX — Company Risk Report
        </p>
        <p className="text-xs text-cri-steel">cixcheck.com</p>
      </div>
      <p className="mt-1 text-sm text-cri-charcoal">
        {companyName} · Company no. {companyNumber}
      </p>
      <p className="mt-0.5 text-xs text-cri-steel">
        Generated {formatDate(new Date())}
        {preparedFor ? ` · Prepared for ${preparedFor}` : ""}
      </p>
    </div>
  );
}

/**
 * Print-only legal footer: closes the saved PDF with the standard CIX
 * disclaimer. Invisible on screen.
 */
export function PrintReportFooter() {
  return (
    <div className="mt-4 hidden border-t border-cri-border pt-3 print:block">
      <p className="text-[10px] leading-relaxed text-cri-steel">
        CIX reports are based on contractor-submitted experiences and moderated
        evidence combined with Companies House public data. Reports indicate
        risk patterns, not legal findings. Access is licensed to the purchaser
        for internal business use. &copy; CIX &middot; cixcheck.com
      </p>
    </div>
  );
}
