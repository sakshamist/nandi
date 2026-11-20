export const PromptKey = {
  Conversation: "conversation.turn",
  Explanation: "recommendation.explanation",
  EvidenceQuality: "documents.evidence_quality",
  VhcExtraction: "documents.vhc_extraction",
} as const;

export type PromptKey = (typeof PromptKey)[keyof typeof PromptKey];

export interface PromptDefinition {
  key: PromptKey;
  version: string;
  modelVersion: string;
  text: string;
}

const PROMPTS: Record<PromptKey, PromptDefinition> = {
  [PromptKey.Conversation]: {
    key: PromptKey.Conversation,
    version: "2026-11-20.1",
    modelVersion: "mock-model-1",
    text: "Extract candidate profile facts from the agent conversation without confirming them.",
  },
  [PromptKey.Explanation]: {
    key: PromptKey.Explanation,
    version: "2026-11-20.1",
    modelVersion: "mock-model-1",
    text: "Explain deterministic policy rule outputs without inventing eligibility or issuance.",
  },
  [PromptKey.EvidenceQuality]: {
    key: PromptKey.EvidenceQuality,
    version: "2026-11-20.1",
    modelVersion: "mock-model-1",
    text: "Score captured evidence quality and report anomalies without setting validation status.",
  },
  [PromptKey.VhcExtraction]: {
    key: PromptKey.VhcExtraction,
    version: "2026-11-20.1",
    modelVersion: "mock-model-1",
    text: "Extract candidate veterinary health certificate fields with per-field confidence.",
  },
};

export function getPrompt(key: PromptKey): PromptDefinition {
  return PROMPTS[key];
}
