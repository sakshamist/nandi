import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const conversationSources = [
  "src/modules/conversation/infer-customer-type.ts",
  "src/modules/conversation/detect-contradictions.ts",
  "src/modules/conversation/derive-missing-facts.ts",
  "src/modules/conversation/propose-profile-facts.ts",
  "src/modules/conversation/get-next-question.ts",
  "src/modules/conversation/process-conversational-input.ts",
];

test("AI event helper emits only AI-owned events", () => {
  const source = read("src/lib/ai/events.ts");
  assert.match(source, /DomainEvent\.ProfileFactProposed/);
  assert.match(source, /DomainEvent\.CustomerTypeInferred/);
  assert.match(source, /EventEmitter\[name\] !== "AI"/);
  assert.doesNotMatch(source, /RecommendationGenerated|DocumentValidationCompleted/);
  assert.doesNotMatch(source, /ProfileFactConfirmed/);
});

test("conversation module uses contracts, mocks, and provider seams", () => {
  for (const path of conversationSources) {
    const source = read(path);
    assert.doesNotMatch(source, /@prisma\/client|\.\.\/\.\.\/prisma/);
    assert.doesNotMatch(source, /localStorage/);
  }

  for (const path of conversationSources.filter((item) => !item.endsWith("detect-contradictions.ts"))) {
    assert.match(read(path), /@\/contracts/);
  }

  const proposals = read("src/modules/conversation/propose-profile-facts.ts");
  assert.match(proposals, /@\/contracts\/mocks/);
  assert.match(proposals, /createProvider\(/);
  assert.doesNotMatch(proposals, /VerificationState\.AgentConfirmed|VerificationState\.ExternallyVerified/);

  const nextQuestion = read("src/modules/conversation/get-next-question.ts");
  assert.match(nextQuestion, /mockEarlyIdPrompt/);
  assert.match(nextQuestion, /EARLY_ID/);

  const processInput = read("src/modules/conversation/process-conversational-input.ts");
  assert.match(processInput, /createAiEvent\(/);
  assert.match(processInput, /DomainEvent\.ProfileFactProposed/);
  assert.match(processInput, /DomainEvent\.CustomerTypeInferred/);
  assert.match(processInput, /buildProvenance\(/);
  assert.doesNotMatch(processInput, /ProfileFactConfirmed|RecommendationGenerated/);
});

test("fact-review panel exposes agent override and confirmation controls", () => {
  const source = read("src/components/ai/fact-review-panel.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /@\/contracts/);
  assert.match(source, /Override \$\{label\}/);
  assert.match(source, /Confirm/);
  assert.match(source, /Reject/);
  assert.match(source, /Needs confirmation/);
  assert.doesNotMatch(source, /localStorage|@prisma\/client/);
});
