import { PrismaClient } from "@prisma/client";
import type { ProfileFact } from "@prisma/client";
import type {
  ConfirmProfileFactInput,
  ConfirmProfileFactResult,
  ProfileFactProposal,
  RecommendationContext,
} from "@/contracts/ai";
import {
  CustomerType,
  VerificationState,
  prismaAdapters,
  bandToScore,
  serializeSourceEvidence,
} from "@/contracts/enums";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";

const prisma = new PrismaClient();

const VERIFIED_STATES = new Set<string>([
  prismaAdapters.factVerificationState.toPrisma(VerificationState.AgentConfirmed),
  prismaAdapters.factVerificationState.toPrisma(VerificationState.ExternallyVerified),
]);

function toContractCustomerType(value: string): CustomerType {
  return value.toLowerCase() as CustomerType;
}

export async function persistProfileFactProposal(
  interactionId: string,
  proposal: ProfileFactProposal,
): Promise<ProfileFact> {
  return prisma.profileFact.create({
    data: {
      interactionId,
      entityType: proposal.proposedValue.entityType,
      attributeKey: proposal.proposedValue.attributeKey,
      proposedValue: proposal.proposedValue.proposedValue,
      confidence: bandToScore(proposal.confidence),
      sourceEvidence: serializeSourceEvidence(proposal.sourceEvidence),
      verificationState: prismaAdapters.factVerificationState.toPrisma(VerificationState.Unverified),
      confirmedByAgent: false,
    },
  });
}

export async function confirmProfileFact(input: ConfirmProfileFactInput): Promise<ConfirmProfileFactResult> {
  const fact = await prisma.profileFact.findUnique({ where: { id: input.factId } });
  if (!fact) {
    throw new Error(`ProfileFact not found: ${input.factId}`);
  }
  await prisma.profileFact.update({
    where: { id: input.factId },
    data: {
      verificationState: prismaAdapters.factVerificationState.toPrisma(input.verificationState),
      confirmedByAgent: input.verificationState === VerificationState.AgentConfirmed,
      ...(input.acceptedValue !== undefined ? { proposedValue: input.acceptedValue } : {}),
    },
  });
  emit(DomainEvent.ProfileFactConfirmed, {
    factId: input.factId,
    verificationState: input.verificationState,
  });
  return {
    factId: input.factId,
    verificationState: input.verificationState,
    eventName: "ProfileFactConfirmed",
  };
}

export async function getRecommendationContext(interactionId: string): Promise<RecommendationContext> {
  const interaction = await prisma.interaction.findUnique({ where: { id: interactionId } });
  if (!interaction) {
    throw new Error(`Interaction not found: ${interactionId}`);
  }
  const verifiedFacts: Record<string, unknown> = {};
  const livestock: Array<Record<string, unknown>> = [];
  const facts = await prisma.profileFact.findMany({ where: { interactionId } });
  for (const fact of facts) {
    if (!VERIFIED_STATES.has(fact.verificationState)) {
      continue;
    }
    verifiedFacts[fact.attributeKey] = fact.proposedValue;
    if (fact.entityType === "LIVESTOCK") {
      livestock.push({ [fact.attributeKey]: fact.proposedValue });
    }
  }
  const customer = interaction.customerId
    ? await prisma.customer.findUnique({ where: { id: interaction.customerId } })
    : null;
  const factCustomerType = verifiedFacts["customerType"];
  const customerType: CustomerType = customer
    ? toContractCustomerType(customer.customerType)
    : typeof factCustomerType === "string"
      ? (factCustomerType as CustomerType)
      : CustomerType.Individual;
  return {
    interactionId,
    customerType,
    verifiedFacts,
    livestock,
  };
}
