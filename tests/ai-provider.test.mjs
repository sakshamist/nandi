import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("provider routing supports mock and gemini with required configuration", () => {
  const provider = read("src/lib/ai/provider.ts");
  assert.match(provider, /LLM_PROVIDER \?\? "mock"/);
  assert.match(provider, /configured === "gemini"/);
  assert.match(provider, /GEMINI_API_KEY/);
  assert.match(provider, /GEMINI_API_KEY is required when LLM_PROVIDER=gemini/);
  assert.match(provider, /createGeminiProvider/);
  assert.match(provider, /Unsupported AI provider/);
});

test("gemini provider calls generateContent and parses JSON with fallback", () => {
  const gemini = read("src/lib/ai/gemini-provider.ts");
  assert.match(gemini, /generateContent/);
  assert.match(gemini, /responseMimeType: "application\/json"/);
  assert.match(gemini, /candidates\?\.\[0\]/);
  assert.match(gemini, /JSON\.parse/);
  assert.match(gemini, /confidence === ConfidenceBand\.Low/);
  assert.match(gemini, /ReasonCode\.LowConfidenceReviewRequired/);
  assert.match(gemini, /createEnvelope/);
  assert.match(gemini, /modelVersion: options\.model/);
});
