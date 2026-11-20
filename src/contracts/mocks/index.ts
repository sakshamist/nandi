import {
  ApplicationState,
  ConfidenceBand,
  CustomerType,
  EvidenceRefType,
  ReasonCode,
  SourceEvidenceType,
  ValidationStatus,
  VerificationState,
} from "../enums";
import type { EvidenceRequirement } from "../operations";
import type {
  DocumentAsset,
  EvidenceQualityResult,
  ExplanationResult,
  PhotoAsset,
  ProfileFactProposal,
  ProvenancePayload,
  VhcExtractionResult,
} from "../ai";

const provenance: ProvenancePayload = {
  promptKey: "surelm.mock.v1",
  promptVersion: "2026-11-20.1",
  modelVersion: "mock-model-1",
  provider: "MOCK",
  confidence: ConfidenceBand.High,
  sourceEvidence: { type: SourceEvidenceType.ConversationTurn, ref: "turn-mock-1" },
  reasonCodes: [],
  rawEvidenceRef: "turn-mock-1",
};

export const mockEarlyIdPrompt = {
  question: "Does this animal already have a government ear tag or RFID?",
  idStatus: "absent" as const,
  provenance,
};

export const mockProcessConversationalInput = {
  interactionId: "interaction-mock-1",
  turnId: "turn-mock-1",
  messageText: "We have ten dairy cows and no ear tag yet.",
  nextQuestion: "Are you the individual owner or representing a group?",
  candidateFacts: [] as ProfileFactProposal[],
  contradictions: [] as string[],
  provenance,
};

export const mockProposeProfileFacts: ProfileFactProposal[] = [
  {
    proposedValue: {
      entityType: "CUSTOMER",
      attributeKey: "customerType",
      proposedValue: "DAIRY_FARM",
      timestamp: "2026-11-20T00:00:00.000Z",
    },
    sourceEvidence: { type: SourceEvidenceType.ConversationTurn, ref: "turn-mock-1" },
    confidence: ConfidenceBand.High,
    verificationState: VerificationState.Unverified,
    promptVersion: provenance.promptVersion,
    modelVersion: provenance.modelVersion,
  },
];

export const mockExplainRecommendation: ExplanationResult = {
  proposedValue: {
    rationale: "Mock rationale derived from seeded insurer rules.",
    prerequisites: ["Valid ear tag before issuance", "Veterinary Health Certificate"],
    exclusions: [],
    missingFacts: ["dentition age"],
    postSubmissionSteps: ["Complete tagging inspection"],
  },
  sourceEvidence: { type: SourceEvidenceType.ProductRule, ref: "product-rule-mock-1" },
  confidence: ConfidenceBand.High,
  verificationState: VerificationState.Unverified,
  promptVersion: provenance.promptVersion,
  modelVersion: provenance.modelVersion,
};

const mockPhoto: PhotoAsset = {
  id: "photo-mock-1",
  storageUri: "mock://photos/ear-tag-1",
  mimeType: "image/jpeg",
  category: "EAR_TAG_PHOTO",
};

export const mockAssessEvidenceQuality: EvidenceQualityResult = {
  proposedValue: {
    scores: { blur: 0.92, illumination: 0.88, tagLegibility: 0.84, overall: 0.88 },
    anomalies: [],
  },
  sourceEvidence: { type: SourceEvidenceType.Photo, ref: mockPhoto.id },
  confidence: ConfidenceBand.High,
  verificationState: VerificationState.Unverified,
  promptVersion: provenance.promptVersion,
  modelVersion: provenance.modelVersion,
  reasonCodes: [],
};

const mockDocument: DocumentAsset = {
  id: "document-mock-1",
  storageUri: "mock://documents/vhc-1",
  mimeType: "application/pdf",
  category: "VETERINARY_HEALTH_CERTIFICATE",
};

export const mockExtractVhcFields: VhcExtractionResult = {
  proposedValue: [
    {
      key: "vetLicenseNumber",
      value: "VET-MOCK-1",
      confidence: ConfidenceBand.High,
    },
    {
      key: "dentitionAge",
      value: "36 months",
      confidence: ConfidenceBand.Medium,
    },
  ],
  sourceEvidence: { type: SourceEvidenceType.Document, ref: mockDocument.id },
  confidence: ConfidenceBand.Medium,
  verificationState: VerificationState.Unverified,
  promptVersion: provenance.promptVersion,
  modelVersion: provenance.modelVersion,
  reasonCodes: [],
};

export const mockGetRecommendationContext = {
  interactionId: "interaction-mock-1",
  customerType: CustomerType.DairyFarm,
  verifiedFacts: { livestockCount: 10, ownership: "OWNER" },
  livestock: [{ species: "CATTLE", breed: "HOLSTEIN", ageMonths: 36 }],
};

export const mockRuleOutputs = {
  productId: "product-mock-1",
  requiresTagForSubmission: false,
  allowsPendingTaggingInspection: true,
  requiresTagForIssuance: true,
  requiresVhc: true,
  vhcRequirements: ["vetLicenseNumber", "dentitionAge", "milkYield"],
  eligibility: {
    productId: "product-mock-1",
    eligible: true,
    reasonCodes: [],
    missingFacts: ["milkYield"],
  },
};

export const mockEvidenceRequirements: EvidenceRequirement[] = [
  {
    code: "ANIMAL_FULL_BODY_PHOTO",
    category: "ANIMAL_FULL_BODY_PHOTO",
    evidenceRefType: EvidenceRefType.Photo,
    requiredForSubmission: true,
    requiredForIssuance: true,
  },
  {
    code: "EAR_TAG_PHOTO",
    category: "EAR_TAG_PHOTO",
    evidenceRefType: EvidenceRefType.Photo,
    requiredForSubmission: true,
    requiredForIssuance: true,
  },
  {
    code: "ANIMAL_WITH_OWNER_PHOTO",
    category: "ANIMAL_WITH_OWNER_PHOTO",
    evidenceRefType: EvidenceRefType.Photo,
    requiredForSubmission: true,
    requiredForIssuance: true,
  },
  {
    code: "VHC",
    category: "VETERINARY_HEALTH_CERTIFICATE",
    evidenceRefType: EvidenceRefType.Document,
    requiredForSubmission: true,
    requiredForIssuance: true,
  },
  {
    code: "KYC_IDENTITY",
    category: "KYC_IDENTITY_PROOF",
    evidenceRefType: EvidenceRefType.Document,
    requiredForSubmission: true,
    requiredForIssuance: true,
  },
];

export const mockRecordEvidenceValidation = {
  evidence: { evidenceType: EvidenceRefType.Photo, evidenceId: mockPhoto.id },
  status: ValidationStatus.Pass,
  reasonCodes: [] as ReasonCode[],
  checklistUpdated: true,
};

export const mockAuditSink = {
  applicationState: ApplicationState.ProfileIncomplete,
  provenance,
  eventNames: [] as string[],
};
