import { SourceEvidenceType } from "@/contracts";
import type { ExplainRecommendation, ExplanationValue } from "@/contracts";
import { mockExplainRecommendation } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

export const explainRecommendation: ExplainRecommendation = async (input) => {
  const provider = createProvider();
  const eligible = input.rankedPolicies
    .filter((policy) => policy.eligible)
    .sort((left, right) => left.rank - right.rank);
  const top = eligible[0];
  const prerequisite = input.prerequisites.find((item) => item.productId === top?.productId);
  const rationale = top
    ? `Policy ${top.code} matches the deterministic rule outputs for this profile.`
    : "No eligible policy was returned by the deterministic rule engine.";
  const exclusions = top && top.score < 0.6 ? [...mockExplainRecommendation.proposedValue.exclusions] : [];
  const missingFacts = top?.missingFacts ?? [];
  const postSubmissionSteps = prerequisite?.requiresVhc
    ? ["Upload veterinary health certificate"]
    : [...mockExplainRecommendation.proposedValue.postSubmissionSteps];

  const result = await provider.generate<ExplanationValue>({
    promptKey: PromptKey.Explanation,
    evidence: {
      type: SourceEvidenceType.ProductRule,
      ref: top?.productId ?? "no-policy",
    },
    proposedValue: {
      rationale,
      prerequisites: top?.prerequisites ?? [],
      exclusions,
      missingFacts,
      postSubmissionSteps,
    },
    confidenceScore: top ? Math.min(1, Math.max(0, top.score)) : 0.3,
  });

  return result.envelope;
};
