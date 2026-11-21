import { ReasonCode, SourceEvidenceType } from "@/contracts";
import type { AssessEvidenceQuality, EvidenceQualityValue } from "@/contracts";
import { mockAssessEvidenceQuality } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

const FAILURE_THRESHOLD = 0.6;
const REVIEW_THRESHOLD = 0.8;

export const assessEvidenceQuality: AssessEvidenceQuality = async (photo) => {
  const provider = createProvider();
  const category = photo.category.toUpperCase();
  const base = mockAssessEvidenceQuality.proposedValue.scores;
  const blur = /BLUR/.test(category) ? 0.2 : base.blur;
  const illumination = /DARK|LOW_LIGHT/.test(category) ? 0.3 : base.illumination;
  const requiresTagReadability = /EAR_TAG|TAG/.test(category);
  const tagLegibility = requiresTagReadability
    ? base.tagLegibility
    : Math.max(base.tagLegibility, blur);
  const scores = {
    blur,
    illumination,
    tagLegibility,
    overall: Math.min(blur, illumination, tagLegibility),
  };
  const reasonCodes: ReasonCode[] = [];

  if (scores.blur < FAILURE_THRESHOLD) {
    reasonCodes.push(ReasonCode.BlurryPhoto);
  }
  if (scores.illumination < FAILURE_THRESHOLD) {
    reasonCodes.push(ReasonCode.PoorIllumination);
  }
  if (requiresTagReadability && scores.tagLegibility < FAILURE_THRESHOLD) {
    reasonCodes.push(ReasonCode.IllegibleTag);
  }
  if (scores.overall < REVIEW_THRESHOLD) {
    reasonCodes.push(ReasonCode.LowConfidenceReviewRequired);
  }

  const anomalies = [...new Set([
    ...mockAssessEvidenceQuality.proposedValue.anomalies,
    ...reasonCodes,
  ])];
  const result = await provider.generate<EvidenceQualityValue>({
    promptKey: PromptKey.EvidenceQuality,
    evidence: {
      type: SourceEvidenceType.Photo,
      ref: photo.id,
    },
    proposedValue: { scores, anomalies },
    confidenceScore: scores.overall,
    reasonCodes,
  });

  return {
    ...result.envelope,
    reasonCodes: [...new Set([...result.reasonCodes, ...reasonCodes])],
  };
};
