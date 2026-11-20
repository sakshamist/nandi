import type { ApplicationState, LivestockIdStatus, ValidationStatus, VerificationState } from "./enums";
import type { ProvenancePayload } from "./ai";

export const DomainEvent = {
  InteractionStarted: "InteractionStarted",
  DraftSynced: "DraftSynced",
  ProfileFactProposed: "ProfileFactProposed",
  ProfileFactConfirmed: "ProfileFactConfirmed",
  CustomerTypeInferred: "CustomerTypeInferred",
  LivestockIdStatusRecorded: "LivestockIdStatusRecorded",
  IdReferralCreated: "IdReferralCreated",
  IdReferralDeclined: "IdReferralDeclined",
  RecommendationGenerated: "RecommendationGenerated",
  PolicySelected: "PolicySelected",
  ChecklistCreated: "ChecklistCreated",
  PhotoEvidenceCaptured: "PhotoEvidenceCaptured",
  DocumentValidationCompleted: "DocumentValidationCompleted",
  ApplicationStateChanged: "ApplicationStateChanged",
  ApplicationSubmitted: "ApplicationSubmitted",
  PolicyIssued: "PolicyIssued",
  ApplicationRejected: "ApplicationRejected",
  BulkValidationRequested: "BulkValidationRequested",
  ClaimCaseReferenced: "ClaimCaseReferenced",
} as const;
export type DomainEventName = (typeof DomainEvent)[keyof typeof DomainEvent];

export interface BaseEventPayload {
  interactionId?: string;
  actorId?: string;
  provenance?: ProvenancePayload;
}

export interface DomainEventPayloadMap {
  InteractionStarted: BaseEventPayload & { interactionId: string; agentId: string };
  DraftSynced: BaseEventPayload & { interactionId: string; version: number; clientMutationId: string };
  ProfileFactProposed: BaseEventPayload & { factId: string; entityType: string; attributeKey: string };
  ProfileFactConfirmed: BaseEventPayload & { factId: string; verificationState: VerificationState };
  CustomerTypeInferred: BaseEventPayload & { customerType: string };
  LivestockIdStatusRecorded: BaseEventPayload & { identifierId: string; status: LivestockIdStatus };
  IdReferralCreated: BaseEventPayload & { referralId: string; instituteId?: string };
  IdReferralDeclined: BaseEventPayload & { referralId: string };
  RecommendationGenerated: BaseEventPayload & { recommendationRunId: string; rankedProductIds: string[] };
  PolicySelected: BaseEventPayload & { policySelectionId: string; productId: string };
  ChecklistCreated: BaseEventPayload & { checklistInstanceId: string; version: number };
  PhotoEvidenceCaptured: BaseEventPayload & { photoId: string; category: string };
  DocumentValidationCompleted: BaseEventPayload & {
    evidenceType: "photo" | "document";
    evidenceId: string;
    status: ValidationStatus;
    reasonCodes: string[];
  };
  ApplicationStateChanged: BaseEventPayload & {
    applicationId: string;
    fromState: ApplicationState;
    toState: ApplicationState;
  };
  ApplicationSubmitted: BaseEventPayload & { applicationId: string; attemptId: string };
  PolicyIssued: BaseEventPayload & { applicationId: string; policyNumber: string };
  ApplicationRejected: BaseEventPayload & { applicationId: string; reason: string };
  BulkValidationRequested: BaseEventPayload & { batchId: string };
  ClaimCaseReferenced: BaseEventPayload & { caseId: string };
}

export interface DomainEventEnvelope<K extends DomainEventName> {
  name: K;
  payload: DomainEventPayloadMap[K];
  occurredAt: string;
  correlationId: string;
}

export const EventEmitter: Record<DomainEventName, "PLATFORM" | "AI"> = {
  InteractionStarted: "PLATFORM",
  DraftSynced: "PLATFORM",
  ProfileFactProposed: "AI",
  ProfileFactConfirmed: "PLATFORM",
  CustomerTypeInferred: "AI",
  LivestockIdStatusRecorded: "PLATFORM",
  IdReferralCreated: "PLATFORM",
  IdReferralDeclined: "PLATFORM",
  RecommendationGenerated: "PLATFORM",
  PolicySelected: "PLATFORM",
  ChecklistCreated: "PLATFORM",
  PhotoEvidenceCaptured: "PLATFORM",
  DocumentValidationCompleted: "PLATFORM",
  ApplicationStateChanged: "PLATFORM",
  ApplicationSubmitted: "PLATFORM",
  PolicyIssued: "PLATFORM",
  ApplicationRejected: "PLATFORM",
  BulkValidationRequested: "PLATFORM",
  ClaimCaseReferenced: "PLATFORM",
};

export const NonBlockingReferralEvents: readonly DomainEventName[] = [
  DomainEvent.IdReferralCreated,
  DomainEvent.IdReferralDeclined,
];
