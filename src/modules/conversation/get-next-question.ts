import { LivestockIdStatus } from "@/contracts";
import type { GetNextQuestion, NextQuestionInput } from "@/contracts";
import { mockEarlyIdPrompt } from "@/contracts/mocks";

export function shouldPromptForEarlyId(input: NextQuestionInput): boolean {
  const needsIdCheck = input.idStatus === LivestockIdStatus.Absent
    || input.idStatus === LivestockIdStatus.Unknown;
  return needsIdCheck && input.referralDecision === undefined;
}

export const getNextQuestion: GetNextQuestion = async (input) => {
  if (shouldPromptForEarlyId(input)) {
    return {
      question: mockEarlyIdPrompt.question,
      purpose: "EARLY_ID",
    };
  }

  if (input.missingFacts.includes("customerType")) {
    return {
      question: "Are you the individual owner or representing a group?",
      purpose: "PROFILE",
    };
  }

  if (input.missingFacts.includes("livestockCount")) {
    return {
      question: "How many animals are covered?",
      purpose: "PROFILE",
    };
  }

  if (input.missingFacts.length > 0) {
    return {
      question: `What is the ${input.missingFacts[0].replaceAll("_", " ")}?`,
      purpose: "PROFILE",
    };
  }

  return {
    question: "Review the captured details before continuing.",
    purpose: "REVIEW",
  };
};
