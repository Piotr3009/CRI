"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitRightToReplyAction, type ReplyState } from "./actions";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { ShieldCheckIcon } from "@/components/Icons";

const initialState: ReplyState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Sending…" : "Request Review / Right to Reply"}
    </button>
  );
}

export function RightToReplyForm({ reportId }: { reportId: string }) {
  const [state, formAction] = useFormState(
    submitRightToReplyAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-cri-green/30 bg-cri-green/5 p-4">
        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-cri-green" />
        <p className="text-sm text-cri-charcoal">{state.message}</p>
      </div>
    );
  }

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="riskReportId" value={reportId} />

      {state.message ? (
        <p className="text-sm font-medium text-cri-amber-dark">{state.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="responderName" className="label">
            Your name
          </label>
          <input
            id="responderName"
            name="responderName"
            type="text"
            className="input"
          />
          <FormErrorMessage message={errors.responderName} />
        </div>
        <div>
          <label htmlFor="responderEmail" className="label">
            Your email
          </label>
          <input
            id="responderEmail"
            name="responderEmail"
            type="email"
            className="input"
          />
          <FormErrorMessage message={errors.responderEmail} />
        </div>
      </div>

      <div>
        <label htmlFor="responseText" className="label">
          Your response
        </label>
        <textarea
          id="responseText"
          name="responseText"
          rows={4}
          className="input"
          placeholder="Explain your connection to this report and what you would like reviewed."
        />
        <FormErrorMessage message={errors.responseText} />
      </div>

      <SubmitButton />
      <p className="text-xs text-cri-steel">
        Submissions are reviewed by moderation and are not published
        automatically.
      </p>
    </form>
  );
}
