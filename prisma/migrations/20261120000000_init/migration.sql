-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'DAIRY_FARM', 'COOPERATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "LivestockIdStatus" AS ENUM ('PRESENT', 'ABSENT', 'UNKNOWN', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ReferralDecision" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'HANDOFF_COMPLETED', 'APPOINTMENT_SCHEDULED', 'TAGGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('REQUIRED', 'CONDITIONAL', 'OPTIONAL', 'COMPLETED', 'WAIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('ANIMAL_FULL_BODY_PHOTO', 'EAR_TAG_PHOTO', 'ANIMAL_WITH_OWNER_PHOTO', 'VETERINARY_HEALTH_CERTIFICATE', 'KYC_IDENTITY_PROOF', 'KYC_ADDRESS_PROOF', 'OWNERSHIP_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ApplicationState" AS ENUM ('PROFILE_INCOMPLETE', 'AWAITING_TAGGING_INSPECTION', 'READY_FOR_SUBMISSION', 'SUBMITTED', 'UNDERWRITING_REVIEW', 'ISSUED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubmissionMode" AS ENUM ('API', 'PORTAL_HANDOFF', 'MANUAL_HANDOFF');

-- CreateEnum
CREATE TYPE "FactVerificationState" AS ENUM ('UNVERIFIED', 'AGENT_CONFIRMED', 'EXTERNALLY_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceRefType" AS ENUM ('PHOTO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "RecommendationOutcomeStatus" AS ENUM ('SELECTED', 'OPTED_OUT', 'EXPIRED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "territoryCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'hi',
    "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisationType" "CustomerType" NOT NULL DEFAULT 'COOPERATIVE',
    "registrationNumber" TEXT,
    "contactPhone" TEXT NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMember" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "roleInOrganisation" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestockRecord" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "organisationId" TEXT,
    "species" TEXT NOT NULL DEFAULT 'CATTLE',
    "breed" TEXT,
    "ageMonths" INTEGER,
    "dentitionCount" INTEGER,
    "currentMilkYieldLpd" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestockRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestockIdentifier" (
    "id" TEXT NOT NULL,
    "livestockRecordId" TEXT NOT NULL,
    "idStatus" "LivestockIdStatus" NOT NULL DEFAULT 'UNKNOWN',
    "tagNumber" TEXT,
    "tagType" TEXT DEFAULT 'VISUAL_EAR_TAG',
    "issuer" TEXT DEFAULT 'INAPH',
    "verificationState" "FactVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivestockIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instituteType" TEXT NOT NULL DEFAULT 'GOVERNMENT_VETERINARY_DISPENSARY',
    "contactPerson" TEXT,
    "contactPhone" TEXT NOT NULL,
    "email" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "serviceAreaSummary" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdReferral" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "customerId" TEXT,
    "provisionalCustomerName" TEXT,
    "livestockIdentifierId" TEXT NOT NULL,
    "instituteId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "decision" "ReferralDecision" NOT NULL DEFAULT 'UNDECIDED',
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "handoffTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentStage" TEXT NOT NULL DEFAULT 'STARTED',
    "referralStatus" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "clientDraftKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTurn" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'hi',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileFact" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "customerId" TEXT,
    "entityType" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "proposedValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceEvidence" TEXT,
    "verificationState" "FactVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "confirmedByAgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "insurerName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "minAgeMonths" INTEGER NOT NULL DEFAULT 12,
    "maxAgeMonths" INTEGER NOT NULL DEFAULT 144,
    "basePremiumRate" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL DEFAULT 'ELIGIBILITY',
    "ruleKey" TEXT NOT NULL,
    "conditionsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurerConstraint" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "requiresTagForSubmission" BOOLEAN NOT NULL DEFAULT false,
    "allowsPendingTaggingInspection" BOOLEAN NOT NULL DEFAULT true,
    "requiresTagForIssuance" BOOLEAN NOT NULL DEFAULT true,
    "requiresVhc" BOOLEAN NOT NULL DEFAULT true,
    "vhcRequirementsJson" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsurerConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRun" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "inputContextJson" TEXT NOT NULL,
    "candidatePoliciesJson" TEXT NOT NULL,
    "rationaleSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationOutcome" (
    "id" TEXT NOT NULL,
    "recommendationRunId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "RecommendationOutcomeStatus" NOT NULL DEFAULT 'SELECTED',
    "selectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicySelection" (
    "id" TEXT NOT NULL,
    "recommendationRunId" TEXT,
    "interactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "PolicySelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "itemsConfigJson" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistInstance" (
    "id" TEXT NOT NULL,
    "policySelectionId" TEXT NOT NULL,
    "applicationId" TEXT,
    "templateId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistInstanceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EvidenceCategory" NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'REQUIRED',
    "requiredForSubmission" BOOLEAN NOT NULL DEFAULT true,
    "requiredForIssuance" BOOLEAN NOT NULL DEFAULT true,
    "evidenceId" TEXT,
    "evidenceRefType" "EvidenceRefType",
    "reasonCode" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoEvidence" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "livestockRecordId" TEXT,
    "livestockIdentifierId" TEXT,
    "category" "EvidenceCategory" NOT NULL,
    "storageUri" TEXT NOT NULL,
    "thumbnailUri" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "fileSizeBytes" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "hasGeoConsent" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" DOUBLE PRECISION,
    "tagNumberDetected" TEXT,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationNotes" TEXT,
    "reviewerNotes" TEXT,
    "reviewedByAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "customerId" TEXT,
    "category" "EvidenceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "storageUri" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSizeBytes" INTEGER,
    "extractedDataJson" TEXT,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationNotes" TEXT,
    "hasUploadConsent" BOOLEAN NOT NULL DEFAULT false,
    "reviewedByAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT,
    "agentId" TEXT NOT NULL,
    "customerId" TEXT,
    "organisationId" TEXT,
    "livestockRecordId" TEXT,
    "productId" TEXT NOT NULL,
    "policySelectionId" TEXT NOT NULL,
    "state" "ApplicationState" NOT NULL DEFAULT 'PROFILE_INCOMPLETE',
    "submissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "issuanceEligible" BOOLEAN NOT NULL DEFAULT false,
    "submissionMode" "SubmissionMode" NOT NULL DEFAULT 'MANUAL_HANDOFF',
    "externalPolicyNumber" TEXT,
    "externalReferenceId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAttempt" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "submissionMode" "SubmissionMode" NOT NULL DEFAULT 'MANUAL_HANDOFF',
    "idempotencyKey" TEXT NOT NULL,
    "requestPayloadJson" TEXT NOT NULL,
    "responsePayloadJson" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkBatch" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'STUB_NOT_IMPLEMENTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmCase" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "applicationId" TEXT,
    "caseType" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'AGENT',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeStateJson" TEXT,
    "afterStateJson" TEXT,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "interactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptMetadata" (
    "id" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "photoId" TEXT,
    "documentId" TEXT,
    "evidenceRefType" "EvidenceRefType" NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "reasonCodesJson" TEXT,
    "confidenceBand" TEXT,
    "deterministic" BOOLEAN NOT NULL DEFAULT false,
    "promptMetadataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "evidenceRefType" "EvidenceRefType" NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStateTransition" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromState" "ApplicationState",
    "toState" "ApplicationState" NOT NULL,
    "actorId" TEXT,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStateTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyIssuance" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "insurerReference" TEXT,
    "policyNumber" TEXT NOT NULL,
    "payloadJson" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchItemStub" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "customerId" TEXT,
    "livestockRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STUB_NOT_IMPLEMENTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchItemStub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimCaseStub" (
    "id" TEXT NOT NULL,
    "crmCaseId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_IMPLEMENTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimCaseStub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleVersion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "rulesJson" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureMetadata" (
    "id" TEXT NOT NULL,
    "photoEvidenceId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "hasGeoConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaptureMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE INDEX "Customer_primaryPhone_idx" ON "Customer"("primaryPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_registrationNumber_key" ON "Organisation"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMember_organisationId_customerId_key" ON "OrganisationMember"("organisationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "LivestockIdentifier_livestockRecordId_key" ON "LivestockIdentifier"("livestockRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "IdReferral_idempotencyKey_key" ON "IdReferral"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_clientDraftKey_key" ON "Interaction"("clientDraftKey");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationTurn_interactionId_turnOrder_key" ON "ConversationTurn"("interactionId", "turnOrder");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_code_key" ON "InsuranceProduct"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InsurerConstraint_productId_version_key" ON "InsurerConstraint"("productId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationOutcome_recommendationRunId_productId_key" ON "RecommendationOutcome"("recommendationRunId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistInstance_policySelectionId_key" ON "ChecklistInstance"("policySelectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItem_checklistInstanceId_code_key" ON "ChecklistItem"("checklistInstanceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoEvidence_idempotencyKey_key" ON "PhotoEvidence"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Document_idempotencyKey_key" ON "Document"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Application_policySelectionId_key" ON "Application"("policySelectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttempt_idempotencyKey_key" ON "SubmissionAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptMetadata_promptKey_promptVersion_key" ON "PromptMetadata"("promptKey", "promptVersion");

-- CreateIndex
CREATE INDEX "ValidationResult_evidenceRefType_evidenceId_idx" ON "ValidationResult"("evidenceRefType", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyIssuance_applicationId_key" ON "PolicyIssuance"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminConfig_key_key" ON "AdminConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RuleVersion_productId_version_key" ON "RuleVersion"("productId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureMetadata_photoEvidenceId_key" ON "CaptureMetadata"("photoEvidenceId");

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestockRecord" ADD CONSTRAINT "LivestockRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestockRecord" ADD CONSTRAINT "LivestockRecord_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestockIdentifier" ADD CONSTRAINT "LivestockIdentifier_livestockRecordId_fkey" FOREIGN KEY ("livestockRecordId") REFERENCES "LivestockRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdReferral" ADD CONSTRAINT "IdReferral_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdReferral" ADD CONSTRAINT "IdReferral_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdReferral" ADD CONSTRAINT "IdReferral_livestockIdentifierId_fkey" FOREIGN KEY ("livestockIdentifierId") REFERENCES "LivestockIdentifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdReferral" ADD CONSTRAINT "IdReferral_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTurn" ADD CONSTRAINT "ConversationTurn_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFact" ADD CONSTRAINT "ProfileFact_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFact" ADD CONSTRAINT "ProfileFact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRule" ADD CONSTRAINT "ProductRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurerConstraint" ADD CONSTRAINT "InsurerConstraint_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRun" ADD CONSTRAINT "RecommendationRun_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRun" ADD CONSTRAINT "RecommendationRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationOutcome" ADD CONSTRAINT "RecommendationOutcome_recommendationRunId_fkey" FOREIGN KEY ("recommendationRunId") REFERENCES "RecommendationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationOutcome" ADD CONSTRAINT "RecommendationOutcome_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicySelection" ADD CONSTRAINT "PolicySelection_recommendationRunId_fkey" FOREIGN KEY ("recommendationRunId") REFERENCES "RecommendationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicySelection" ADD CONSTRAINT "PolicySelection_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicySelection" ADD CONSTRAINT "PolicySelection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_policySelectionId_fkey" FOREIGN KEY ("policySelectionId") REFERENCES "PolicySelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistInstanceId_fkey" FOREIGN KEY ("checklistInstanceId") REFERENCES "ChecklistInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvidence" ADD CONSTRAINT "PhotoEvidence_livestockRecordId_fkey" FOREIGN KEY ("livestockRecordId") REFERENCES "LivestockRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvidence" ADD CONSTRAINT "PhotoEvidence_livestockIdentifierId_fkey" FOREIGN KEY ("livestockIdentifierId") REFERENCES "LivestockIdentifier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvidence" ADD CONSTRAINT "PhotoEvidence_reviewedByAgentId_fkey" FOREIGN KEY ("reviewedByAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedByAgentId_fkey" FOREIGN KEY ("reviewedByAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_livestockRecordId_fkey" FOREIGN KEY ("livestockRecordId") REFERENCES "LivestockRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_policySelectionId_fkey" FOREIGN KEY ("policySelectionId") REFERENCES "PolicySelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttempt" ADD CONSTRAINT "SubmissionAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkBatch" ADD CONSTRAINT "BulkBatch_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCase" ADD CONSTRAINT "CrmCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCase" ADD CONSTRAINT "CrmCase_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "PhotoEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_promptMetadataId_fkey" FOREIGN KEY ("promptMetadataId") REFERENCES "PromptMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStateTransition" ADD CONSTRAINT "ApplicationStateTransition_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStateTransition" ADD CONSTRAINT "ApplicationStateTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyIssuance" ADD CONSTRAINT "PolicyIssuance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItemStub" ADD CONSTRAINT "BatchItemStub_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BulkBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItemStub" ADD CONSTRAINT "BatchItemStub_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItemStub" ADD CONSTRAINT "BatchItemStub_livestockRecordId_fkey" FOREIGN KEY ("livestockRecordId") REFERENCES "LivestockRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimCaseStub" ADD CONSTRAINT "ClaimCaseStub_crmCaseId_fkey" FOREIGN KEY ("crmCaseId") REFERENCES "CrmCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureMetadata" ADD CONSTRAINT "CaptureMetadata_photoEvidenceId_fkey" FOREIGN KEY ("photoEvidenceId") REFERENCES "PhotoEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
