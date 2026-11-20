import { ReasonCode } from "@/contracts/enums";
import type { EligibilityInput, EligibilityResult } from "@/contracts/operations";
import { prisma } from "@/lib/prisma";

export async function evaluatePolicyEligibility(input: EligibilityInput): Promise<EligibilityResult> {
  const product = await prisma.insuranceProduct.findUnique({ where: { id: input.productId } });
  if (!product || !product.active) {
    return {
      productId: input.productId,
      eligible: false,
      reasonCodes: [ReasonCode.InvalidStateTransition],
      missingFacts: ["product"],
    };
  }
  const missingFacts: string[] = [];
  const livestock = input.context.livestock[0];
  let age: number | null = null;
  if (livestock && typeof livestock.ageMonths === "number") {
    age = livestock.ageMonths;
  }
  if (!livestock) {
    missingFacts.push("livestock");
  } else if (age === null) {
    missingFacts.push("ageMonths");
  }
  const rules = await prisma.productRule.findMany({
    where: { productId: product.id, ruleType: "ELIGIBILITY" },
  });
  for (const rule of rules) {
    const conditions = (rule.conditionsJson ? JSON.parse(rule.conditionsJson) : {}) as Record<
      string,
      unknown
    >;
    if (rule.ruleKey === "MIN_AGE_MONTHS") {
      const minAge = typeof conditions.minAgeMonths === "number" ? conditions.minAgeMonths : 0;
      if (age !== null && age < minAge) {
        return { productId: product.id, eligible: false, reasonCodes: [], missingFacts };
      }
    }
    if (rule.ruleKey === "MAX_AGE_MONTHS") {
      const maxAge =
        typeof conditions.maxAgeMonths === "number" ? conditions.maxAgeMonths : Number.POSITIVE_INFINITY;
      if (age !== null && age > maxAge) {
        return { productId: product.id, eligible: false, reasonCodes: [], missingFacts };
      }
    }
  }
  return { productId: product.id, eligible: true, reasonCodes: [], missingFacts };
}
