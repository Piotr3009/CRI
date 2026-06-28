"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { AuthModal, type AuthMode } from "./AuthModal";

export function AuthMenu() {
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

  // Not configured yet (e.g. env not set on Vercel) → keep the original CTA.
  if (!isSupabaseConfigured) {
    return (
      <Link href="/pricing" className="btn-primary">
        Join as Verified Contractor
      </Link>
    );
  }

  if (!ready) {
    return <div className="h-10 w-28 animate-pulse rounded-lg bg-black/5" />;
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  }

  if (email) {
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setModalMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className="btn-primary"
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
