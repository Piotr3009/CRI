"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  EvidenceStatus,
  ModerationStatus,
  Visibility,
} from "@prisma/client";
import {
  ADMIN_COOKIE,
  adminSessionToken,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "@/lib/auth";
import {
  updateReportEvidenceStatus,
  updateReportModerationStatus,
  updateReportPublicSummary,
  updateReportVisibility,
} from "@/lib/reports";

const EVIDENCE_VALUES: EvidenceStatus[] = [
  "UNVERIFIED",
  "BASIC_EVIDENCE",
  "VERIFIED_EVIDENCE",
  "LEGAL_EVIDENCE",
];
const VISIBILITY_VALUES: Visibility[] = [
  "PUBLIC",
  "VERIFIED_CONTRACTORS_ONLY",
  "ADMIN_ONLY",
];
const MODERATION_VALUES: ModerationStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DISPUTED",
];

// --- Auth (MVP placeholder, see lib/auth.ts) -------------------------------

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin?error=1");
  }
  cookies().set(ADMIN_COOKIE, adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  redirect("/admin");
}

export async function logoutAdminAction() {
  cookies().delete(ADMIN_COOKIE);
  redirect("/admin");
}

// --- Moderation mutations (all require admin auth) -------------------------

function requireAdmin() {
  if (!isAdminAuthenticated()) redirect("/admin");
}

function revalidateReport(id: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/reports/${id}`);
  revalidatePath("/search");
  revalidatePath(`/reports/${id}`);
}

export async function moderateAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !MODERATION_VALUES.includes(status as ModerationStatus)) return;
  await updateReportModerationStatus(id, status as ModerationStatus);
  revalidateReport(id);
}

export async function setEvidenceStatusAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("evidenceStatus") ?? "");
  if (!id || !EVIDENCE_VALUES.includes(value as EvidenceStatus)) return;
  await updateReportEvidenceStatus(id, value as EvidenceStatus);
  revalidateReport(id);
}

export async function setVisibilityAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("visibility") ?? "");
  if (!id || !VISIBILITY_VALUES.includes(value as Visibility)) return;
  await updateReportVisibility(id, value as Visibility);
  revalidateReport(id);
}

export async function savePublicSummaryAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") ?? "");
  const summary = String(formData.get("publicSummary") ?? "").trim();
  if (!id) return;
  await updateReportPublicSummary(id, summary);
  revalidateReport(id);
}
