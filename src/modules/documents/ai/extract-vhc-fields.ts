import { ReasonCode, SourceEvidenceType, bandToScore } from "@/contracts";
import type { ExtractVhcFields, VhcField } from "@/contracts";
import { mockExtractVhcFields } from "@/contracts/mocks";
import { PromptKey, createProvider } from "@/lib/ai";

export const extractVhcFields: ExtractVhcFields = async (document) => {
  const provider = createProvider();
  const fields: VhcField[] = mockExtractVhcFields.proposedValue.map((field) => ({ ...field }));
  const averageScore = fields.length > 0
    ? fields.reduce((total, field) => total + bandToScore(field.confidence), 0) / fields.length
    : 0;
  const reasonCodes: ReasonCode[] = fields.length > 0 ? [] : [ReasonCode.MissingVhcField];

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

  return { ...result.envelope, reasonCodes: result.reasonCodes };
};
