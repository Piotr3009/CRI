"use client";

import { useState } from "react";
import {
  submitPrivateClientReport,
  submitCommercialClientReport,
  submitMainContractorReport,
  submitProjectManagerReport,
  submitQuantitySurveyorReport,
  submitArchitectPmReport,
} from "@/app/submit-report/actions";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import type { UploadedEvidence } from "@/lib/evidenceUpload";
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  optionsFromLabels,
} from "@/lib/constants";
import { CompanyAutocomplete } from "@/components/CompanyAutocomplete";
import { BEHAVIOUR_QUESTIONS, type BehaviourKey } from "@/lib/behaviourQuestions";
import {
  PM_SCORES,
  QS_SCORES,
  AR_SCORES,
  type PmKey,
  type QsKey,
  type ArKey,
} from "@/lib/spScores";

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
  { value: "MAIN_CONTRACTOR", title: "Main contractor", subtitle: "pays subcontractors", active: true },
  { value: "PROJECT_MANAGER", title: "Project manager", subtitle: "service provider", active: true },
  { value: "QUANTITY_SURVEYOR", title: "Quantity surveyor", subtitle: "service provider", active: true },
  { value: "ARCHITECT_PM", title: "Architect / PM", subtitle: "service provider", active: true },
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
  { key: "canProvide", label: "I can provide evidence on request from CIX." },
  { key: "allowModeration", label: "I understand CIX may moderate, anonymise, restrict or reject this report." },
  { key: "notAutoPublished", label: "I understand this report is not published automatically." },
  { key: "notRevenge", label: "I confirm this is a fair account, not malicious or revenge." },
  { key: "allPaymentsDeclared", label: "I confirm these are ALL payments under this contract — not only the late ones." },
];

const CONTRACT_LENGTH_OPTIONS = [
  { value: "UNDER_1_MONTH", label: "Under 1 month" },
  { value: "1_3_MONTHS", label: "1–3 months" },
  { value: "3_6_MONTHS", label: "3–6 months" },
  { value: "6_12_MONTHS", label: "6–12 months" },
  { value: "1_2_YEARS", label: "1–2 years" },
  { value: "OVER_2_YEARS", label: "Over 2 years" },
];

const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];

// Service providers don't pay → no "all payments declared" consent.
const SP_CONSENT_ITEMS = CONSENT_ITEMS.filter(
  (c) => c.key !== "allPaymentsDeclared",
);


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tri = "YES" | "SOMETIMES" | "NO" | "";

type Consents = {
  realExperience: boolean;
  canProvide: boolean;
  allowModeration: boolean;
  notAutoPublished: boolean;
  notRevenge: boolean;
  allPaymentsDeclared: boolean;
};


type PayRow = { daysLate: string; amountGbp: string };
type InvoiceRow = { invoiceNumber: string; invoiceDate: string; amountGbp: string };

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

function Scale1to10({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={
            "h-9 w-9 rounded-md border text-sm font-medium transition " +
            (value === n
              ? "border-cri-green bg-cri-green text-white"
              : "border-gray-300 text-cri-steel hover:bg-gray-100")
          }
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function ScoreList({
  questions,
  get,
  set,
  errors,
}: {
  questions: { key: string; label: string }[];
  get: (key: string) => string;
  set: (key: string, v: string) => void;
  errors: Errors;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div
          id={q.key}
          key={q.key}
          className="border-t border-gray-100 pt-4 first:border-0 first:pt-0"
        >
          <span className="block text-sm text-cri-charcoal sm:max-w-xl">
            {q.label}
          </span>
          <div className="mt-2">
            <Scale1to10 value={get(q.key)} onChange={(v) => set(q.key, v)} />
            <Err msg={errors[q.key]} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SubmitReportFlow({
  reporterCompanyName: companyNameProp,
  reporterEmail: emailProp,
  reporterPhone: phoneProp,
  reporterTradeType: tradeTypeProp,
  defaultContactName,
}: {
  reporterCompanyName: string;
  reporterEmail: string;
  reporterPhone: string;
  reporterTradeType: string;
  defaultContactName: string;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Reporter (manual for now — comes from the account once auth ships)
  // Reporter identity comes from the signed-in account (read-only). Only the
  // name of the person actually filing this report is editable.
  const [reporterCompanyName] = useState(companyNameProp);
  const [reporterContactName, setReporterContactName] = useState(defaultContactName);
  const [reporterEmail] = useState(emailProp);
  const [reporterPhone] = useState(phoneProp);
  const [reporterTradeType] = useState(tradeTypeProp);

  // Entity (private = initials; commercial = company name + full address)
  const [clientInitials, setClientInitials] = useState("");
  const [entityName, setEntityName] = useState("");
  const [companiesHouseNumber, setCompaniesHouseNumber] = useState("");
  const [projectAddressLine1, setProjectAddressLine1] = useState("");
  const [projectCity, setProjectCity] = useState("");
  const [projectPostcode, setProjectPostcode] = useState("");
  const [projectType, setProjectType] = useState("");
  const [contractValueGbp, setContractValueGbp] = useState("");
  const [contractLength, setContractLength] = useState("");
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [projectStatus, setProjectStatus] = useState("");

  // Commercial-only: court dispute
  const [courtDispute, setCourtDispute] = useState("");

  // Main contractor — chain specifics
  const [backCharges, setBackCharges] = useState<Tri>("");
  const [backChargesAmount, setBackChargesAmount] = useState("");
  const [variationsNoPaper, setVariationsNoPaper] = useState<Tri>("");
  const [retentionStatus, setRetentionStatus] = useState("");
  const [retentionAmount, setRetentionAmount] = useState("");
  const [projectReadiness, setProjectReadiness] = useState("");

  // Service providers (PM) — role + 1-10 scores
  const [spReporterRole, setSpReporterRole] = useState("");
  const [pmScores, setPmScores] = useState<Record<PmKey, string>>({
    pmScheduleScore: "",
    pmTenderDistribScore: "",
    pmDtmProfessionalScore: "",
    pmImpartialScore: "",
    pmDecisionsScore: "",
    pmFragmentationScore: "",
    pmCommunicationScore: "",
    pmRealisticScore: "",
    pmDtmFairnessScore: "",
    pmWouldRecommendScore: "",
  });

  // QS scores (used by the QS tile, and by PM when "also acted as QS")
  const [alsoActedAsQs, setAlsoActedAsQs] = useState(false);
  const [qsScores, setQsScores] = useState<Record<QsKey, string>>({
    qsFairTenderScore: "",
    qsTenderDocsScore: "",
    qsPriceChallengeScore: "",
    qsOpenToExplanationScore: "",
    qsMeasurementScore: "",
    qsVariationPricingScore: "",
    qsClaimsScore: "",
    qsVariationAcceptanceScore: "",
    qsCertTimingScore: "",
    qsUnfairDeductionsScore: "",
    qsFinalAccountScore: "",
    qsImpartialScore: "",
    qsCommunicationScore: "",
    qsWouldRecommendScore: "",
  });

  // Architect-PM scores + "also acted as PM"
  const [alsoActedAsPm, setAlsoActedAsPm] = useState(false);
  const [arScores, setArScores] = useState<Record<ArKey, string>>({
    arDrawingsAccurateScore: "",
    arCompletenessScore: "",
    arCoordinationScore: "",
    arErrorFreeScore: "",
    arTimelinessScore: "",
    arFewChangesScore: "",
    arBuildabilityScore: "",
    arImpartialScore: "",
    arWouldRecommendScore: "",
  });

  // Payments
  const [payRows, setPayRows] = useState<PayRow[]>([{ daysLate: "", amountGbp: "" }]);

  // Debts (> 60 days)
  const [hasDebts, setHasDebts] = useState(false);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([
    { invoiceNumber: "", invoiceDate: "", amountGbp: "" },
  ]);

  // Behaviour
  const [behaviour, setBehaviour] = useState<Record<BehaviourKey, Tri>>({
    behaviourExtraWorkNoCost: "",
    behaviourAskedCostUpfront: "",
    behaviourExpectedFreeLogistics: "",
    behaviourKeptAgreements: "",
    behaviourRespondedOnTime: "",
    behaviourProvidedAccess: "",
    behaviourCommunicationSmooth: "",
    behaviourWouldRecommend: "",
  });

  // Narrative / evidence / consents
  const [issueDescription, setIssueDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedEvidence[]>([]);
  const [consents, setConsents] = useState<Consents>({
    realExperience: false,
    canProvide: false,
    allowModeration: false,
    notAutoPublished: false,
    notRevenge: false,
    allPaymentsDeclared: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPrivate = selectedType === "RESIDENTIAL_CLIENT";
  const isCommercial = selectedType === "COMMERCIAL_CLIENT";
  const isMainContractor = selectedType === "MAIN_CONTRACTOR";
  const isCompany = isCommercial || isMainContractor;
  const isPaying = isPrivate || isCommercial || isMainContractor;
  const isPM = selectedType === "PROJECT_MANAGER";
  const isQS = selectedType === "QUANTITY_SURVEYOR";
  const isArchitectPm = selectedType === "ARCHITECT_PM";
  const isServiceProvider = isPM || isQS || isArchitectPm;

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

  function setInvoiceCount(nRaw: number) {
    const n = Math.max(1, Math.min(20, Math.floor(nRaw || 1)));
    setInvoiceRows((prev) => {
      const next = [...prev];
      while (next.length < n)
        next.push({ invoiceNumber: "", invoiceDate: "", amountGbp: "" });
      next.length = n;
      return next;
    });
  }

  function updateInvoiceRow(i: number, patch: Partial<InvoiceRow>) {
    setInvoiceRows((prev) =>
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

    if (!reporterContactName.trim()) e.reporterContactName = "Required";

    // Project location + type — needed by every survey type.
    if (!projectCity.trim()) e.projectCity = "Required";
    if (projectPostcode.trim().length < 2) e.projectPostcode = "Enter a postcode";
    if (!projectType) e.projectType = "Select a project type";

    if (isPaying) {
      if (isCompany) {
        if (!entityName.trim()) e.entityName = "Required";
      } else {
        if (!clientInitials.trim()) e.clientInitials = "Required";
      }
      if (isCompany && courtDispute !== "YES" && courtDispute !== "NO")
        e.courtDispute = "Please answer";

      if (isMainContractor) {
        if (backCharges === "") e.backCharges = "Please answer";
        if (variationsNoPaper === "") e.variationsNoPaper = "Please answer";
        if (!retentionStatus) e.retentionStatus = "Please choose";
        const r = Number(projectReadiness);
        if (!projectReadiness || !Number.isInteger(r) || r < 1 || r > 10) {
          e.projectReadiness = "Pick 1–10";
        }
      }

      if (!projectStatus) e.projectStatus = "Select a status";

      const cv = Number(contractValueGbp);
      if (contractValueGbp.trim() === "" || !Number.isInteger(cv) || cv <= 0) {
        e.contractValueGbp = "Enter the approximate value";
      }
      if (!contractLength) e.contractLength = "Select a length";

      payRows.forEach((r, i) => {
        const n = Number(r.daysLate);
        const amt = Number(r.amountGbp);
        const badDays =
          r.daysLate.trim() === "" || !Number.isInteger(n) || n < 0;
        const badAmt =
          r.amountGbp.trim() === "" || !Number.isInteger(amt) || amt < 0;
        if (badDays || badAmt) {
          e[`pay_${i}`] = "Enter days (0 = on time) and amount £";
        }
      });

      if (hasDebts) {
        invoiceRows.forEach((r, i) => {
          const amt = Number(r.amountGbp);
          if (
            !r.invoiceNumber.trim() ||
            !r.invoiceDate.trim() ||
            r.amountGbp.trim() === "" ||
            !Number.isFinite(amt) ||
            amt <= 0
          ) {
            e[`inv_${i}`] = "Enter invoice number, date and amount";
          }
        });
      }

      BEHAVIOUR_QUESTIONS.forEach((q) => {
        if (behaviour[q.key] === "") e[`beh_${q.key}`] = "Please answer";
      });

      CONSENT_ITEMS.forEach((c) => {
        if (!consents[c.key]) e[`con_${c.key}`] = "Required";
      });
    }

    if (isServiceProvider) {
      if (!entityName.trim()) e.entityName = "Required";
      if (!spReporterRole.trim()) e.spReporterRole = "Required";

      const spCv = Number(contractValueGbp);
      if (contractValueGbp.trim() === "" || !Number.isInteger(spCv) || spCv <= 0) {
        e.contractValueGbp = "Enter the approximate value";
      }
      if (courtDispute !== "YES" && courtDispute !== "NO") {
        e.courtDispute = "Please answer";
      }

      if (isArchitectPm) {
        AR_SCORES.forEach((q) => {
          const v = Number(arScores[q.key]);
          if (!arScores[q.key] || !Number.isInteger(v) || v < 1 || v > 10) {
            e[q.key] = "Pick 1–10";
          }
        });
      }

      // PM questions: on the PM tile, or when an architect also acted as PM.
      if (isPM || (isArchitectPm && alsoActedAsPm)) {
        PM_SCORES.forEach((q) => {
          const v = Number(pmScores[q.key]);
          if (!pmScores[q.key] || !Number.isInteger(v) || v < 1 || v > 10) {
            e[q.key] = "Pick 1–10";
          }
        });
      }

      // QS questions: on the QS tile, or when a PM/architect also acted as QS.
      if (isQS || ((isPM || isArchitectPm) && alsoActedAsQs)) {
        QS_SCORES.forEach((q) => {
          const v = Number(qsScores[q.key]);
          if (!qsScores[q.key] || !Number.isInteger(v) || v < 1 || v > 10) {
            e[q.key] = "Pick 1–10";
          }
        });
      }

      SP_CONSENT_ITEMS.forEach((c) => {
        if (!consents[c.key]) e[`con_${c.key}`] = "Required";
      });
    }

    return e;
  }

  const allErrors = validate();
  const errors: Errors = showErrors ? allErrors : {};
  const hasNoErrors = Object.keys(allErrors).length === 0;

  // Soft, non-blocking sanity warnings about the payments listed.
  const paymentsTotal = payRows.reduce(
    (s, r) => s + (Number(r.amountGbp) || 0),
    0,
  );
  const abandonedTotal = hasDebts
    ? invoiceRows.reduce((s, r) => s + (Number(r.amountGbp) || 0), 0)
    : 0;
  const accountedTotal = paymentsTotal + abandonedTotal;
  const contractVal = Number(contractValueGbp) || 0;
  // Payments + abandoned invoices together should roughly match the contract
  // value; warn (never block) when they diverge by more than 10%.
  const totalOffContract =
    contractVal > 0 &&
    accountedTotal > 0 &&
    Math.abs(accountedTotal - contractVal) > contractVal * 0.1;
  const longButSingle =
    ["1_3_MONTHS", "3_6_MONTHS", "6_12_MONTHS", "1_2_YEARS", "OVER_2_YEARS"].includes(
      contractLength,
    ) && payRows.length === 1;
  const showPaymentWarning = totalOffContract || longButSingle;

  // Ordered ids for "scroll to first problem".
  const errorOrder: string[] = [
    "reporterContactName",
    "entityName",
    "spReporterRole",
    "clientInitials",
    "projectCity",
    "projectPostcode",
    "projectType",
    "projectStatus",
    "contractValueGbp",
    "contractLength",
    "courtDispute",
    "backCharges",
    "variationsNoPaper",
    "retentionStatus",
    "projectReadiness",
    ...AR_SCORES.map((q) => q.key),
    ...PM_SCORES.map((q) => q.key),
    ...QS_SCORES.map((q) => q.key),
    ...payRows.map((_, i) => `pay_${i}`),
    ...invoiceRows.map((_, i) => `inv_${i}`),
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

      companiesHouseNumber: companiesHouseNumber.trim(),

      projectAddressLine1: projectAddressLine1.trim(),
      projectCity: projectCity.trim(),
      projectPostcode: projectPostcode.trim(),
      projectType,
      contractValueGbp: Number(contractValueGbp),
      contractLength,
      startDate,
      finishDate,
      projectStatus,

      payments: payRows.map((r) => ({
        daysLate: Number(r.daysLate),
        amountGbp: Number(r.amountGbp),
      })),

      abandonedInvoices: hasDebts
        ? invoiceRows.map((r) => ({
            invoiceNumber: r.invoiceNumber.trim(),
            invoiceDate: r.invoiceDate,
            amountGbp: Number(r.amountGbp),
          }))
        : [],
      abandonedInvoicesCount: hasDebts ? invoiceRows.length : null,
      abandonedInvoicesTotalGbp: hasDebts
        ? invoiceRows.reduce((sum, r) => sum + (Number(r.amountGbp) || 0), 0)
        : null,

      behaviourExtraWorkNoCost: behaviour.behaviourExtraWorkNoCost,
      behaviourAskedCostUpfront: behaviour.behaviourAskedCostUpfront,
      behaviourExpectedFreeLogistics: behaviour.behaviourExpectedFreeLogistics,
      behaviourKeptAgreements: behaviour.behaviourKeptAgreements,
      behaviourRespondedOnTime: behaviour.behaviourRespondedOnTime,
      behaviourProvidedAccess: behaviour.behaviourProvidedAccess,
      behaviourCommunicationSmooth: behaviour.behaviourCommunicationSmooth,
      behaviourWouldRecommend: behaviour.behaviourWouldRecommend,

      issueDescription: issueDescription.trim(),
      evidenceTypes: evidence,
      evidenceFiles,
      consents,
    };

    try {
      let res;
      const qsNums = {
        qsFairTenderScore: Number(qsScores.qsFairTenderScore),
        qsTenderDocsScore: Number(qsScores.qsTenderDocsScore),
        qsPriceChallengeScore: Number(qsScores.qsPriceChallengeScore),
        qsOpenToExplanationScore: Number(qsScores.qsOpenToExplanationScore),
        qsMeasurementScore: Number(qsScores.qsMeasurementScore),
        qsVariationPricingScore: Number(qsScores.qsVariationPricingScore),
        qsClaimsScore: Number(qsScores.qsClaimsScore),
        qsVariationAcceptanceScore: Number(qsScores.qsVariationAcceptanceScore),
        qsCertTimingScore: Number(qsScores.qsCertTimingScore),
        qsUnfairDeductionsScore: Number(qsScores.qsUnfairDeductionsScore),
        qsFinalAccountScore: Number(qsScores.qsFinalAccountScore),
        qsImpartialScore: Number(qsScores.qsImpartialScore),
        qsCommunicationScore: Number(qsScores.qsCommunicationScore),
        qsWouldRecommendScore: Number(qsScores.qsWouldRecommendScore),
      };
      const spReporter = {
        reporterCompanyName: reporterCompanyName.trim(),
        reporterContactName: reporterContactName.trim(),
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim(),
        reporterTradeType: reporterTradeType.trim(),
        entityName: entityName.trim(),
        spReporterRole: spReporterRole.trim(),
        companiesHouseNumber: companiesHouseNumber.trim(),
        projectAddressLine1: projectAddressLine1.trim(),
        projectCity: projectCity.trim(),
        projectPostcode: projectPostcode.trim(),
        projectType,
        contractValueGbp: Number(contractValueGbp),
        courtDispute,
        issueDescription: issueDescription.trim(),
        evidenceTypes: evidence,
        evidenceFiles,
        consents: {
          realExperience: consents.realExperience,
          canProvide: consents.canProvide,
          allowModeration: consents.allowModeration,
          notAutoPublished: consents.notAutoPublished,
          notRevenge: consents.notRevenge,
        },
      };

      const pmNums = {
        pmScheduleScore: Number(pmScores.pmScheduleScore),
        pmTenderDistribScore: Number(pmScores.pmTenderDistribScore),
        pmDtmProfessionalScore: Number(pmScores.pmDtmProfessionalScore),
        pmImpartialScore: Number(pmScores.pmImpartialScore),
        pmDecisionsScore: Number(pmScores.pmDecisionsScore),
        pmFragmentationScore: Number(pmScores.pmFragmentationScore),
        pmCommunicationScore: Number(pmScores.pmCommunicationScore),
        pmRealisticScore: Number(pmScores.pmRealisticScore),
        pmDtmFairnessScore: Number(pmScores.pmDtmFairnessScore),
        pmWouldRecommendScore: Number(pmScores.pmWouldRecommendScore),
      };
      const arNums = {
        arDrawingsAccurateScore: Number(arScores.arDrawingsAccurateScore),
        arCompletenessScore: Number(arScores.arCompletenessScore),
        arCoordinationScore: Number(arScores.arCoordinationScore),
        arErrorFreeScore: Number(arScores.arErrorFreeScore),
        arTimelinessScore: Number(arScores.arTimelinessScore),
        arFewChangesScore: Number(arScores.arFewChangesScore),
        arBuildabilityScore: Number(arScores.arBuildabilityScore),
        arImpartialScore: Number(arScores.arImpartialScore),
        arWouldRecommendScore: Number(arScores.arWouldRecommendScore),
      };

      if (isPM) {
        res = await submitProjectManagerReport({
          ...spReporter,
          ...pmNums,
          alsoActedAsQs,
          ...(alsoActedAsQs ? qsNums : {}),
        });
      } else if (isQS) {
        res = await submitQuantitySurveyorReport({
          ...spReporter,
          ...qsNums,
        });
      } else if (isArchitectPm) {
        res = await submitArchitectPmReport({
          ...spReporter,
          ...arNums,
          alsoActedAsPm,
          ...(alsoActedAsPm ? pmNums : {}),
          alsoActedAsQs,
          ...(alsoActedAsQs ? qsNums : {}),
        });
      } else if (isMainContractor) {
        res = await submitMainContractorReport({
          ...shared,
          entityName: entityName.trim(),
          courtDispute,
          backChargesUnagreed: backCharges,
          backChargesAmountGbp:
            backChargesAmount.trim() === "" ? null : Number(backChargesAmount),
          variationsNoPaper,
          retentionStatus,
          retentionAmountGbp:
            retentionAmount.trim() === "" ? null : Number(retentionAmount),
          projectReadinessScore: Number(projectReadiness),
        });
      } else if (isCommercial) {
        res = await submitCommercialClientReport({
          ...shared,
          entityName: entityName.trim(),
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
      {/* Step 1 — reporter (from signed-in account) */}
      <Section
        title="Your details"
        description="Pulled from your signed-in account — kept private, never shown publicly."
      >
        <div className="rounded-lg border border-cri-border bg-cri-bg/50 px-4 py-3 text-sm">
          <span className="text-cri-steel">Reporting as: </span>
          <span className="font-medium text-cri-charcoal">
            {reporterCompanyName || "—"}
          </span>
          {reporterEmail ? (
            <span className="text-cri-steel"> · {reporterEmail}</span>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-cri-steel">
          Your identity stays private — the reported company never sees it. Each
          company&apos;s score is the average of all reports.
        </p>

        <div className="mt-4 max-w-sm">
          <Field
            label="Name of person filing this report"
            required
            error={errors.reporterContactName}
          >
            <input
              id="reporterContactName"
              className={inp(errors.reporterContactName)}
              value={reporterContactName}
              onChange={(e) => setReporterContactName(e.target.value)}
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
      {selectedType && !isPaying && !isServiceProvider && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-cri-steel">
          This survey type is coming soon. Right now you can submit a{" "}
          <strong className="text-cri-charcoal">Private client</strong>,{" "}
          <strong className="text-cri-charcoal">Commercial client</strong> or{" "}
          <strong className="text-cri-charcoal">Main contractor</strong> report.
        </div>
      )}

      {/* Step 3 — survey (private or commercial) */}
      {isPaying && (
        <>
          <Section
            title="Who you are reporting"
            description={
              isCompany
                ? "The company you are reporting on. The company name is public; the full project address stays internal."
                : "Private clients are shown by initials and area only — never a full name or full address."
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {isCompany ? (
                <div id="entityName" className="sm:col-span-2">
                  <Field
                    label="Company"
                    required
                    error={errors.entityName}
                    hint="Search Companies House and pick the company — this captures its registration number."
                  >
                    <CompanyAutocomplete
                      name={entityName}
                      number={companiesHouseNumber}
                      onSelect={(c) => {
                        setEntityName(c.name);
                        setCompaniesHouseNumber(c.number);
                      }}
                      onClear={() => {
                        setEntityName("");
                        setCompaniesHouseNumber("");
                      }}
                      error={errors.entityName}
                    />
                  </Field>
                </div>
              ) : (
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
              )}
            </div>
          </Section>

          <Section
            title="Project details"
            description="Project location and contract details. The address is internal only — public reports show just the area (e.g. SW19)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Project address"
                hint="Where the work was. Internal only — used to verify your report, never shown publicly."
              >
                <input
                  className={inputClass}
                  placeholder="Address line (optional)"
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
                label="Project postcode"
                required
                error={errors.projectPostcode}
                hint="Full postcode — internal only. Public shows just the area (e.g. SW19)."
              >
                <input
                  id="projectPostcode"
                  className={inp(errors.projectPostcode)}
                  value={projectPostcode}
                  onChange={(e) => setProjectPostcode(e.target.value)}
                />
              </Field>

              <Field label="Project type" required error={errors.projectType}>
                <Select
                  id="projectType"
                  value={projectType}
                  onChange={setProjectType}
                  options={optionsFromLabels(PROJECT_TYPE_LABELS)}
                  error={errors.projectType}
                />
              </Field>
              <Field
                label="Approximate contract value (£)"
                required
                error={errors.contractValueGbp}
                hint="Roughly — e.g. 120000. Used to sanity-check payments. Never shown publicly."
              >
                <input
                  id="contractValueGbp"
                  type="number"
                  min={0}
                  className={inp(errors.contractValueGbp)}
                  placeholder="e.g. 120000"
                  value={contractValueGbp}
                  onChange={(e) => setContractValueGbp(e.target.value)}
                />
              </Field>
              <Field
                label="Contract length"
                required
                error={errors.contractLength}
              >
                <Select
                  id="contractLength"
                  value={contractLength}
                  onChange={setContractLength}
                  options={CONTRACT_LENGTH_OPTIONS}
                  error={errors.contractLength}
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
              <Field
                label="Finish date"
                hint="Optional — actual completion date. Leave blank if still ongoing."
              >
                <input
                  type="date"
                  className={inputClass}
                  value={finishDate}
                  onChange={(e) => setFinishDate(e.target.value)}
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

            {isCompany && (
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

          {isMainContractor && (
            <Section
              title="Main contractor — chain issues"
              description="Questions specific to working under a main contractor. Facts only — scores are calculated later."
            >
              {/* 1. Back-charges */}
              <div
                id="backCharges"
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <span className="text-sm text-cri-charcoal sm:max-w-md">
                  Did the main contractor deduct from your invoices for defects
                  or damages that were NOT mutually agreed and accepted by both
                  sides?
                </span>
                <div className="shrink-0">
                  <TriState value={backCharges} onChange={setBackCharges} />
                  <Err msg={errors.backCharges} />
                </div>
              </div>
              <Field label="Amount deducted £ (optional)">
                <input
                  type="number"
                  min={0}
                  className={inputClass + " sm:w-48"}
                  value={backChargesAmount}
                  onChange={(e) => setBackChargesAmount(e.target.value)}
                />
              </Field>

              {/* 2. Variations without paper */}
              <div
                id="variationsNoPaper"
                className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <span className="text-sm text-cri-charcoal sm:max-w-md">
                  Did the main contractor instruct extra work verbally and
                  refuse to confirm it in writing (variation order)?
                </span>
                <div className="shrink-0">
                  <TriState
                    value={variationsNoPaper}
                    onChange={setVariationsNoPaper}
                  />
                  <Err msg={errors.variationsNoPaper} />
                </div>
              </div>

              {/* 3. Retention */}
              <div id="retentionStatus" className="border-t border-gray-100 pt-4">
                <span className="block text-sm font-medium text-cri-charcoal">
                  Did the main contractor return your retention?
                  <span className="text-red-600"> *</span>
                </span>
                <div className="mt-2 inline-flex flex-wrap rounded-lg border border-gray-300 p-0.5">
                  {[
                    { v: "NOT_RETURNED", label: "Not returned" },
                    { v: "RETURNED", label: "Returned" },
                    { v: "WITHIN_TERM", label: "Still within term" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setRetentionStatus(o.v)}
                      className={
                        "rounded-md px-3 py-1.5 text-sm transition " +
                        (retentionStatus === o.v
                          ? "bg-cri-green text-white"
                          : "text-cri-steel hover:bg-gray-100")
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <Err msg={errors.retentionStatus} />
                <p className="mt-1 text-xs text-cri-steel">
                  &quot;Still within term&quot; = the return date hasn&apos;t
                  passed yet, so it&apos;s not a problem.
                </p>
                <div className="mt-3">
                  <Field label="Retention amount £ (optional)">
                    <input
                      type="number"
                      min={0}
                      className={inputClass + " sm:w-48"}
                      value={retentionAmount}
                      onChange={(e) => setRetentionAmount(e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              {/* 4. Project readiness 1-10 */}
              <div
                id="projectReadiness"
                className="border-t border-gray-100 pt-4"
              >
                <span className="block text-sm font-medium text-cri-charcoal">
                  Was the site ready for your stage of works?
                  <span className="text-red-600"> *</span>
                </span>
                <p className="mb-2 mt-1 text-xs text-cri-steel">
                  1 = not ready, caused major losses · 10 = fully ready
                </p>
                <Scale1to10
                  value={projectReadiness}
                  onChange={setProjectReadiness}
                />
                <Err msg={errors.projectReadiness} />
              </div>
            </Section>
          )}

          <Section
            title="Payments"
            description="Enter ALL payments — including on-time ones (0 days). Listing only the late ones is unfair and your report may be rejected. We calculate the average and score — you don't."
          >
            <Field
              label="How many payments?"
              hint="Max 20. Include every approved payment, on-time and late."
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
                      placeholder="Amount £"
                      className={inp(errors[`pay_${i}`])}
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

            {showPaymentWarning && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {totalOffContract
                  ? "Your payments and abandoned invoices together differ from the contract value by more than 10%. Did you list everything — including on-time payments, retention, and any unpaid invoices?"
                  : "A longer contract with a single payment looks unusual. Please make sure you've listed every payment, not just the late ones."}
              </div>
            )}

            <p className="text-xs text-cri-steel">
              You may be asked to provide proof of payment on request.
            </p>
          </Section>

          <Section
            title="Abandoned invoices (over 60 days)"
            description="Invoices left unpaid for more than 60 days — counted separately from late payments."
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
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-[#D64545]/40 bg-[#D64545]/5 px-4 py-3 text-sm text-cri-charcoal">
                  <span className="font-semibold text-[#D64545]">
                    Important:{" "}
                  </span>
                  Only list genuine invoices that are over 60 days unpaid. Each
                  invoice is reviewed before publication, and the reported
                  company has a right to reply. Knowingly submitting false
                  information may expose you to legal liability.
                </div>

                <Field label="How many abandoned invoices?">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={inputClass + " sm:w-40"}
                    value={invoiceRows.length}
                    onChange={(e) => setInvoiceCount(Number(e.target.value))}
                  />
                </Field>

                <div className="space-y-3">
                  {invoiceRows.map((r, i) => (
                    <div id={`inv_${i}`} key={i}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto,1fr,1fr,1fr] sm:items-center">
                        <span className="text-sm font-medium text-cri-charcoal sm:w-20">
                          Invoice {i + 1}
                        </span>
                        <input
                          placeholder="Invoice number"
                          className={inp(errors[`inv_${i}`])}
                          value={r.invoiceNumber}
                          onChange={(e) =>
                            updateInvoiceRow(i, {
                              invoiceNumber: e.target.value,
                            })
                          }
                        />
                        <input
                          type="date"
                          className={inp(errors[`inv_${i}`])}
                          value={r.invoiceDate}
                          onChange={(e) =>
                            updateInvoiceRow(i, { invoiceDate: e.target.value })
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Amount £"
                          className={inp(errors[`inv_${i}`])}
                          value={r.amountGbp}
                          onChange={(e) =>
                            updateInvoiceRow(i, { amountGbp: e.target.value })
                          }
                        />
                      </div>
                      <Err msg={errors[`inv_${i}`]} />
                    </div>
                  ))}
                </div>
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
            description="Optional. Held privately. A moderator may publish a short, anonymised summary in the public report."
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

            <EvidenceUpload
              value={evidenceFiles}
              onChange={setEvidenceFiles}
              disabled={submitting}
            />
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

      {isServiceProvider && (
        <>
          <Section
            title="Who you are reporting"
            description="The practice / company you are reporting on. The name is public; only the project area (e.g. SW19) is shown — never the full address."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div id="entityName" className="sm:col-span-2">
                <Field
                  label="Practice / company"
                  required
                  error={errors.entityName}
                  hint="Search Companies House and pick the practice / company — this captures its registration number."
                >
                  <CompanyAutocomplete
                    name={entityName}
                    number={companiesHouseNumber}
                    onSelect={(c) => {
                      setEntityName(c.name);
                      setCompaniesHouseNumber(c.number);
                    }}
                    onClear={() => {
                      setEntityName("");
                      setCompaniesHouseNumber("");
                    }}
                    error={errors.entityName}
                  />
                </Field>
              </div>
              <Field
                label="Their role"
                required
                error={errors.spReporterRole}
                hint={
                  isArchitectPm
                    ? "Function, not a person's name — e.g. Project Architect, Architectural Technician."
                    : isQS
                      ? "Function, not a person's name — e.g. Senior QS, Cost Consultant."
                      : "Function, not a person's name — e.g. Project Manager, Senior PM."
                }
              >
                <input
                  id="spReporterRole"
                  className={inp(errors.spReporterRole)}
                  placeholder={
                    isArchitectPm
                      ? "e.g. Project Architect"
                      : isQS
                        ? "e.g. Senior QS"
                        : "e.g. Project Manager"
                  }
                  value={spReporterRole}
                  onChange={(e) => setSpReporterRole(e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Project details"
            description="Project location. The address is internal only — public reports show just the area (e.g. SW19)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Project address"
                hint="Where the work was. Internal only — never shown publicly."
              >
                <input
                  className={inputClass}
                  placeholder="Address line (optional)"
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
                label="Project postcode"
                required
                error={errors.projectPostcode}
                hint="Full postcode — internal only. Public shows just the area."
              >
                <input
                  id="projectPostcode"
                  className={inp(errors.projectPostcode)}
                  value={projectPostcode}
                  onChange={(e) => setProjectPostcode(e.target.value)}
                />
              </Field>
              <Field label="Project type" required error={errors.projectType}>
                <Select
                  id="projectType"
                  value={projectType}
                  onChange={setProjectType}
                  options={optionsFromLabels(PROJECT_TYPE_LABELS)}
                  error={errors.projectType}
                />
              </Field>
              <Field
                label="Approximate project value (£)"
                required
                error={errors.contractValueGbp}
                hint="Roughly — e.g. 250000. Shown publicly as total project value across reviews."
              >
                <input
                  id="contractValueGbp"
                  type="number"
                  min={0}
                  className={inp(errors.contractValueGbp)}
                  placeholder="e.g. 250000"
                  value={contractValueGbp}
                  onChange={(e) => setContractValueGbp(e.target.value)}
                />
              </Field>
              <div id="courtDispute" className="sm:col-span-2">
                <Field
                  label="Did the engagement end in a formal dispute, adjudication, or court action?"
                  required
                  error={errors.courtDispute}
                  hint="The final report shows only the number of disputes — no details."
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
            </div>
          </Section>

          {isArchitectPm && (
            <Section
              title="Architect — design quality"
              description="Rate each from 1 (poor) to 10 (excellent). Averages and gauges are built later from many reports."
            >
              <ScoreList
                questions={AR_SCORES}
                get={(k) => arScores[k as ArKey] ?? ""}
                set={(k, v) =>
                  setArScores((prev) => ({ ...prev, [k as ArKey]: v }))
                }
                errors={errors}
              />
            </Section>
          )}

          {isArchitectPm && (
            <Section
              title="Did this architect also act as the PM?"
              description="On smaller projects the architect often runs the project too. Tick yes to also rate their PM work."
            >
              <div className="inline-flex rounded-lg border border-gray-300 p-0.5">
                {[
                  { v: false, label: "No" },
                  { v: true, label: "Yes — also the PM" },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    onClick={() => setAlsoActedAsPm(o.v)}
                    className={
                      "rounded-md px-3 py-1.5 text-sm transition " +
                      (alsoActedAsPm === o.v
                        ? "bg-cri-green text-white"
                        : "text-cri-steel hover:bg-gray-100")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {(isPM || (isArchitectPm && alsoActedAsPm)) && (
            <Section
              title="Project manager — performance"
              description="Rate each from 1 (poor) to 10 (excellent). Averages and gauges are built later from many reports."
            >
              <ScoreList
                questions={PM_SCORES}
                get={(k) => pmScores[k as PmKey] ?? ""}
                set={(k, v) =>
                  setPmScores((prev) => ({ ...prev, [k as PmKey]: v }))
                }
                errors={errors}
              />
            </Section>
          )}

          {(isPM || isArchitectPm) && (
            <Section
              title={
                isArchitectPm
                  ? "Did this architect also act as the QS?"
                  : "Was this PM also the QS?"
              }
              description="On smaller projects the same person often runs both. Tick yes to also rate their QS / cost work."
            >
              <div className="inline-flex rounded-lg border border-gray-300 p-0.5">
                {[
                  { v: false, label: "No" },
                  { v: true, label: "Yes — also the QS" },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    onClick={() => setAlsoActedAsQs(o.v)}
                    className={
                      "rounded-md px-3 py-1.5 text-sm transition " +
                      (alsoActedAsQs === o.v
                        ? "bg-cri-green text-white"
                        : "text-cri-steel hover:bg-gray-100")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {(isQS || ((isPM || isArchitectPm) && alsoActedAsQs)) && (
            <Section
              title="Quantity surveyor — assessment"
              description="Rate each from 1 (poor) to 10 (excellent). Facts first — averages come later."
            >
              <ScoreList
                questions={QS_SCORES}
                get={(k) => qsScores[k as QsKey] ?? ""}
                set={(k, v) =>
                  setQsScores((prev) => ({ ...prev, [k as QsKey]: v }))
                }
                errors={errors}
              />
            </Section>
          )}

          <Section
            title="Description & evidence"
            description="Optional. Held privately. A moderator may publish a short, anonymised summary in the public report."
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

            <EvidenceUpload
              value={evidenceFiles}
              onChange={setEvidenceFiles}
              disabled={submitting}
            />
          </Section>

          <Section title="Confirmations" description="All required.">
            <div className="space-y-3">
              {SP_CONSENT_ITEMS.map((c) => (
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
