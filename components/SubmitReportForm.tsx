"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import {
  submitReportAction,
  type SubmitReportState,
} from "@/app/submit-report/actions";
import {
  ENTITY_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  RESPONSE_TIME_LABELS,
  CONTRACT_VALUE_RANGES,
  YES_NO_UNSURE,
  PAYMENT_LATE_OPTIONS,
  optionsFromLabels,
  type Option,
} from "@/lib/constants";
import { FormErrorMessage } from "./FormErrorMessage";
import { AlertIcon, LockIcon, ShieldCheckIcon } from "./Icons";

type Errors = Record<string, string[] | undefined>;

const initialState: SubmitReportState = { ok: false };

// ---- Reusable field primitives -------------------------------------------

function Field({
  label,
  htmlFor,
  required,
  hint,
  privacy,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  privacy?: "private" | "public";
  error?: string[];
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-cri-charcoal">
          {label}
          {required ? <span className="text-cri-amber-dark"> *</span> : null}
        </label>
        {privacy === "private" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-cri-steel">
            <LockIcon className="h-3 w-3" /> Private
          </span>
        ) : privacy === "public" ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-cri-green">
            Shown publicly
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="mt-1 text-xs text-cri-steel">{hint}</p> : null}
      <FormErrorMessage message={error} />
    </div>
  );
}

function TextField({
  name,
  label,
  errors,
  type = "text",
  required,
  hint,
  privacy,
  placeholder,
  ...rest
}: {
  name: string;
  label: string;
  errors: Errors;
  type?: string;
  required?: boolean;
  hint?: string;
  privacy?: "private" | "public";
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      privacy={privacy}
      error={errors[name]}
    >
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="input"
        {...rest}
      />
    </Field>
  );
}

function SelectField({
  name,
  label,
  options,
  errors,
  required,
  hint,
  placeholder = "Select…",
  defaultValue = "",
}: {
  name: string;
  label: string;
  options: Option[];
  errors: Errors;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <Field
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      error={errors[name]}
    >
      <select id={name} name={name} className="input" defaultValue={defaultValue}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TextAreaField({
  name,
  label,
  errors,
  required,
  hint,
  privacy,
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  errors: Errors;
  required?: boolean;
  hint?: string;
  privacy?: "private" | "public";
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field
      label={label}
      htmlFor={name}
      required={required}
      hint={hint}
      privacy={privacy}
      error={errors[name]}
    >
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="input"
      />
    </Field>
  );
}

function Checkbox({
  name,
  label,
  errors,
}: {
  name: string;
  label: string;
  errors: Errors;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 rounded-lg border border-cri-border bg-white p-3 text-sm text-cri-charcoal">
        <input
          type="checkbox"
          name={name}
          className="mt-0.5 h-4 w-4 rounded border-cri-border text-cri-green focus:ring-cri-green"
        />
        <span>{label}</span>
      </label>
      <FormErrorMessage message={errors[name]} />
    </div>
  );
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cri-green/10 text-sm font-bold text-cri-green">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-cri-charcoal">{title}</h2>
        {description ? (
          <p className="text-sm text-cri-steel">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary gap-2" disabled={pending}>
      <ShieldCheckIcon className="h-4 w-4" />
      {pending ? "Submitting…" : "Submit report for moderation"}
    </button>
  );
}

// ---- Form ----------------------------------------------------------------

export function SubmitReportForm() {
  const [state, formAction] = useFormState(submitReportAction, initialState);
  const errors: Errors = state.errors ?? {};

  const entityOptions = optionsFromLabels(ENTITY_TYPE_LABELS);
  const projectTypeOptions = optionsFromLabels(PROJECT_TYPE_LABELS);
  const projectStatusOptions = optionsFromLabels(PROJECT_STATUS_LABELS);
  const riskOptions = optionsFromLabels(RISK_LEVEL_LABELS);
  const responseOptions = optionsFromLabels(RESPONSE_TIME_LABELS);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.formError ? (
        <div className="flex items-start gap-2 rounded-lg border border-cri-amber/40 bg-cri-amber-light p-4 text-sm text-cri-amber-dark">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {state.formError}
        </div>
      ) : null}

      {/* 1. Reporter details */}
      <section className="card p-6 shadow-card">
        <SectionHeading
          step={1}
          title="Your details"
          description="Reporter details are private and never shown publicly."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            name="reporterCompanyName"
            label="Reporter company name"
            errors={errors}
            required
            privacy="private"
          />
          <TextField
            name="reporterContactName"
            label="Reporter contact name"
            errors={errors}
            required
            privacy="private"
          />
          <TextField
            name="reporterEmail"
            label="Reporter email"
            type="email"
            errors={errors}
            required
            privacy="private"
          />
          <TextField
            name="reporterPhone"
            label="Reporter phone"
            type="tel"
            errors={errors}
            privacy="private"
          />
          <TextField
            name="reporterTradeType"
            label="Trade type"
            errors={errors}
            required
            placeholder="e.g. Joinery, Electrical, Roofing"
          />
        </div>
      </section>

      {/* 2. Entity being reported */}
      <section className="card p-6 shadow-card">
        <SectionHeading
          step={2}
          title="Entity being reported"
          description="For residential clients, provide initials only — never a full name."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            name="entityType"
            label="Entity type"
            options={entityOptions}
            errors={errors}
            required
          />
          <SelectField
            name="isResidential"
            label="Is this a private residential client?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            errors={errors}
            required
            placeholder="Select…"
          />
          <TextField
            name="entityName"
            label="Entity / company name"
            errors={errors}
            hint="Required for non-residential entities (companies, developers, PM/QS)."
          />
          <TextField
            name="clientInitials"
            label="Client initials (residential)"
            errors={errors}
            placeholder="e.g. C.A."
            hint="Required for residential clients. Use initials only."
          />
          <TextField
            name="projectAddressLine1"
            label="Project address line 1"
            errors={errors}
            privacy="private"
          />
          <TextField
            name="projectCity"
            label="Project city"
            errors={errors}
          />
          <TextField
            name="projectPostcode"
            label="Project postcode"
            errors={errors}
            privacy="private"
            hint="Only an area prefix (e.g. SW19) is ever shown publicly."
          />
          <TextField
            name="publicArea"
            label="Public area"
            errors={errors}
            required
            privacy="public"
            placeholder="e.g. SW19, NW London, Manchester"
          />
        </div>
      </section>

      {/* 3. Project details */}
      <section className="card p-6 shadow-card">
        <SectionHeading step={3} title="Project details" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            name="projectType"
            label="Project type"
            options={projectTypeOptions}
            errors={errors}
            required
          />
          <SelectField
            name="contractValueRange"
            label="Contract value range"
            options={CONTRACT_VALUE_RANGES}
            errors={errors}
          />
          <TextField
            name="startDate"
            label="Start date"
            type="date"
            errors={errors}
          />
          <SelectField
            name="projectStatus"
            label="Completion / status"
            options={projectStatusOptions}
            errors={errors}
            required
          />
        </div>
      </section>

      {/* 4. Risk scoring */}
      <section className="card p-6 shadow-card">
        <SectionHeading
          step={4}
          title="Risk scoring"
          description="Scores are 0–10. Lower scores indicate higher risk."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            name="paymentScore"
            label="Payment Score (0–10)"
            type="number"
            min={0}
            max={10}
            step={0.1}
            errors={errors}
            required
          />
          <TextField
            name="communicationScore"
            label="Communication Score (0–10)"
            type="number"
            min={0}
            max={10}
            step={0.1}
            errors={errors}
            required
          />
          <SelectField
            name="variationRisk"
            label="Variation Risk"
            options={riskOptions}
            errors={errors}
            required
          />
          <SelectField
            name="disputeRisk"
            label="Dispute Risk"
            options={riskOptions}
            errors={errors}
            required
          />
          <SelectField
            name="averageResponseTime"
            label="Average response time"
            options={responseOptions}
            errors={errors}
          />
          <SelectField
            name="extrasRequestedWithoutApprovedCost"
            label="Extras requested without approved cost?"
            options={YES_NO_UNSURE}
            errors={errors}
          />
          <SelectField
            name="paymentLate"
            label="Was payment late?"
            options={PAYMENT_LATE_OPTIONS}
            errors={errors}
          />
          <TextField
            name="paymentDelayDays"
            label="Payment delay (days)"
            type="number"
            min={0}
            errors={errors}
          />
          <TextField
            name="amountUnpaid"
            label="Amount unpaid (£, optional)"
            type="number"
            min={0}
            errors={errors}
          />
          <SelectField
            name="formalDispute"
            label="Formal dispute / adjudication / legal action?"
            options={YES_NO_UNSURE}
            errors={errors}
          />
        </div>
      </section>

      {/* 5. Description */}
      <section className="card p-6 shadow-card">
        <SectionHeading step={5} title="Description" />
        <div className="mt-5 grid gap-4">
          <TextAreaField
            name="issueDescription"
            label="Issue description"
            errors={errors}
            required
            privacy="private"
            rows={5}
            hint="Full detail held for moderation. Stick to factual, first-hand experience."
          />
          <TextAreaField
            name="publicSummary"
            label="Public summary suggestion"
            errors={errors}
            privacy="public"
            rows={3}
            hint="A short, neutral summary CRI may use publicly after moderation."
          />
        </div>
      </section>

      {/* 6. Evidence */}
      <section className="card p-6 shadow-card">
        <SectionHeading
          step={6}
          title="Evidence"
          description="Evidence strengthens a report and supports moderation."
        />
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-cri-border bg-cri-bg p-4 text-sm text-cri-steel">
            <LockIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium text-cri-charcoal">
                Evidence upload coming soon
              </p>
              <p>
                File uploads aren&rsquo;t enabled in this MVP. For now, describe
                your evidence below — CRI may request copies during moderation.
              </p>
            </div>
          </div>
          <TextAreaField
            name="evidenceDescription"
            label="Describe your evidence"
            errors={errors}
            rows={3}
            hint="e.g. signed contract, dated invoices, email correspondence, photos."
          />
        </div>
      </section>

      {/* 7. Confirmations */}
      <section className="card p-6 shadow-card">
        <SectionHeading step={7} title="Confirmations" />
        <div className="mt-5 space-y-3">
          <Checkbox
            name="confirmRealExperience"
            label="I confirm this report is based on my real business experience."
            errors={errors}
          />
          <Checkbox
            name="confirmCanProvideEvidence"
            label="I confirm I can provide evidence if requested."
            errors={errors}
          />
          <Checkbox
            name="confirmModeration"
            label="I understand CRI may moderate, edit, anonymise, restrict or reject this report before publication."
            errors={errors}
          />
          <Checkbox
            name="confirmNotAutomatic"
            label="I understand this report will not be published automatically."
            errors={errors}
          />
        </div>
      </section>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        <p className="text-xs text-cri-steel">
          Your report defaults to <strong>Pending</strong> and is reviewed before
          any publication.
        </p>
      </div>
    </form>
  );
}
