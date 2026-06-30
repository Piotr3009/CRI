"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { AuthModal, type AuthMode } from "./AuthModal";

export function AuthMenu({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const isMobile = variant === "mobile";
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Not configured yet (e.g. env not set on Vercel) -> keep the original CTA.
  if (!isSupabaseConfigured) {
    return (
      <Link
        href="/pricing"
        className={
          isMobile
            ? "mt-1 flex w-full items-center justify-center rounded-lg bg-cri-green px-3 py-2 text-sm font-semibold text-white"
            : "btn-primary"
        }
      >
        Join as Verified Contractor
      </Link>
    );
  }

  if (!ready) {
    return (
      <div
        className={`h-10 animate-pulse rounded-lg bg-black/5 ${
          isMobile ? "w-full" : "w-28"
        }`}
      />
    );
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  }

  if (email) {
    if (isMobile) {
      return (
        <div className="mt-1 rounded-lg border border-cri-border p-2">
          <p className="truncate px-1 text-xs text-cri-steel">{email}</p>
          <Link
            href="/account"
            className="mt-1.5 block w-full rounded-lg bg-cri-bg px-3 py-2 text-center text-sm font-medium text-cri-charcoal hover:bg-black/5"
          >
            My account
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1.5 w-full rounded-lg bg-cri-bg px-3 py-2 text-sm font-medium text-cri-charcoal hover:bg-black/5"
          >
            Log out
          </button>
        </div>
      );
    }
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-cri-border bg-white px-3 py-2 text-sm font-medium text-cri-charcoal hover:bg-cri-bg"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cri-green text-xs font-semibold text-white">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[160px] truncate">{email}</span>
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-cri-border bg-white p-1.5 shadow-card-hover">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-cri-charcoal hover:bg-cri-bg"
              >
                My account
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-cri-charcoal hover:bg-cri-bg"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={isMobile ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <button
          type="button"
          className={isMobile ? "btn-secondary w-full" : "btn-ghost"}
          onClick={() => setModalMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={isMobile ? "btn-primary w-full" : "btn-primary"}
          onClick={() => setModalMode("signup")}
        >
          Sign up
        </button>
      </div>
      {modalMode && (
        <AuthModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSwitchMode={setModalMode}
        />
      )}
    </>
  );
}
