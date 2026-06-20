import { AlertIcon } from "./Icons";

/**
 * Standard, legally-careful disclaimer shown alongside reports and examples.
 * Wording deliberately avoids any finding of wrongdoing.
 */
export function LegalDisclaimer({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <div
      className={`flex gap-3 rounded-lg border border-cri-border bg-cri-bg p-4 ${className}`}
    >
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-cri-steel" />
      <p className="text-xs leading-relaxed text-cri-steel">
        {variant === "compact" ? (
          <>
            CRI reports are based on contractor-submitted experiences and
            moderated evidence. Reports indicate risk patterns, not legal
            findings.
          </>
        ) : (
          <>
            CRI reports indicate contractor-submitted risk patterns and moderated
            experiences. CRI does not make legal findings of wrongdoing. Scores
            and risk levels reflect a contractor&rsquo;s reported experience and
            CRI&rsquo;s moderation, and may be subject to a right to reply,
            correction or removal. This information is provided to help assess
            risk and is not legal advice.
          </>
        )}
      </p>
    </div>
  );
}
