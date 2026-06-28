"use client";

import { useEffect, useRef, useState } from "react";

export type Company = { name: string; number: string; address: string };

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = Boolean(number);

  // Debounced search.
  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setApiError(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/companies/search?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setApiError(
            res.status === 429
              ? "Too many searches — wait a moment."
              : "Can't reach Companies House right now.",
          );
          setResults([]);
        } else {
          setApiError(null);
          setResults(data.items ?? []);
        }
        setOpen(true);
      } catch {
        setApiError("Can't reach Companies House right now.");
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

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
              setQuery(name);
              setResults([]);
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

  return (
    <div ref={boxRef} className="relative">
      <input
        className={`input ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length || apiError) setOpen(true);
        }}
      />
      {open && (loading || apiError || results.length > 0 || query.trim().length >= 2) && (
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
    </div>
  );
}
