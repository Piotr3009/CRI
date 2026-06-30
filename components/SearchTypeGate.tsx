"use client";

import { CompanySearch } from "./CompanySearch";

// Search now starts with the company, not the role. After a company is picked,
// CompanySearch reveals only the roles that company has reports in (see
// CompanyRolePicker). This wrapper is kept so app/search/page.tsx imports stay
// stable.
export function SearchTypeGate() {
  return <CompanySearch />;
}
