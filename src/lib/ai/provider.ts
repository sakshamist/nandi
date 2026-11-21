import { ConfidenceBand, ReasonCode, confidenceBand } from "@/contracts";
import type { AiEnvelope, SourceEvidence } from "@/contracts";
import { getPrompt } from "./prompts";
import type { PromptKey } from "./prompts";
import { createEnvelope } from "./provenance";
import { createGeminiProvider } from "./gemini-provider";

export interface AiGenerationInput<T> {
  promptKey: PromptKey;
  evidence: SourceEvidence;
  proposedValue: T;
  confidenceScore?: number;
  confidence?: ConfidenceBand;
  reasonCodes?: ReasonCode[];
  rawEvidenceRef?: string;
}

export interface AiGenerationResult<T> {
  envelope: AiEnvelope<T>;
  reasonCodes: ReasonCode[];
  rawEvidenceRef: string;
}

export interface AiProvider {
  name: string;
  generate<T>(input: AiGenerationInput<T>): Promise<AiGenerationResult<T>>;
}

export function createMockProvider(): AiProvider {
  return {
    name: "mock",
    async generate<T>(input: AiGenerationInput<T>): Promise<AiGenerationResult<T>> {
      const prompt = getPrompt(input.promptKey);
      const confidence = input.confidence ?? confidenceBand(input.confidenceScore ?? 0.5);
      const envelope = createEnvelope<T>({
        proposedValue: input.proposedValue,
        sourceEvidence: input.evidence,
        confidence,
        promptVersion: prompt.version,
        modelVersion: prompt.modelVersion,
      });
      const reasonCodes = [...(input.reasonCodes ?? [])];
      if (confidence === ConfidenceBand.Low && !reasonCodes.includes(ReasonCode.LowConfidenceReviewRequired)) {
        reasonCodes.push(ReasonCode.LowConfidenceReviewRequired);
      }
      return {
        envelope,
        reasonCodes,
        rawEvidenceRef: input.rawEvidenceRef ?? input.evidence.ref,
      };
    },
  };
}

export function createProvider(): AiProvider {
  const configured = process.env.LLM_PROVIDER ?? "mock";
  if (configured === "mock") {
    return createMockProvider();
  }
  if (configured === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini");
    }
    return createGeminiProvider({
      apiKey,
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      baseUrl: process.env.GEMINI_BASE_URL,
    });
  }
  throw new Error(`Unsupported AI provider: ${configured}`);
}
