# nandi — SureLM

AI-assisted livestock insurance distribution workspace. The agent is the operator; AI assists with conversation, extraction, explanations, and evidence review.

## Documentation

- `SureLM_Architecture_and_Sprint_Plan.md` — product and sprint source of truth.
- `DEV_SPLIT_ADDENDUM.md` — authoritative ownership overrides for the two-developer split.
- `DEV_AI.md` — Developer 1: all AI logic and AI-facing UI.
- `DEV_PLATFORM.md` — Developer 2: platform, workflow, deterministic rules, state machine, and non-AI UI.
- `src/contracts/` — frozen typed contracts shared by both workstreams.

## Setup

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`npm ci` runs `prisma generate` through `postinstall`. Set `DATABASE_URL` and `DIRECT_URL` to the pilot Cloud SQL for PostgreSQL instance before running migrations or seeds. For local development only, any standard PostgreSQL URL is acceptable.

## GCP pilot deployment

Target project: `project-nandi`. Region: `us-central1`. This is a $5-credit demo/pilot, not a production deployment.

- Runtime: Next.js modular monolith on Cloud Run, request-based billing, min instances `0`.
- Database: Cloud SQL for PostgreSQL free-trial instance. It expires after 30 days, has no SLA or backups, and must be deleted or explicitly upgraded before expiry.
- Vector database: Qdrant Cloud Free. Keep `QDRANT_URL`, `QDRANT_API_KEY`, and `QDRANT_COLLECTION` in Secret Manager; reactivate the free cluster weekly to avoid suspension.
- Storage: one private Google Cloud Storage (GCS) Standard bucket, no versioning, lifecycle cleanup for test assets, signed URLs with a short TTL.
- AI: mock-first. Keep `FEATURE_AI_EXPLANATIONS=false` and `FEATURE_AI_EVIDENCE=false` unless Gemini/Vertex AI is separately funded.
- Secrets: store database, Qdrant, and GCS configuration in Secret Manager and inject them into the Cloud Run service account.
- Observability: use Cloud Logging, Cloud Monitoring, and a budget alert. Keep the in-app `AuditEvent` table canonical.

Do not enable Cloud SQL HA/replicas/backups, paid Cloud SQL instances, local GPU inference, Qdrant Standard, high-volume Gemini, external APM/SIEM, or production insurer/CRM integrations during the credit-funded pilot.

Pilot teardown: export required demo records, delete the Cloud SQL instance, Cloud Run service, Artifact Registry image, and GCS bucket, remove secrets and the service account, then reactivate or delete the Qdrant cluster.

## Knowledge ingestion and hybrid search

Use this workflow to ingest approved product knowledge documents into Qdrant and PostgreSQL, then enable hybrid retrieval.

### 1. Prepare the environment

```bash
npm ci
cp .env.example .env
```

Set at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nandi?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/nandi?schema=public"
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""
QDRANT_COLLECTION="surelm_product_knowledge"
```

Optional hybrid-search and reranking settings:

```env
FEATURE_HYBRID_SEARCH="false"
RERANKER_PROVIDER="mock"
GCP_PROJECT_ID=""
GCP_LOCATION="global"
VERTEX_RANKER_MODEL="semantic-ranker-fast@latest"
```

### 2. Start PostgreSQL and Qdrant

Start PostgreSQL with the pilot Cloud SQL instance or a local PostgreSQL service. Start Qdrant locally or use Qdrant Cloud Free, then verify:

```bash
curl http://localhost:6333/collections
```

### 3. Apply database migrations and seed data

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Prepare source documents

Place approved Markdown files in a folder. PDF brochures must be converted to Markdown before ingestion. Example:

```bash
mkdir -p /path/to/knowledge
```

### 5. Preview ingestion

```bash
npm run docs:ingest:dry-run -- --dir /path/to/knowledge
```

### 6. Run ingestion

```bash
npm run docs:ingest -- --dir /path/to/knowledge
```

Optional limit:

```bash
npm run docs:ingest -- --dir /path/to/knowledge --limit 100
```

This creates Qdrant vectors and PostgreSQL `KnowledgeDocument` / `KnowledgeChunk` records. The PostgreSQL chunks include a generated `tsvector` column for full-text search.

### 7. Enable hybrid search

Set:

```env
FEATURE_HYBRID_SEARCH="true"
```

For Vertex AI reranking, also set:

```env
RERANKER_PROVIDER="vertex"
GCP_PROJECT_ID="your-gcp-project-id"
```

Authenticate locally with:

```bash
gcloud auth application-default login
```

### 8. Verify ingestion

```bash
curl http://localhost:6333/collections/surelm_product_knowledge
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "KnowledgeChunk";'
```

Expected result: matching chunk counts in Qdrant and PostgreSQL.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Next.js app |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Node test runner smoke/contract tests |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:migrate` | Apply committed migrations |
| `npm run db:migrate:dev` | Create a development migration |
| `npm run db:seed` | Seed baseline data |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema directly (development only) |

## Branches

`main` carries the frozen contracts and integration merges. Work from `dev/ai` and `dev/platform`; task branches use `ai/*` and `platform/*`. Contract changes land on `main` first.

## CI

`.github/workflows/ci.yml` runs install, lint, typecheck, tests, and Prisma validation on pushes and PRs to `main`, `dev/ai`, and `dev/platform`.
