"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { TRADE_TYPES } from "@/lib/constants";
import { CompanyAutocomplete } from "@/components/CompanyAutocomplete";

export type AuthMode = "login" | "signup" | "forgot";

type AccountType = "" | "ltd" | "sole" | "other";

const ACCOUNT_TYPES: { value: Exclude<AccountType, "">; label: string; hint: string }[] = [
  { value: "ltd", label: "Limited company (Ltd)", hint: "Registered at Companies House" },
  { value: "sole", label: "Sole trader", hint: "No company number" },
  { value: "other", label: "Other", hint: "Partnership, charity, etc." },
];

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

// Top-level (not nested in AuthModal) so typing doesn't remount it / lose focus.
function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="input pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-cri-steel hover:text-cri-charcoal"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          <EyeIcon off={show} />
        </button>
      </div>
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>("");
  const [companyName, setCompanyName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [tradeType, setTradeType] = useState("");

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
    if (isSignup) {
      if (!accountType) return "Choose your account type.";
      if (accountType === "ltd" && !companyNumber.trim())
        return "Search for and select your company.";
      if (!companyName.trim()) return "Enter your company / business name.";
      if (!contactName.trim()) return "Enter your name.";
      if (!tradeType.trim()) return "Select your trade type.";
    }
    if (!email.trim()) return "Enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email.";
    if (isForgot) return null;
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (isSignup && password !== confirmPassword)
      return "Passwords do not match.";
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
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              companyName: companyName.trim(),
              contactName: contactName.trim(),
              tradeType: tradeType.trim(),
              companyNumber: companyNumber.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (err) {
          setError(err.message);
          setSubmitting(false);
          return;
        }
        // Supabase deliberately fakes success for an already-registered email
        // (anti-enumeration) but returns an empty identities array — detect it
        // and tell the person the truth instead of promising an email that
        // will never arrive.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setError(
            "An account with this email already exists. Sign in instead, or use \u201CForgot password\u201D if you can\u2019t remember your password.",
          );
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

  const stepHeader = (n: number, text: string) => (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cri-green text-[11px] font-bold text-white">
        {n}
      </span>
      <span className="text-sm font-semibold text-cri-charcoal">{text}</span>
    </div>
  );

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
      ) : isSignup ? (
        <>
          <p className="text-xs text-cri-steel">
            You report facts about companies — your details stay private and are
            never shown publicly.
          </p>

          <div className="mt-4 space-y-5">
            {/* Step 1 — account type */}
            <div className="space-y-2">
              {stepHeader(1, "Account type")}
              <div className="space-y-2">
                {ACCOUNT_TYPES.map((t) => {
                  const active = accountType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setAccountType(t.value);
                        // Switching type clears any company picked under another type.
                        setCompanyName("");
                        setCompanyNumber("");
                        setError(null);
                      }}
                      className={`flex w-full flex-col rounded-lg border px-4 py-2.5 text-left transition ${
                        active
                          ? "border-cri-green bg-cri-green/5 ring-1 ring-cri-green"
                          : "border-cri-border hover:border-cri-green/50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-cri-charcoal">
                        {t.label}
                      </span>
                      <span className="text-xs text-cri-steel">{t.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steps 2–4 appear once a type is chosen */}
            {accountType && (
              <>
                {/* Step 2 — company / identity */}
                <div className="space-y-3">
                  {stepHeader(2, "Your details")}

                  {accountType === "ltd" ? (
                    <div>
                      <label className="label">Find your company</label>
                      <CompanyAutocomplete
                        name={companyName}
                        number={companyNumber}
                        onSelect={(c) => {
                          setCompanyName(c.name);
                          setCompanyNumber(c.number);
                        }}
                        onClear={() => {
                          setCompanyName("");
                          setCompanyNumber("");
                        }}
                        placeholder="Start typing your company name…"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="label">Business name</label>
                      <input
                        className="input"
                        placeholder="Your trading name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="label">Your name</label>
                    <input
                      className="input"
                      placeholder="Contact person"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">
                      Phone{" "}
                      <span className="font-normal text-cri-steel">
                        (optional)
                      </span>
                    </label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="e.g. 07123 456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Step 3 — trade type */}
                <div className="space-y-2">
                  {stepHeader(3, "Trade type")}
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

                {/* Step 4 — login details */}
                <div className="space-y-3">
                  {stepHeader(4, "Login details")}
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <PasswordField
                    label="Password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((x) => !x)}
                  />
                  <PasswordField
                    label="Confirm password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((x) => !x)}
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
            {submitting ? "Please wait…" : "Create account"}
          </button>

          <p className="mt-4 text-center text-sm text-cri-steel">
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
          </p>
        </>
      ) : (
        <>
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
              <>
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((x) => !x)}
                />
                <button
                  type="button"
                  className="text-xs font-medium text-cri-green hover:underline"
                  onClick={() => {
                    setError(null);
                    onSwitchMode("forgot");
                  }}
                >
                  Forgot password?
                </button>
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
              : isForgot
                ? "Send reset link"
                : "Log in"}
          </button>

          <p className="mt-4 text-center text-sm text-cri-steel">
            {isForgot ? (
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
