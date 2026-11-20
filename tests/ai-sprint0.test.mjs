import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const seams = [
  "src/modules/recommendation/ai/explain-recommendation.ts",
  "src/modules/documents/ai/assess-evidence-quality.ts",
  "src/modules/documents/ai/extract-vhc-fields.ts",
];

test("Sprint 0 AI infrastructure is present", () => {
  const index = read("src/lib/ai/index.ts");
  for (const name of ["prompts", "provider", "provenance", "retrieval"]) {
    assert.match(index, new RegExp(`export \\* from "./${name}"`));
  }

  const provider = read("src/lib/ai/provider.ts");
  assert.match(provider, /LLM_PROVIDER \?\? "mock"/);
  assert.match(provider, /Unsupported AI provider/);
  assert.doesNotMatch(provider, /Vertex|OpenAI|Ollama/);

  const prompts = read("src/lib/ai/prompts.ts");
  assert.match(prompts, /"2026-11-20.1"/);
  assert.match(prompts, /recommendation\.explanation/);
  assert.match(prompts, /documents\.evidence_quality/);
  assert.match(prompts, /documents\.vhc_extraction/);

  const retrieval = read("src/lib/ai/retrieval.ts");
  assert.match(retrieval, /surelm_product_knowledge/);
  assert.doesNotMatch(retrieval, /\bfetch\(|axios/);

  const provenance = read("src/lib/ai/provenance.ts");
  assert.match(provenance, /VerificationState\.Unverified/);
  assert.doesNotMatch(provenance, /VerificationState\.AgentConfirmed/);
});

test("AI seams use frozen contracts and shared mocks", () => {
  for (const path of seams) {
    const source = read(path);
    assert.match(source, /from "@\/contracts"/);
    assert.match(source, /from "@\/contracts\/mocks"/);
    assert.match(source, /createProvider\(/);
    assert.doesNotMatch(source, /@prisma\/client|\.\.\/\.\.\/prisma/);
    assert.doesNotMatch(source, /PromptMetadata|AuditEvent/);
  }
});

test("AI seams never promote results or set deterministic status", () => {
  for (const path of seams) {
    const source = read(path);
    assert.doesNotMatch(source, /VerificationState\.AgentConfirmed/);
    assert.doesNotMatch(source, /VerificationState\.ExternallyVerified/);
    assert.doesNotMatch(source, /ValidationStatus\.Pass|ValidationStatus\.Fail|ValidationStatus\.NeedsReview/);
  }

  const explanation = read("src/modules/recommendation/ai/explain-recommendation.ts");
  assert.match(explanation, /deterministic rule outputs/);
  assert.doesNotMatch(explanation, /\bissued\b/);
});
