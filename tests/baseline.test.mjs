import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const has = (path) => existsSync(new URL(path, root));

test("required documentation is present", () => {
  for (const path of [
    "README.md",
    "DEV_AI.md",
    "DEV_PLATFORM.md",
    "DEV_SPLIT_ADDENDUM.md",
    "SureLM_Architecture_and_Sprint_Plan.md",
  ]) {
    assert.equal(has(path), true, `${path} is missing`);
  }
});

test("package exposes baseline and database scripts", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const script of ["dev", "lint", "typecheck", "test", "db:generate", "db:migrate", "db:seed", "db:validate", "postinstall"]) {
    assert.equal(typeof pkg.scripts[script], "string", `${script} script is missing`);
  }
  assert.equal(pkg.prisma.seed, "node prisma/seed.mjs");
});

test("environment template covers all external services", () => {
  const env = read(".env.example");
  for (const key of ["DATABASE_URL", "DIRECT_URL", "QDRANT_URL", "LLM_PROVIDER", "GCS_BUCKET", "SIGNED_URL_TTL_SECONDS"]) {
    assert.match(env, new RegExp(`^${key}=`, "m"));
  }
});

test("initial migration files exist", () => {
  assert.equal(has("prisma/migrations/20261120000000_init/migration.sql"), true);
  assert.equal(has("prisma/migrations/migration_lock.toml"), true);
});

test("default Next.js scaffold copy is removed", () => {
  const page = read("src/app/page.tsx");
  const layout = read("src/app/layout.tsx");
  assert.doesNotMatch(page, /To get started, edit the/);
  assert.doesNotMatch(layout, /Create Next App/);
  assert.doesNotMatch(layout, /LayoutProps/);
});

test("CI covers both workstream branches", () => {
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /dev\/ai/);
  assert.match(ci, /dev\/platform/);
  assert.match(ci, /npm run typecheck/);
  assert.match(ci, /npm test/);
  assert.match(ci, /npm run db:validate/);
});

test("deployment docs describe the GCP pilot stack", () => {
  const docs = [
    "SureLM_Architecture_and_Sprint_Plan.md",
    "DEV_AI.md",
    "DEV_PLATFORM.md",
    "DEV_SPLIT_ADDENDUM.md",
    "README.md",
  ]
    .map(read)
    .join("\n");

  for (const term of [
    "Cloud Run",
    "Cloud SQL",
    "Cloud Storage",
    "GCS",
    "Vertex AI",
    "Qdrant",
    "Secret Manager",
    "Cloud Logging",
    "Cloud Monitoring",
  ]) {
    assert.match(docs, new RegExp(term, "i"), `${term} is missing from deployment docs`);
  }
});

test("deployment docs do not advertise replaced providers", () => {
  const docs = [
    "SureLM_Architecture_and_Sprint_Plan.md",
    "DEV_AI.md",
    "DEV_PLATFORM.md",
    "DEV_SPLIT_ADDENDUM.md",
    "README.md",
  ]
    .map(read)
    .join("\n");

  for (const term of ["Neon", "Ollama", "OpenAI", "S3", "Vercel"]) {
    assert.doesNotMatch(docs, new RegExp(`\\b${term}\\b`, "i"), `${term} is still advertised`);
  }
});

test("environment template uses GCP and mock AI defaults", () => {
  const env = read(".env.example");
  assert.match(env, /^GOOGLE_CLOUD_PROJECT=/m);
  assert.match(env, /^LLM_PROVIDER="mock"$/m);
  assert.doesNotMatch(env, /OLLAMA_BASE_URL|OPENAI_API_KEY|OBJECT_STORAGE_(ENDPOINT|ACCESS_KEY|SECRET_KEY)/);
});
