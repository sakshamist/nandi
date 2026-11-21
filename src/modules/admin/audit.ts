import type { AuditEvent } from "@prisma/client";
import { DomainEvent, type DomainEventName } from "@/contracts/events";
import { onAny } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";

export interface RecordAuditEventInput {
  actorId?: string;
  actorType?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: string | null;
  afterState?: string | null;
  metadataJson?: string | null;
  interactionId?: string;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  interactionId?: string;
  actorId?: string;
  limit?: number;
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<AuditEvent> {
  return prisma.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "AGENT",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeStateJson: input.beforeState ?? null,
      afterStateJson: input.afterState ?? null,
      metadataJson: input.metadataJson ?? null,
      interactionId: input.interactionId ?? null,
    },
  });
}

export async function getAuditLog(filters: AuditLogFilter = {}): Promise<AuditEvent[]> {
  return prisma.auditEvent.findMany({
    where: {
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.interactionId ? { interactionId: filters.interactionId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: filters.limit ?? 50,
  });
}

const EVENT_META: Record<string, { entityType: string; entityIdKey: string }> = {
  InteractionStarted: { entityType: "INTERACTION", entityIdKey: "interactionId" },
  DraftSynced: { entityType: "INTERACTION_DRAFT", entityIdKey: "interactionId" },
  ProfileFactProposed: { entityType: "PROFILE_FACT", entityIdKey: "factId" },
  ProfileFactConfirmed: { entityType: "PROFILE_FACT", entityIdKey: "factId" },
  LivestockIdStatusRecorded: { entityType: "LIVESTOCK_IDENTIFIER", entityIdKey: "identifierId" },
  IdReferralCreated: { entityType: "ID_REFERRAL", entityIdKey: "referralId" },
  IdReferralDeclined: { entityType: "ID_REFERRAL", entityIdKey: "referralId" },
  RecommendationGenerated: { entityType: "RECOMMENDATION_RUN", entityIdKey: "recommendationRunId" },
  PolicySelected: { entityType: "POLICY_SELECTION", entityIdKey: "policySelectionId" },
  ChecklistCreated: { entityType: "CHECKLIST_INSTANCE", entityIdKey: "checklistInstanceId" },
  PhotoEvidenceCaptured: { entityType: "PHOTO_EVIDENCE", entityIdKey: "photoId" },
  DocumentValidationCompleted: { entityType: "DOCUMENT_VALIDATION", entityIdKey: "evidenceId" },
  ApplicationStateChanged: { entityType: "APPLICATION", entityIdKey: "applicationId" },
  ApplicationSubmitted: { entityType: "APPLICATION", entityIdKey: "applicationId" },
  PolicyIssued: { entityType: "APPLICATION", entityIdKey: "applicationId" },
  ApplicationRejected: { entityType: "APPLICATION", entityIdKey: "applicationId" },
  BulkValidationRequested: { entityType: "BULK_BATCH", entityIdKey: "batchId" },
  ClaimCaseReferenced: { entityType: "CLAIM_CASE_STUB", entityIdKey: "caseId" },
};

function auditFromEvent(name: DomainEventName, payload: unknown): void {
  const meta = EVENT_META[name];
  if (!meta) {
    return;
  }
  const record = payload as Record<string, unknown>;
  const entityId = record[meta.entityIdKey];
  if (typeof entityId !== "string" || !entityId) {
    return;
  }
  void recordAuditEvent({
    action: name,
    entityType: meta.entityType,
    entityId,
    interactionId: typeof record.interactionId === "string" ? record.interactionId : undefined,
    beforeState: typeof record.fromState === "string" ? record.fromState : undefined,
    afterState: typeof record.toState === "string" ? record.toState : undefined,
  }).catch(() => undefined);
}

onAny(auditFromEvent);

export const AUDIT_EVENT_COVERAGE = Object.values(DomainEvent) as DomainEventName[];
