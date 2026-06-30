"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/account/actions";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-[#D64545]/40 px-4 py-2 text-sm font-semibold text-[#D64545] transition-colors hover:bg-[#D64545]/5"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={deleteAccountAction} className="space-y-3">
      <p className="text-sm text-cri-charcoal">
        This permanently deletes your account and personal details. Reports
        you&apos;ve submitted stay online but are anonymised — they can no longer
        be traced to you. <span className="font-semibold">This cannot be undone.</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-[#D64545] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c13a3a]"
        >
          Yes, delete permanently
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-cri-border px-4 py-2 text-sm font-semibold text-cri-charcoal hover:bg-cri-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
