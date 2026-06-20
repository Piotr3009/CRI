/** Small, dependency-free display helpers. */

/** Render a 0–10 score as e.g. "3.2/10". */
export function formatScore(score: number): string {
  return `${score.toFixed(1)}/10`;
}

/**
 * Public-safe postcode prefix (outward code only), e.g. "SW19 5AB" -> "SW19".
 * Used so a residential exact postcode is never shown publicly.
 */
export function postcodePrefix(postcode?: string | null): string | null {
  if (!postcode) return null;
  const trimmed = postcode.trim();
  if (!trimmed) return null;
  const outward = trimmed.split(/\s+/)[0];
  return outward.toUpperCase();
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrencyGBP(amount?: number | null): string | null {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Collapse a residential full name to initials, e.g. "Chris Adams" -> "C.A." */
export function toInitials(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((p) => `${p[0]!.toUpperCase()}.`).join("");
}
