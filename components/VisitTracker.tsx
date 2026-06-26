"use client";

import { useEffect } from "react";

/**
 * Fires once per full page load to record an aggregate visit.
 * Renders nothing; failures are silent so they never affect the UI.
 */
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
