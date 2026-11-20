import { ApplicationState, prismaAdapters } from "@/contracts/enums";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";
import type { Application } from "@prisma/client";
import { prismaApplicationStore } from "./application-store";
import { getIssuanceReadiness, getSubmissionReadiness } from "./readiness";

export const VALID_TRANSITIONS: Record<string, ApplicationState[]> = {
  [ApplicationState.ProfileIncomplete]: [
    ApplicationState.AwaitingTaggingInspection,
    ApplicationState.ReadyForSubmission,
  ],
  [ApplicationState.AwaitingTaggingInspection]: [
    ApplicationState.ReadyForSubmission,
    ApplicationState.Submitted,
  ],
  [ApplicationState.ReadyForSubmission]: [ApplicationState.Submitted],
  [ApplicationState.Submitted]: [ApplicationState.UnderwritingReview],
  [ApplicationState.UnderwritingReview]: [ApplicationState.Issued, ApplicationState.Rejected],
  [ApplicationState.Issued]: [],
  [ApplicationState.Rejected]: [],
};

export interface TransitionApplicationInput {
  applicationId: string;
  toState: ApplicationState;
  actorId?: string | null;
  reasonCode?: string | null;
}

export async function transitionApplication(input: TransitionApplicationInput): Promise<Application> {
  const application = await prismaApplicationStore.getApplication(input.applicationId);
  if (!application) {
    throw new Error(`Application not found: ${input.applicationId}`);
  }
  const fromState = prismaAdapters.applicationState.fromPrisma(application.state);
  const validTargets = VALID_TRANSITIONS[fromState] ?? [];
  if (!validTargets.includes(input.toState)) {
    throw new Error(`Invalid state transition: ${fromState} -> ${input.toState}`);
  }
  if (input.toState === ApplicationState.Submitted) {
    const submission = await getSubmissionReadiness(input.applicationId);
    if (!submission.eligible) {
      throw new Error(`Submission not allowed: ${submission.reasonCodes.join(", ")}`);
    }
  }
  if (input.toState === ApplicationState.Issued) {
    const issuance = await getIssuanceReadiness(input.applicationId);
    if (!issuance.eligible) {
      throw new Error(`Issuance not allowed: ${issuance.reasonCodes.join(", ")}`);
    }
  }
  await prismaApplicationStore.recordTransition({
    applicationId: input.applicationId,
    fromState: application.state,
    toState: prismaAdapters.applicationState.toPrisma(input.toState),
    actorId: input.actorId ?? null,
    reasonCode: input.reasonCode ?? null,
  });
  await prisma.application.update({
    where: { id: application.id },
    data: {
      state: prismaAdapters.applicationState.toPrisma(input.toState),
      updatedAt: new Date(),
    },
  });
  await refreshApplicationCaches(input.applicationId);
  emit(DomainEvent.ApplicationStateChanged, {
    applicationId: input.applicationId,
    fromState,
    toState: input.toState,
  });
  const updated = await prismaApplicationStore.getApplication(input.applicationId);
  if (!updated) {
    throw new Error(`Application not found after transition: ${input.applicationId}`);
  }
  return updated;
}

export async function refreshApplicationCaches(applicationId: string): Promise<void> {
  const submission = await getSubmissionReadiness(applicationId);
  const issuance = await getIssuanceReadiness(applicationId);
  await prismaApplicationStore.updateCaches(applicationId, {
    submissionEligible: submission.eligible,
    issuanceEligible: issuance.eligible,
  });
}

export interface ApplicationDeclarations {
  accepted: boolean;
}

export async function setApplicationDeclarations(
  applicationId: string,
  declarations: ApplicationDeclarations,
): Promise<void> {
  const application = await loadApplication(applicationId);
  await prisma.application.update({
    where: { id: application.id },
    data: {
      declarationsJson: JSON.stringify({
        accepted: declarations.accepted,
        updatedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function getApplicationDeclarations(
  applicationId: string,
): Promise<ApplicationDeclarations> {
  const application = await loadApplication(applicationId);
  if (!application.declarationsJson) {
    return { accepted: false };
  }
  const parsed = JSON.parse(application.declarationsJson) as { accepted?: boolean };
  return { accepted: parsed.accepted === true };
}

async function loadApplication(applicationId: string): Promise<Application> {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }
  return application;
}
