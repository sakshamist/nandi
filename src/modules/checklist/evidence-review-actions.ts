"use server";

import { EvidenceRefType } from "@/contracts";
import type {
  EvidenceQualityResult,
  RecordEvidenceValidationResult,
  VhcExtractionResult,
} from "@/contracts";
import { recordEvidenceValidation } from "./checklist";

const DEFAULT_ACTOR_ID = "agent-demo";

export async function confirmEvidenceForValidation(input: {
  evidenceId: string;
  quality?: EvidenceQualityResult;
  vhc?: VhcExtractionResult;
  actorId?: string;
}): Promise<RecordEvidenceValidationResult> {
  return recordEvidenceValidation({
    evidence: { evidenceType: EvidenceRefType.Photo, evidenceId: input.evidenceId },
    quality: input.quality,
    vhc: input.vhc,
    actorId: input.actorId ?? DEFAULT_ACTOR_ID,
    idempotencyKey: crypto.randomUUID(),
  });
}
