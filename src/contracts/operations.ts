import type {
  ApplicationState,
  ChecklistItemStatus,
  CustomerType,
  EvidenceRefType,
  LivestockIdStatus,
  ReasonCode,
  ValidationStatus,
} from "./enums";
import type {
  ConfirmProfileFactInput,
  ConfirmProfileFactResult,
  ConversationalTurnResult,
  DocumentAsset,
  EvidenceQualityResult,
  EvidenceRef,
  ExplanationResult,
  PhotoAsset,
  ProfileFactProposal,
  ProvenancePayload,
  RankedPolicy,
  RecommendationContext,
  VhcExtractionResult,
} from "./ai";

export interface InteractionContext {
  interactionId: string;
  agentId: string;
  customerId?: string;
  clientMutationId?: string;
  idempotencyKey?: string;
}

export interface StartInteractionResult {
  interactionId: string;
  state: ApplicationState;
}

export interface ResumeInteractionInput {
  interactionId: string;
  agentId: string;
  clientDraftKey?: string;
}

export interface SyncOfflineDraftInput {
  interactionId: string;
  clientMutationId: string;
  idempotencyKey: string;
  baseVersion: number;
  payload: Record<string, unknown>;
}

export interface SyncOfflineDraftResult {
  interactionId: string;
  accepted: boolean;
  version: number;
}

export interface CloseInteractionInput {
  interactionId: string;
  reason?: string;
}

export interface ConversationalInput {
  interactionId: string;
  turnId: string;
  speaker: "AGENT" | "CUSTOMER" | "SYSTEM";
  messageText: string;
  languageCode: string;
  idempotencyKey: string;
}

export interface NextQuestionInput {
  interactionId: string;
  customerType?: CustomerType;
  missingFacts: string[];
  idStatus?: LivestockIdStatus;
}

export interface NextQuestionResult {
  question: string;
  purpose: "PROFILE" | "EARLY_ID" | "EVIDENCE" | "REVIEW";
}

export interface CheckIdStatusInput {
  interactionId: string;
  livestockRecordId: string;
  idempotencyKey: string;
}

export interface CheckIdStatusResult {
  status: LivestockIdStatus;
  identifierId?: string;
}

export interface RecordIdDecisionInput {
  interactionId: string;
  identifierId: string;
  status: LivestockIdStatus;
  idempotencyKey: string;
}

export interface CreateReferralHandoffInput {
  interactionId: string;
  identifierId: string;
  instituteId?: string;
  provisionalCustomerName?: string;
  idempotencyKey: string;
}

export interface CreateReferralHandoffResult {
  referralId: string;
  status: "PENDING" | "HANDOFF_COMPLETED";
}

export interface EligibilityInput {
  productId: string;
  context: RecommendationContext;
}

export interface EligibilityResult {
  productId: string;
  eligible: boolean;
  reasonCodes: ReasonCode[];
  missingFacts: string[];
}

export interface InsurerPrerequisites {
  productId: string;
  requiresTagForSubmission: boolean;
  allowsPendingTaggingInspection: boolean;
  requiresTagForIssuance: boolean;
  requiresVhc: boolean;
  vhcRequirements: string[];
}

export interface ExplainRecommendationInput {
  context: RecommendationContext;
  rankedPolicies: RankedPolicy[];
  prerequisites: InsurerPrerequisites[];
}

export interface GenerateChecklistInput {
  policySelectionId: string;
  productId: string;
  context: RecommendationContext;
  prerequisites: InsurerPrerequisites;
}

export interface ChecklistInstanceResult {
  checklistInstanceId: string;
  version: number;
  items: Array<{
    code: string;
    category: string;
    status: ChecklistItemStatus;
    requiredForSubmission: boolean;
    requiredForIssuance: boolean;
  }>;
}

export interface RecalculateChecklistInput {
  checklistInstanceId: string;
  context: RecommendationContext;
}

export interface EvidenceRequirementsInput {
  checklistInstanceId: string;
}

export interface EvidenceRequirement {
  code: string;
  category: string;
  evidenceRefType: EvidenceRefType;
  requiredForSubmission: boolean;
  requiredForIssuance: boolean;
}

export interface RecordEvidenceValidationInput {
  evidence: EvidenceRef;
  quality?: EvidenceQualityResult;
  vhc?: VhcExtractionResult;
  actorId: string;
  idempotencyKey: string;
}

export interface RecordEvidenceValidationResult {
  evidence: EvidenceRef;
  status: ValidationStatus;
  reasonCodes: ReasonCode[];
  checklistUpdated: boolean;
}

export interface ReadinessInput {
  applicationId: string;
  fromState: ApplicationState;
  checklistInstanceId: string;
  declarationsAccepted: boolean;
  rules: InsurerPrerequisites;
}

export interface ReadinessResult {
  eligible: boolean;
  reasonCodes: ReasonCode[];
  toState: ApplicationState;
}

export interface SubmitApplicationInput {
  applicationId: string;
  idempotencyKey: string;
  mode: "API" | "PORTAL_HANDOFF" | "MANUAL_HANDOFF";
}

export interface SubmitApplicationResult {
  attemptId: string;
  externalReferenceId: string;
  submittedAt: string;
}

export interface PollApplicationStatusInput {
  applicationId: string;
  externalReferenceId: string;
}

export interface PollApplicationStatusResult {
  state: ApplicationState;
  issuerReference?: string;
}

export interface RecordQualityResultInput {
  evidence: EvidenceRef;
  result: EvidenceQualityResult;
  provenance: ProvenancePayload;
}

export interface AttachRecommendationRationaleInput {
  recommendationRunId: string;
  productId: string;
  result: ExplanationResult;
  provenance: ProvenancePayload;
}

export type StartInteraction = (input: InteractionContext) => Promise<StartInteractionResult>;
export type ResumeInteraction = (input: ResumeInteractionInput) => Promise<InteractionContext>;
export type SyncOfflineDraft = (input: SyncOfflineDraftInput) => Promise<SyncOfflineDraftResult>;
export type CloseInteraction = (input: CloseInteractionInput) => Promise<void>;
export type ProcessConversationalInput = (input: ConversationalInput) => Promise<ConversationalTurnResult>;
export type GetNextQuestion = (input: NextQuestionInput) => Promise<NextQuestionResult>;
export type ProposeProfileFacts = (input: ConversationalInput) => Promise<ProfileFactProposal[]>;
export type ConfirmProfileFact = (input: ConfirmProfileFactInput) => Promise<ConfirmProfileFactResult>;
export type CheckIdStatus = (input: CheckIdStatusInput) => Promise<CheckIdStatusResult>;
export type RecordIdDecision = (input: RecordIdDecisionInput) => Promise<void>;
export type CreateReferralHandoff = (input: CreateReferralHandoffInput) => Promise<CreateReferralHandoffResult>;
export type GetRecommendationContext = (interactionId: string) => Promise<RecommendationContext>;
export type EvaluatePolicyEligibility = (input: EligibilityInput) => Promise<EligibilityResult>;
export type GetInsurerPrerequisites = (productId: string) => Promise<InsurerPrerequisites>;
export type ExplainRecommendation = (input: ExplainRecommendationInput) => Promise<ExplanationResult>;
export type GenerateChecklistInstance = (input: GenerateChecklistInput) => Promise<ChecklistInstanceResult>;
export type RecalculateChecklist = (input: RecalculateChecklistInput) => Promise<ChecklistInstanceResult>;
export type GetPendingEvidenceRequirements = (input: EvidenceRequirementsInput) => Promise<EvidenceRequirement[]>;
export type AssessEvidenceQuality = (photo: PhotoAsset) => Promise<EvidenceQualityResult>;
export type ExtractVhcFields = (document: DocumentAsset) => Promise<VhcExtractionResult>;
export type RecordQualityResult = (input: RecordQualityResultInput) => Promise<RecordEvidenceValidationResult>;
export type AttachRecommendationRationale = (input: AttachRecommendationRationaleInput) => Promise<void>;
export type RecordEvidenceValidation = (input: RecordEvidenceValidationInput) => Promise<RecordEvidenceValidationResult>;
export type EvaluateSubmissionReadiness = (input: ReadinessInput) => Promise<ReadinessResult>;
export type EvaluateIssuanceReadiness = (input: ReadinessInput) => Promise<ReadinessResult>;
export type SubmitApplication = (input: SubmitApplicationInput) => Promise<SubmitApplicationResult>;
export type PollApplicationStatus = (input: PollApplicationStatusInput) => Promise<PollApplicationStatusResult>;

export interface Operations {
  startInteraction: StartInteraction;
  resumeInteraction: ResumeInteraction;
  syncOfflineDraft: SyncOfflineDraft;
  closeInteraction: CloseInteraction;
  processConversationalInput: ProcessConversationalInput;
  getNextQuestion: GetNextQuestion;
  proposeProfileFacts: ProposeProfileFacts;
  confirmProfileFact: ConfirmProfileFact;
  checkIdStatus: CheckIdStatus;
  recordIdDecision: RecordIdDecision;
  createReferralHandoff: CreateReferralHandoff;
  getRecommendationContext: GetRecommendationContext;
  evaluatePolicyEligibility: EvaluatePolicyEligibility;
  getInsurerPrerequisites: GetInsurerPrerequisites;
  explainRecommendation: ExplainRecommendation;
  generateChecklistInstance: GenerateChecklistInstance;
  recalculateChecklist: RecalculateChecklist;
  getPendingEvidenceRequirements: GetPendingEvidenceRequirements;
  assessEvidenceQuality: AssessEvidenceQuality;
  extractVhcFields: ExtractVhcFields;
  recordQualityResult: RecordQualityResult;
  attachRecommendationRationale: AttachRecommendationRationale;
  recordEvidenceValidation: RecordEvidenceValidation;
  evaluateSubmissionReadiness: EvaluateSubmissionReadiness;
  evaluateIssuanceReadiness: EvaluateIssuanceReadiness;
  submitApplication: SubmitApplication;
  pollApplicationStatus: PollApplicationStatus;
}
