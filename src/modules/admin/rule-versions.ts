import type { RuleVersion } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateRuleVersionInput {
  productId: string;
  version: number;
  rulesJson: string;
  effectiveFrom?: Date;
}

export async function createRuleVersion(input: CreateRuleVersionInput): Promise<RuleVersion> {
  return prisma.ruleVersion.upsert({
    where: { productId_version: { productId: input.productId, version: input.version } },
    update: { rulesJson: input.rulesJson, effectiveFrom: input.effectiveFrom ?? new Date() },
    create: {
      productId: input.productId,
      version: input.version,
      rulesJson: input.rulesJson,
      effectiveFrom: input.effectiveFrom ?? new Date(),
    },
  });
}

export async function getRuleVersions(productId: string): Promise<RuleVersion[]> {
  return prisma.ruleVersion.findMany({
    where: { productId },
    orderBy: [{ version: "desc" }],
  });
}
