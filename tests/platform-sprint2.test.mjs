import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile service persists AI proposals as unverified facts with provenance", () => {
  const facts = read("src/modules/profile/profile-facts.ts");
  assert.match(facts, /export async function persistProfileFactProposal/);
  assert.match(facts, /prismaAdapters\.factVerificationState\.toPrisma\(VerificationState\.Unverified\)/);
  assert.match(facts, /serializeSourceEvidence\(proposal\.sourceEvidence\)/);
  assert.match(facts, /confirmedByAgent: false/);
  assert.match(facts, /prisma\.profileFact\.create/);
});

test("confirmProfileFact sets verification, applies agent overrides and emits ProfileFactConfirmed", () => {
  const facts = read("src/modules/profile/profile-facts.ts");
  const block = facts.slice(
    facts.indexOf("export async function confirmProfileFact"),
    facts.indexOf("export async function getRecommendationContext"),
  );
  assert.match(block, /throw new Error\(`ProfileFact not found/);
  assert.match(block, /emit\(DomainEvent\.ProfileFactConfirmed/);
  assert.match(block, /verificationState: prismaAdapters\.factVerificationState\.toPrisma\(input\.verificationState\)/);
  assert.match(block, /eventName: "ProfileFactConfirmed"/);
  assert.match(block, /acceptedValue !== undefined \? \{ proposedValue: input\.acceptedValue \} : \{\}/);
});

test("getRecommendationContext returns verified facts only, from ProfileFacts and Customer", () => {
  const facts = read("src/modules/profile/profile-facts.ts");
  const block = facts.slice(facts.indexOf("export async function getRecommendationContext"));
  assert.match(block, /VERIFIED_STATES\.has\(fact\.verificationState\)/);
  assert.match(block, /fact\.entityType === "LIVESTOCK"/);
  assert.match(block, /prisma\.customer\.findUnique/);
  assert.match(block, /livestock/);
  assert.match(block, /customerType/);
});
