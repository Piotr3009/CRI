import type { Metadata } from "next";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

export const metadata: Metadata = {
  title: "Legal and Data Protection",
  description:
    "How CRI handles contractor-submitted reports, evidence-based moderation, residential privacy, right to reply, data protection and removal requests.",
};

const SECTIONS: { id?: string; title: string; body: React.ReactNode }[] = [
  {
    title: "CRI is not legal advice",
    body: (
      <p>
        CRI is an information and risk-assessment platform. Nothing on CRI
        constitutes legal advice, a credit reference, or a professional
        recommendation. Risk scores and summaries are intended to help
        contractors assess potential risk before pricing or accepting work. You
        should take your own professional advice before making decisions.
      </p>
    ),
  },
  {
    title: "Contractor-submitted reports",
    body: (
      <p>
        Reports are submitted by contractors describing their own first-hand
        business experience on a project. They reflect the reporter&rsquo;s
        account and CRI&rsquo;s moderation. CRI does not independently verify
        every statement and does not make findings of fact or wrongdoing.
      </p>
    ),
  },
  {
    title: "How scores work",
    body: (
      <p>
        Risk scores, percentages and overall risk levels (such as a payment
        score or an &ldquo;Overall: High&rdquo; label) are calculated
        automatically as an aggregate of contractor-submitted ratings for that
        entity. They are not CRI&rsquo;s own opinion, judgement or verdict, and
        they are not a statement that any party has acted unlawfully or
        improperly. Where only a small number of reports exist, an aggregate may
        reflect very few experiences and should be read with caution.
      </p>
    ),
  },
  {
    title: "Reporter responsibility and indemnity",
    body: (
      <>
        <p>
          When you submit a report you are solely responsible for its content,
          including its truthfulness, accuracy, completeness, legality and any
          supporting evidence. By submitting, you confirm: &ldquo;I acknowledge
          that I am solely responsible for the content of this report, including
          its truthfulness, accuracy, legality and any supporting evidence. I
          understand that CRI publishes contractor-submitted experiences and
          does not independently verify every factual statement.&rdquo;
        </p>
        <p className="mt-3">
          If a report you submit is found to be unlawful (for example
          defamatory or in breach of data-protection law), you agree to
          reimburse CRI for the losses, costs and reasonable legal expenses CRI
          incurs as a result.
        </p>
      </>
    ),
  },
  {
    title: "Acceptable use and accuracy duty",
    body: (
      <p>
        You may only report parties you have genuinely worked with or had direct
        first-hand business dealings with. You must not submit false, misleading
        or malicious reports, rate yourself or your own business, post for or
        against a competitor to distort their standing, or submit content you do
        not have the right to share. Breaching this may lead to removal of
        content, suspension of your account, and liability under the indemnity
        above.
      </p>
    ),
  },
  {
    title: "Evidence-based moderation",
    body: (
      <p>
        Reports are reviewed before publication. CRI may request supporting
        evidence, edit or anonymise content, restrict visibility, or reject a
        report. The evidence status shown on a report indicates how well it is
        supported, from unverified through to documented or legal evidence.
        Nothing is published automatically.
      </p>
    ),
  },
  {
    title: "No anonymous public accusations",
    body: (
      <p>
        CRI is not a blacklist, a revenge platform, or a public shaming board.
        Reporter identities are recorded privately, public wording is kept
        measured and factual, and reports describe risk patterns rather than
        making accusations.
      </p>
    ),
  },
  {
    title: "Account and verification",
    body: (
      <p>
        To submit a report you must register an account and may be asked to
        verify that you are a genuine contractor or business. CRI may decline,
        suspend or remove accounts, and may withhold or down-weight reports from
        accounts that cannot be verified. Verification helps protect everyone
        named on the platform and supports the right to reply.
      </p>
    ),
  },
  {
    id: "residential-privacy",
    title: "Residential client privacy",
    body: (
      <p>
        Private residential individuals are afforded stronger privacy. Public
        residential records show initials and a general area only. Full names,
        exact addresses, and contact details are never shown publicly and are
        restricted to administrators and, where legally appropriate, verified
        contractors.
      </p>
    ),
  },
  {
    title: "Commercial entity reporting",
    body: (
      <p>
        For companies and commercial entities (developers, main contractors,
        management companies, housing associations and similar), a company name
        and location may be shown where legally appropriate. Wording remains
        measured and non-defamatory, and the entity retains a right to reply.
      </p>
    ),
  },
  {
    id: "right-to-reply",
    title: "Right to reply",
    body: (
      <p>
        Anyone connected to a report may request a review or submit a right to
        reply from the report page. Submissions are reviewed by moderation. CRI
        may publish a response, annotate, correct, restrict or remove a report in
        light of a reply.
      </p>
    ),
  },
  {
    title: "Dispute and correction process",
    body: (
      <p>
        If you believe a report is inaccurate, you can raise a dispute via the
        right to reply or the contact details below. Disputed reports may be
        marked accordingly while reviewed. CRI aims to correct or restrict
        inaccurate content promptly once substantiated.
      </p>
    ),
  },
  {
    title: "Data protection",
    body: (
      <p>
        CRI processes personal data in line with applicable UK data protection
        law (including UK GDPR and the Data Protection Act 2018). We collect only
        what is needed to operate the platform, restrict sensitive residential
        data, and apply data minimisation to public displays. This MVP is a
        demonstration build and is not a statement that all compliance measures
        are complete.
      </p>
    ),
  },
  {
    id: "removal",
    title: "Removal / review requests",
    body: (
      <p>
        You can request the review, correction, restriction or removal of a
        report or of personal data relating to you. Please use the contact
        details below and include enough information to identify the report.
      </p>
    ),
  },
  {
    title: "Defamation-sensitive wording",
    body: (
      <p>
        CRI deliberately avoids language that asserts criminality, dishonesty or
        wrongdoing. Reports indicate contractor-submitted risk patterns and
        moderated experiences. CRI does not make legal findings of wrongdoing.
      </p>
    ),
  },
  {
    title: "Limitation of liability",
    body: (
      <p>
        CRI is a reporting platform &mdash; not an investigator, arbitrator,
        regulator or court. To the fullest extent permitted by law, CRI is not
        liable for decisions you make based on information on the platform, for
        the accuracy of contractor-submitted content, or for indirect or
        consequential loss. Nothing in these terms excludes liability that
        cannot lawfully be excluded.
      </p>
    ),
  },
  {
    title: "Governing law",
    body: (
      <p>
        These terms and your use of CRI are governed by the law of England and
        Wales, and the courts of England and Wales have exclusive jurisdiction.
      </p>
    ),
  },
  {
    title: "Contact for legal / data requests",
    body: (
      <p>
        For legal, data protection, right-to-reply or removal requests, contact{" "}
        <span className="font-medium text-cri-charcoal">legal@cri.example</span>.
        (Demo address — replace with a monitored contact before production.)
      </p>
    ),
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
        Legal &amp; Data Protection
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
        Legal and data protection
      </h1>
      <p className="mt-3 text-cri-steel">
        How CRI handles reports, evidence, privacy and your rights. Please read
        this alongside any report you view.
      </p>

      <div className="mt-6">
        <LegalDisclaimer />
      </div>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            id={section.id}
            className="scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-cri-charcoal">
              {section.title}
            </h2>
            <div className="mt-2 text-sm leading-relaxed text-cri-steel">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}