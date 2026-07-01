/**
 * Shared (client + server) constants and helpers for evidence file uploads.
 *
 * Pure module — no server-only imports — so it is safe to import from browser
 * components AND server actions. Files are uploaded directly from the browser
 * to Supabase Storage via a server-issued signed upload URL; they never pass
 * through the Next.js server (Vercel caps request bodies well below our limit).
 */

/** Private Supabase Storage bucket that holds evidence files. */
export const EVIDENCE_BUCKET = "evidence";

/** Maximum number of files a single report may carry. */
export const MAX_EVIDENCE_FILES = 10;

/** Maximum size of a single file (100 MB — allowed on the Supabase Pro plan). */
export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024;

/** Allowed file extensions (lowercase, without the leading dot). */
export const ALLOWED_EVIDENCE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "doc",
  "docx",
  "xls",
  "xlsx",
] as const;

/** `accept` attribute for the file input (extensions + broad hints for mobile). */
export const EVIDENCE_ACCEPT_ATTR =
  ".pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx,.xls,.xlsx,application/pdf,image/*";

/**
 * A file that has finished uploading to Storage and is ready to be attached to
 * the report on submit. This is the shape passed from the browser back to the
 * submit action.
 */
export type UploadedEvidence = {
  /** Object key within the evidence bucket. */
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  /** Maps to Evidence.type. */
  kind: "PHOTO" | "DOCUMENT";
};

/** Lowercase extension without the dot, or "" when there is none. */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** Image files map to PHOTO, everything else to DOCUMENT. */
export function evidenceKindFromMime(
  mimeType: string,
  fileName: string,
): "PHOTO" | "DOCUMENT" {
  const ext = extensionOf(fileName);
  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "heic", "heif"].includes(ext)
  ) {
    return "PHOTO";
  }
  return "DOCUMENT";
}

/** Human-readable size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Reduce a filename to a safe storage-object segment (keeps the extension). */
export function sanitizeFileName(fileName: string): string {
  const ext = extensionOf(fileName);
  const rawBase = ext ? fileName.slice(0, fileName.length - ext.length - 1) : fileName;
  const base =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
}

/** Validate type + size. Enforced on both client and server. */
export function validateEvidenceFile(file: {
  fileName: string;
  sizeBytes: number;
}): { ok: true } | { ok: false; error: string } {
  const ext = extensionOf(file.fileName);
  if (!(ALLOWED_EVIDENCE_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: "File type not allowed" };
  }
  if (file.sizeBytes <= 0) {
    return { ok: false, error: "File is empty" };
  }
  if (file.sizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
    return { ok: false, error: "File exceeds 100 MB" };
  }
  return { ok: true };
}
