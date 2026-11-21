import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("explanation uses only deterministic rule outputs", () => {
  const source = read("src/modules/recommendation/ai/explain-recommendation.ts");
  assert.match(source, /input\.rankedPolicies/);
  assert.match(source, /input\.prerequisites/);
  assert.match(source, /from "@\/contracts\/mocks"/);
  assert.match(source, /createProvider\(/);
  assert.match(source, /deterministic rule outputs/);
  assert.match(source, /prerequisites[,:]/);
  assert.match(source, /exclusions[,:]/);
  assert.match(source, /missingFacts[,:]/);
  assert.match(source, /postSubmissionSteps[,:]/);
  assert.doesNotMatch(source, /evaluatePolicyEligibility\(/);
  assert.doesNotMatch(source, /\bissued\b/);
  assert.doesNotMatch(source, /@prisma\/client|localStorage|PromptMetadata|AuditEvent/);
});

test("explanation card renders rationale and requirements", () => {
  const source = read("src/components/ai/explanation-card.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /ExplanationResult/);
  assert.match(source, /value\.rationale/);
  assert.match(source, /title="Prerequisites"/);
  assert.match(source, /title="Exclusions"/);
  assert.match(source, /title="Missing facts"/);
  assert.match(source, /title="Post-submission requirements"/);
  assert.match(source, /confidenceLabel\(/);
  assert.doesNotMatch(source, /localStorage|@prisma\/client|RecommendationGenerated/);
});

test("AI barrel exports explanation card", () => {
  const source = read("src/components/ai/index.ts");
  assert.match(source, /export \* from "\.\/explanation-card"/);
  assert.match(source, /export \* from "\.\/fact-review-panel"/);
});
