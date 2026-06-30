"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  EvidenceStatus,
  ModerationStatus,
  Visibility,
} from "@prisma/client";
import { getAdminUser } from "@/lib/auth";
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

// --- Moderation mutations (all require an admin account) -------------------

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

function revalidateReport(id: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/reports/${id}`);
  revalidatePath("/search");
  revalidatePath(`/reports/${id}`);
}

export async function moderateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !MODERATION_VALUES.includes(status as ModerationStatus)) return;
  await updateReportModerationStatus(id, status as ModerationStatus);
  revalidateReport(id);
}

export async function setEvidenceStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("evidenceStatus") ?? "");
  if (!id || !EVIDENCE_VALUES.includes(value as EvidenceStatus)) return;
  await updateReportEvidenceStatus(id, value as EvidenceStatus);
  revalidateReport(id);
}

export async function setVisibilityAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const value = String(formData.get("visibility") ?? "");
  if (!id || !VISIBILITY_VALUES.includes(value as Visibility)) return;
  await updateReportVisibility(id, value as Visibility);
  revalidateReport(id);
}

export async function savePublicSummaryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const summary = String(formData.get("publicSummary") ?? "").trim();
  if (!id) return;
  await updateReportPublicSummary(id, summary);
  revalidateReport(id);
}
