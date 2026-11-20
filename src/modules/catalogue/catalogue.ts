import type { InsuranceProduct } from "@prisma/client";
import type { InsurerPrerequisites } from "@/contracts/operations";
import { prisma } from "@/lib/prisma";

export async function getInsurerPrerequisites(productId: string): Promise<InsurerPrerequisites> {
  const constraint = await prisma.insurerConstraint.findFirst({
    where: { productId },
    orderBy: { version: "desc" },
  });
  if (!constraint) {
    throw new Error(`No insurer constraint found for product: ${productId}`);
  }
  return {
    productId,
    requiresTagForSubmission: constraint.requiresTagForSubmission,
    allowsPendingTaggingInspection: constraint.allowsPendingTaggingInspection,
    requiresTagForIssuance: constraint.requiresTagForIssuance,
    requiresVhc: constraint.requiresVhc,
    vhcRequirements: constraint.vhcRequirementsJson
      ? (JSON.parse(constraint.vhcRequirementsJson) as string[])
      : [],
  };
}

export async function getCatalogue(filters?: { activeOnly?: boolean }): Promise<InsuranceProduct[]> {
  return prisma.insuranceProduct.findMany({
    where: filters?.activeOnly === false ? {} : { active: true },
    orderBy: [{ name: "asc" }],
  });
}
