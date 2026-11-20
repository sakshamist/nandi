import { PrismaClient } from "@prisma/client";
import type { IdReferral } from "@prisma/client";
import type {
  CheckIdStatusInput,
  CheckIdStatusResult,
  CreateReferralHandoffInput,
  CreateReferralHandoffResult,
  RecordIdDecisionInput,
} from "@/contracts/operations";
import { prismaAdapters } from "@/contracts/enums";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";

const prisma = new PrismaClient();

export async function checkIdStatus(input: CheckIdStatusInput): Promise<CheckIdStatusResult> {
  const record = await prisma.livestockRecord.findUnique({ where: { id: input.livestockRecordId } });
  if (!record) {
    throw new Error(`LivestockRecord not found: ${input.livestockRecordId}`);
  }
  const identifier = await prisma.livestockIdentifier.findFirst({
    where: { livestockRecordId: record.id },
  });
  return {
    status: prismaAdapters.livestockIdStatus.fromPrisma(identifier?.idStatus ?? "UNKNOWN"),
    identifierId: identifier?.id,
  };
}

export async function recordIdDecision(input: RecordIdDecisionInput): Promise<void> {
  const identifier = await prisma.livestockIdentifier.findUnique({
    where: { id: input.identifierId },
  });
  if (!identifier) {
    return;
  }
  await prisma.livestockIdentifier.update({
    where: { id: identifier.id },
    data: { idStatus: prismaAdapters.livestockIdStatus.toPrisma(input.status) },
  });
  emit(DomainEvent.LivestockIdStatusRecorded, {
    identifierId: identifier.id,
    status: input.status,
  });
}

export async function createReferralHandoff(
  input: CreateReferralHandoffInput,
): Promise<CreateReferralHandoffResult> {
  const existing = await prisma.idReferral.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return {
      referralId: existing.id,
      status: existing.status as CreateReferralHandoffResult["status"],
    };
  }
  const interaction = await prisma.interaction.findUnique({ where: { id: input.interactionId } });
  const referral = await prisma.idReferral.create({
    data: {
      interactionId: input.interactionId,
      customerId: interaction?.customerId ?? null,
      provisionalCustomerName: input.provisionalCustomerName ?? null,
      livestockIdentifierId: input.identifierId,
      instituteId: input.instituteId ?? null,
      idempotencyKey: input.idempotencyKey,
      status: "PENDING",
    },
  });
  emit(DomainEvent.IdReferralCreated, {
    referralId: referral.id,
    instituteId: referral.instituteId ?? undefined,
  });
  return { referralId: referral.id, status: "PENDING" };
}

export async function acceptReferralHandoff(input: { referralId: string }): Promise<IdReferral> {
  return prisma.idReferral.update({
    where: { id: input.referralId },
    data: { decision: "INTERESTED", status: "HANDOFF_COMPLETED" },
  });
}

export async function declineReferralHandoff(input: { referralId: string }): Promise<void> {
  await prisma.idReferral.update({
    where: { id: input.referralId },
    data: { decision: "NOT_INTERESTED", status: "CANCELLED" },
  });
  emit(DomainEvent.IdReferralDeclined, { referralId: input.referralId });
}
