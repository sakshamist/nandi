import { LivestockIdStatus } from "@/contracts";
import type { GetNextQuestion } from "@/contracts";
import { mockEarlyIdPrompt } from "@/contracts/mocks";

export const getNextQuestion: GetNextQuestion = async (input) => {
  if (input.idStatus === LivestockIdStatus.Absent || input.idStatus === LivestockIdStatus.Unknown) {
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
