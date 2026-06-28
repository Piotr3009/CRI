"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "signup";

export function AuthModal({
  mode,
  onClose,
  onSwitchMode,
}: {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return "Enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (isSignup) {
      if (!companyName.trim()) return "Enter your company name.";
      if (!contactName.trim()) return "Enter a contact person.";
      if (!tradeType.trim()) return "Enter your trade type.";
    }
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    try {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              companyName: companyName.trim(),
              contactName: contactName.trim(),
              tradeType: tradeType.trim(),
              companyNumber: companyNumber.trim(),
            },
          },
        });
        if (err) {
          setError(err.message);
          setSubmitting(false);
          return;
        }
        setSentTo(email.trim());
        setSubmitting(false);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(err.message);
          setSubmitting(false);
          return;
        }
        onClose();
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {sentTo ? (
          <div className="text-center">
            <h2 className="text-lg font-bold text-cri-charcoal">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-cri-steel">
              We sent a confirmation link to{" "}
              <span className="font-medium text-cri-charcoal">{sentTo}</span>.
              Click it to activate your account, then log in.
            </p>
            <button className="btn-primary mt-5 w-full" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-cri-charcoal">
                {isSignup ? "Create your account" : "Log in"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1 text-cri-steel hover:bg-black/5"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {isSignup && (
              <p className="mt-1 text-xs text-cri-steel">
                You report facts about companies — your details stay private and
                are never shown publicly.
              </p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder={isSignup ? "At least 8 characters" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignup && (
                <>
                  <div>
                    <label className="label">Company name</label>
                    <input
                      className="input"
                      placeholder="e.g. ABC Electrical Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Contact person</label>
                    <input
                      className="input"
                      placeholder="Your name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Trade type</label>
                    <input
                      className="input"
                      placeholder="e.g. Electrical, Joinery"
                      value={tradeType}
                      onChange={(e) => setTradeType(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">
                      Companies House number{" "}
                      <span className="font-normal text-cri-steel">
                        (optional)
                      </span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. 01234567 — sole traders can skip"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                    />
                  </div>
                </>
              )}
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
              {submitting
                ? "Please wait…"
                : isSignup
                  ? "Create account"
                  : "Log in"}
            </button>

            <p className="mt-4 text-center text-sm text-cri-steel">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-cri-green hover:underline"
                    onClick={() => {
                      setError(null);
                      onSwitchMode("login");
                    }}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  No account yet?{" "}
                  <button
                    type="button"
                    className="font-semibold text-cri-green hover:underline"
                    onClick={() => {
                      setError(null);
                      onSwitchMode("signup");
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
