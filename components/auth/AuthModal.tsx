"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { TRADE_TYPES } from "@/lib/constants";

export type AuthMode = "login" | "signup" | "forgot";

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
  const isForgot = mode === "forgot";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const title = sentTo
    ? "Check your email"
    : isSignup
      ? "Create your account"
      : isForgot
        ? "Reset your password"
        : "Log in";

  function validate(): string | null {
    if (!email.trim()) return "Enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email.";
    if (isForgot) return null;
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (isSignup) {
      if (password !== confirmPassword) return "Passwords do not match.";
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
      if (isForgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset` },
        );
        if (err) {
          setError(err.message);
          setSubmitting(false);
          return;
        }
        setSentTo(email.trim());
        setSubmitting(false);
      } else if (isSignup) {
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
    <Modal title={title} onClose={onClose}>
      {sentTo ? (
        <div className="text-center">
          <p className="text-sm text-cri-steel">
            We sent {isForgot ? "a password reset" : "a confirmation"} link to{" "}
            <span className="font-medium text-cri-charcoal">{sentTo}</span>.
            {isForgot
              ? " Click it to set a new password."
              : " Click it to activate your account, then log in."}
          </p>
          <button className="btn-primary mt-5 w-full" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          {isSignup && (
            <p className="text-xs text-cri-steel">
              You report facts about companies — your details stay private and
              are never shown publicly.
            </p>
          )}
          {isForgot && (
            <p className="text-xs text-cri-steel">
              Enter your email and we&apos;ll send you a link to set a new
              password.
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
            {!isForgot && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder={isSignup ? "At least 8 characters" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "login" && (
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-medium text-cri-green hover:underline"
                    onClick={() => {
                      setError(null);
                      onSwitchMode("forgot");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
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
                  <select
                    className="input"
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {TRADE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
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
                : isForgot
                  ? "Send reset link"
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
            ) : isForgot ? (
              <>
                Remembered it?{" "}
                <button
                  type="button"
                  className="font-semibold text-cri-green hover:underline"
                  onClick={() => {
                    setError(null);
                    onSwitchMode("login");
                  }}
                >
                  Back to log in
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
    </Modal>
  );
}
