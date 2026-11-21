import type { Application } from "@prisma/client";
import { prismaAdapters } from "@/contracts/enums";
import { normalizeInsurerRules } from "@/contracts/rules";
import { evaluateIssuanceReadiness, evaluateSubmissionReadiness } from "@/contracts/rules";
import type { ReadinessDecision } from "@/contracts/rules";
import { prisma } from "@/lib/prisma";
import { getInsurerPrerequisites } from "@/modules/catalogue";
import { getApplicationDeclarations } from "./application";

type SubmissionReadinessInput = Parameters<typeof evaluateSubmissionReadiness>[0];
type IssuanceReadinessInput = Parameters<typeof evaluateIssuanceReadiness>[0];

async function loadApplication(applicationId: string): Promise<Application> {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }
  return application;
}

async function getChecklistInstance(application: Application) {
  return prisma.checklistInstance.findUnique({
    where: { policySelectionId: application.policySelectionId },
  });
}

async function getTagVerified(application: Application): Promise<boolean> {
  const checklistInstance = await getChecklistInstance(application);
  if (checklistInstance) {
    const earTagPhoto = await prisma.checklistItem.findFirst({
      where: {
        checklistInstanceId: checklistInstance.id,
        code: "EAR_TAG_PHOTO",
        status: "COMPLETED",
      },
    });
    if (earTagPhoto) {
      return true;
    }
  }
  if (application.livestockRecordId) {
    const record = await prisma.livestockRecord.findUnique({
      where: { id: application.livestockRecordId },
      include: { identifier: true },
    });
    return (
      record?.identifier?.verificationState === "AGENT_CONFIRMED" ||
      record?.identifier?.verificationState === "EXTERNALLY_VERIFIED"
    );
  }
  return false;
}

async function getVhcValid(application: Application): Promise<boolean> {
  const checklistInstance = await getChecklistInstance(application);
  const vhcItem = await prisma.checklistItem.findFirst({
    where: {
      checklistInstanceId: checklistInstance?.id ?? "",
      category: "VETERINARY_HEALTH_CERTIFICATE",
    },
  });
  return vhcItem?.status === "COMPLETED";
}

async function getIdStatus(application: Application): Promise<SubmissionReadinessInput["idStatus"]> {
  if (application.livestockRecordId) {
    const record = await prisma.livestockRecord.findUnique({
      where: { id: application.livestockRecordId },
      include: { identifier: true },
    });
    if (record?.identifier) {
      return prismaAdapters.livestockIdStatus.fromPrisma(record.identifier.idStatus);
    }
  }
  return "unknown";
}

async function getReferralStatus(
  application: Application,
): Promise<SubmissionReadinessInput["referralStatus"]> {
  const referral = await prisma.idReferral.findFirst({
    where: application.interactionId ? { interactionId: application.interactionId } : {},
    orderBy: [{ createdAt: "desc" }],
  });
  return referral?.status ?? "PENDING";
}

async function isInsurerAccepted(applicationId: string): Promise<boolean> {
  const issuance = await prisma.policyIssuance.findUnique({ where: { applicationId } });
  return !!issuance;
}

export async function getSubmissionReadiness(applicationId: string): Promise<ReadinessDecision> {
  const application = await loadApplication(applicationId);
  const rules = normalizeInsurerRules(await getInsurerPrerequisites(application.productId));
  const tagVerified = await getTagVerified(application);
  const vhcValid = await getVhcValid(application);
  const checklistInstance = await getChecklistInstance(application);
  const declarations = await getApplicationDeclarations(applicationId);
  const idStatus = await getIdStatus(application);
  const referralStatus = await getReferralStatus(application);
  return evaluateSubmissionReadiness({
    applicationId,
    fromState: prismaAdapters.applicationState.fromPrisma(application.state),
    declarationsAccepted: declarations.accepted,
    rules,
    idStatus,
    tagVerified,
    vhcValid,
    checklistComplete: checklistInstance?.isComplete ?? false,
    referralStatus,
  });
}

export async function getIssuanceReadiness(applicationId: string): Promise<ReadinessDecision> {
  const application = await loadApplication(applicationId);
  const rules = normalizeInsurerRules(await getInsurerPrerequisites(application.productId));
  return evaluateIssuanceReadiness({
    applicationId,
    fromState: prismaAdapters.applicationState.fromPrisma(application.state),
    rules,
    tagVerified: await getTagVerified(application),
    vhcValid: await getVhcValid(application),
    insurerAccepted: await isInsurerAccepted(applicationId),
  } satisfies IssuanceReadinessInput);
}
