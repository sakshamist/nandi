import type { EvidenceQualityResult, EvidenceRef, VhcExtractionResult } from "@/contracts/ai";
import { ReasonCode, ValidationStatus } from "@/contracts/enums";

export interface RoutedValidation {
  status: ValidationStatus;
  reasonCodes: ReasonCode[];
}

const THRESHOLDS = {
  tagLegibility: 0.5,
  blur: 0.5,
  illumination: 0.5,
  overall: 0.5,
};

export function routeEvidence(
  evidence: EvidenceRef,
  quality?: EvidenceQualityResult,
  vhc?: VhcExtractionResult,
): RoutedValidation {
  void evidence;
  if (quality) {
    const scores = quality.proposedValue.scores;
    if (scores.tagLegibility < THRESHOLDS.tagLegibility) {
      return { status: ValidationStatus.Fail, reasonCodes: [ReasonCode.IllegibleTag] };
    }
    if (scores.blur < THRESHOLDS.blur) {
      return { status: ValidationStatus.Fail, reasonCodes: [ReasonCode.BlurryPhoto] };
    }
    if (scores.illumination < THRESHOLDS.illumination) {
      return { status: ValidationStatus.Fail, reasonCodes: [ReasonCode.PoorIllumination] };
    }
    if (quality.proposedValue.anomalies.length > 0) {
      return { status: ValidationStatus.NeedsReview, reasonCodes: [ReasonCode.LowConfidenceReviewRequired] };
    }
    if (scores.overall < THRESHOLDS.overall) {
      return { status: ValidationStatus.NeedsReview, reasonCodes: [ReasonCode.LowConfidenceReviewRequired] };
    }
    return { status: ValidationStatus.Pass, reasonCodes: [] };
  }
  if (vhc) {
    if (vhc.proposedValue.some((field) => !field.value)) {
      return { status: ValidationStatus.NeedsReview, reasonCodes: [ReasonCode.MissingVhcField] };
    }
    return { status: ValidationStatus.Pass, reasonCodes: [] };
  }
  return { status: ValidationStatus.Pending, reasonCodes: [] };
}
