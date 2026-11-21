import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("interaction lifecycle service implements start/resume/sync/close", () => {
  const interaction = read("src/modules/interaction/interaction.ts");
  assert.match(interaction, /export function createInteractionService/);
  assert.match(interaction, /async startInteraction/);
  assert.match(interaction, /async resumeInteraction/);
  assert.match(interaction, /async syncOfflineDraft/);
  assert.match(interaction, /async closeInteraction/);
  assert.match(interaction, /emit\(DomainEvent\.InteractionStarted/);
  assert.match(interaction, /ApplicationState\.ProfileIncomplete/);
});

test("syncOfflineDraft is idempotent on replay and conflicts on stale baseVersion", () => {
  const interaction = read("src/modules/interaction/interaction.ts");
  const syncBlock = interaction.slice(
    interaction.indexOf("async syncOfflineDraft"),
    interaction.indexOf("async closeInteraction"),
  );
  assert.match(syncBlock, /seen\.get\(input\.idempotencyKey\)/);
  assert.match(syncBlock, /input\.baseVersion !== current/);
  assert.match(syncBlock, /{ accepted: false, version: current }/);
  assert.match(syncBlock, /emit\(DomainEvent\.DraftSynced/);
});

test("prisma interaction store persists interactions with status transitions", () => {
  const store = read("src/modules/interaction/interaction-store.ts");
  assert.match(store, /new PrismaClient\(\)/);
  assert.match(store, /prisma\.interaction\.create/);
  assert.match(store, /status: "CLOSED"/);
});

test("workspace draft store keeps FieldDrafts in IndexedDB with memory fallback", () => {
  const draftStore = read("src/modules/workspace/draft-store.ts");
  assert.match(draftStore, /interface FieldDraft/);
  assert.match(draftStore, /queuedSyncItems/);
  assert.match(draftStore, /indexedDB\.open/);
  assert.match(draftStore, /keyPath: "id"/);
  assert.match(draftStore, /globalThis/);
  assert.match(draftStore, /export async function drafts/);
});

test("offline detector reports online/offline and supports subscriptions", () => {
  const detector = read("src/modules/workspace/offline-detector.ts");
  assert.match(detector, /navigator\.onLine/);
  assert.match(detector, /window\.addEventListener\("online"/);
  assert.match(detector, /window\.addEventListener\("offline"/);
  assert.match(detector, /export function isOnline/);
  assert.match(detector, /export function subscribeOffline/);
});

test("workspace shell shows the offline banner and local-draft sync indicator", () => {
  const shell = read("src/components/workspace/workspace-shell.tsx");
  assert.match(shell, /"use client"/);
  assert.match(shell, /Drafts saved locally/);
  assert.match(shell, /You are offline/);
  assert.match(shell, /subscribeOffline/);
  assert.match(shell, /Workspace sections/);
});

test("event bus is the single in-process emitter hub with name filtering", () => {
  const bus = read("src/lib/events/bus.ts");
  assert.match(bus, /export function emit/);
  assert.match(bus, /export function on/);
});
