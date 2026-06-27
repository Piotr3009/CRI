"use client";

import { useState } from "react";
import {
  submitPrivateClientReport,
  submitCommercialClientReport,
} from "@/app/submit-report/actions";
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  CONTRACT_VALUE_RANGES,
  optionsFromLabels,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

type TypeTile = {
  value: string;
  title: string;
  subtitle: string;
  active: boolean;
};

const TYPE_TILES: TypeTile[] = [
  { value: "RESIDENTIAL_CLIENT", title: "Private client", subtitle: "individual", active: true },
  { value: "COMMERCIAL_CLIENT", title: "Commercial client", subtitle: "company / investor", active: true },
  { value: "MAIN_CONTRACTOR", title: "Main contractor", subtitle: "pays subcontractors", active: false },
  { value: "ARCHITECT_PM", title: "Architect / PM", subtitle: "service provider", active: false },
  { value: "PROJECT_MANAGER", title: "Project manager", subtitle: "service provider", active: false },
  { value: "QUANTITY_SURVEYOR", title: "Quantity surveyor", subtitle: "service provider", active: false },
];

const BEHAVIOUR_QUESTIONS: { key: BehaviourKey; label: string }[] = [
  { key: "behaviourExtraWorkNoCost", label: "Did the client request additional or changed work without agreeing to the extra cost?" },
  { key: "behaviourAskedCostUpfront", label: "Did the client ask about the cost before instructing work?" },
  { key: "behaviourExpectedFreeLogistics", label: "Did the client expect free organisation / logistics (samples, space for other trades, coordination)?" },
  { key: "behaviourKeptAgreements", label: "Did the client keep to what was agreed?" },
  { key: "behaviourCommunicationSmooth", label: "Did cooperation and communication run smoothly?" },
  { key: "behaviourWouldRecommend", label: "Would you recommend this client to other contractors?" },
];

const EVIDENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "INVOICES", label: "Invoices / contract" },
  { value: "SMS_EMAIL", label: "SMS / email / messages" },
  { value: "PHOTOS", label: "Photos" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "OTHER", label: "Other" },
];

const CONSENT_ITEMS: { key: keyof Consents; label: string }[] = [
  { key: "realExperience", label: "I confirm this is based on my own real, first-hand experience." },
  { key: "canProvide", label: "I can provide evidence on request from CTX." },
  { key: "allowModeration", label: "I understand CTX may moderate, anonymise, restrict or reject this report." },
  { key: "notAutoPublished", label: "I understand this report is not published automatically." },
  { key: "notRevenge", label: "I confirm this is a fair account, not malicious or revenge." },
];

const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tri = "YES" | "SOMETIMES" | "NO" | "";

type BehaviourKey =
  | "behaviourExtraWorkNoCost"
  | "behaviourAskedCostUpfront"
  | "behaviourExpectedFreeLogistics"
  | "behaviourKeptAgreements"
  | "behaviourCommunicationSmooth"
  | "behaviourWouldRecommend";

type Consents = {
  realExperience: boolean;
  canProvide: boolean;
  allowModeration: boolean;
  notAutoPublished: boolean;
  notRevenge: boolean;
};

type PayRow = { daysLate: string; amountGbp: string };

type Errors = Record<string, string>;

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-cri-charcoal focus:border-cri-green focus:outline-none focus:ring-1 focus:ring-cri-green";

function inp(hasError?: string) {
  return (
    inputClass +
    (hasError
      ? " border-red-400 focus:border-red-400 focus:ring-red-400"
      : "")
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-cri-charcoal">{title}</h2>
      {description && <p className="mt-1 text-sm text-cri-steel">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-cri-charcoal">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error ? (
        <Err msg={error} />
      ) : hint ? (
        <p className="mt-1 text-xs text-cri-steel">{hint}</p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inp(error)}
    >
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TriState({
  value,
  onChange,
}: {
  value: Tri;
  onChange: (v: Tri) => void;
}) {
  const opts: { v: Exclude<Tri, "">; label: string }[] = [
    { v: "YES", label: "Yes" },
    { v: "SOMETIMES", label: "Sometimes" },
    { v: "NO", label: "No" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={
            "rounded-md px-3 py-1.5 text-sm transition " +
            (value === o.v
              ? "bg-cri-green text-white"
              : "text-cri-steel hover:bg-gray-100")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SubmitReportFlow() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Reporter (manual for now — comes from the account once auth ships)
  const [reporterCompanyName, setReporterCompanyName] = useState("");
  const [reporterContactName, setReporterContactName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterTradeType, setReporterTradeType] = useState("");

  // Entity (private = initials; commercial = company name + full address)
  const [clientInitials, setClientInitials] = useState("");
  const [entityName, setEntityName] = useState("");
  const [projectAddressLine1, setProjectAddressLine1] = useState("");
  const [projectCity, setProjectCity] = useState("");
  const [projectPostcode, setProjectPostcode] = useState("");
  const [projectType, setProjectType] = useState("");
  const [contractValueRange, setContractValueRange] = useState("");
  const [startDate, setStartDate] = useState("");
  const [projectStatus, setProjectStatus] = useState("");

  // Commercial-only: court dispute
  const [courtDispute, setCourtDispute] = useState("");

  // Payments
  const [payRows, setPayRows] = useState<PayRow[]>([{ daysLate: "", amountGbp: "" }]);

  // Debts (> 60 days)
  const [hasDebts, setHasDebts] = useState(false);
  const [abandonedCount, setAbandonedCount] = useState("");
  const [abandonedTotal, setAbandonedTotal] = useState("");

  // Behaviour
  const [behaviour, setBehaviour] = useState<Record<BehaviourKey, Tri>>({
    behaviourExtraWorkNoCost: "",
    behaviourAskedCostUpfront: "",
    behaviourExpectedFreeLogistics: "",
    behaviourKeptAgreements: "",
    behaviourCommunicationSmooth: "",
    behaviourWouldRecommend: "",
  });

  // Narrative / evidence / consents
  const [issueDescription, setIssueDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [consents, setConsents] = useState<Consents>({
    realExperience: false,
    canProvide: false,
    allowModeration: false,
    notAutoPublished: false,
    notRevenge: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPrivate = selectedType === "RESIDENTIAL_CLIENT";
  const isCommercial = selectedType === "COMMERCIAL_CLIENT";
  const isPaying = isPrivate || isCommercial;

  // --- Payment count control -------------------------------------------------
  function setPaymentCount(nRaw: number) {
    const n = Math.max(1, Math.min(20, Math.floor(nRaw || 1)));
    setPayRows((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ daysLate: "", amountGbp: "" });
      next.length = n;
      return next;
    });
  }

  function updatePayRow(i: number, patch: Partial<PayRow>) {
    setPayRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  function toggleEvidence(v: string) {
    setEvidence((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function toggleConsent(k: keyof Consents) {
    setConsents((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  // --- Validation: build an errors map keyed by field id ---------------------
  function validate(): Errors {
    const e: Errors = {};

    if (!reporterCompanyName.trim()) e.reporterCompanyName = "Required";
    if (!reporterContactName.trim()) e.reporterContactName = "Required";
    if (!reporterEmail.trim()) e.reporterEmail = "Required";
    else if (!EMAIL_RE.test(reporterEmail.trim()))
      e.reporterEmail = "Enter a valid email";
    if (!reporterTradeType.trim()) e.reporterTradeType = "Required";

    if (isCommercial) {
      if (!entityName.trim()) e.entityName = "Required";
      if (!projectCity.trim()) e.projectCity = "Required";
      if (projectPostcode.trim().length < 2) e.projectPostcode = "Enter a postcode";
      if (courtDispute !== "YES" && courtDispute !== "NO")
        e.courtDispute = "Please answer";
    } else {
      if (!clientInitials.trim()) e.clientInitials = "Required";
      if (projectPostcode.trim().length < 2) e.projectPostcode = "Enter a postcode";
    }

    if (!projectType) e.projectType = "Select a project type";
    if (!projectStatus) e.projectStatus = "Select a status";

    payRows.forEach((r, i) => {
      const n = Number(r.daysLate);
      if (r.daysLate.trim() === "" || !Number.isInteger(n) || n < 0) {
        e[`pay_${i}`] = "Enter days (0 = on time)";
      }
    });

    if (hasDebts) {
      const n = Number(abandonedCount);
      if (abandonedCount.trim() === "" || !Number.isInteger(n) || n < 0) {
        e.abandonedCount = "Enter a number";
      }
    }

    BEHAVIOUR_QUESTIONS.forEach((q) => {
      if (behaviour[q.key] === "") e[`beh_${q.key}`] = "Please answer";
    });

    CONSENT_ITEMS.forEach((c) => {
      if (!consents[c.key]) e[`con_${c.key}`] = "Required";
    });

    return e;
  }

  const allErrors = validate();
  const errors: Errors = showErrors ? allErrors : {};
  const hasNoErrors = Object.keys(allErrors).length === 0;

  // Ordered ids for "scroll to first problem".
  const errorOrder: string[] = [
    "reporterCompanyName",
    "reporterContactName",
    "reporterEmail",
    "reporterTradeType",
    "entityName",
    "clientInitials",
    "projectCity",
    "projectPostcode",
    "projectType",
    "projectStatus",
    "courtDispute",
    ...payRows.map((_, i) => `pay_${i}`),
    "abandonedCount",
    ...BEHAVIOUR_QUESTIONS.map((q) => `beh_${q.key}`),
    ...CONSENT_ITEMS.map((c) => `con_${c.key}`),
  ];

  // --- Submit ----------------------------------------------------------------
  async function handleSubmit() {
    setFormError(null);
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setShowErrors(true);
      const firstKey = errorOrder.find((k) => errs[k]);
      if (firstKey) {
        setTimeout(() => {
          document
            .getElementById(firstKey)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
      }
      return;
    }

    setSubmitting(true);

    const shared = {
      reporterCompanyName: reporterCompanyName.trim(),
      reporterContactName: reporterContactName.trim(),
      reporterEmail: reporterEmail.trim(),
      reporterPhone: reporterPhone.trim(),
      reporterTradeType: reporterTradeType.trim(),

      projectPostcode: projectPostcode.trim(),
      projectType,
      contractValueRange,
      startDate,
      projectStatus,

      payments: payRows.map((r) => ({
        daysLate: Number(r.daysLate),
        amountGbp: r.amountGbp.trim() === "" ? null : Number(r.amountGbp),
      })),

      abandonedInvoicesCount:
        hasDebts && abandonedCount.trim() !== "" ? Number(abandonedCount) : null,
      abandonedInvoicesTotalGbp:
        hasDebts && abandonedTotal.trim() !== "" ? Number(abandonedTotal) : null,

      behaviourExtraWorkNoCost: behaviour.behaviourExtraWorkNoCost,
      behaviourAskedCostUpfront: behaviour.behaviourAskedCostUpfront,
      behaviourExpectedFreeLogistics: behaviour.behaviourExpectedFreeLogistics,
      behaviourKeptAgreements: behaviour.behaviourKeptAgreements,
      behaviourCommunicationSmooth: behaviour.behaviourCommunicationSmooth,
      behaviourWouldRecommend: behaviour.behaviourWouldRecommend,

      issueDescription: issueDescription.trim(),
      evidenceTypes: evidence,
      consents,
    };

    try {
      let res;
      if (isCommercial) {
        res = await submitCommercialClientReport({
          ...shared,
          entityName: entityName.trim(),
          projectAddressLine1: projectAddressLine1.trim(),
          projectCity: projectCity.trim(),
          courtDispute,
        });
      } else {
        res = await submitPrivateClientReport({
          ...shared,
          clientInitials: clientInitials.trim(),
        });
      }
      // On success the action redirects; only an error returns a result here.
      if (res && !res.ok) {
        setFormError(res.formError ?? "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // --- Render ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Step 1 — reporter (temporary manual block) */}
      <Section
        title="Your details"
        description="Temporary — these will come from your verified account once sign-in is live. Private, never shown publicly."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your company name" required error={errors.reporterCompanyName}>
            <input
              id="reporterCompanyName"
              className={inp(errors.reporterCompanyName)}
              value={reporterCompanyName}
              onChange={(e) => setReporterCompanyName(e.target.value)}
            />
          </Field>
          <Field label="Contact name" required error={errors.reporterContactName}>
            <input
              id="reporterContactName"
              className={inp(errors.reporterContactName)}
              value={reporterContactName}
              onChange={(e) => setReporterContactName(e.target.value)}
            />
          </Field>
          <Field label="Email" required error={errors.reporterEmail}>
            <input
              id="reporterEmail"
              type="email"
              className={inp(errors.reporterEmail)}
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
            />
          </Field>
          <Field
            label="Trade type"
            required
            error={errors.reporterTradeType}
            hint="e.g. Electrical, Joinery"
          >
            <input
              id="reporterTradeType"
              className={inp(errors.reporterTradeType)}
              value={reporterTradeType}
              onChange={(e) => setReporterTradeType(e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Step 2 — type picker */}
      <Section
        title="Who are you reporting?"
        description="Pick a type — the survey adapts automatically."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TYPE_TILES.map((t) => {
            const selected = selectedType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={
                  "rounded-xl border p-4 text-left shadow-sm transition " +
                  (selected
                    ? "border-cri-green bg-white ring-1 ring-cri-green "
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 ") +
                  (t.active ? "" : "opacity-80")
                }
              >
                <div className="flex items-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-cri-charcoal">
                    {t.title.charAt(0)}
                  </span>
                  {selected && (
                    <span className="ml-auto text-sm font-semibold text-cri-green">
                      ✓
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-cri-charcoal">
                  {t.title}
                </p>
                <p className="text-xs text-cri-steel">
                  {t.active ? t.subtitle : "Coming soon"}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Coming soon notice for non-active types */}
      {selectedType && !isPaying && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-cri-steel">
          This survey type is coming soon. Right now you can submit a{" "}
          <strong className="text-cri-charcoal">Private client</strong> or{" "}
          <strong className="text-cri-charcoal">Commercial client</strong>{" "}
          report.
        </div>
      )}

      {/* Step 3 — survey (private or commercial) */}
      {isPaying && (
        <>
          <Section
            title="Who you are reporting"
            description={
              isCommercial
                ? "Companies are public (Companies House) — full name and address may be shown."
                : "Private clients are recorded by initials only — never a full name."
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {isCommercial ? (
                <>
                  <Field label="Company name" required error={errors.entityName}>
                    <input
                      id="entityName"
                      className={inp(errors.entityName)}
                      placeholder="e.g. ABC Construction Ltd"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                    />
                  </Field>
                  <Field label="Address line">
                    <input
                      className={inputClass}
                      value={projectAddressLine1}
                      onChange={(e) => setProjectAddressLine1(e.target.value)}
                    />
                  </Field>
                  <Field label="City / town" required error={errors.projectCity}>
                    <input
                      id="projectCity"
                      className={inp(errors.projectCity)}
                      value={projectCity}
                      onChange={(e) => setProjectCity(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Postcode"
                    required
                    error={errors.projectPostcode}
                    hint="Full postcode — company address is public."
                  >
                    <input
                      id="projectPostcode"
                      className={inp(errors.projectPostcode)}
                      value={projectPostcode}
                      onChange={(e) => setProjectPostcode(e.target.value)}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Client initials"
                    required
                    error={errors.clientInitials}
                    hint="Initials only, e.g. C.A."
                  >
                    <input
                      id="clientInitials"
                      className={inp(errors.clientInitials)}
                      value={clientInitials}
                      onChange={(e) => setClientInitials(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Project postcode"
                    required
                    error={errors.projectPostcode}
                    hint="Only the area prefix (e.g. SW19) is ever shown publicly."
                  >
                    <input
                      id="projectPostcode"
                      className={inp(errors.projectPostcode)}
                      value={projectPostcode}
                      onChange={(e) => setProjectPostcode(e.target.value)}
                    />
                  </Field>
                </>
              )}

              <Field label="Project type" required error={errors.projectType}>
                <Select
                  id="projectType"
                  value={projectType}
                  onChange={setProjectType}
                  options={optionsFromLabels(PROJECT_TYPE_LABELS)}
                  error={errors.projectType}
                />
              </Field>
              <Field label="Contract value">
                <Select
                  value={contractValueRange}
                  onChange={setContractValueRange}
                  options={CONTRACT_VALUE_RANGES}
                />
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="Status" required error={errors.projectStatus}>
                <Select
                  id="projectStatus"
                  value={projectStatus}
                  onChange={setProjectStatus}
                  options={optionsFromLabels(PROJECT_STATUS_LABELS)}
                  error={errors.projectStatus}
                />
              </Field>
            </div>

            {isCommercial && (
              <div id="courtDispute">
                <Field
                  label="Did the dispute end up in court?"
                  required
                  error={errors.courtDispute}
                  hint="The final report shows only the number of court disputes — no details."
                >
                  <Select
                    value={courtDispute}
                    onChange={setCourtDispute}
                    options={YES_NO_OPTIONS}
                    placeholder="Select…"
                    error={errors.courtDispute}
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section
            title="Payments"
            description="Enter how many payments there were, then the days late for each. On time or early = 0. We calculate the average and score — you don't."
          >
            <Field
              label="How many payments?"
              hint="Max 20. Enter approved payments only."
            >
              <input
                type="number"
                min={1}
                max={20}
                className={inputClass + " sm:w-40"}
                value={payRows.length}
                onChange={(e) => setPaymentCount(Number(e.target.value))}
              />
            </Field>

            <div className="space-y-3">
              {payRows.map((r, i) => (
                <div id={`pay_${i}`} key={i}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto,1fr,1fr] sm:items-center">
                    <span className="text-sm font-medium text-cri-charcoal sm:w-24">
                      Payment {i + 1}
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Days late (0 = on time)"
                      className={inp(errors[`pay_${i}`])}
                      value={r.daysLate}
                      onChange={(e) =>
                        updatePayRow(i, { daysLate: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount £ (optional)"
                      className={inputClass}
                      value={r.amountGbp}
                      onChange={(e) =>
                        updatePayRow(i, { amountGbp: e.target.value })
                      }
                    />
                  </div>
                  <Err msg={errors[`pay_${i}`]} />
                </div>
              ))}
            </div>

            <p className="text-xs text-cri-steel">
              You may be asked to provide proof of payment on request.
            </p>
          </Section>

          <Section
            title="Abandoned invoices (over 60 days)"
            description="Invoices left unpaid for more than 60 days — counted separately from late payments. Proof (an approved, never-paid invoice) may be required."
          >
            <label className="flex items-center gap-2 text-sm text-cri-charcoal">
              <input
                type="checkbox"
                checked={hasDebts}
                onChange={(e) => setHasDebts(e.target.checked)}
              />
              There are invoices unpaid for more than 60 days
            </label>

            {hasDebts && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="How many abandoned invoices?"
                  required
                  error={errors.abandonedCount}
                >
                  <input
                    id="abandonedCount"
                    type="number"
                    min={0}
                    className={inp(errors.abandonedCount)}
                    value={abandonedCount}
                    onChange={(e) => setAbandonedCount(e.target.value)}
                  />
                </Field>
                <Field label="Total amount £">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={abandonedTotal}
                    onChange={(e) => setAbandonedTotal(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section
            title="Behaviour"
            description="Answer the facts. Scores are calculated later from many reports — not from this single one."
          >
            <div className="space-y-4">
              {BEHAVIOUR_QUESTIONS.map((q) => (
                <div
                  id={`beh_${q.key}`}
                  key={q.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <span className="text-sm text-cri-charcoal sm:max-w-md">
                    {q.label}
                  </span>
                  <div className="shrink-0">
                    <TriState
                      value={behaviour[q.key]}
                      onChange={(v) =>
                        setBehaviour((prev) => ({ ...prev, [q.key]: v }))
                      }
                    />
                    <Err msg={errors[`beh_${q.key}`]} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Description & evidence"
            description="Optional. Held privately for moderation — never published as written."
          >
            <Field
              label="Describe the situation"
              hint="Max 1000 characters. Facts, first-hand."
            >
              <textarea
                className={inputClass + " min-h-[120px]"}
                maxLength={1000}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
            </Field>

            <div>
              <span className="block text-sm font-medium text-cri-charcoal">
                What evidence do you hold?
              </span>
              <div className="mt-2 flex flex-wrap gap-3">
                {EVIDENCE_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex items-center gap-2 text-sm text-cri-charcoal"
                  >
                    <input
                      type="checkbox"
                      checked={evidence.includes(o.value)}
                      onChange={() => toggleEvidence(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Upload placeholder — secure file storage is a future module */}
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cri-charcoal">
                    Upload supporting documents
                  </p>
                  <p className="text-xs text-cri-steel">
                    Secure file upload is coming soon. For now, tick what you
                    hold above — CTX may request it.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg border border-gray-300 px-3 py-2 text-sm text-cri-steel"
                >
                  Coming soon
                </button>
              </div>
            </div>
          </Section>

          <Section title="Confirmations" description="All required.">
            <div className="space-y-3">
              {CONSENT_ITEMS.map((c) => (
                <div id={`con_${c.key}`} key={c.key}>
                  <label className="flex items-start gap-2 text-sm text-cri-charcoal">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={consents[c.key]}
                      onChange={() => toggleConsent(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                  <Err msg={errors[`con_${c.key}`]} />
                </div>
              ))}
            </div>
          </Section>

          {showErrors && !hasNoErrors && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Please fix the highlighted fields above, then submit again.
            </p>
          )}

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-cri-green px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit report for moderation"}
          </button>
        </>
      )}
    </div>
  );
}
