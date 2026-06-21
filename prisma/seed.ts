/**
 * Demo seed data for CRI.
 *
 * ⚠️ ALL DATA BELOW IS ENTIRELY FICTIONAL and exists only to demonstrate the
 * MVP. Company names, people, areas, scores and summaries are invented.
 *
 * The seed clears existing rows first so it is repeatable in development.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear (respect FK order). Safe: demo database only.
  await prisma.rightToReply.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.riskReport.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@cri.example",
      name: "CRI Admin (demo)",
      companyName: "CRI",
      role: "ADMIN",
      verifiedStatus: "VERIFIED",
    },
  });

  const contractor = await prisma.user.create({
    data: {
      email: "demo.contractor@cri.example",
      name: "Demo Contractor",
      companyName: "Demo Joinery Ltd",
      phone: "07000 000000",
      role: "CONTRACTOR",
      verifiedStatus: "VERIFIED",
    },
  });

  // 1. Residential — C.A. — SW19 (APPROVED, restricted visibility)
  const residential = await prisma.riskReport.create({
    data: {
      reporterId: contractor.id,
      reporterCompanyName: "Demo Joinery Ltd",
      reporterContactName: "Demo Contractor",
      reporterEmail: "demo.contractor@cri.example",
      reporterPhone: "07000 000000",
      reporterTradeType: "Joinery",
      entityType: "RESIDENTIAL_CLIENT",
      entityName: null,
      clientInitials: "C.A.",
      isResidential: true,
      projectAddressLine1: "[withheld — demo]",
      projectCity: "London",
      projectPostcode: "SW19 4AB",
      publicArea: "SW19",
      projectType: "REFURBISHMENT",
      contractValueRange: "25K_50K",
      projectStatus: "DISPUTED",
      paymentScore: 2.8,
      communicationScore: 3.5,
      variationRisk: "HIGH",
      disputeRisk: "MEDIUM",
      averageResponseTime: "ONE_TO_TWO_WEEKS",
      extrasRequestedWithoutApprovedCost: "YES",
      paymentLate: "YES",
      paymentDelayDays: 45,
      amountUnpaid: 6200,
      formalDispute: "NO",
      issueDescription:
        "[Fictional demo] Contractor reports delayed stage payments and repeated requests for additional joinery work before revised costs were agreed in writing.",
      publicSummary:
        "Contractor-reported delayed payment and repeated requests for additional work before costs were agreed.",
      evidenceStatus: "BASIC_EVIDENCE",
      moderationStatus: "APPROVED",
      visibility: "VERIFIED_CONTRACTORS_ONLY",
    },
  });

  await prisma.evidence.create({
    data: {
      riskReportId: residential.id,
      type: "DESCRIPTION",
      description:
        "[Demo] Dated invoices and email correspondence available on request.",
      status: "ACCEPTED",
    },
  });

  // 2. Developer — Greenfield Urban Ltd — London (APPROVED, PUBLIC)
  await prisma.riskReport.create({
    data: {
      reporterCompanyName: "Riverside Electrical Contractors",
      reporterContactName: "[Demo Reporter]",
      reporterEmail: "reporter@cri.example",
      reporterTradeType: "Electrical",
      entityType: "DEVELOPER",
      entityName: "Greenfield Urban Ltd",
      isResidential: false,
      projectCity: "London",
      publicArea: "London",
      projectType: "NEW_BUILD",
      contractValueRange: "100K_PLUS",
      projectStatus: "COMPLETED",
      paymentScore: 4.2,
      communicationScore: 5.0,
      variationRisk: "MEDIUM",
      disputeRisk: "LOW",
      averageResponseTime: "THREE_TO_SEVEN_DAYS",
      extrasRequestedWithoutApprovedCost: "NO",
      paymentLate: "PARTIALLY",
      paymentDelayDays: 21,
      formalDispute: "NO",
      issueDescription:
        "[Fictional demo] Generally workable relationship; some valuation delays on later stages of a new-build programme.",
      publicSummary:
        "Contractor-reported moderate payment delays on later project stages, with otherwise reasonable communication.",
      evidenceStatus: "VERIFIED_EVIDENCE",
      moderationStatus: "APPROVED",
      visibility: "PUBLIC",
    },
  });

  // 3. Main Contractor — Northline Build Group — Manchester (APPROVED, PUBLIC)
  await prisma.riskReport.create({
    data: {
      reporterCompanyName: "Pennine Roofing Co",
      reporterContactName: "[Demo Reporter]",
      reporterEmail: "reporter2@cri.example",
      reporterTradeType: "Roofing",
      entityType: "MAIN_CONTRACTOR",
      entityName: "Northline Build Group",
      isResidential: false,
      projectCity: "Manchester",
      publicArea: "Manchester",
      projectType: "ROOFING",
      contractValueRange: "50K_100K",
      projectStatus: "COMPLETED",
      paymentScore: 3.0,
      communicationScore: 3.8,
      variationRisk: "HIGH",
      disputeRisk: "HIGH",
      averageResponseTime: "ONE_TO_TWO_WEEKS",
      extrasRequestedWithoutApprovedCost: "YES",
      paymentLate: "YES",
      paymentDelayDays: 60,
      amountUnpaid: 18400,
      formalDispute: "YES",
      issueDescription:
        "[Fictional demo] Reported deductions at final account stage and slow responses on variations during a roofing package.",
      publicSummary:
        "Contractor-reported final-account deductions and slow variation responses, with a formal dispute noted.",
      evidenceStatus: "BASIC_EVIDENCE",
      moderationStatus: "APPROVED",
      visibility: "PUBLIC",
    },
  });

  // 4. Quantity Surveyor — Meridian QS Consultants — Birmingham (APPROVED, PUBLIC)
  await prisma.riskReport.create({
    data: {
      reporterCompanyName: "Citywide Plumbing Services",
      reporterContactName: "[Demo Reporter]",
      reporterEmail: "reporter3@cri.example",
      reporterTradeType: "Plumbing",
      entityType: "QUANTITY_SURVEYOR",
      entityName: "Meridian QS Consultants",
      isResidential: false,
      projectCity: "Birmingham",
      publicArea: "Birmingham",
      projectType: "PLUMBING",
      contractValueRange: "25K_50K",
      projectStatus: "COMPLETED",
      paymentScore: 5.5,
      communicationScore: 4.0,
      variationRisk: "MEDIUM",
      disputeRisk: "MEDIUM",
      averageResponseTime: "THREE_TO_SEVEN_DAYS",
      extrasRequestedWithoutApprovedCost: "NOT_SURE",
      paymentLate: "NO",
      formalDispute: "NO",
      issueDescription:
        "[Fictional demo] Reported firm valuations and limited flexibility on interim applications during a fit-out.",
      publicSummary:
        "Contractor-reported firm interim valuations and limited flexibility on applications during the project.",
      evidenceStatus: "UNVERIFIED",
      moderationStatus: "APPROVED",
      visibility: "PUBLIC",
    },
  });

  // 5. Residential — R.P. — E17 (PENDING — should NOT appear in public search)
  await prisma.riskReport.create({
    data: {
      reporterCompanyName: "Demo Joinery Ltd",
      reporterContactName: "Demo Contractor",
      reporterEmail: "demo.contractor@cri.example",
      reporterTradeType: "Joinery",
      entityType: "RESIDENTIAL_CLIENT",
      clientInitials: "R.P.",
      isResidential: true,
      projectCity: "London",
      projectPostcode: "E17 7QX",
      publicArea: "E17",
      projectType: "EXTENSION",
      contractValueRange: "10K_25K",
      projectStatus: "ONGOING",
      paymentScore: 3.1,
      communicationScore: 2.9,
      variationRisk: "HIGH",
      disputeRisk: "MEDIUM",
      averageResponseTime: "MORE_THAN_TWO_WEEKS",
      extrasRequestedWithoutApprovedCost: "YES",
      paymentLate: "YES",
      paymentDelayDays: 30,
      formalDispute: "NOT_SURE",
      issueDescription:
        "[Fictional demo] Awaiting moderation — illustrates that pending reports are never shown publicly.",
      publicSummary: null,
      evidenceStatus: "UNVERIFIED",
      moderationStatus: "PENDING",
      visibility: "VERIFIED_CONTRACTORS_ONLY",
    },
  });

  // 6. Management Company — Parkway Management Co — Leeds (DISPUTED)
  const disputed = await prisma.riskReport.create({
    data: {
      reporterCompanyName: "Northgate Decorators",
      reporterContactName: "[Demo Reporter]",
      reporterEmail: "reporter4@cri.example",
      reporterTradeType: "Decoration",
      entityType: "MANAGEMENT_COMPANY",
      entityName: "Parkway Management Co",
      isResidential: false,
      projectCity: "Leeds",
      publicArea: "Leeds",
      projectType: "DECORATION",
      contractValueRange: "10K_25K",
      projectStatus: "DISPUTED",
      paymentScore: 4.5,
      communicationScore: 4.5,
      variationRisk: "MEDIUM",
      disputeRisk: "HIGH",
      averageResponseTime: "ONE_TO_THREE_DAYS",
      extrasRequestedWithoutApprovedCost: "NO",
      paymentLate: "PARTIALLY",
      formalDispute: "YES",
      issueDescription:
        "[Fictional demo] A dispute has been raised; report is under review and a right to reply has been received.",
      publicSummary:
        "Contractor-reported scope and payment disagreement; under review with a right to reply received.",
      evidenceStatus: "BASIC_EVIDENCE",
      moderationStatus: "DISPUTED",
      visibility: "VERIFIED_CONTRACTORS_ONLY",
    },
  });

  await prisma.rightToReply.create({
    data: {
      riskReportId: disputed.id,
      responderName: "[Demo] Parkway Management Co",
      responderEmail: "contact@parkway.example",
      responseText:
        "[Fictional demo] We disagree with parts of this account and have asked CRI to review the report.",
      status: "PENDING",
    },
  });

  console.log("Seed complete (fictional demo data).");
  console.log(`Admin user: ${admin.email}`);
  console.log(`Contractor user: ${contractor.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
