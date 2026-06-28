import type { ReactNode } from "react";
import type { Evidence, RightToReply, RiskReport } from "@prisma/client";
import {
  ENTITY_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  RESPONSE_TIME_LABELS,
  EVIDENCE_STATUS_LABELS,
  VISIBILITY_LABELS,
  MODERATION_STATUS_LABELS,
  CONTRACT_VALUE_LABELS,
  YES_NO_UNSURE_LABELS,
  optionsFromLabels,
} from "@/lib/constants";
import { formatDate, formatCurrencyGBP } from "@/lib/format";
import { calculateOverallRisk, isResidentialEntity } from "@/lib/privacy";
import { BEHAVIOUR_QUESTIONS, BEHAVIOUR_ANSWER_LABELS } from "@/lib/behaviourQuestions";
import {
  moderateAction,
  setEvidenceStatusAction,
  setVisibilityAction,
  savePublicSummaryAction,
} from "@/app/admin/actions";
import { RiskBadge } from "./RiskBadge";
import { EvidenceBadge } from "./EvidenceBadge";
import { VisibilityBadge } from "./VisibilityBadge";
import { LockIcon } from "./Icons";

type FullReport = RiskReport & {
  evidence: Evidence[];
  rightToReplies: RightToReply[];
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-cri-border py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-cri-steel">{label}</dt>
      <dd className="text-sm font-medium text-cri-charcoal sm:text-right">
        {children}
      </dd>
    </div>
  );
}

export function AdminReportDetail({ report }: { report: FullReport }) {
  const residential = isResidentialEntity(report);
  const evidenceOptions = optionsFromLabels(EVIDENCE_STATUS_LABELS);
  const visibilityOptions = optionsFromLabels(VISIBILITY_LABELS);

  return (
    <div className="space-y-6">
      {/* Header + moderation actions */}
      <div className="card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cri-steel">
              {ENTITY_TYPE_LABELS[report.entityType]}
            </p>
            <h1 className="mt-1 text-xl font-bold text-cri-charcoal">
              {residential
                ? `Residential — ${report.clientInitials ?? "—"}`
                : report.entityName ?? "—"}
            </h1>
            <p className="text-sm text-cri-steel">
              {report.publicArea} · Submitted {formatDate(report.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={calculateOverallRisk(report)} label="Overall" />
            <EvidenceBadge status={report.evidenceStatus} />
            <VisibilityBadge visibility={report.visibility} />
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-cri-border bg-cri-bg p-4">
          <p className="mb-3 text-sm font-semibold text-cri-charcoal">
            Moderation status —{" "}
            {MODERATION_STATUS_LABELS[report.moderationStatus]}
          </p>
          <form action={moderateAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={report.id} />
            <button
              type="submit"
              name="status"
              value="APPROVED"
              className="rounded-lg bg-cri-green px-4 py-2 text-sm font-semibold text-white hover:bg-cri-green-dark"
            >
              Approve
            </button>
            <button
              type="submit"
              name="status"
              value="DISPUTED"
              className="rounded-lg border border-cri-amber-dark/40 bg-[#F4DFB6] px-4 py-2 text-sm font-semibold text-cri-amber-dark"
            >
              Mark as disputed
            </button>
            <button
              type="submit"
              name="status"
              value="REJECTED"
              className="rounded-lg border border-cri-border bg-white px-4 py-2 text-sm font-semibold text-cri-charcoal hover:bg-cri-bg"
            >
              Reject
            </button>
            <button
              type="submit"
              name="status"
              value="PENDING"
              className="rounded-lg border border-cri-border bg-white px-4 py-2 text-sm font-semibold text-cri-steel hover:bg-cri-bg"
            >
              Reset to pending
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evidence status + visibility */}
        <div className="card p-6 shadow-card">
          <h2 className="text-base font-semibold text-cri-charcoal">
            Evidence &amp; visibility
          </h2>

          <form
            action={setEvidenceStatusAction}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="id" value={report.id} />
            <div className="flex-1">
              <label htmlFor="evidenceStatus" className="label">
                Evidence status
              </label>
              <select
                id="evidenceStatus"
                name="evidenceStatus"
                defaultValue={report.evidenceStatus}
                className="input"
              >
                {evidenceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Save
            </button>
          </form>

          <form
            action={setVisibilityAction}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="id" value={report.id} />
            <div className="flex-1">
              <label htmlFor="visibility" className="label">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue={report.visibility}
                className="input"
              >
                {visibilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Save
            </button>
          </form>

          {residential ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-cri-amber-light p-3 text-xs text-cri-amber-dark">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
              Residential record. Keep visibility restricted unless full public
              disclosure is legally appropriate.
            </p>
          ) : null}
        </div>

        {/* Public summary editor */}
        <div className="card p-6 shadow-card">
          <h2 className="text-base font-semibold text-cri-charcoal">
            Public summary
          </h2>
          <p className="mt-1 text-xs text-cri-steel">
            This is the only narrative shown publicly. Keep it neutral and
            factual.
          </p>
          <form action={savePublicSummaryAction} className="mt-3">
            <input type="hidden" name="id" value={report.id} />
            <textarea
              name="publicSummary"
              rows={5}
              defaultValue={report.publicSummary ?? ""}
              className="input"
              placeholder="Moderated public summary…"
            />
            <button type="submit" className="btn-secondary mt-3">
              Save public summary
            </button>
          </form>
        </div>
      </div>

      {/* Scores */}
      <div className="card p-6 shadow-card">
        <h2 className="text-base font-semibold text-cri-charcoal">
          Risk scoring
        </h2>
        <dl className="mt-3">
          <Row label="Payment Score">{report.paymentScore.toFixed(1)} / 10</Row>
          <Row label="Communication Score">
            {report.communicationScore.toFixed(1)} / 10
          </Row>
          <Row label="Variation Risk">
            <RiskBadge level={report.variationRisk} />
          </Row>
          <Row label="Dispute Risk">
            <RiskBadge level={report.disputeRisk} />
          </Row>
          <Row label="Average response time">
            {report.averageResponseTime
              ? RESPONSE_TIME_LABELS[report.averageResponseTime]
              : "—"}
          </Row>
          <Row label="Extras without approved cost">
            {report.extrasRequestedWithoutApprovedCost
              ? YES_NO_UNSURE_LABELS[report.extrasRequestedWithoutApprovedCost]
              : "—"}
          </Row>
          <Row label="Payment late">
            {report.paymentLate
              ? YES_NO_UNSURE_LABELS[report.paymentLate]
              : "—"}
          </Row>
          <Row label="Payment delay (days)">
            {report.paymentDelayDays ?? "—"}
          </Row>
          <Row label="Amount unpaid">
            {formatCurrencyGBP(report.amountUnpaid) ?? "—"}
          </Row>
          <Row label="Formal dispute / legal action">
            {report.formalDispute
              ? YES_NO_UNSURE_LABELS[report.formalDispute]
              : "—"}
          </Row>
        </dl>
      </div>

      {/* Behaviour — raw answers (same questions the public report averages) */}
      <div className="card p-6 shadow-card">
        <h2 className="text-base font-semibold text-cri-charcoal">Behaviour</h2>
        <p className="mt-1 text-xs text-cri-steel">
          This reporter&apos;s raw answers. The public report shows the average of
          these (as gauges) across all reports for the company.
        </p>
        <dl className="mt-3">
          {BEHAVIOUR_QUESTIONS.map((q) => (
            <Row key={q.key} label={q.label}>
              {report[q.key] ? BEHAVIOUR_ANSWER_LABELS[report[q.key]!] : "—"}
            </Row>
          ))}
          <Row label="Site ready for their stage (1–10)">
            {report.projectReadinessScore ?? "—"}
          </Row>
        </dl>
      </div>

      {/* Project + private details */}
      <div className="card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <LockIcon className="h-4 w-4 text-cri-amber-dark" />
          <h2 className="text-base font-semibold text-cri-charcoal">
            Private details — admin only
          </h2>
        </div>
        <p className="mt-1 text-xs text-cri-steel">
          These fields are never exposed on public pages.
        </p>
        <dl className="mt-3">
          <Row label="Project type">
            {PROJECT_TYPE_LABELS[report.projectType]}
          </Row>
          <Row label="Project status">
            {PROJECT_STATUS_LABELS[report.projectStatus]}
          </Row>
          <Row label="Contract value">
            {report.contractValueRange
              ? CONTRACT_VALUE_LABELS[report.contractValueRange]
              : "—"}
          </Row>
          <Row label="Start date">{formatDate(report.startDate)}</Row>
          <Row label="Finish date">{formatDate(report.finishDate)}</Row>
          <Row label="Entity name (full)">{report.entityName ?? "—"}</Row>
          <Row label="Companies House no.">
            {report.companiesHouseNumber ?? "—"}
          </Row>
          <Row label="Client initials">{report.clientInitials ?? "—"}</Row>
          <Row label="Address line 1">
            {report.projectAddressLine1 ?? "—"}
          </Row>
          <Row label="City">{report.projectCity ?? "—"}</Row>
          <Row label="Postcode (full)">{report.projectPostcode ?? "—"}</Row>
          <Row label="Reporter company">{report.reporterCompanyName}</Row>
          <Row label="Reporter contact">{report.reporterContactName}</Row>
          <Row label="Reporter email">{report.reporterEmail}</Row>
          <Row label="Reporter phone">{report.reporterPhone ?? "—"}</Row>
          <Row label="Reporter trade">{report.reporterTradeType}</Row>
        </dl>
        <div className="mt-4">
          <p className="text-sm font-medium text-cri-steel">
            Issue description (private)
          </p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-cri-border bg-cri-bg p-3 text-sm text-cri-charcoal">
            {report.issueDescription}
          </p>
        </div>
      </div>

      {/* Evidence */}
      <div className="card p-6 shadow-card">
        <h2 className="text-base font-semibold text-cri-charcoal">
          Evidence ({report.evidence.length})
        </h2>
        {report.evidence.length === 0 ? (
          <p className="mt-2 text-sm text-cri-steel">No evidence attached.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.evidence.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-cri-border bg-cri-bg p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-cri-charcoal">{e.type}</span>
                  <span className="text-xs text-cri-steel">{e.status}</span>
                </div>
                {e.description ? (
                  <p className="mt-1 text-cri-steel">{e.description}</p>
                ) : null}
                {e.fileUrl ? (
                  <p className="mt-1 break-all text-xs text-cri-green">
                    {e.fileUrl}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right to reply submissions */}
      <div className="card p-6 shadow-card">
        <h2 className="text-base font-semibold text-cri-charcoal">
          Right to reply ({report.rightToReplies.length})
        </h2>
        {report.rightToReplies.length === 0 ? (
          <p className="mt-2 text-sm text-cri-steel">
            No right-to-reply submissions.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.rightToReplies.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-cri-border bg-cri-bg p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-cri-charcoal">
                    {r.responderName}
                  </span>
                  <span className="text-xs text-cri-steel">{r.status}</span>
                </div>
                <p className="text-xs text-cri-steel">{r.responderEmail}</p>
                <p className="mt-1 whitespace-pre-wrap text-cri-charcoal">
                  {r.responseText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
