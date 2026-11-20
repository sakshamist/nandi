import { ReasonCode, SourceEvidenceType } from "@/contracts";
import type { AssessEvidenceQuality, EvidenceQualityValue } from "@/contracts";
import { mockAssessEvidenceQuality } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

export const assessEvidenceQuality: AssessEvidenceQuality = async (photo) => {
  const provider = createProvider();
  const base = mockAssessEvidenceQuality.proposedValue.scores;
  const blur = photo.category.includes("BLUR") ? 0.2 : base.blur;
  const illumination = photo.category.includes("DARK") ? 0.3 : base.illumination;
  const tagLegibility = photo.category.includes("EAR_TAG") ? base.tagLegibility : base.blur;
  const scores = {
    blur,
    illumination,
    tagLegibility,
    overall: Math.min(blur, illumination, tagLegibility),
  };
  const reasonCodes: ReasonCode[] = [];
  if (scores.blur < 0.5) reasonCodes.push(ReasonCode.BlurryPhoto);
  if (scores.illumination < 0.5) reasonCodes.push(ReasonCode.PoorIllumination);
  if (scores.tagLegibility < 0.5) reasonCodes.push(ReasonCode.IllegibleTag);
  const anomalies = [...mockAssessEvidenceQuality.proposedValue.anomalies, ...reasonCodes];

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

  return { ...result.envelope, reasonCodes: result.reasonCodes };
};
