"use client";

import { useState } from "react";
import { submitPrivateClientReport } from "@/app/submit-report/actions";
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
  { value: "COMMERCIAL_CLIENT", title: "Commercial client", subtitle: "company", active: false },
  { value: "DEVELOPER", title: "Developer", subtitle: "investor", active: false },
  { value: "MAIN_CONTRACTOR", title: "Main contractor", subtitle: "main contractor", active: false },
  { value: "ARCHITECT_PM", title: "Architect / PM", subtitle: "architect / PM", active: false },
  { value: "PROJECT_MANAGER", title: "Project manager", subtitle: "does not pay", active: false },
  { value: "QUANTITY_SURVEYOR", title: "Quantity surveyor", subtitle: "does not pay", active: false },
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
  { key: "canProvide", label: "I can provide evidence on request from CRI." },
  { key: "allowModeration", label: "I understand CRI may moderate, anonymise, restrict or reject this report." },
  { key: "notAutoPublished", label: "I understand this report is not published automatically." },
  { key: "notRevenge", label: "I confirm this is a fair account, not malicious or revenge." },
];

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

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-cri-charcoal focus:border-cri-green focus:outline-none focus:ring-1 focus:ring-cri-green";

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

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
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-cri-charcoal">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-cri-steel">{hint}</p>}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
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

  // Entity / project
  const [clientInitials, setClientInitials] = useState("");
  const [projectPostcode, setProjectPostcode] = useState("");
  const [projectType, setProjectType] = useState("");
  const [contractValueRange, setContractValueRange] = useState("");
  const [startDate, setStartDate] = useState("");
  const [projectStatus, setProjectStatus] = useState("");

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
  const [error, setError] = useState<string | null>(null);

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
    setPayRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function toggleEvidence(v: string) {
    setEvidence((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function toggleConsent(k: keyof Consents) {
    setConsents((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  // --- Validation ------------------------------------------------------------
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reporterEmail.trim());
  const reporterOk =
    reporterCompanyName.trim() !== "" &&
    reporterContactName.trim() !== "" &&
    emailOk &&
    reporterTradeType.trim() !== "";
  const entityOk =
    clientInitials.trim() !== "" &&
    projectPostcode.trim().length >= 2 &&
    projectType !== "" &&
    projectStatus !== "";
  const paymentsOk =
    payRows.length >= 1 &&
    payRows.every((r) => {
      const n = Number(r.daysLate);
      return r.daysLate.trim() !== "" && Number.isInteger(n) && n >= 0;
    });
  const behaviourOk = BEHAVIOUR_QUESTIONS.every((q) => behaviour[q.key] !== "");
  const debtsOk =
    !hasDebts || (abandonedCount.trim() !== "" && Number(abandonedCount) >= 0);
  const consentsOk = Object.values(consents).every(Boolean);

  const canSubmit =
    !submitting &&
    selectedType === "RESIDENTIAL_CLIENT" &&
    reporterOk &&
    entityOk &&
    paymentsOk &&
    behaviourOk &&
    debtsOk &&
    consentsOk;

  // --- Submit ----------------------------------------------------------------
  async function handleSubmit() {
    setError(null);
    if (!canSubmit) {
      setError("Please complete all required fields correctly.");
      return;
    }
    setSubmitting(true);

    const payload = {
      reporterCompanyName: reporterCompanyName.trim(),
      reporterContactName: reporterContactName.trim(),
      reporterEmail: reporterEmail.trim(),
      reporterPhone: reporterPhone.trim(),
      reporterTradeType: reporterTradeType.trim(),

      clientInitials: clientInitials.trim(),
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
      const res = await submitPrivateClientReport(payload);
      // On success the action redirects; only an error returns a result here.
      if (res && !res.ok) {
        setError(res.formError ?? "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const isPrivate = selectedType === "RESIDENTIAL_CLIENT";

  // --- Render ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Step 1 — reporter (temporary manual block) */}
      <Section
        title="Your details"
        description="Temporary — these will come from your verified account once sign-in is live. Private, never shown publicly."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your company name" required>
            <input
              className={inputClass}
              value={reporterCompanyName}
              onChange={(e) => setReporterCompanyName(e.target.value)}
            />
          </Field>
          <Field label="Contact name" required>
            <input
              className={inputClass}
              value={reporterContactName}
              onChange={(e) => setReporterContactName(e.target.value)}
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
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
          <Field label="Trade type" required hint="e.g. Electrical, Joinery">
            <input
              className={inputClass}
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
                  "rounded-xl border p-4 text-left transition " +
                  (selected
                    ? "border-cri-green ring-1 ring-cri-green "
                    : "border-gray-200 hover:border-gray-300 ") +
                  (t.active ? "" : "opacity-70")
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
      {selectedType && !isPrivate && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-cri-steel">
          This survey type is coming soon. Right now you can submit a{" "}
          <strong className="text-cri-charcoal">Private client</strong> report.
        </div>
      )}

      {/* Step 3 — Private client survey */}
      {isPrivate && (
        <>
          <Section
            title="Who you are reporting"
            description="Private clients are recorded by initials only — never a full name."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client initials" required hint="Initials only, e.g. C.A.">
                <input
                  className={inputClass}
                  value={clientInitials}
                  onChange={(e) => setClientInitials(e.target.value)}
                />
              </Field>
              <Field
                label="Project postcode"
                required
                hint="Only the area prefix (e.g. SW19) is ever shown publicly."
              >
                <input
                  className={inputClass}
                  value={projectPostcode}
                  onChange={(e) => setProjectPostcode(e.target.value)}
                />
              </Field>
              <Field label="Project type" required>
                <Select
                  value={projectType}
                  onChange={setProjectType}
                  options={optionsFromLabels(PROJECT_TYPE_LABELS)}
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
              <Field label="Status" required>
                <Select
                  value={projectStatus}
                  onChange={setProjectStatus}
                  options={optionsFromLabels(PROJECT_STATUS_LABELS)}
                />
              </Field>
            </div>
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

            <div className="space-y-2">
              {payRows.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[auto,1fr,1fr] sm:items-center"
                >
                  <span className="text-sm font-medium text-cri-charcoal sm:w-24">
                    Payment {i + 1}
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Days late (0 = on time)"
                    className={inputClass}
                    value={r.daysLate}
                    onChange={(e) => updatePayRow(i, { daysLate: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Amount £ (optional)"
                    className={inputClass}
                    value={r.amountGbp}
                    onChange={(e) => updatePayRow(i, { amountGbp: e.target.value })}
                  />
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
                <Field label="How many abandoned invoices?" required>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
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
                  key={q.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-cri-charcoal sm:max-w-md">
                    {q.label}
                  </span>
                  <TriState
                    value={behaviour[q.key]}
                    onChange={(v) =>
                      setBehaviour((prev) => ({ ...prev, [q.key]: v }))
                    }
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Description & evidence"
            description="Optional. Held privately for moderation — never published as written."
          >
            <Field label="Describe the situation" hint="Max 1000 characters. Facts, first-hand.">
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
          </Section>

          <Section title="Confirmations" description="All required.">
            <div className="space-y-3">
              {CONSENT_ITEMS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-start gap-2 text-sm text-cri-charcoal"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={consents[c.key]}
                    onChange={() => toggleConsent(c.key)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={
              "w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition " +
              (canSubmit
                ? "bg-cri-green hover:opacity-90"
                : "cursor-not-allowed bg-gray-300")
            }
          >
            {submitting ? "Submitting…" : "Submit report for moderation"}
          </button>
        </>
      )}
    </div>
  );
}
