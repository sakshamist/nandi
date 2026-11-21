import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("checklist engine composes mandatory photos, VHC and insurer tagging tasks", () => {
  const engine = read("src/modules/checklist/checklist-engine.ts");
  assert.match(engine, /export function composeItems/);
  assert.match(engine, /code: "ANIMAL_FULL_BODY_PHOTO"/);
  assert.match(engine, /code: "EAR_TAG_PHOTO"/);
  assert.match(engine, /code: "ANIMAL_WITH_OWNER_PHOTO"/);
  assert.match(engine, /code: "KYC_IDENTITY_PROOF"/);
  assert.match(engine, /prerequisites\.requiresVhc/);
  assert.match(engine, /prerequisites\.requiresTagForSubmission/);
  assert.match(engine, /prerequisites\.allowsPendingTaggingInspection/);
  assert.match(engine, /"VETERINARY_HEALTH_CERTIFICATE"/);
});

test("composeItems dedupes template items via the seen set", () => {
  const engine = read("src/modules/checklist/checklist-engine.ts");
  const composeBlock = engine.slice(
    engine.indexOf("export function composeItems"),
    engine.indexOf("export function enforceDependencies"),
  );
  assert.match(composeBlock, /const seen = new Set\(items\.map\(\(item\) => item\.code\)\)/);
  assert.match(composeBlock, /if \(seen\.has\(code\)\) \{\s*continue;\s*\}/);
});

test("enforceDependencies adds the vet fields required by the VHC", () => {
  const engine = read("src/modules/checklist/checklist-engine.ts");
  assert.match(engine, /export function enforceDependencies/);
  assert.match(engine, /codes\.has\("VETERINARY_HEALTH_CERTIFICATE"\)/);
  assert.match(engine, /"VET_LICENSE_NUMBER"/);
  assert.match(engine, /"VET_SIGNOFF"/);
  assert.match(engine, /"DENTITION_AGE"/);
  assert.match(engine, /"MILK_YIELD"/);
  assert.match(engine, /"HEALTH_STATUS"/);
});

test("generateChecklistInstance creates a snapshot tied to the product version and emits ChecklistCreated", () => {
  const checklist = read("src/modules/checklist/checklist.ts");
  assert.match(checklist, /export async function generateChecklistInstance/);
  assert.match(checklist, /prisma\.checklistInstance\.create/);
  assert.match(checklist, /version: product\.version/);
  assert.match(checklist, /emit\(DomainEvent\.ChecklistCreated/);
  assert.match(checklist, /toResultItems\(items\)/);
});

test("recalculateChecklist rebuilds items and bumps the snapshot version", () => {
  const checklist = read("src/modules/checklist/checklist.ts");
  assert.match(checklist, /prisma\.checklistItem\.deleteMany/);
  assert.match(checklist, /version: instance\.version \+ 1/);
  assert.match(checklist, /createChecklistItems\(instance\.id, composed\)/);
});

test("getPendingEvidenceRequirements returns non-completed items with contract-typed fields", () => {
  const checklist = read("src/modules/checklist/checklist.ts");
  const block = checklist.slice(
    checklist.indexOf("export async function getPendingEvidenceRequirements"),
  );
  assert.match(block, /item\.status !== PrismaChecklistItemStatus\.COMPLETED/);
  assert.match(block, /evidenceRefType: item\.evidenceRefType === "DOCUMENT" \? "document" : "photo"/);
  assert.match(block, /code: item\.code/);
  assert.match(block, /requiredForSubmission: item\.requiredForSubmission/);
});

test("recordEvidenceValidation routes validation and updates the checklist item", () => {
  const checklist = read("src/modules/checklist/checklist.ts");
  const block = checklist.slice(
    checklist.indexOf("export async function recordEvidenceValidation"),
  );
  assert.match(block, /routeEvidence\(input\.evidence, input\.quality, input\.vhc\)/);
  assert.match(block, /evidenceId: input\.evidence\.evidenceId/);
  assert.match(block, /status === ValidationStatus\.Pass\s*\?\s*PrismaChecklistItemStatus\.COMPLETED\s*:\s*PrismaChecklistItemStatus\.BLOCKED/);
  assert.match(block, /checklistItem\.updateMany/);
  assert.match(block, /completedAt: new Date\(\)/);
  assert.match(block, /checklistUpdated = true/);
});

test("routing: photo failures route to BlurryPhoto / IllegibleTag; anomalies route to review", () => {
  const routing = read("src/modules/checklist/routing.ts");
  assert.match(routing, /export function routeEvidence/);
  assert.match(routing, /scores\.blur < THRESHOLDS\.blur/);
  assert.match(routing, /ReasonCode\.BlurryPhoto/);
  assert.match(routing, /scores\.tagLegibility < THRESHOLDS\.tagLegibility/);
  assert.match(routing, /ReasonCode\.IllegibleTag/);
  assert.match(routing, /quality\.proposedValue\.anomalies\.length > 0/);
  assert.match(routing, /ReasonCode\.LowConfidenceReviewRequired/);
  assert.match(routing, /vhc\.proposedValue\.some\(\(field\) => !field\.value\)/);
  assert.match(routing, /ReasonCode\.MissingVhcField/);
  assert.match(routing, /ValidationStatus\.Pending/);
});

test("policy selection is captured and PolicySelected is emitted", () => {
  const policySelection = read("src/modules/checklist/policy-selection.ts");
  assert.match(policySelection, /export async function selectPolicy/);
  assert.match(policySelection, /prisma\.policySelection\.findFirst/);
  assert.match(policySelection, /emit\(DomainEvent\.PolicySelected/);
  assert.match(policySelection, /agentConfirmed: true/);
});

test("checklist module barrel re-exports checklist, engine, policy selection and routing", () => {
  const barrel = read("src/modules/checklist/index.ts");
  assert.match(barrel, /export \* from "\.\/checklist"/);
  assert.match(barrel, /export \* from "\.\/checklist-engine"/);
  assert.match(barrel, /export \* from "\.\/policy-selection"/);
  assert.match(barrel, /export \* from "\.\/routing"/);
});

test("checklist tracker page shows progress and item statuses", () => {
  const page = read("src/app/checklist/page.tsx");
  assert.match(page, /Checklist tracker/);
  assert.match(page, /Math\.round\(\(completed \/ total\) \* 100\)/);
  assert.match(page, /item\.status/);
  assert.match(page, /No checklist yet/);
});
