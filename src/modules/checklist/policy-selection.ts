import type { PolicySelection } from "@prisma/client";
import { DomainEvent } from "@/contracts/events";
import { emit } from "@/lib/events/bus";
import { prisma } from "@/lib/prisma";

export interface SelectPolicyInput {
  interactionId: string;
  productId: string;
  agentId?: string;
}

export async function selectPolicy(input: SelectPolicyInput): Promise<PolicySelection> {
  void input.agentId;
  const existing = await prisma.policySelection.findFirst({
    where: { interactionId: input.interactionId, productId: input.productId },
    orderBy: [{ selectedAt: "desc" }],
  });
  if (existing) {
    return existing;
  }
  const selection = await prisma.policySelection.create({
    data: {
      interactionId: input.interactionId,
      productId: input.productId,
      agentConfirmed: true,
    },
  });
  emit(DomainEvent.PolicySelected, {
    policySelectionId: selection.id,
    productId: input.productId,
  });
  return selection;
}
