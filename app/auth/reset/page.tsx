"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

  async function handleSubmit() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="text-xl font-bold text-cri-charcoal">
          Set a new password
        </h1>

        {checking ? (
          <p className="mt-3 text-sm text-cri-steel">Loading…</p>
        ) : done ? (
          <>
            <p className="mt-3 text-sm text-cri-steel">
              Your password has been updated. You&apos;re now signed in.
            </p>
            <button
              className="btn-primary mt-5 w-full"
              onClick={() => router.push("/")}
            >
              Continue
            </button>
          </>
        ) : !hasSession ? (
          <>
            <p className="mt-3 text-sm text-cri-steel">
              This reset link is invalid or has expired. Request a new one from
              the log-in screen.
            </p>
            <Link href="/" className="btn-primary mt-5 inline-flex w-full">
              Back to home
            </Link>
          </>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">New password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-cri-amber/10 px-3 py-2 text-sm text-cri-amber-dark">
                {error}
              </p>
            )}

            <button
              className="btn-primary mt-5 w-full"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Please wait…" : "Update password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
