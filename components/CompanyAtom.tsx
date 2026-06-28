"use client";

import { useState } from "react";
import type { CompanyAtom as Atom } from "@/lib/level2/atom";

type Status = "idle" | "loading" | "error" | "done";

export function CompanyAtom({ number }: { number: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [atom, setAtom] = useState<Atom | null>(null);

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/companies/atom?number=${encodeURIComponent(number)}`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setAtom((await res.json()) as Atom);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-cri-border px-4 py-4 text-center">
        <p className="text-sm text-cri-steel">
          See other companies linked to this one through its owners and directors —
          a trail of dissolved companies can signal phoenixing.
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cri-green px-4 py-2 text-sm font-semibold text-cri-green transition-colors hover:bg-cri-green hover:text-white"
        >
          Show connected companies
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <p className="mt-5 rounded-lg bg-cri-bg px-4 py-3 text-sm text-cri-steel">
        Loading connected companies… this checks Companies House and can take a moment.
      </p>
    );
  }

  if (status === "error" || !atom) {
    return (
      <div className="mt-5 rounded-lg bg-cri-bg px-4 py-3 text-sm text-cri-steel">
        Couldn&apos;t load connected companies right now.{" "}
        <button type="button" onClick={load} className="font-semibold text-cri-green hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-cri-charcoal">Ownership &amp; control</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {atom.core.length === 0 ? (
          <span className="text-sm text-cri-steel">No active officers found.</span>
        ) : (
          atom.core.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="rounded-lg border border-cri-border bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-cri-charcoal">{p.name}</span>
                {p.isOwner ? (
                  <span className="rounded-full bg-cri-green/10 px-2 py-0.5 text-[11px] font-semibold text-cri-green">
                    Owner
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-cri-steel">
                {p.role || "officer"}
                {p.dob ? ` · born ${p.dob}` : ""}
                {!p.expanded ? ` · professional director (${p.appointmentsTotal} appointments) — not expanded` : ""}
              </p>
            </div>
          ))
        )}
      </div>

      <p className="mt-5 text-sm font-semibold text-cri-charcoal">
        Connected companies{" "}
        <span className="font-normal text-cri-steel">· {atom.connected.length}</span>
      </p>

      {atom.connected.length === 0 ? (
        <p className="mt-2 text-sm text-cri-steel">No connected companies found.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {atom.connected.map((c) => {
            const dead = c.statusLabel !== "Active";
            return (
              <div
                key={c.number}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cri-border bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        dead
                          ? "bg-cri-amber-light text-cri-amber-dark"
                          : "bg-cri-green/10 text-cri-green"
                      }`}
                    >
                      {c.statusLabel}
                    </span>
                    <span className="truncate text-sm font-medium text-cri-charcoal">{c.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-cri-steel">
                    {c.number} · via {c.people.join(", ")}
                  </p>
                </div>
                {c.viaOwner ? (
                  <span className="shrink-0 rounded-full bg-cri-amber-light px-2 py-0.5 text-[11px] font-semibold text-cri-amber-dark">
                    Owner-linked
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {atom.truncated ? (
        <p className="mt-3 text-xs text-cri-steel">
          Only the first {atom.core.length} directors were checked to stay within Companies House
          limits.
        </p>
      ) : null}
    </div>
  );
}
