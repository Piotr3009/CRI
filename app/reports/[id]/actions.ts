"use server";

import { rightToReplySchema } from "@/lib/validation";
import { createRightToReply, getPublicRiskReportById } from "@/lib/reports";

export type ReplyState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * Right-to-reply submission. Anyone connected to a report can request a review
 * or submit a response. Submissions are stored as PENDING and reviewed by
 * moderation before anything is published.
 */
export async function submitRightToReplyAction(
  _prevState: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = rightToReplySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Only accept replies against reports that are actually publicly visible.
  const report = await getPublicRiskReportById(parsed.data.riskReportId);
  if (!report) {
    return { ok: false, message: "We couldn’t find that report." };
  }

  try {
    await createRightToReply(parsed.data);
  } catch (error) {
    console.error("Failed to create right to reply", error);
    return {
      ok: false,
      message: "Something went wrong. Please try again shortly.",
    };
  }

  return {
    ok: true,
    message:
      "Thank you. Your request has been received and will be reviewed by our moderation team.",
  };
}
