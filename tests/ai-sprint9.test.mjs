import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const aiSources = [
  "src/lib/ai/events.ts",
  "src/lib/ai/prompts.ts",
  "src/lib/ai/provider.ts",
  "src/lib/ai/provenance.ts",
  "src/lib/ai/retrieval.ts",
  "src/modules/conversation/derive-missing-facts.ts",
  "src/modules/conversation/detect-contradictions.ts",
  "src/modules/conversation/get-next-question.ts",
  "src/modules/conversation/infer-customer-type.ts",
  "src/modules/conversation/process-conversational-input.ts",
  "src/modules/conversation/propose-profile-facts.ts",
  "src/modules/recommendation/ai/explain-recommendation.ts",
  "src/modules/documents/ai/assess-evidence-quality.ts",
  "src/modules/documents/ai/extract-vhc-fields.ts",
  "src/components/ai/evidence-exception-review.tsx",
  "src/components/ai/explanation-card.tsx",
  "src/components/ai/fact-review-panel.tsx",
];

test("AI envelopes carry all version and provenance metadata", () => {
  const contract = read("src/contracts/ai.ts");
  for (const field of [
    "proposedValue",
    "sourceEvidence",
    "confidence",
    "verificationState",
    "promptVersion",
    "modelVersion",
  ]) {
    assert.match(contract, new RegExp(`${field}:`));
  }

  const provenance = read("src/lib/ai/provenance.ts");
  assert.match(provenance, /VerificationState\.Unverified/);
  assert.match(provenance, /promptVersion: input\.envelope\.promptVersion/);
  assert.match(provenance, /modelVersion: input\.envelope\.modelVersion/);
  assert.match(provenance, /reasonCodes: input\.reasonCodes/);
});

test("AI never promotes confidence or writes platform state", () => {
  for (const path of aiSources) {
    const source = read(path);
    assert.doesNotMatch(source, /VerificationState\.AgentConfirmed|VerificationState\.ExternallyVerified/);
    assert.doesNotMatch(source, /ValidationStatus\./);
    assert.doesNotMatch(source, /@prisma\/client|localStorage|AuditEvent|PromptMetadata/);
    assert.doesNotMatch(source, /recordEvidenceValidation|confirmProfileFact|attachRecommendationRationale/);
    assert.doesNotMatch(source, /DomainEvent\.RecommendationGenerated|DomainEvent\.DocumentValidationCompleted|DomainEvent\.ProfileFactConfirmed/);
  }
});

test("AI never drives application state transitions", () => {
  for (const path of aiSources) {
    const source = read(path);
    assert.doesNotMatch(source, /ApplicationState\./);
    assert.doesNotMatch(source, /\bissued\b|\bsubmitted\b/);
  }
});

test("explanation remains grounded in deterministic outputs", () => {
  const source = read("src/modules/recommendation/ai/explain-recommendation.ts");
  assert.match(source, /input\.rankedPolicies/);
  assert.match(source, /input\.prerequisites/);
  assert.match(source, /deterministic rule outputs/);
  assert.doesNotMatch(source, /evaluatePolicyEligibility\(/);
  assert.doesNotMatch(source, /getInsurerPrerequisites\(/);
});

test("AI audit handoff uses typed events with provenance", () => {
  const process = read("src/modules/conversation/process-conversational-input.ts");
  assert.match(process, /createAiEvent\(/);
  assert.match(process, /DomainEvent\.ProfileFactProposed/);
  assert.match(process, /DomainEvent\.CustomerTypeInferred/);
  assert.match(process, /provenance,/);

  const events = read("src/lib/ai/events.ts");
  assert.match(events, /DomainEvent\.ProfileFactProposed/);
  assert.match(events, /DomainEvent\.CustomerTypeInferred/);
  assert.doesNotMatch(events, /RecommendationGenerated|DocumentValidationCompleted|ProfileFactConfirmed/);
});

test("sprint-specific AI regression guards are present", () => {
  const earlyId = read("tests/ai-sprint3.test.mjs");
  assert.match(earlyId, /referralDecision/);

  const explanation = read("tests/ai-sprint4.test.mjs");
  assert.match(explanation, /deterministic rule outputs/);

  const evidence = read("tests/ai-sprint6.test.mjs");
  assert.match(evidence, /LowConfidenceReviewRequired/);
});

test("confidence thresholds route low-quality output to review, never final status", () => {
  const quality = read("src/modules/documents/ai/assess-evidence-quality.ts");
  assert.match(quality, /FAILURE_THRESHOLD/);
  assert.match(quality, /REVIEW_THRESHOLD/);
  assert.match(quality, /ReasonCode\.LowConfidenceReviewRequired/);

  const vhc = read("src/modules/documents/ai/extract-vhc-fields.ts");
  assert.match(vhc, /LOW_CONFIDENCE_THRESHOLD/);
  assert.match(vhc, /bandToScore/);
  assert.match(vhc, /ConfidenceBand/);
  assert.match(vhc, /ReasonCode\.LowConfidenceReviewRequired/);
});

test("exception review surfaces simulated low-confidence and quality failures", () => {
  const review = read("src/components/ai/evidence-exception-review.tsx");
  assert.match(review, /quality\?\.reasonCodes/);
  assert.match(review, /vhc\?\.reasonCodes/);
  assert.match(review, /Low-confidence or failed validation requires agent review/);
  assert.match(review, /Reason codes/);
  assert.match(review, /onRetake/);
  assert.match(review, /onConfirm/);
  assert.match(review, /onReject/);
});

test("AI-owned E2E steps are wired: inference, early-ID prompt, no-repeat", () => {
  const process = read("src/modules/conversation/process-conversational-input.ts");
  assert.match(process, /inferCustomerType/);
  assert.match(process, /proposeProfileFacts/);

  const infer = read("src/modules/conversation/infer-customer-type.ts");
  assert.match(infer, /CustomerType\.Cooperative/);

  const nextQuestion = read("src/modules/conversation/get-next-question.ts");
  assert.match(nextQuestion, /shouldPromptForEarlyId/);
  assert.match(nextQuestion, /input\.referralDecision === undefined/);
  assert.match(nextQuestion, /purpose: "EARLY_ID"/);
});
