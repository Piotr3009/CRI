"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createEvidenceUploadUrl } from "@/app/submit-report/actions";
import {
  EVIDENCE_ACCEPT_ATTR,
  EVIDENCE_BUCKET,
  MAX_EVIDENCE_FILES,
  formatFileSize,
  validateEvidenceFile,
  type UploadedEvidence,
} from "@/lib/evidenceUpload";

type Item = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  status: "uploading" | "done" | "error";
  error?: string;
  uploaded?: UploadedEvidence;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Evidence uploader. Files upload directly from the browser to Supabase Storage
 * via a server-issued signed URL. As each file finishes, its descriptor is
 * emitted through `onChange`; the parent form carries these into the submit
 * action, which creates the Evidence rows.
 */
export function EvidenceUpload({
  value,
  onChange,
  disabled,
}: {
  value: UploadedEvidence[];
  onChange: (next: UploadedEvidence[]) => void;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Single source of truth: update the ref, mirror to state, emit committed set.
  function commit(next: Item[]) {
    itemsRef.current = next;
    setItems(next);
    onChange(
      next
        .filter(
          (i): i is Item & { uploaded: UploadedEvidence } =>
            i.status === "done" && !!i.uploaded,
        )
        .map((i) => i.uploaded),
    );
  }

  function countKept(list: Item[]): number {
    return list.filter((i) => i.status !== "error").length;
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const supabase = createSupabaseBrowserClient();

    for (const file of Array.from(fileList)) {
      const id = newId();

      // Enforce the file-count cap against the current kept set.
      if (countKept(itemsRef.current) >= MAX_EVIDENCE_FILES) {
        commit([
          ...itemsRef.current,
          {
            id,
            fileName: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
            status: "error",
            error: `Maximum ${MAX_EVIDENCE_FILES} files`,
          },
        ]);
        continue;
      }

      const check = validateEvidenceFile({
        fileName: file.name,
        sizeBytes: file.size,
      });
      if (!check.ok) {
        commit([
          ...itemsRef.current,
          {
            id,
            fileName: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
            status: "error",
            error: check.error,
          },
        ]);
        continue;
      }

      const mimeType = file.type || "application/octet-stream";
      commit([
        ...itemsRef.current,
        { id, fileName: file.name, sizeBytes: file.size, mimeType, status: "uploading" },
      ]);

      const fail = (message: string) => {
        commit(
          itemsRef.current.map((i) =>
            i.id === id ? { ...i, status: "error", error: message } : i,
          ),
        );
      };

      try {
        const res = await createEvidenceUploadUrl({
          fileName: file.name,
          sizeBytes: file.size,
          mimeType,
        });
        if (!res.ok) {
          fail(res.error);
          continue;
        }

        const { error } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .uploadToSignedUrl(res.path, res.token, file, {
            contentType: mimeType,
          });
        if (error) {
          fail("Upload failed. Try again.");
          continue;
        }

        commit(
          itemsRef.current.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "done",
                  uploaded: {
                    path: res.path,
                    fileName: file.name,
                    sizeBytes: file.size,
                    mimeType,
                    kind: res.kind,
                  },
                }
              : i,
          ),
        );
      } catch {
        fail("Upload failed. Try again.");
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    commit(itemsRef.current.filter((i) => i.id !== id));
  }

  const atLimit = countKept(items) >= MAX_EVIDENCE_FILES;
  const inputDisabled = Boolean(disabled) || atLimit;

  return (
    <div>
      <span className="block text-sm font-medium text-cri-charcoal">
        Upload evidence{" "}
        <span className="font-normal text-cri-steel">(optional)</span>
      </span>
      <p className="mt-1 text-xs text-cri-steel">
        Invoices, photos, emails, drawings — anything that backs your report.
      </p>

      <label
        className={`mt-2 flex flex-col items-center rounded-lg border border-dashed p-5 text-center transition-colors ${
          inputDisabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
            : "cursor-pointer border-gray-300 bg-gray-50 hover:border-cri-green"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={EVIDENCE_ACCEPT_ATTR}
          disabled={inputDisabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <span className="text-sm font-medium text-cri-charcoal">
          Tap to add files or drag here
        </span>
        <span className="mt-1 text-xs text-cri-steel">
          PDF, JPG, PNG, HEIC, DOC, XLS · up to 100 MB · max {MAX_EVIDENCE_FILES}{" "}
          files
        </span>
      </label>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                item.status === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-cri-border bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    item.status === "error" ? "text-red-700" : "text-cri-charcoal"
                  }`}
                >
                  {item.fileName}
                </p>
                {item.status === "uploading" ? (
                  <div className="mt-1 h-1 overflow-hidden rounded bg-gray-200">
                    <div className="h-full w-1/3 animate-pulse rounded bg-cri-green" />
                  </div>
                ) : item.status === "error" ? (
                  <p className="text-xs text-red-600">{item.error}</p>
                ) : (
                  <p className="text-xs text-cri-steel">
                    {formatFileSize(item.sizeBytes)}
                  </p>
                )}
              </div>
              {item.status === "uploading" ? (
                <span className="text-xs text-cri-steel">Uploading…</span>
              ) : item.status === "done" ? (
                <span
                  className="text-sm font-semibold text-cri-green"
                  aria-label="Uploaded"
                >
                  ✓
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.fileName}`}
                className="rounded p-1 text-cri-steel transition-colors hover:text-cri-charcoal"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
