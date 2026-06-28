"use client";

import { useEffect, useRef, useState } from "react";

export type Company = { name: string; number: string; address: string };
type Officer = { id: string; name: string; dob: string; address: string };

const REACH_ERR = "Can't reach Companies House right now.";
const RATE_ERR = "Too many searches — wait a moment.";

export function CompanyAutocomplete({
  name,
  number,
  onSelect,
  onClear,
  error,
  placeholder = "Start typing the company name…",
}: {
  name: string;
  number: string;
  onSelect: (company: Company) => void;
  onClear: () => void;
  error?: string;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"company" | "director">("company");

  // Company-search state.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);

  // Director-search state.
  const [officerQuery, setOfficerQuery] = useState("");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [pickedOfficer, setPickedOfficer] = useState<Officer | null>(null);
  const [officerCompanies, setOfficerCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Shared.
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = Boolean(number);

  function errFromStatus(status: number) {
    return status === 429 ? RATE_ERR : REACH_ERR;
  }

  // Company search (debounced).
  useEffect(() => {
    if (selected || mode !== "company") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setApiError(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setApiError(errFromStatus(res.status));
          setResults([]);
        } else {
          setApiError(null);
          setResults(data.items ?? []);
        }
        setOpen(true);
      } catch {
        setApiError(REACH_ERR);
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, mode, selected]);

  // Officer search (debounced).
  useEffect(() => {
    if (selected || mode !== "director" || pickedOfficer) return;
    const q = officerQuery.trim();
    if (q.length < 2) {
      setOfficers([]);
      setApiError(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/companies/search-officers?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setApiError(errFromStatus(res.status));
          setOfficers([]);
        } else {
          setApiError(null);
          setOfficers(data.items ?? []);
        }
        setOpen(true);
      } catch {
        setApiError(REACH_ERR);
        setOfficers([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [officerQuery, mode, selected, pickedOfficer]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function pickOfficer(o: Officer) {
    setPickedOfficer(o);
    setOpen(false);
    setOfficerCompanies([]);
    setLoadingCompanies(true);
    setApiError(null);
    try {
      const res = await fetch(
        `/api/companies/officer-appointments?id=${encodeURIComponent(o.id)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setApiError(errFromStatus(res.status));
      } else {
        setOfficerCompanies(data.items ?? []);
      }
    } catch {
      setApiError(REACH_ERR);
    } finally {
      setLoadingCompanies(false);
    }
  }

  function switchMode(next: "company" | "director") {
    setMode(next);
    setResults([]);
    setOfficers([]);
    setPickedOfficer(null);
    setOfficerCompanies([]);
    setApiError(null);
    setOpen(false);
  }

  // ---- Selected company chip ----
  if (selected) {
    return (
      <div className="rounded-lg border border-cri-green/40 bg-cri-green/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-cri-charcoal">
              {name}
            </p>
            <p className="mt-0.5 text-xs text-cri-steel">
              Companies House no.{" "}
              <span className="font-medium text-cri-charcoal">{number}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOfficerQuery("");
              setResults([]);
              setOfficers([]);
              setPickedOfficer(null);
              setOfficerCompanies([]);
              onClear();
            }}
            className="shrink-0 text-xs font-semibold text-cri-green hover:underline"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  const tabBase =
    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors";
  const tabOn = "bg-white text-cri-charcoal shadow-sm";
  const tabOff = "text-cri-steel hover:text-cri-charcoal";

  return (
    <div ref={boxRef} className="relative">
      {/* Search mode toggle */}
      <div className="mb-2 inline-flex gap-1 rounded-lg bg-cri-bg p-1">
        <button
          type="button"
          onClick={() => switchMode("company")}
          className={`${tabBase} ${mode === "company" ? tabOn : tabOff}`}
        >
          By company name
        </button>
        <button
          type="button"
          onClick={() => switchMode("director")}
          className={`${tabBase} ${mode === "director" ? tabOn : tabOff}`}
        >
          By director name
        </button>
      </div>

      {/* COMPANY MODE */}
      {mode === "company" && (
        <>
          <input
            className={`input ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length || apiError) setOpen(true);
            }}
          />
          {open &&
            (loading || apiError || results.length > 0 || query.trim().length >= 2) && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-cri-border bg-white shadow-card-hover">
                {loading && (
                  <p className="px-3 py-2.5 text-sm text-cri-steel">Searching…</p>
                )}
                {!loading && apiError && (
                  <p className="px-3 py-2.5 text-sm text-cri-amber-dark">{apiError}</p>
                )}
                {!loading && !apiError && results.length === 0 && (
                  <p className="px-3 py-2.5 text-sm text-cri-steel">
                    No matching companies.
                  </p>
                )}
                {!loading &&
                  !apiError &&
                  results.map((c) => (
                    <button
                      key={c.number}
                      type="button"
                      onClick={() => {
                        onSelect(c);
                        setOpen(false);
                      }}
                      className="block w-full border-b border-cri-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-cri-bg"
                    >
                      <span className="block text-sm font-medium text-cri-charcoal">
                        {c.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-cri-steel">
                        {c.number}
                        {c.address ? ` · ${c.address}` : ""}
                      </span>
                    </button>
                  ))}
              </div>
            )}
        </>
      )}

      {/* DIRECTOR MODE — step 1: find the person */}
      {mode === "director" && !pickedOfficer && (
        <>
          <input
            className={`input ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
            placeholder="Start typing the director's name…"
            value={officerQuery}
            onChange={(e) => setOfficerQuery(e.target.value)}
            onFocus={() => {
              if (officers.length || apiError) setOpen(true);
            }}
          />
          {open &&
            (loading ||
              apiError ||
              officers.length > 0 ||
              officerQuery.trim().length >= 2) && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-cri-border bg-white shadow-card-hover">
                {loading && (
                  <p className="px-3 py-2.5 text-sm text-cri-steel">Searching…</p>
                )}
                {!loading && apiError && (
                  <p className="px-3 py-2.5 text-sm text-cri-amber-dark">{apiError}</p>
                )}
                {!loading && !apiError && officers.length === 0 && (
                  <p className="px-3 py-2.5 text-sm text-cri-steel">
                    No matching people.
                  </p>
                )}
                {!loading &&
                  !apiError &&
                  officers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickOfficer(o)}
                      className="block w-full border-b border-cri-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-cri-bg"
                    >
                      <span className="block text-sm font-medium text-cri-charcoal">
                        {o.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-cri-steel">
                        {o.dob ? `Born ${o.dob}` : "DOB n/a"}
                        {o.address ? ` · ${o.address}` : ""}
                      </span>
                    </button>
                  ))}
              </div>
            )}
        </>
      )}

      {/* DIRECTOR MODE — step 2: pick one of their companies */}
      {mode === "director" && pickedOfficer && (
        <div className="rounded-xl border border-cri-border bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-cri-border/60 px-3 py-2">
            <p className="min-w-0 truncate text-xs text-cri-steel">
              Companies for{" "}
              <span className="font-semibold text-cri-charcoal">
                {pickedOfficer.name}
              </span>
              {pickedOfficer.dob ? ` (born ${pickedOfficer.dob})` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setPickedOfficer(null);
                setOfficerCompanies([]);
                setApiError(null);
              }}
              className="shrink-0 text-xs font-semibold text-cri-green hover:underline"
            >
              Change person
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loadingCompanies && (
              <p className="px-3 py-2.5 text-sm text-cri-steel">Loading companies…</p>
            )}
            {!loadingCompanies && apiError && (
              <p className="px-3 py-2.5 text-sm text-cri-amber-dark">{apiError}</p>
            )}
            {!loadingCompanies && !apiError && officerCompanies.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-cri-steel">
                No companies found for this person.
              </p>
            )}
            {!loadingCompanies &&
              !apiError &&
              officerCompanies.map((c) => (
                <button
                  key={c.number}
                  type="button"
                  onClick={() => onSelect(c)}
                  className="block w-full border-b border-cri-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-cri-bg"
                >
                  <span className="block text-sm font-medium text-cri-charcoal">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-cri-steel">
                    {c.number}
                    {c.address ? ` · ${c.address}` : ""}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
