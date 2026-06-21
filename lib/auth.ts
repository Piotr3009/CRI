/**
 * ⚠️ PLACEHOLDER ADMIN GATE — NOT PRODUCTION AUTH ⚠️
 *
 * This is an MVP stub so the /admin moderation dashboard is not left wide open.
 * It uses a single shared password (env `ADMIN_PASSWORD`) and stores a hashed
 * session token in an httpOnly cookie. It does NOT provide real user accounts,
 * roles, rate-limiting, CSRF protection or audit logging.
 *
 * TODO(before production): replace with a proper auth provider (e.g. NextAuth /
 * Auth.js, Clerk, Lucia) and per-user ADMIN roles backed by the `User` model.
 */

import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "cri_admin";

// Falls back to a clearly-non-secret default so local dev works out of the box.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cri-admin-demo";

/** Hashed token stored in the cookie (so the raw password is never stored). */
function sessionToken(): string {
  return crypto
    .createHash("sha256")
    .update(`cri-admin:${ADMIN_PASSWORD}`)
    .digest("hex");
}

export function verifyAdminPassword(input: string): boolean {
  // Constant-time-ish comparison for the shared password.
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function adminSessionToken(): string {
  return sessionToken();
}

export function isAdminAuthenticated(): boolean {
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  return !!cookie && cookie === sessionToken();
}
