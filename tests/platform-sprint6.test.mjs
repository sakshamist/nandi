import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("GCS adapter signs short-lived HMAC URLs and verifies expiry", () => {
  const gcs = read("src/lib/storage/gcs.ts");
  assert.match(gcs, /import \{ createHmac \} from "node:crypto"/);
  assert.match(gcs, /export interface SignUrlOptions/);
  assert.match(gcs, /export function signUrl/);
  assert.match(gcs, /requireEnv\("GCS_BUCKET"\)/);
  assert.match(gcs, /requireEnv\("GCS_SIGNED_URL_SIGNING_KEY"\)/);
  assert.match(gcs, /SIGNED_URL_TTL_SECONDS/);
  assert.match(gcs, /X-Goog-Expires/);
  assert.match(gcs, /X-Goog-Signature/);
  assert.match(gcs, /"X-Goog-Algorithm", "GOOGLE-HMAC"/);
  assert.match(gcs, /export function verifySignedUrl/);
  assert.match(gcs, /expiresAt\.getTime\(\) > Date\.now\(\)/);
});

test("document/photo service persists photos with consent-gated geolocation and metadata", () => {
  const documents = read("src/modules/documents/documents.ts");
  assert.match(documents, /export async function createPhoto/);
  assert.match(documents, /export async function createDocument/);
  assert.match(documents, /export async function getPhotoHistory/);
  assert.match(documents, /export async function getDocumentHistory/);
  assert.match(documents, /prisma\.photoEvidence\.create/);
  assert.match(documents, /prisma\.captureMetadata\.create/);
  assert.match(documents, /latitude: consent \? \(input\.latitude \?\? null\) : null/);
  assert.match(documents, /emit\(DomainEvent\.PhotoEvidenceCaptured/);
  assert.match(documents, /signUrl\(`photos\/\$\{input\.idempotencyKey\}`, \{ method: "GET" \}\)/);
});

test("capture server action records photos with validation-eligible fields", () => {
  const capture = read("src/modules/documents/capture.ts");
  assert.match(capture, /"use server"/);
  assert.match(capture, /export async function capturePhoto/);
  assert.match(capture, /formData\.get\("category"\)/);
  assert.match(capture, /formData\.get\("hasGeoConsent"\)/);
  assert.match(capture, /formData\.get\("deviceInfo"\)/);
  assert.match(capture, /Missing idempotency key, category or photo file/);
  assert.match(capture, /createPhoto\(\{/);
});

test("capture photo form requests GPS consent and device info", () => {
  const form = read("src/components/capture/photo-capture-form.tsx");
  assert.match(form, /"use client"/);
  assert.match(form, /navigator\.geolocation/);
  assert.match(form, /geolocation\.getCurrentPosition/);
  assert.match(form, /hasConsent/);
  assert.match(form, /formData\.append\("hasGeoConsent"/);
  assert.match(form, /capturePhoto\(formData\)/);
  assert.match(form, /I allow using the photo with GPS location/);
});

test("capture shell renders photo forms for checklist photo items", () => {
  const page = read("src/app/capture/page.tsx");
  assert.match(page, /PHOTO_CATEGORIES/);
  assert.match(page, /ANIMAL_FULL_BODY_PHOTO/);
  assert.match(page, /EAR_TAG_PHOTO/);
  assert.match(page, /ANIMAL_WITH_OWNER_PHOTO/);
  assert.match(page, /<PhotoCaptureForm category=\{item\.category\} \/>/);
});

test("documents module barrel re-exports the service and capture seam", () => {
  const barrel = read("src/modules/documents/index.ts");
  assert.match(barrel, /export \* from "\.\/documents"/);
  assert.match(barrel, /export \* from "\.\/capture"/);
});

test("capture mounts the AI evidence exception review wired to validation routing", () => {
  const page = read("src/app/capture/page.tsx");
  assert.match(page, /EvidenceExceptionReview/);
  assert.match(page, /mockEvidenceRequirements/);
  assert.match(page, /mockAssessEvidenceQuality/);
  assert.match(page, /mockExtractVhcFields/);

  const wrapper = read("src/components/capture/evidence-exception-review.tsx");
  assert.match(wrapper, /"use client"/);
  assert.match(wrapper, /confirmEvidenceForValidation/);

  const actions = read("src/modules/checklist/evidence-review-actions.ts");
  assert.match(actions, /"use server"/);
  assert.match(actions, /recordEvidenceValidation\(\{/);
  assert.match(actions, /EvidenceRefType\.Photo/);
  assert.match(actions, /idempotencyKey/);
});
