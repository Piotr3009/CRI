"use server";

import { getCompanyEntityTypes } from "@/lib/reports";
import type { EntityType } from "@prisma/client";

export type CompanyRole = {
  value: EntityType;
  title: string;
  subtitle: string;
  count: number;
};

// Roles we can render a public report for, in display order. Mirrors
// RENDER_ORDER in app/company/[number]/page.tsx. Residential is intentionally
// excluded — it has no report engine and its search tile is disabled.
const ROLE_META: { value: EntityType; title: string; subtitle: string }[] = [
  { value: "MAIN_CONTRACTOR", title: "Main contractor", subtitle: "pays subcontractors" },
  { value: "COMMERCIAL_CLIENT", title: "Commercial client", subtitle: "company / investor" },
  { value: "PROJECT_MANAGER", title: "Project manager", subtitle: "service provider" },
  { value: "QUANTITY_SURVEYOR", title: "Quantity surveyor", subtitle: "service provider" },
  { value: "ARCHITECT_PM", title: "Architect / PM", subtitle: "service provider" },
];

/**
 * Roles in which this company has approved, public community reports.
 * Returns them in display order, each with its review count. An empty array
 * means nobody has reported this company yet (the search UI then offers the
 * Companies-House-only report instead).
 */
export async function getCompanyRoles(chNumber: string): Promise<CompanyRole[]> {
  const number = chNumber.trim();
  if (!number) return [];

  const grouped = await getCompanyEntityTypes(number);
  const countByType = new Map<EntityType, number>(
    grouped.map((g) => [g.entityType, g.count]),
  );

  return ROLE_META.filter((m) => (countByType.get(m.value) ?? 0) > 0).map((m) => ({
    ...m,
    count: countByType.get(m.value) ?? 0,
  }));
}
