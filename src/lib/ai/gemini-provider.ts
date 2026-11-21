import { ConfidenceBand, ReasonCode, confidenceBand } from "@/contracts";
import { getPrompt } from "./prompts";
import { createEnvelope } from "./provenance";
import type { AiGenerationInput, AiGenerationResult, AiProvider } from "./provider";

export interface GeminiProviderOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface GeminiResponseJson {
  proposedValue?: unknown;
  confidence?: ConfidenceBand;
  reasonCodes?: ReasonCode[];
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export function createGeminiProvider(options: GeminiProviderOptions): AiProvider {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    name: "gemini",
    async generate<T>(input: AiGenerationInput<T>): Promise<AiGenerationResult<T>> {
      const prompt = getPrompt(input.promptKey);
      const response = await fetch(
        `${baseUrl}/models/${options.model}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt.text}\n\nCandidate value: ${JSON.stringify(input.proposedValue)}\nSource evidence: ${JSON.stringify(input.evidence)}\nReturn JSON with proposedValue, confidence and reasonCodes.`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = parseGeminiJson(text);

      const proposedValue = (parsed?.proposedValue as T) ?? input.proposedValue;
      const confidence =
        input.confidence ?? parsed?.confidence ?? confidenceBand(input.confidenceScore ?? 0.5);
      const reasonCodes = [
        ...new Set([...(input.reasonCodes ?? []), ...(parsed?.reasonCodes ?? [])]),
      ];
      if (
        confidence === ConfidenceBand.Low &&
        !reasonCodes.includes(ReasonCode.LowConfidenceReviewRequired)
      ) {
        reasonCodes.push(ReasonCode.LowConfidenceReviewRequired);
      }

      const envelope = createEnvelope<T>({
        proposedValue,
        sourceEvidence: input.evidence,
        confidence,
        promptVersion: prompt.version,
        modelVersion: options.model,
      });

      return {
        envelope,
        reasonCodes,
        rawEvidenceRef: input.rawEvidenceRef ?? input.evidence.ref,
      };
    },
  };
}

function parseGeminiJson(text: string): GeminiResponseJson | null {
  const trimmed = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(trimmed) as GeminiResponseJson;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
