"use client";

import { useState } from "react";
import { CompanyAutocomplete, type Company } from "@/components/CompanyAutocomplete";
import { CompanyRolePicker } from "@/components/CompanyRolePicker";

// Flow: pick a company first, then we reveal only the roles that company
// actually has reports in. The role is no longer chosen up front, so a buyer
// can never land on an empty report shell for a role nobody reported.
export function CompanySearch() {
  const [selected, setSelected] = useState<Company | null>(null);

  return (
    <div>
      <CompanyAutocomplete
        name={selected?.name ?? ""}
        number={selected?.number ?? ""}
        onSelect={(c) => setSelected(c)}
        onClear={() => setSelected(null)}
        placeholder="Search a company by name (or by director name)…"
      />

      {selected ? <CompanyRolePicker company={selected} /> : null}
    </div>
  );
}
