-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CONTRACTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerifiedStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('RESIDENTIAL_CLIENT', 'COMMERCIAL_CLIENT', 'DEVELOPER', 'MAIN_CONTRACTOR', 'PROJECT_MANAGER', 'QUANTITY_SURVEYOR', 'MANAGEMENT_COMPANY', 'HOUSING_ASSOCIATION');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('REFURBISHMENT', 'EXTENSION', 'JOINERY', 'WINDOWS_AND_DOORS', 'ELECTRICAL', 'PLUMBING', 'ROOFING', 'DECORATION', 'NEW_BUILD', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('COMPLETED', 'ONGOING', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AverageResponseTime" AS ENUM ('UNDER_24H', 'ONE_TO_THREE_DAYS', 'THREE_TO_SEVEN_DAYS', 'ONE_TO_TWO_WEEKS', 'MORE_THAN_TWO_WEEKS');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('UNVERIFIED', 'BASIC_EVIDENCE', 'VERIFIED_EVIDENCE', 'LEGAL_EVIDENCE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'VERIFIED_CONTRACTORS_ONLY', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "EvidenceReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RightToReplyStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "YesNoUnsure" AS ENUM ('YES', 'NO', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "PaymentLateStatus" AS ENUM ('YES', 'NO', 'PARTIALLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRACTOR',
    "verifiedStatus" "VerifiedStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "reporterCompanyName" TEXT NOT NULL,
    "reporterContactName" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "reporterPhone" TEXT,
    "reporterTradeType" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityName" TEXT,
    "clientInitials" TEXT,
    "isResidential" BOOLEAN NOT NULL DEFAULT false,
    "projectAddressLine1" TEXT,
    "projectCity" TEXT,
    "projectPostcode" TEXT,
    "publicArea" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "contractValueRange" TEXT,
    "startDate" TIMESTAMP(3),
    "projectStatus" "ProjectStatus" NOT NULL DEFAULT 'COMPLETED',
    "paymentScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "variationRisk" "RiskLevel" NOT NULL,
    "disputeRisk" "RiskLevel" NOT NULL,
    "averageResponseTime" "AverageResponseTime",
    "extrasRequestedWithoutApprovedCost" "YesNoUnsure",
    "paymentLate" "PaymentLateStatus",
    "paymentDelayDays" INTEGER,
    "amountUnpaid" INTEGER,
    "formalDispute" "YesNoUnsure",
    "issueDescription" TEXT NOT NULL,
    "publicSummary" TEXT,
    "evidenceStatus" "EvidenceStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "Visibility" NOT NULL DEFAULT 'VERIFIED_CONTRACTORS_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "riskReportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "description" TEXT,
    "status" "EvidenceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightToReply" (
    "id" TEXT NOT NULL,
    "riskReportId" TEXT NOT NULL,
    "responderName" TEXT NOT NULL,
    "responderEmail" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "status" "RightToReplyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightToReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RiskReport_moderationStatus_idx" ON "RiskReport"("moderationStatus");

-- CreateIndex
CREATE INDEX "RiskReport_entityType_idx" ON "RiskReport"("entityType");

-- CreateIndex
CREATE INDEX "RiskReport_publicArea_idx" ON "RiskReport"("publicArea");

-- CreateIndex
CREATE INDEX "Evidence_riskReportId_idx" ON "Evidence"("riskReportId");

-- CreateIndex
CREATE INDEX "RightToReply_riskReportId_idx" ON "RightToReply"("riskReportId");

-- AddForeignKey
ALTER TABLE "RiskReport" ADD CONSTRAINT "RiskReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_riskReportId_fkey" FOREIGN KEY ("riskReportId") REFERENCES "RiskReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightToReply" ADD CONSTRAINT "RightToReply_riskReportId_fkey" FOREIGN KEY ("riskReportId") REFERENCES "RiskReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
