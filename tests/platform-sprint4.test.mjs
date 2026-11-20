import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("catalogue serves insurer prerequisites from versioned InsurerConstraint", () => {
  const catalogue = read("src/modules/catalogue/catalogue.ts");
  assert.match(catalogue, /export async function getInsurerPrerequisites/);
  assert.match(catalogue, /prisma\.insurerConstraint\.findFirst/);
  assert.match(catalogue, /orderBy: \{ version: "desc" \}/);
  assert.match(catalogue, /vhcRequirementsJson\s*\?\s*\(JSON\.parse\(constraint\.vhcRequirementsJson\) as string\[\]\)\s*:\s*\[\]/);
  assert.match(catalogue, /export async function getCatalogue/);
});

test("evaluatePolicyEligibility applies deterministic age-range gates", () => {
  const eligibility = read("src/modules/recommendation/eligibility.ts");
  assert.match(eligibility, /export async function evaluatePolicyEligibility/);
  assert.match(eligibility, /rule\.ruleKey === "MIN_AGE_MONTHS"/);
  assert.match(eligibility, /rule\.ruleKey === "MAX_AGE_MONTHS"/);
  assert.match(eligibility, /JSON\.parse\(rule\.conditionsJson\)/);
  assert.match(eligibility, /age !== null && age < minAge/);
  assert.match(eligibility, /age !== null && age > maxAge/);
  assert.match(eligibility, /eligible: false/);
  assert.match(eligibility, /eligible: true/);
});

test("rankPolicies ranks by premium rate with eligibility flags and missing facts", () => {
  const ranking = read("src/modules/recommendation/ranking.ts");
  assert.match(ranking, /export async function rankPolicies/);
  assert.match(ranking, /rank: index \+ 1/);
  assert.match(ranking, /score: product\.basePremiumRate/);
  assert.match(ranking, /prerequisites\.requiresVhc \? \["requiresVhc"\] : \[\]/);
  assert.match(ranking, /ranked\.sort\(\(a, b\) => a\.score - b\.score/);
});

test("recommendation module barrel re-exports eligibility and ranking", () => {
  const barrel = read("src/modules/recommendation/index.ts");
  assert.match(barrel, /export \* from "\.\/eligibility"/);
  assert.match(barrel, /export \* from "\.\/ranking"/);
});

test("recommendation comparison shell lists policies with insurer requirements and missing facts", () => {
  const page = read("src/app/recommendation/page.tsx");
  assert.match(page, /Recommended policies/);
  assert.match(page, /requiresTagForSubmission \? "Tag required before submission" : null/);
  assert.match(page, /missingFacts\.join\(", "\)/);
  assert.match(page, /getInsurerPrerequisites\(product\.id\)/);
  assert.match(page, /evaluatePolicyEligibility\(\{ productId: product\.id, context \}\)/);
});
