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
  hasInsolvencyHistory: boolean;
  hasCharges: boolean;
  companyType: string; // raw, e.g. "ltd", "plc", "llp"
  companyTypeLabel: string;
  sicLabels: string[]; // e.g. "43320 — Joinery installation" (or raw code if unknown)
  incorporatedOn: string | null; // ISO date
  ageYears: number | null;
  accountsOverdue: boolean;
  accountsNextDue: string | null; // ISO date
  confirmationOverdue: boolean;
  previousNames: string[];
  registeredAddress: string | null;
};

// Construction-relevant SIC 2007 codes (divisions 41–43). Anything outside this
// set is shown as its raw code — still tells the buyer it's NOT a typical
// construction activity.
const SIC_LABELS: Record<string, string> = {
  "41100": "Development of building projects",
  "41201": "Construction of commercial buildings",
  "41202": "Construction of domestic buildings",
  "42110": "Construction of roads and motorways",
  "42120": "Construction of railways and underground railways",
  "42130": "Construction of bridges and tunnels",
  "42210": "Construction of utility projects for fluids",
  "42220": "Construction of utility projects for electricity and telecoms",
  "42910": "Construction of water projects",
  "42990": "Construction of other civil engineering projects n.e.c.",
  "43110": "Demolition",
  "43120": "Site preparation",
  "43130": "Test drilling and boring",
  "43210": "Electrical installation",
  "43220": "Plumbing, heat and air-conditioning installation",
  "43290": "Other construction installation",
  "43310": "Plastering",
  "43320": "Joinery installation",
  "43330": "Floor and wall covering",
  "43341": "Painting",
  "43342": "Glazing",
  "43390": "Other building completion and finishing",
  "43910": "Roofing activities",
  "43991": "Scaffold erection",
  "43999": "Other specialised construction activities n.e.c.",
};

const COMPANY_TYPE_LABELS: Record<string, string> = {
  ltd: "Private limited (Ltd)",
  plc: "Public limited (PLC)",
  llp: "Limited liability partnership (LLP)",
  "private-unlimited": "Private unlimited",
  "private-limited-guarant-nsc": "Private limited by guarantee",
  "private-limited-guarant-nsc-limited-exemption": "Private limited by guarantee",
  "limited-partnership": "Limited partnership (LP)",
  "old-public-company": "Old public company",
  "community-interest-company": "Community interest company (CIC)",
};

function sicLabel(code: string): string {
  return SIC_LABELS[code] ? `${code} — ${SIC_LABELS[code]}` : code;
}

function companyTypeLabel(type: string): string {
  if (COMPANY_TYPE_LABELS[type]) return COMPANY_TYPE_LABELS[type];
  return type
    ? type.split("-").join(" ").replace(/^./, (c) => c.toUpperCase())
    : "—";
}

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
      type?: string;
      has_insolvency_history?: boolean;
      has_charges?: boolean;
      sic_codes?: string[];
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
      hasInsolvencyHistory: Boolean(d.has_insolvency_history),
      hasCharges: Boolean(d.has_charges),
      companyType: d.type ?? "",
      companyTypeLabel: companyTypeLabel(d.type ?? ""),
      sicLabels: (d.sic_codes ?? []).map(sicLabel),
      incorporatedOn,
      ageYears: yearsSince(incorporatedOn),
      accountsOverdue:
        typeof d.accounts?.overdue === "boolean"
          ? d.accounts.overdue
          : isOverdue(d.accounts?.next_due),
      accountsNextDue: d.accounts?.next_due ?? null,
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
