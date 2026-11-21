import { ConfidenceBand, ReasonCode, SourceEvidenceType, bandToScore } from "@/contracts";
import type { ExtractVhcFields, VhcField, VhcFieldKey } from "@/contracts";
import { mockExtractVhcFields } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

const REQUIRED_FIELDS: VhcFieldKey[] = [
  "vetLicenseNumber",
  "certificationDate",
  "dentitionAge",
  "milkYield",
  "healthStatus",
];
const LOW_CONFIDENCE_THRESHOLD = 0.8;

function buildFields(): VhcField[] {
  const mocked = new Map(mockExtractVhcFields.proposedValue.map((field) => [field.key, field]));
  return REQUIRED_FIELDS.map((key) => mocked.get(key) ?? {
    key,
    value: `MISSING_${key}`,
    confidence: ConfidenceBand.Low,
  });
}

export const extractVhcFields: ExtractVhcFields = async (document) => {
  const provider = createProvider();
  const fields = buildFields();
  const missingFields = fields.filter((field) => field.value.startsWith("MISSING_"));
  const lowConfidenceFields = fields.filter(
    (field) => bandToScore(field.confidence) < LOW_CONFIDENCE_THRESHOLD,
  );
  const averageScore = fields.length > 0
    ? fields.reduce((total, field) => total + bandToScore(field.confidence), 0) / fields.length
    : 0;
  const reasonCodes: ReasonCode[] = [];

  if (missingFields.length > 0) {
    reasonCodes.push(ReasonCode.MissingVhcField);
  }
  if (lowConfidenceFields.length > 0) {
    reasonCodes.push(ReasonCode.LowConfidenceReviewRequired);
  }

  const result = await provider.generate<VhcField[]>({
    promptKey: PromptKey.VhcExtraction,
    evidence: {
      type: SourceEvidenceType.Document,
      ref: document.id,
    },
    proposedValue: fields,
    confidenceScore: averageScore,
    reasonCodes,
  });

  return {
    ...result.envelope,
    reasonCodes: [...new Set([...result.reasonCodes, ...reasonCodes])],
  };
};
