import type {
  ConfidenceBand,
  CustomerType,
  EvidenceRefType,
  ReasonCode,
  SourceEvidenceType,
  VerificationState,
} from "./enums";

export interface SourceEvidence {
  type: SourceEvidenceType;
  ref: string;
}

export interface AiEnvelope<T> {
  proposedValue: T;
  sourceEvidence: SourceEvidence;
  confidence: ConfidenceBand;
  verificationState: VerificationState;
  promptVersion: string;
  modelVersion: string;
}

export interface ProvenancePayload {
  promptKey: string;
  promptVersion: string;
  modelVersion: string;
  provider: string;
  confidence: ConfidenceBand;
  sourceEvidence: SourceEvidence;
  reasonCodes: ReasonCode[];
  rawEvidenceRef: string;
}

export interface RecommendationContext {
  interactionId: string;
  customerType: CustomerType;
  verifiedFacts: Record<string, unknown>;
  livestock: Array<Record<string, unknown>>;
}

export interface RankedPolicy {
  productId: string;
  code: string;
  name: string;
  rank: number;
  score: number;
  eligible: boolean;
  prerequisites: string[];
  missingFacts: string[];
}

export interface ExplanationValue {
  rationale: string;
  prerequisites: string[];
  exclusions: string[];
  missingFacts: string[];
  postSubmissionSteps: string[];
}

export type ExplanationResult = AiEnvelope<ExplanationValue>;

export interface PhotoAsset {
  id: string;
  storageUri: string;
  mimeType: string;
  category: string;
}

export interface DocumentAsset {
  id: string;
  storageUri: string;
  mimeType: string;
  category: string;
}

export interface EvidenceQualityScores {
  blur: number;
  illumination: number;
  tagLegibility: number;
  overall: number;
}

export interface EvidenceQualityValue {
  scores: EvidenceQualityScores;
  anomalies: string[];
}

export type EvidenceQualityResult = AiEnvelope<EvidenceQualityValue> & {
  reasonCodes: ReasonCode[];
};

export type VhcFieldKey =
  | "vetLicenseNumber"
  | "certificationDate"
  | "dentitionAge"
  | "milkYield"
  | "healthStatus";

export interface VhcField {
  key: VhcFieldKey;
  value: string;
  confidence: ConfidenceBand;
}

export type VhcExtractionResult = AiEnvelope<VhcField[]> & {
  reasonCodes: ReasonCode[];
};

export interface ProfileFactProposalValue {
  entityType: "CUSTOMER" | "LIVESTOCK" | "ORGANISATION";
  attributeKey: string;
  proposedValue: string;
  timestamp: string;
}

export type ProfileFactProposal = AiEnvelope<ProfileFactProposalValue>;

export interface ConversationalTurnResult {
  interactionId: string;
  turnId: string;
  messageText: string;
  nextQuestion: string | null;
  candidateFacts: ProfileFactProposal[];
  contradictions: string[];
  provenance: ProvenancePayload;
}

export interface ConfirmProfileFactInput {
  factId: string;
  acceptedValue?: string;
  actorId: string;
  verificationState: VerificationState;
}

export interface ConfirmProfileFactResult {
  factId: string;
  verificationState: VerificationState;
  eventName: "ProfileFactConfirmed";
}

export interface EvidenceRef {
  evidenceType: EvidenceRefType;
  evidenceId: string;
}
