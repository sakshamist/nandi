import { CustomerType } from "@/contracts";
import type { ProfileFactProposal } from "@/contracts";

export function deriveMissingFacts(
  customerType: CustomerType,
  candidateFacts: ProfileFactProposal[],
): string[] {
  const captured = new Set(candidateFacts.map((fact) => fact.proposedValue.attributeKey));
  const missingFacts: string[] = [];

  if (customerType === CustomerType.Other && !captured.has("customerType")) {
    missingFacts.push("customerType");
  }
  if (!captured.has("livestockCount")) {
    missingFacts.push("livestockCount");
  }
  if (!captured.has("ownership")) {
    missingFacts.push("ownership");
  }

  return missingFacts;
}
