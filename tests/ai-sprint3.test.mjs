import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const conversationSources = [
  "src/modules/conversation/get-next-question.ts",
  "src/modules/conversation/process-conversational-input.ts",
  "src/modules/conversation/propose-profile-facts.ts",
  "src/modules/conversation/infer-customer-type.ts",
  "src/modules/conversation/detect-contradictions.ts",
  "src/modules/conversation/derive-missing-facts.ts",
];

test("early ID prompt respects ID status and referral decisions", () => {
  const source = read("src/modules/conversation/get-next-question.ts");
  assert.match(source, /export function shouldPromptForEarlyId/);
  assert.match(source, /LivestockIdStatus\.Absent/);
  assert.match(source, /LivestockIdStatus\.Unknown/);
  assert.match(source, /input\.referralDecision === undefined/);
  assert.match(source, /mockEarlyIdPrompt\.question/);
  assert.match(source, /purpose: "EARLY_ID"/);
});

test("conversation turn forwards ID status and referral decision", () => {
  const source = read("src/modules/conversation/process-conversational-input.ts");
  assert.match(source, /idStatus: input\.idStatus/);
  assert.match(source, /referralDecision: input\.referralDecision/);
});

test("AI conversation never emits referral or platform-owned events", () => {
  for (const path of conversationSources) {
    const source = read(path);
    assert.doesNotMatch(source, /IdReferralCreated|IdReferralDeclined/);
    assert.doesNotMatch(source, /RecommendationGenerated|DocumentValidationCompleted/);
    assert.doesNotMatch(source, /ProfileFactConfirmed/);
    assert.doesNotMatch(source, /createReferralHandoff/);
  }

  const events = read("src/lib/ai/events.ts");
  assert.doesNotMatch(events, /IdReferralCreated|IdReferralDeclined/);
});
