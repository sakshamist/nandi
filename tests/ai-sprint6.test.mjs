import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("quality assessment returns reason codes without final status", () => {
  const source = read("src/modules/documents/ai/assess-evidence-quality.ts");
  assert.match(source, /from "@\/contracts\/mocks"/);
  assert.match(source, /createProvider\(/);
  assert.match(source, /ReasonCode\.BlurryPhoto/);
  assert.match(source, /ReasonCode\.PoorIllumination/);
  assert.match(source, /ReasonCode\.IllegibleTag/);
  assert.match(source, /ReasonCode\.LowConfidenceReviewRequired/);
  assert.doesNotMatch(source, /ValidationStatus\./);
  assert.doesNotMatch(source, /recordEvidenceValidation|@prisma\/client|localStorage/);
});

test("VHC extraction returns all canonical fields with reason codes", () => {
  const source = read("src/modules/documents/ai/extract-vhc-fields.ts");
  assert.match(source, /REQUIRED_FIELDS/);
  assert.match(source, /vetLicenseNumber/);
  assert.match(source, /certificationDate/);
  assert.match(source, /dentitionAge/);
  assert.match(source, /milkYield/);
  assert.match(source, /healthStatus/);
  assert.match(source, /ReasonCode\.MissingVhcField/);
  assert.match(source, /ReasonCode\.LowConfidenceReviewRequired/);
  assert.doesNotMatch(source, /ValidationStatus\./);
  assert.doesNotMatch(source, /recordEvidenceValidation|@prisma\/client|localStorage/);
});

test("exception review exposes agent affordances without owning validation", () => {
  const source = read("src/components/ai/evidence-exception-review.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /EvidenceRequirement\[\]/);
  assert.match(source, /EvidenceQualityResult/);
  assert.match(source, /VhcExtractionResult/);
  assert.match(source, /onRetake/);
  assert.match(source, /onConfirm/);
  assert.match(source, /onReject/);
  assert.match(source, /Retake/);
  assert.match(source, /Confirm for validation/);
  assert.match(source, /Reason codes/);
  assert.doesNotMatch(source, /ValidationStatus|recordEvidenceValidation|DomainEvent|@prisma\/client|localStorage/);
});

test("AI barrel exports exception review", () => {
  const source = read("src/components/ai/index.ts");
  assert.match(source, /export \* from "\.\/evidence-exception-review"/);
});
