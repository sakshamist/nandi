import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("checkIdStatus reads LivestockIdentifier status", () => {
  const service = read("src/modules/id-referral/id-referral.ts");
  assert.match(service, /export async function checkIdStatus/);
  assert.match(service, /prisma\.livestockIdentifier\.findFirst/);
  assert.match(service, /prismaAdapters\.livestockIdStatus\.fromPrisma/);
});

test("recordIdDecision records LivestockIdStatusRecorded", () => {
  const service = read("src/modules/id-referral/id-referral.ts");
  const block = service.slice(
    service.indexOf("export async function recordIdDecision"),
    service.indexOf("export async function createReferralHandoff"),
  );
  assert.match(block, /emit\(DomainEvent\.LivestockIdStatusRecorded/);
  assert.match(block, /prismaAdapters\.livestockIdStatus\.toPrisma\(input\.status\)/);
});

test("createReferralHandoff is idempotent and emits IdReferralCreated", () => {
  const service = read("src/modules/id-referral/id-referral.ts");
  const block = service.slice(
    service.indexOf("export async function createReferralHandoff"),
    service.indexOf("export async function acceptReferralHandoff"),
  );
  assert.match(block, /prisma\.idReferral\.findUnique/);
  assert.match(block, /idempotencyKey: input\.idempotencyKey/);
  assert.match(block, /emit\(DomainEvent\.IdReferralCreated/);
  assert.match(block, /livestockIdentifierId: input\.identifierId/);
});

test("accept/decline referral handoffs record decisions and emit referral events", () => {
  const service = read("src/modules/id-referral/id-referral.ts");
  const decline = service.slice(service.indexOf("export async function declineReferralHandoff"));
  assert.match(decline, /decision: "NOT_INTERESTED"/);
  assert.match(decline, /status: "CANCELLED"/);
  assert.match(decline, /emit\(DomainEvent\.IdReferralDeclined/);
  assert.match(service, /decision: "INTERESTED", status: "HANDOFF_COMPLETED"/);
});

test("institute directory serves active institutes and lookup", () => {
  const directory = read("src/modules/id-referral/directory.ts");
  assert.match(directory, /prisma\.institute\.findMany/);
  assert.match(directory, /active: true/);
  assert.match(directory, /export async function listInstitutes/);
  assert.match(directory, /export async function getInstitute/);
  assert.match(directory, /export async function lookupReferralDestination/);
});

test("referral status is exposed to the workspace shell as a server action", () => {
  const action = read("src/modules/id-referral/referral-status.ts");
  assert.match(action, /"use server"/);
  assert.match(action, /export async function getReferralStatus/);
  assert.match(action, /prisma\.idReferral\.findMany/);
});

test("workspace shell renders the referral indicator", () => {
  const page = read("src/app/page.tsx");
  assert.match(page, /import ReferralStatus from "@\/components\/referral-status"/);
  assert.match(page, /<ReferralStatus \/>/);
});

test("seeds cover the institute directory", () => {
  const seed = read("prisma/seed.mjs");
  assert.match(seed, /await findOrCreate\(prisma\.institute, \{ name: institute\.name \}, institute\)/);
  assert.match(seed, /name: "GVI - PB-01 Bhuvanagudi"/);
  assert.match(seed, /name: "GVDS - PB-02 Murtijapur"/);
});

test("referral events never block submission (parallel-flow rule)", () => {
  const rules = read("src/contracts/rules.ts");
  const block = rules.slice(
    rules.indexOf("export function referralBlocksSubmission"),
    rules.indexOf("export function evaluateSubmissionReadiness"),
  );
  assert.match(block, /return false/);
  const events = read("src/contracts/events.ts");
  assert.match(events, /IdReferralCreated/);
  assert.match(events, /IdReferralDeclined/);
  assert.match(events, /NonBlockingReferralEvents/);
});

test("id-referral barrel re-exports the directory and status seam", () => {
  const barrel = read("src/modules/id-referral/index.ts");
  assert.match(barrel, /export \* from "\.\/id-referral"/);
  assert.match(barrel, /export \* from "\.\/directory"/);
  assert.match(barrel, /export \* from "\.\/referral-status"/);
});
