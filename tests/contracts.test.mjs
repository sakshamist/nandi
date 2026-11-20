import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("event registry has one emitter per event", () => {
  const source = read("src/contracts/events.ts");
  const emitterBlock = source.slice(source.indexOf("export const EventEmitter"), source.indexOf("export const NonBlockingReferralEvents"));
  const emitterCount = [...emitterBlock.matchAll(/^\s{2}[A-Za-z]+:\s*"(AI|PLATFORM)",$/gm)].length;

  assert.equal(emitterCount, 19);
  assert.match(emitterBlock, /DocumentValidationCompleted:\s*"PLATFORM"/);
  assert.match(emitterBlock, /ProfileFactProposed:\s*"AI"/);
  assert.match(emitterBlock, /CustomerTypeInferred:\s*"AI"/);
  assert.doesNotMatch(emitterBlock, /RecommendationGenerated:\s*"AI"/);
});

test("operations use canonical names and handoff seams", () => {
  const source = read("src/contracts/operations.ts");
  assert.match(source, /syncOfflineDraft:/);
  assert.match(source, /confirmProfileFact:/);
  assert.match(source, /recordQualityResult:/);
  assert.match(source, /attachRecommendationRationale:/);
  assert.match(source, /idStatus\?: LivestockIdStatus/);
  assert.match(source, /referralDecision\?: ReferralDecision/);
  assert.doesNotMatch(source, /\bsyncDraft:/);
});

test("referral decision is a canonical contract enum", () => {
  const source = read("src/contracts/enums.ts");
  assert.match(source, /export const ReferralDecision = \{/);
  assert.match(source, /Accepted: "accepted"/);
  assert.match(source, /Declined: "declined"/);
});

test("rule contract normalizes conflicting insurer flags", () => {
  const source = read("src/contracts/rules.ts");
  assert.match(source, /export function normalizeInsurerRules/);
  assert.match(source, /ReasonCode\.InsurerAllowsPendingTag/);
  assert.match(source, /referralBlocksSubmission/);
});

test("addendum ratifies the ownership overrides", () => {
  const source = read("DEV_SPLIT_ADDENDUM.md");
  assert.match(source, /:560.*Developer 1 \(AI UI\)/);
  assert.match(source, /:645.*:651.*Developer 1/);
  assert.match(source, /sole emitter|one emitter/i);
});
