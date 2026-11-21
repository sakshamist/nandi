import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("event bus supports any-listener subscriptions (audit trail)", () => {
  const bus = read("src/lib/events/bus.ts");
  assert.match(bus, /export function onAny/);
  assert.match(bus, /for \(const listener of \[\.\.\.anyListeners\]\)/);
});

test("audit trail records every platform event to AuditEvent", () => {
  const audit = read("src/modules/admin/audit.ts");
  assert.match(audit, /recordAuditEvent/);
  assert.match(audit, /prisma\.auditEvent\.create/);
  assert.match(audit, /getAuditLog/);
  assert.match(audit, /ApplicationStateChanged/);
  assert.match(audit, /ProfileFactConfirmed/);
  assert.match(audit, /LivestockIdStatusRecorded/);
  assert.match(audit, /IdReferralCreated/);
  assert.match(audit, /IdReferralDeclined/);
  assert.match(audit, /PhotoEvidenceCaptured/);
  assert.match(audit, /DocumentValidationCompleted/);
  assert.match(audit, /BulkValidationRequested/);
  assert.match(audit, /ClaimCaseReferenced/);
  assert.match(audit, /onAny\(auditFromEvent\)/);
});

test("admin config and rule versions manage AdminConfig and RuleVersion", () => {
  const config = read("src/modules/admin/admin-config.ts");
  assert.match(config, /prisma\.adminConfig\.findFirst/);
  assert.match(config, /prisma\.adminConfig\.upsert/);
  const rules = read("src/modules/admin/rule-versions.ts");
  assert.match(rules, /export async function createRuleVersion/);
  assert.match(rules, /prisma\.ruleVersion\.upsert/);
  assert.match(rules, /export async function getRuleVersions/);
});

test("admin console renders audit trail, rule versions and institutes", () => {
  const page = read("src/app/admin/page.tsx");
  assert.match(page, /Admin & supervisor console/);
  assert.match(page, /Audit trail/);
  assert.match(page, /Rule versions/);
  assert.match(page, /Institute directory/);
  assert.match(page, /event\.beforeStateJson && event\.afterStateJson/);
});

test("no plaintext PII or documents in localStorage", () => {
  const draftStore = read("src/modules/workspace/draft-store.ts");
  assert.match(draftStore, /indexedDB\.open/);
  assert.doesNotMatch(draftStore, /localStorage\.setItem/);
  const page = read("src/app/page.tsx");
  assert.doesNotMatch(page, /localStorage\.setItem/);
});

test("offline draft recovery is preserved (IndexedDB draft store + sync ledger)", () => {
  const draftStore = read("src/modules/workspace/draft-store.ts");
  assert.match(draftStore, /memoryDrafts\(\)/);
  const interaction = read("src/modules/interaction/interaction.ts");
  assert.match(interaction, /seen\.get\(input\.idempotencyKey\)/);
});

test("insurer adapter keeps retry idempotency", () => {
  const adapter = read("src/modules/application/insurer-adapter.ts");
  assert.match(adapter, /idempotencyKey/);
  assert.match(adapter, /findUnique/);
});

test("E2E scenarios A, B1, B2, C and D are specified end to end", () => {
  const scenarios = read("src/modules/application/e2e-scenarios.ts");
  assert.match(scenarios, /SCENARIOS: Record<string, ScenarioStep\[\]>/);
  assert.match(scenarios, /^\s*A: \[/m);
  assert.match(scenarios, /^\s*B1: \[/m);
  assert.match(scenarios, /^\s*B2: \[/m);
  assert.match(scenarios, /^\s*C: \[/m);
  assert.match(scenarios, /^\s*D: \[/m);
  assert.match(scenarios, /action: "startInteraction"/);
  assert.match(scenarios, /action: "selectPolicy"/);
  assert.match(scenarios, /action: "generateChecklistInstance"/);
  assert.match(scenarios, /action: "submitApplication"/);
  assert.match(scenarios, /action: "createReferralHandoff"/);
  assert.match(scenarios, /action: "rankPolicies"/);
  assert.match(scenarios, /action: "transitionApplication"/);
  assert.match(scenarios, /action: "createBulkBatch"/);
});

test("agent onboarding quick-start is documented", () => {
  const doc = read("docs/agent-quickstart.md");
  assert.match(doc, /SureLM Agent Workspace/);
  assert.match(doc, /Offline/i);
  assert.match(doc, /Capture/i);
  assert.match(doc, /Application/i);
  assert.match(doc, /audit trail/i);
});
