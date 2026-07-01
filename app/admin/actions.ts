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
  getEvidenceFileRef,
  updateReportEvidenceStatus,
  updateReportModerationStatus,
  updateReportPublicSummary,
  updateReportVisibility,
} from "@/lib/reports";
import {
  createSupabaseAdminClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";
import { EVIDENCE_BUCKET } from "@/lib/evidenceUpload";

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

// ---------------------------------------------------------------------------
// Evidence download — moderator-only. Returns a short-lived signed URL for a
// file in the private "evidence" bucket. The URL forces a download and expires
// after 60 seconds.
// ---------------------------------------------------------------------------

export type EvidenceDownloadUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createEvidenceDownloadUrl(
  evidenceId: string,
): Promise<EvidenceDownloadUrlResult> {
  const user = await getAdminUser();
  if (!user) {
    return { ok: false, error: "Not authorised." };
  }
  if (!isAdminClientConfigured) {
    return { ok: false, error: "Downloads are not available right now." };
  }

  const ref = await getEvidenceFileRef(evidenceId);
  if (!ref?.fileUrl) {
    return { ok: false, error: "File not found." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(ref.fileUrl, 60, { download: ref.fileName ?? true });
    if (error || !data) {
      return { ok: false, error: "Could not create a download link." };
    }
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    console.error("Failed to create evidence download URL", error);
    return { ok: false, error: "Could not create a download link." };
  }
}
