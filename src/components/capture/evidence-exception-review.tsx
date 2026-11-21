"use client";

import { useState } from "react";
import { EvidenceExceptionReview as AiEvidenceExceptionReview } from "@/components/ai/evidence-exception-review";
import type {
  EvidenceQualityResult,
  EvidenceRequirement,
  VhcExtractionResult,
} from "@/contracts";
import { confirmEvidenceForValidation } from "@/modules/checklist/evidence-review-actions";

interface EvidenceExceptionReviewProps {
  requirements: EvidenceRequirement[];
  quality?: EvidenceQualityResult;
  vhc?: VhcExtractionResult;
}

export default function EvidenceExceptionReview({
  requirements,
  quality,
  vhc,
}: EvidenceExceptionReviewProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleConfirm(evidenceId: string) {
    const result = await confirmEvidenceForValidation({ evidenceId, quality, vhc });
    setStatus(result.status);
  }

  return (
    <div className="flex flex-col gap-3">
      <AiEvidenceExceptionReview
        requirements={requirements}
        quality={quality}
        vhc={vhc}
        onRetake={() => undefined}
        onConfirm={handleConfirm}
        onReject={() => undefined}
      />
      {status ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Validation routed: {status}</p>
      ) : null}
    </div>
  );
}
