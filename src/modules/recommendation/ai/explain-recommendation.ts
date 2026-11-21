import { SourceEvidenceType } from "@/contracts";
import type {
  ExplainRecommendation,
  ExplanationValue,
  InsurerPrerequisites,
  RankedPolicy,
} from "@/contracts";
import { mockExplainRecommendation } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function prerequisitesFromRules(rules?: InsurerPrerequisites): string[] {
  if (!rules) {
    return [];
  }

  const prerequisites: string[] = [];
  if (rules.requiresTagForSubmission) {
    prerequisites.push("Valid ear tag required before submission");
  }
  if (rules.allowsPendingTaggingInspection) {
    prerequisites.push("Tagging inspection may remain pending at submission");
  }
  if (rules.requiresTagForIssuance) {
    prerequisites.push("Valid ear tag required before policy issuance");
  }
  if (rules.requiresVhc) {
    prerequisites.push("Veterinary Health Certificate required");
  }
  prerequisites.push(...rules.vhcRequirements);
  return unique(prerequisites);
}

function postSubmissionStepsFromRules(rules?: InsurerPrerequisites): string[] {
  if (!rules) {
    return [];
  }

  const steps: string[] = [];
  if (rules.requiresVhc) {
    steps.push("Upload veterinary health certificate");
  }
  if (rules.allowsPendingTaggingInspection) {
    steps.push("Complete tagging inspection after submission");
  }
  if (rules.requiresTagForIssuance) {
    steps.push("Complete ear tag verification before policy issuance");
  }
  return unique(steps);
}

function exclusionsFromPolicies(policies: RankedPolicy[]): string[] {
  return policies
    .filter((policy) => !policy.eligible)
    .map((policy) => `${policy.code} was excluded by deterministic rule outputs.`);
}

export const explainRecommendation: ExplainRecommendation = async (input) => {
  const provider = createProvider();
  const eligible = input.rankedPolicies
    .filter((policy) => policy.eligible)
    .sort((left, right) => left.rank - right.rank);
  const top = eligible[0];
  const rules = input.prerequisites.find((item) => item.productId === top?.productId);
  const rationale = top
    ? `${top.name} (${top.code}) matches the deterministic rule outputs for this profile at rank ${top.rank}.`
    : "No eligible policy was returned by the deterministic rule engine.";
  const prerequisites = unique([
    ...(top?.prerequisites ?? []),
    ...prerequisitesFromRules(rules),
  ]);
  const missingFacts = unique(top?.missingFacts ?? []);
  const postSubmissionSteps = unique([
    ...postSubmissionStepsFromRules(rules),
    ...(rules ? [] : mockExplainRecommendation.proposedValue.postSubmissionSteps),
  ]);
  const evidenceRef = top?.productId ?? mockExplainRecommendation.sourceEvidence.ref;

  const result = await provider.generate<ExplanationValue>({
    promptKey: PromptKey.Explanation,
    evidence: {
      type: SourceEvidenceType.ProductRule,
      ref: evidenceRef,
    },
    proposedValue: {
      rationale,
      prerequisites,
      exclusions: exclusionsFromPolicies(input.rankedPolicies),
      missingFacts,
      postSubmissionSteps,
    },
    confidenceScore: top ? Math.min(1, Math.max(0, top.score)) : 0.3,
  });

  return result.envelope;
};
