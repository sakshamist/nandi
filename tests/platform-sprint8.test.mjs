import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("bulk stub creates a labelled not_implemented batch and per-record items", () => {
  const bulk = read("src/modules/stubs/bulk.ts");
  assert.match(bulk, /export async function createBulkBatch/);
  assert.match(bulk, /prisma\.bulkBatch\.create/);
  assert.match(bulk, /status: "STUB_NOT_IMPLEMENTED"/);
  assert.match(bulk, /not_implemented/i);
  assert.match(bulk, /prisma\.batchItemStub\.create/);
  assert.match(bulk, /emit\(DomainEvent\.BulkValidationRequested/);
  assert.match(bulk, /export async function getBatchProgress/);
  assert.match(bulk, /notImplemented: true/);
  assert.match(bulk, /export async function listBulkBatches/);
});

test("crm stubs create cases and claim stubs and emit ClaimCaseReferenced", () => {
  const crm = read("src/modules/stubs/crm.ts");
  assert.match(crm, /export async function createCrmCase/);
  assert.match(crm, /prisma\.crmCase\.create/);
  assert.match(crm, /caseType: input\.caseType/);
  assert.match(crm, /export async function getCrmCases/);
  assert.match(crm, /export async function createClaimStub/);
  assert.match(crm, /status \?\? "claim_intimated"/);
  assert.match(crm, /prisma\.claimCaseStub\.create/);
  assert.match(crm, /emit\(DomainEvent\.ClaimCaseReferenced/);
  assert.match(crm, /export async function getClaimStubs/);
});

test("stubs barrel re-exports bulk and crm modules", () => {
  const barrel = read("src/modules/stubs/index.ts");
  assert.match(barrel, /export \* from "\.\/bulk"/);
  assert.match(barrel, /export \* from "\.\/crm"/);
});
