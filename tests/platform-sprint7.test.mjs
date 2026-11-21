import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("state machine defines valid transitions and rejects invalid ones", () => {
  const application = read("src/modules/application/application.ts");
  assert.match(application, /export const VALID_TRANSITIONS/);
  assert.match(application, /ProfileIncomplete\]: \[/);
  assert.match(application, /AwaitingTaggingInspection\]: \[/);
  assert.match(application, /ReadyForSubmission\]: \[ApplicationState\.Submitted\]/);
  assert.match(application, /Submitted\]: \[ApplicationState\.UnderwritingReview\]/);
  assert.match(application, /UnderwritingReview\]: \[ApplicationState\.Issued, ApplicationState\.Rejected\]/);
  assert.match(application, /export async function transitionApplication/);
  assert.match(application, /Invalid state transition/);
  assert.match(application, /prismaApplicationStore\.recordTransition/);
  assert.match(application, /prismaApplicationStore\.updateCaches/);
  assert.match(application, /emit\(DomainEvent\.ApplicationStateChanged/);
  assert.match(application, /export async function setApplicationDeclarations/);
  assert.match(application, /export async function getApplicationDeclarations/);
});

test("readiness gates evaluate insurer rules and never auto-promote", () => {
  const readiness = read("src/modules/application/readiness.ts");
  assert.match(readiness, /export async function getSubmissionReadiness/);
  assert.match(readiness, /export async function getIssuanceReadiness/);
  assert.match(readiness, /evaluateSubmissionReadiness/);
  assert.match(readiness, /evaluateIssuanceReadiness/);
  assert.match(readiness, /normalizeInsurerRules/);
  assert.match(readiness, /prismaAdapters\.applicationState\.fromPrisma/);
  assert.match(readiness, /VETERINARY_HEALTH_CERTIFICATE/);
  assert.match(readiness, /AGENT_CONFIRMED/);
  assert.match(readiness, /getApplicationDeclarations/);
});

test("insurer adapter submits idempotently and polls status", () => {
  const adapter = read("src/modules/application/insurer-adapter.ts");
  assert.match(adapter, /export async function submitApplication/);
  assert.match(adapter, /prisma\.submissionAttempt\.findUnique/);
  assert.match(adapter, /idempotencyKey: input\.idempotencyKey/);
  assert.match(adapter, /prisma\.submissionAttempt\.create/);
  assert.match(adapter, /emit\(DomainEvent\.ApplicationSubmitted/);
  assert.match(adapter, /transitionApplication\(\{ applicationId: input\.applicationId, toState: ApplicationState\.Submitted \}\)/);
  assert.match(adapter, /export async function pollApplicationStatus/);
});

test("application shell renders declarations review per application", () => {
  const page = read("src/app/application/page.tsx");
  assert.match(page, /DeclarationsReview/);
  assert.match(page, /application\.product\.name/);
  const form = read("src/components/application/declarations-review.tsx");
  assert.match(form, /"use client"/);
  assert.match(form, /saveApplicationDeclarations/);
});

test("Application schema carries declarations for the review screen", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /declarationsJson\s+String\?/);
});

test("application module barrel re-exports state machine, store, readiness and adapter", () => {
  const barrel = read("src/modules/application/index.ts");
  assert.match(barrel, /export \* from "\.\/application"/);
  assert.match(barrel, /export \* from "\.\/application-store"/);
  assert.match(barrel, /export \* from "\.\/readiness"/);
  assert.match(barrel, /export \* from "\.\/insurer-adapter"/);
  assert.match(barrel, /export \* from "\.\/declarations-action"/);
});
