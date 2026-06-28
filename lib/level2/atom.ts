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
export const MAX_OFFICERS_EXPANDED = 6; // cap people we expand (each costs a search + several fetches)
export const MAX_RECORDS_PER_PERSON = 12; // CH stores a person under MANY officer records; merge up to this many
export const MAX_TOTAL_APPOINTMENT_FETCHES = 30; // global ceiling on appointment lookups per atom
export const MAX_INSOLVENCY_CHECKS = 12; // cap profile lookups for insolvency history

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
  insolvent: boolean; // currently in an insolvency process OR has insolvency history
};

export type CompanyAtom = {
  core: AtomPerson[];
  connected: AtomCompany[];
  truncated: boolean; // more officers than we expanded
  insolvencyCount: number; // # connected companies that failed (insolvency) — the phoenix signal
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

function personTokens(name: string): Set<string> {
  return new Set(
    name
      .toUpperCase()
      .replace(/[.,]/g, " ")
      .split(/\s+/)
      .filter((t) => t && !TITLES.has(t)),
  );
}

/**
 * Match two person records across Companies House's inconsistent name formats.
 * The smaller token set must be fully contained in the larger (so "Piotr
 * Tarasek" matches "Piotr Jan Tarasek"), with at least 2 shared tokens, and the
 * date of birth must agree when both are present.
 */
function samePerson(
  a: { name: string; dob: string },
  b: { name: string; dob: string },
): boolean {
  const ta = personTokens(a.name);
  const tb = personTokens(b.name);
  if (ta.size === 0 || tb.size === 0) return false;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let shared = 0;
  for (const t of small) if (large.has(t)) shared++;
  if (shared !== small.size || small.size < 2) return false;
  if (a.dob && b.dob) return a.dob === b.dob;
  return true;
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

// Real insolvency processes — NOT plain "dissolved" (which is usually a normal,
// voluntary strike-off and not a warning on its own).
const INSOLVENCY_STATUSES = new Set([
  "liquidation",
  "administration",
  "receivership",
  "voluntary-arrangement",
  "insolvency-proceedings",
]);
function isInsolventStatus(status: string): boolean {
  return INSOLVENCY_STATUSES.has(status);
}

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
          insolvent: isInsolventStatus(c.status),
        });
      }
    }
  }

  const connected = Array.from(byNumber.values());
  connected.sort((a, b) => strength(b) - strength(a));

  const insolvencyCount = connected.filter((c) => c.insolvent).length;
  return { core, connected, truncated, insolvencyCount };
}

/**
 * Pure: OR in insolvency HISTORY (a company that failed then dissolved shows
 * status "dissolved", so current status alone misses it). `historyMap` maps a
 * company number to whether Companies House records an insolvency case for it.
 */
export function applyInsolvencyHistory(
  atom: CompanyAtom,
  historyMap: Record<string, boolean>,
): CompanyAtom {
  const connected = atom.connected.map((c) => ({
    ...c,
    insolvent: c.insolvent || historyMap[c.number] === true,
  }));
  connected.sort((a, b) => strength(b) - strength(a));
  return { ...atom, connected, insolvencyCount: connected.filter((c) => c.insolvent).length };
}

function strength(c: AtomCompany): number {
  return (
    (c.insolvent ? 3 : 0) + (c.viaOwner ? 2 : 0) + (DEAD.has(c.status) ? 1 : 0) + (c.people.length - 1)
  );
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

  // One person can appear on this company under several officer records (e.g.
  // two roles). Collapse them so the nucleus shows each owner once and we don't
  // expand the same person twice.
  const uniqueOfficers: OfficerInput[] = [];
  for (const o of officers) {
    if (!uniqueOfficers.some((u) => samePerson(u, o))) uniqueOfficers.push(o);
  }

  const toExpand = uniqueOfficers.slice(0, MAX_OFFICERS_EXPANDED);
  const truncated = uniqueOfficers.length > MAX_OFFICERS_EXPANDED;

  type ApptItem = {
    appointed_to?: { company_name?: string; company_number?: string; company_status?: string };
  };
  type OfficerSearchItem = {
    title?: string;
    date_of_birth?: { month?: number; year?: number };
    links?: { self?: string };
  };

  // CH keeps a person under MANY officer records (different addresses / filings
  // over time). The record on this company only lists the companies filed under
  // it — older/dissolved companies sit under other records. So search the person
  // by name and merge appointments from every record that matches on name + DOB.
  // People are processed sequentially under a global fetch budget; records for
  // one person are fetched in parallel.
  const expansions: Record<string, Expansion> = {};
  let budget = MAX_TOTAL_APPOINTMENT_FETCHES;

  for (const o of toExpand) {
    // Base record — the person AS LISTED on this company. Always fetched, so the
    // atom never collapses to empty. Its top-level DOB is authoritative (the
    // company's officer entry sometimes omits it).
    const baseAppts = await chGet(
      `/officers/${encodeURIComponent(o.officerId)}/appointments?items_per_page=50`,
    );
    budget -= 1;
    const baseItems = (baseAppts?.items as ApptItem[]) ?? [];
    const baseDob =
      dob(baseAppts?.date_of_birth as { month?: number; year?: number } | undefined) || o.dob;
    const baseTotal =
      typeof baseAppts?.total_results === "number"
        ? (baseAppts.total_results as number)
        : baseItems.length;

    const seen = new Set<string>();
    const companies: Array<{ companyName: string; companyNumber: string; status: string }> = [];
    const addItems = (items: ApptItem[]) => {
      for (const it of items) {
        const num = it.appointed_to?.company_number;
        if (!num || seen.has(num)) continue;
        seen.add(num);
        companies.push({
          companyName: it.appointed_to!.company_name ?? "",
          companyNumber: num,
          status: it.appointed_to!.company_status ?? "active",
        });
      }
    };
    addItems(baseItems);

    // A person whose PRIMARY record alone holds many companies is a
    // professional/nominee director — don't expand or merge.
    const isNominee = baseTotal > NOMINEE_APPOINTMENTS_THRESHOLD;

    // Merge other officer records of the SAME person (older/dissolved companies
    // sit under other records). Match STRICTLY on date of birth so we never pull
    // in a different person who happens to share the name.
    if (!isNominee && baseDob && budget > 0) {
      const search = await chGet(
        `/search/officers?q=${encodeURIComponent(o.name)}&items_per_page=35`,
      );
      const extraIds = ((search?.items as OfficerSearchItem[]) ?? [])
        .filter((it) => it.title && it.links?.self)
        .filter((it) => {
          const d = dob(it.date_of_birth);
          return d === baseDob && samePerson({ name: it.title as string, dob: d }, { name: o.name, dob: baseDob });
        })
        .map((it) => extractOfficerId(it.links!.self as string))
        .filter((id) => id && id !== o.officerId);

      const cap = Math.max(0, Math.min(MAX_RECORDS_PER_PERSON - 1, budget));
      const ids = Array.from(new Set(extraIds)).slice(0, cap);
      budget -= ids.length;

      const apptLists = await Promise.all(
        ids.map((id) => chGet(`/officers/${encodeURIComponent(id)}/appointments?items_per_page=50`)),
      );
      for (const appts of apptLists) addItems((appts?.items as ApptItem[]) ?? []);
    }

    expansions[o.officerId] = isNominee
      ? { expanded: false, total: baseTotal, companies: [] }
      : { expanded: true, total: companies.length, companies };

    if (budget <= 0) break;
  }

  const atom = assembleAtom(number, uniqueOfficers, pscList, expansions, truncated);

  // Insolvency HISTORY pass: a company that failed often shows as "dissolved"
  // today, so current status alone misses it. Check the profile flag for the
  // non-active connected companies that aren't already flagged by status.
  const toCheck = atom.connected
    .filter((c) => c.status !== "active" && !c.insolvent)
    .slice(0, MAX_INSOLVENCY_CHECKS)
    .map((c) => c.number);

  if (toCheck.length === 0) return atom;

  const historyMap: Record<string, boolean> = {};
  const profiles = await Promise.all(
    toCheck.map((num) => chGet(`/company/${encodeURIComponent(num)}`)),
  );
  toCheck.forEach((num, i) => {
    historyMap[num] = (profiles[i]?.has_insolvency_history as boolean) === true;
  });

  return applyInsolvencyHistory(atom, historyMap);
}
