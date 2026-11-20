import { DomainEvent, SourceEvidenceType } from "@/contracts";
import type { ProcessConversationalInput } from "@/contracts";
import { mockProcessConversationalInput } from "@/contracts/mocks";
import { PromptKey, buildProvenance, createAiEvent, createProvider } from "@/lib/ai";
import { detectContradictions } from "./detect-contradictions";
import { deriveMissingFacts } from "./derive-missing-facts";
import { getNextQuestion } from "./get-next-question";
import { inferCustomerType } from "./infer-customer-type";
import { proposeProfileFacts } from "./propose-profile-facts";

export const processConversationalInput: ProcessConversationalInput = async (input) => {
  const provider = createProvider();
  const messageText = input.messageText.trim() || mockProcessConversationalInput.messageText;
  const candidateFacts = await proposeProfileFacts({ ...input, messageText });
  const customerType = inferCustomerType(messageText);
  const contradictions = detectContradictions(messageText);
  const missingFacts = deriveMissingFacts(customerType, candidateFacts);
  const question = await getNextQuestion({
    interactionId: input.interactionId,
    customerType,
    missingFacts,
  });
  const evidence = {
    type: SourceEvidenceType.ConversationTurn,
    ref: input.turnId,
  };
  const result = await provider.generate<string>({
    promptKey: PromptKey.Conversation,
    evidence,
    proposedValue: messageText,
    confidenceScore: contradictions.length > 0 ? 0.4 : 0.8,
    rawEvidenceRef: input.turnId,
  });
  const provenance = buildProvenance({
    envelope: result.envelope,
    promptKey: PromptKey.Conversation,
    provider: provider.name,
    reasonCodes: result.reasonCodes,
    rawEvidenceRef: result.rawEvidenceRef,
  });

  for (const fact of candidateFacts) {
    createAiEvent(
      DomainEvent.ProfileFactProposed,
      {
        interactionId: input.interactionId,
        factId: `${input.turnId}:${fact.proposedValue.attributeKey}`,
        entityType: fact.proposedValue.entityType,
        attributeKey: fact.proposedValue.attributeKey,
        provenance,
      },
      { correlationId: input.idempotencyKey },
    );
  }

  createAiEvent(
    DomainEvent.CustomerTypeInferred,
    {
      interactionId: input.interactionId,
      customerType,
      provenance,
    },
    { correlationId: input.idempotencyKey },
  );

  return {
    interactionId: input.interactionId,
    turnId: input.turnId,
    messageText,
    nextQuestion: question.question,
    candidateFacts,
    contradictions,
    provenance,
  };
};
