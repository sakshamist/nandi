import type { RankedPolicy, RecommendationContext } from "@/contracts/ai";
import { prisma } from "@/lib/prisma";
import { getInsurerPrerequisites } from "@/modules/catalogue";
import { evaluatePolicyEligibility } from "./eligibility";

export async function rankPolicies(context: RecommendationContext): Promise<RankedPolicy[]> {
  const products = await prisma.insuranceProduct.findMany({
    where: { active: true },
    orderBy: [{ name: "asc" }],
  });
  const ranked: Array<Omit<RankedPolicy, "rank">> = [];
  for (const product of products) {
    const eligibility = await evaluatePolicyEligibility({ productId: product.id, context });
    const prerequisites = await getInsurerPrerequisites(product.id);
    ranked.push({
      productId: product.id,
      code: product.code,
      name: product.name,
      score: product.basePremiumRate,
      eligible: eligibility.eligible,
      prerequisites: [
        ...(prerequisites.requiresTagForSubmission ? ["requiresTagForSubmission"] : []),
        ...(prerequisites.allowsPendingTaggingInspection ? ["allowsPendingTaggingInspection"] : []),
        ...(prerequisites.requiresTagForIssuance ? ["requiresTagForIssuance"] : []),
        ...(prerequisites.requiresVhc ? ["requiresVhc"] : []),
      ],
      missingFacts: eligibility.missingFacts,
    });
  }
  ranked.sort((a, b) => a.score - b.score || a.code.localeCompare(b.code));
  return ranked.map((policy, index) => ({ ...policy, rank: index + 1 }));
}
