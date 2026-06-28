/**
 * Server-side Companies House company profile fetch (facts for the Level-2
 * report: status, age, overdue filings, previous names, registered address).
 * The API key never leaves the server. Returns null on any failure so the
 * report can degrade gracefully ("company facts unavailable").
 */

export type CompanyFacts = {
  name: string;
  number: string;
  status: string; // raw, e.g. "active", "dissolved", "liquidation"
  statusLabel: string; // humanised, e.g. "In liquidation"
  incorporatedOn: string | null; // ISO date
  ageYears: number | null;
  accountsOverdue: boolean;
  confirmationOverdue: boolean;
  previousNames: string[];
  registeredAddress: string | null;
};

function humaniseStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Active",
    dissolved: "Dissolved",
    liquidation: "In liquidation",
    administration: "In administration",
    "voluntary-arrangement": "Voluntary arrangement",
    "converted-closed": "Converted / closed",
    "insolvency-proceedings": "Insolvency proceedings",
    receivership: "In receivership",
  };
  if (map[status]) return map[status];
  // Fallback: turn "some-status" into "Some status".
  return status
    .split("-")
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function isOverdue(nextDue: string | undefined): boolean {
  if (!nextDue) return false;
  const due = new Date(nextDue);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

function yearsSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
}

export async function getCompanyProfile(
  number: string,
): Promise<CompanyFacts | null> {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/company/${encodeURIComponent(
        number,
      )}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const d = (await res.json()) as {
      company_name?: string;
      company_number?: string;
      company_status?: string;
      date_of_creation?: string;
      accounts?: { next_due?: string; overdue?: boolean };
      confirmation_statement?: { next_due?: string; overdue?: boolean };
      previous_company_names?: Array<{ name?: string }>;
      registered_office_address?: {
        address_line_1?: string;
        address_line_2?: string;
        locality?: string;
        region?: string;
        postal_code?: string;
        country?: string;
      };
    };

    const status = d.company_status ?? "unknown";
    const incorporatedOn = d.date_of_creation ?? null;

    const a = d.registered_office_address;
    const registeredAddress = a
      ? [a.address_line_1, a.locality, a.postal_code].filter(Boolean).join(", ") ||
        null
      : null;

    return {
      name: d.company_name ?? `Company ${number}`,
      number: d.company_number ?? number,
      status,
      statusLabel: humaniseStatus(status),
      incorporatedOn,
      ageYears: yearsSince(incorporatedOn),
      accountsOverdue:
        typeof d.accounts?.overdue === "boolean"
          ? d.accounts.overdue
          : isOverdue(d.accounts?.next_due),
      confirmationOverdue:
        typeof d.confirmation_statement?.overdue === "boolean"
          ? d.confirmation_statement.overdue
          : isOverdue(d.confirmation_statement?.next_due),
      previousNames: (d.previous_company_names ?? [])
        .map((p) => p.name)
        .filter((n): n is string => Boolean(n)),
      registeredAddress,
    };
  } catch {
    return null;
  }
}
