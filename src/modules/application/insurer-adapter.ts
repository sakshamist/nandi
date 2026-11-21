import { ApplicationState, prismaAdapters } from "@/contracts/enums";
import type { PollApplicationStatusInput, PollApplicationStatusResult, SubmitApplicationInput, SubmitApplicationResult } from "@/contracts/operations";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";
import { transitionApplication } from "./application";
import { getSubmissionReadiness } from "./readiness";

export async function submitApplication(input: SubmitApplicationInput): Promise<SubmitApplicationResult> {
  const existing = await prisma.submissionAttempt.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const replayed = JSON.parse(existing.responsePayloadJson ?? "{}") as SubmitApplicationResult;
    return {
      attemptId: replayed.attemptId ?? existing.id,
      externalReferenceId: replayed.externalReferenceId ?? "",
      submittedAt: replayed.submittedAt ?? existing.createdAt.toISOString(),
    };
  }
  const application = await prisma.application.findUnique({ where: { id: input.applicationId } });
  if (!application) {
    throw new Error(`Application not found: ${input.applicationId}`);
  }
  const readiness = await getSubmissionReadiness(input.applicationId);
  if (!readiness.eligible) {
    throw new Error(`Submission not allowed: ${readiness.reasonCodes.join(", ")}`);
  }
  const externalReferenceId = `ext-${crypto.randomUUID()}`;
  const attempt = await prisma.submissionAttempt.create({
    data: {
      applicationId: input.applicationId,
      attemptNumber: 1,
      submissionMode: input.mode,
      idempotencyKey: input.idempotencyKey,
      requestPayloadJson: JSON.stringify({ productId: application.productId, mode: input.mode }),
      success: true,
    },
  });
  const result: SubmitApplicationResult = {
    attemptId: attempt.id,
    externalReferenceId,
    submittedAt: new Date().toISOString(),
  };
  await prisma.submissionAttempt.update({
    where: { id: attempt.id },
    data: { responsePayloadJson: JSON.stringify(result) },
  });
  await prisma.application.update({
    where: { id: input.applicationId },
    data: { externalReferenceId, submissionMode: input.mode, submittedAt: new Date() },
  });
  emit(DomainEvent.ApplicationSubmitted, {
    applicationId: input.applicationId,
    attemptId: attempt.id,
  });
  await transitionApplication({ applicationId: input.applicationId, toState: ApplicationState.Submitted });
  return result;
}

export async function pollApplicationStatus(input: PollApplicationStatusInput): Promise<PollApplicationStatusResult> {
  const application = await prisma.application.findUnique({ where: { id: input.applicationId } });
  if (!application) {
    throw new Error(`Application not found: ${input.applicationId}`);
  }
  return {
    state: prismaAdapters.applicationState.fromPrisma(application.state),
    issuerReference: application.externalReferenceId ?? undefined,
  };
}
