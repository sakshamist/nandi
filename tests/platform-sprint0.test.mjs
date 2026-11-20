import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const MODULES = [
  "workspace",
  "interaction",
  "profile",
  "id-referral",
  "catalogue",
  "recommendation",
  "checklist",
  "documents",
  "application",
  "stubs",
  "admin",
];

test("platform module skeletons exist for M1-M13 modules", () => {
  for (const moduleName of MODULES) {
    assert.ok(
      existsSync(new URL(`../src/modules/${moduleName}/index.ts`, import.meta.url)),
      `missing module skeleton: src/modules/${moduleName}`,
    );
  }
});

test("platform module barrels re-export via typed barrels", () => {
  const barrel = read("src/modules/index.ts");
  for (const moduleName of MODULES) {
    assert.match(barrel, new RegExp(`from "\\./${moduleName}"`), `barrel missing ${moduleName}`);
  }
});

test("frozen contracts are consistent for platform implementation", () => {
  const operations = read("src/contracts/operations.ts");
  assert.match(operations, /export type StartInteraction/);
  assert.match(operations, /export type CloseInteraction/);
  assert.match(operations, /export type SyncOfflineDraft/);
  assert.doesNotMatch(operations, /\bsyncDraft:/);
  const events = read("src/contracts/events.ts");
  assert.match(events, /export const NonBlockingReferralEvents/);
});
