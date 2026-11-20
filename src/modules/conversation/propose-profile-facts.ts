import { CustomerType, SourceEvidenceType } from "@/contracts";
import type { ProfileFactProposal, ProfileFactProposalValue, ProposeProfileFacts } from "@/contracts";
import { mockProposeProfileFacts } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";
import { inferCustomerType } from "./infer-customer-type";

const LIVESTOCK_COUNT_PATTERN = /(\d+)\s+(cattle|cows|buffalo|goats|sheep)/i;

export const proposeProfileFacts: ProposeProfileFacts = async (input) => {
  const provider = createProvider();
  const evidence = {
    type: SourceEvidenceType.ConversationTurn,
    ref: input.turnId,
  };
  const proposals: ProfileFactProposal[] = [];
  const countMatch = input.messageText.match(LIVESTOCK_COUNT_PATTERN);

  if (countMatch) {
    const proposedValue: ProfileFactProposalValue = {
      entityType: "LIVESTOCK",
      attributeKey: "livestockCount",
      proposedValue: countMatch[1],
      timestamp: new Date().toISOString(),
    };
    const result = await provider.generate<ProfileFactProposalValue>({
      promptKey: PromptKey.Conversation,
      evidence,
      proposedValue,
      confidenceScore: 0.9,
      rawEvidenceRef: input.turnId,
    });
    proposals.push(result.envelope);
  }

  const customerType = inferCustomerType(input.messageText);
  if (customerType !== CustomerType.Other) {
    const proposedValue: ProfileFactProposalValue = {
      entityType: "CUSTOMER",
      attributeKey: "customerType",
      proposedValue: customerType,
      timestamp: new Date().toISOString(),
    };
    const result = await provider.generate<ProfileFactProposalValue>({
      promptKey: PromptKey.Conversation,
      evidence,
      proposedValue,
      confidenceScore: 0.75,
      rawEvidenceRef: input.turnId,
    });
    proposals.push(result.envelope);
  }

  if (proposals.length > 0) {
    return proposals;
  }

  return mockProposeProfileFacts.map((proposal) => ({
    ...proposal,
    sourceEvidence: evidence,
  }));
};
