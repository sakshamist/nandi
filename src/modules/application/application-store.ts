import { PrismaClient } from "@prisma/client";
import type { Application, ApplicationStateTransition, SubmissionAttempt } from "@prisma/client";

const prisma = new PrismaClient();

export interface ApplicationStore {
  getApplication(applicationId: string): Promise<Application | null>;
  createApplication(input: {
    agentId: string;
    productId: string;
    policySelectionId: string;
    organisationId?: string | null;
    livestockRecordId?: string | null;
    customerId?: string | null;
    interactionId?: string | null;
  }): Promise<Application>;
  recordTransition(input: {
    applicationId: string;
    fromState: Application["state"] | null;
    toState: Application["state"];
    actorId?: string | null;
    reasonCode?: string | null;
  }): Promise<ApplicationStateTransition>;
  updateCaches(
    applicationId: string,
    caches: { submissionEligible: boolean; issuanceEligible: boolean },
  ): Promise<void>;
  getSubmissionAttempts(applicationId: string): Promise<SubmissionAttempt[]>;
  createSubmissionAttempt(input: {
    applicationId: string;
    attemptNumber: number;
    submissionMode: string;
    idempotencyKey: string;
    requestPayloadJson: string;
    success: boolean;
  }): Promise<SubmissionAttempt>;
}

export const prismaApplicationStore: ApplicationStore = {
  async getApplication(applicationId: string) {
    return prisma.application.findUnique({ where: { id: applicationId } }) ?? null;
  },
  async createApplication(input) {
    return prisma.application.create({
      data: {
        agentId: input.agentId,
        productId: input.productId,
        policySelectionId: input.policySelectionId,
        organisationId: input.organisationId ?? null,
        livestockRecordId: input.livestockRecordId ?? null,
        customerId: input.customerId ?? null,
        interactionId: input.interactionId ?? null,
        state: "PROFILE_INCOMPLETE",
      },
    });
  },
  async recordTransition(input) {
    return prisma.applicationStateTransition.create({
      data: {
        applicationId: input.applicationId,
        fromState: input.fromState,
        toState: input.toState,
        actorId: input.actorId ?? null,
        reasonCode: input.reasonCode ?? null,
      },
    });
  },
  async updateCaches(applicationId, caches) {
    await prisma.application.update({
      where: { id: applicationId },
      data: { submissionEligible: caches.submissionEligible, issuanceEligible: caches.issuanceEligible },
    });
  },
  async getSubmissionAttempts(applicationId: string) {
    return prisma.submissionAttempt.findMany({ where: { applicationId }, orderBy: [{ createdAt: "asc" }] });
  },
  async createSubmissionAttempt(input) {
    return prisma.submissionAttempt.create({
      data: {
        applicationId: input.applicationId,
        attemptNumber: input.attemptNumber,
        submissionMode: input.submissionMode as SubmissionAttempt["submissionMode"],
        idempotencyKey: input.idempotencyKey,
        requestPayloadJson: input.requestPayloadJson,
        success: input.success,
      },
    });
  },
};
