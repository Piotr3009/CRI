/**
 * Company "atom" — connected-companies graph for phoenixing detection.
 *
 * Core  = this company's ACTIVE officers (directors), with owners (active PSC)
 *         flagged via a name + date-of-birth match.
 * Electrons = each (non-nominee) person's OTHER companies, INCLUDING dissolved
 *         ones (a trail of dead companies behind an owner is the signal).
 *
 * Depth is 1 (we do not recurse into the connected companies' people).
 *
 * Companies House only lets you search appointments by OFFICER, not by PSC, so
 * we start from the company's officers (which carry an officer id) and use the
 * PSC list only to annotate which officers are real owners.
 *
 * Tuning knobs (safe to change):
 */
export const NOMINEE_APPOINTMENTS_THRESHOLD = 20; // >this ⇒ likely a professional/nominee director
export const MAX_OFFICERS_EXPANDED = 6; // cap people we expand (each now costs a search + several fetches)
export const MAX_RECORDS_PER_PERSON = 4; // CH stores a person under several officer records (by address); merge up to this many

export type AtomPerson = {
  name: string;
  dob: string; // "m/yyyy" or ""
  role: string;
  isOwner: boolean;
  expanded: boolean; // false ⇒ nominee/cap, electrons not pulled
  appointmentsTotal: number;
};

export type AtomCompany = {
  name: string;
  number: string;
  status: string;
  statusLabel: string;
  viaOwner: boolean; // linked via at least one owner of this company
  people: string[]; // names of THIS company's people who link to it
};

export type CompanyAtom = {
  core: AtomPerson[];
  connected: AtomCompany[];
  truncated: boolean; // more officers than we expanded
};

// ---- helpers (pure) --------------------------------------------------------

const TITLES = new Set([
  "MR",
  "MRS",
  "MS",
  "MISS",
  "DR",
  "PROF",
  "SIR",
  "DAME",
  "LORD",
  "LADY",
  "REV",
  "MX",
]);

/** Order-independent, title-stripped name key for matching across CH formats. */
export function normName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !TITLES.has(t))
    .sort()
    .join(" ");
}

function samePerson(
  a: { name: string; dob: string },
  b: { name: string; dob: string },
): boolean {
  if (normName(a.name) !== normName(b.name)) return false;
  if (a.dob && b.dob) return a.dob === b.dob;
  return true; // name match, DOB unknown on one side
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  dissolved: "Dissolved",
  liquidation: "In liquidation",
  administration: "In administration",
  "voluntary-arrangement": "Voluntary arrangement",
  "converted-closed": "Converted / closed",
  "insolvency-proceedings": "Insolvency proceedings",
  receivership: "In receivership",
};
function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s.split("-").join(" ").replace(/^./, (c) => c.toUpperCase());
}
const DEAD = new Set([
  "dissolved",
  "liquidation",
  "administration",
  "insolvency-proceedings",
  "receivership",
  "voluntary-arrangement",
  "converted-closed",
]);

export type OfficerInput = { name: string; dob: string; role: string; officerId: string };
export type PscInput = { name: string; dob: string };
export type Expansion = {
  expanded: boolean;
  total: number;
  companies: Array<{ companyName: string; companyNumber: string; status: string }>;
};

/** Pure assembly — no I/O, fully unit-testable. */
export function assembleAtom(
  thisNumber: string,
  officers: OfficerInput[],
  pscList: PscInput[],
  expansions: Record<string, Expansion>,
  truncated: boolean,
): CompanyAtom {
  const core: AtomPerson[] = officers.map((o) => {
    const exp = expansions[o.officerId];
    return {
      name: o.name,
      dob: o.dob,
      role: o.role,
      isOwner: pscList.some((p) => samePerson(o, p)),
      expanded: exp ? exp.expanded : false,
      appointmentsTotal: exp ? exp.total : 0,
    };
  });

  const byNumber = new Map<string, AtomCompany>();
  for (const o of officers) {
    const exp = expansions[o.officerId];
    if (!exp || !exp.expanded) continue;
    const ownerLink = pscList.some((p) => samePerson(o, p));
    for (const c of exp.companies) {
      if (!c.companyNumber || c.companyNumber === thisNumber) continue;
      const existing = byNumber.get(c.companyNumber);
      if (existing) {
        if (!existing.people.includes(o.name)) existing.people.push(o.name);
        existing.viaOwner = existing.viaOwner || ownerLink;
      } else {
        byNumber.set(c.companyNumber, {
          name: c.companyName,
          number: c.companyNumber,
          status: c.status,
          statusLabel: statusLabel(c.status),
          viaOwner: ownerLink,
          people: [o.name],
        });
      }
    }
  }

  const connected = Array.from(byNumber.values());
  connected.sort((a, b) => strength(b) - strength(a));

  return { core, connected, truncated };
}

function strength(c: AtomCompany): number {
  return (c.viaOwner ? 2 : 0) + (DEAD.has(c.status) ? 1 : 0) + (c.people.length - 1);
}

// ---- CH orchestration (I/O) ------------------------------------------------

function extractOfficerId(appointmentsPath: string): string {
  // "/officers/{id}/appointments" -> "{id}"
  const parts = appointmentsPath.split("/").filter(Boolean);
  return parts[1] ?? "";
}

export async function buildCompanyAtom(number: string): Promise<CompanyAtom | null> {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return null;
  const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`;

  async function chGet(path: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`https://api.company-information.service.gov.uk${path}`, {
        headers: { Authorization: auth },
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  const [officersRaw, pscRaw] = await Promise.all([
    chGet(`/company/${encodeURIComponent(number)}/officers?items_per_page=35`),
    chGet(`/company/${encodeURIComponent(number)}/persons-with-significant-control?items_per_page=25`),
  ]);
  if (!officersRaw) return null;

  type OfficerItem = {
    name?: string;
    officer_role?: string;
    resigned_on?: string;
    date_of_birth?: { month?: number; year?: number };
    links?: { officer?: { appointments?: string } };
  };
  type PscItem = {
    name?: string;
    ceased?: boolean;
    ceased_on?: string;
    date_of_birth?: { month?: number; year?: number };
  };

  const dob = (d?: { month?: number; year?: number }) =>
    d?.year ? `${d.month ?? ""}/${d.year}` : "";

  const officers: OfficerInput[] = ((officersRaw.items as OfficerItem[]) ?? [])
    .filter((o) => !o.resigned_on)
    .map((o) => ({
      name: o.name ?? "",
      dob: dob(o.date_of_birth),
      role: o.officer_role ?? "",
      officerId: extractOfficerId(o.links?.officer?.appointments ?? ""),
    }))
    .filter((o) => o.name && o.officerId);

  const pscList: PscInput[] = ((pscRaw?.items as PscItem[]) ?? [])
    .filter((p) => !p.ceased_on && p.ceased !== true)
    .map((p) => ({ name: p.name ?? "", dob: dob(p.date_of_birth) }));

  const toExpand = officers.slice(0, MAX_OFFICERS_EXPANDED);
  const truncated = officers.length > MAX_OFFICERS_EXPANDED;

  type ApptItem = {
    appointed_to?: { company_name?: string; company_number?: string; company_status?: string };
  };
  type OfficerSearchItem = {
    title?: string;
    date_of_birth?: { month?: number; year?: number };
    links?: { self?: string };
  };

  const results = await Promise.all(
    toExpand.map(async (o) => {
      // CH keeps a person under SEVERAL officer records (one per correspondence
      // address used over time). The record on this company only lists the
      // companies registered with that same address — older/dissolved companies
      // sit under other records. So search the person by name and merge the
      // appointments from every record that matches on name + date of birth.
      const search = await chGet(
        `/search/officers?q=${encodeURIComponent(o.name)}&items_per_page=20`,
      );
      const matchedIds = ((search?.items as OfficerSearchItem[]) ?? [])
        .filter((it) => it.title && it.links?.self)
        .filter(
          (it) =>
            normName(it.title as string) === normName(o.name) &&
            (() => {
              const d = dob(it.date_of_birth);
              return !o.dob || !d || d === o.dob;
            })(),
        )
        .map((it) => extractOfficerId(it.links!.self as string))
        .filter(Boolean);

      const ids = Array.from(new Set([o.officerId, ...matchedIds])).slice(
        0,
        MAX_RECORDS_PER_PERSON,
      );

      const apptLists = await Promise.all(
        ids.map((id) =>
          chGet(`/officers/${encodeURIComponent(id)}/appointments?items_per_page=50`),
        ),
      );

      const seen = new Set<string>();
      const companies: Array<{ companyName: string; companyNumber: string; status: string }> = [];
      for (const appts of apptLists) {
        for (const it of (appts?.items as ApptItem[]) ?? []) {
          const num = it.appointed_to?.company_number;
          if (!num || seen.has(num)) continue;
          seen.add(num);
          companies.push({
            companyName: it.appointed_to!.company_name ?? "",
            companyNumber: num,
            status: it.appointed_to!.company_status ?? "active",
          });
        }
      }

      const total = companies.length; // unique companies for this person
      if (total > NOMINEE_APPOINTMENTS_THRESHOLD) {
        return { id: o.officerId, exp: { expanded: false, total, companies: [] } as Expansion };
      }
      return { id: o.officerId, exp: { expanded: true, total, companies } as Expansion };
    }),
  );

  const expansions: Record<string, Expansion> = {};
  for (const r of results) expansions[r.id] = r.exp;

  return assembleAtom(number, officers, pscList, expansions, truncated);
}
