# Product Knowledge Ingestion Plan

## Goal

Ingest approved product knowledge and guideline documents into the Qdrant collection `surelm_product_knowledge` so the AI retrieval seam can return grounded product rules instead of relying on mocked documents.

## Scope

- In scope: ingestion of approved markdown knowledge files into Qdrant.
- Out of scope: PII, customer documents, VHC evidence, and insurer submission payloads.
- Retrieval integration with `src/lib/ai/retrieval.ts` is phase 2.

## Proposed Components

1. `knowledge/`
   - Approved markdown source documents.
   - Examples: product rules, insurer prerequisites, referral rules, evidence guidelines.

2. `src/lib/ai/ingestion.ts`
   - `chunkMarkdown(content, source)`
   - `buildPointId(source, index, contentHash)`
   - `buildPoints(chunks, embeddings)`
   - `ingestKnowledge(options)`

3. `src/lib/ai/embeddings.ts`
   - `EmbeddingProvider` interface
   - Mock deterministic provider by default
   - Optional Vertex/Gemini provider behind environment flags

4. `src/lib/ai/qdrant.ts`
   - `ensureCollection`
   - `upsertPoints`
   - Optional search helper for retrieval integration

5. `scripts/ingest-docs.mjs` or `scripts/ingest-docs.ts`
   - CLI entry point
   - Supports `--dir`, `--dry-run`, and `--limit`
   - Loads environment configuration

## Data Flow

1. Read markdown files from `knowledge/`.
2. Split each file into heading-aware chunks.
3. Generate one embedding per chunk.
4. Build Qdrant points with deterministic IDs.
5. Upsert points into `surelm_product_knowledge`.
6. Return summary: files, chunks, points, collection.

## Idempotency

Point IDs are derived from:

- source path
- chunk index
- content hash

Re-running ingestion updates existing points instead of creating duplicates.

## Metadata

Each Qdrant point payload should include:

- source path
- heading
- chunk index
- content hash
- embedding model and version
- chunk size and overlap settings
- ingestion timestamp

## Testing

- Unit tests for chunking, hashing, and point construction.
- Integration tests gated by `QDRANT_URL` and `RUN_QDRANT_TESTS=1`.
- Dry-run mode for validating chunk output without Qdrant access.

## Security And Compliance

- Ingest only approved product knowledge.
- Never ingest PII or customer-specific records.
- Log source paths and chunk counts, not document content.
- Keep embedding and Qdrant credentials in environment variables or Secret Manager.

## Phase 2

- Update `createRetrievalClient` to query Qdrant when configured.
- Fall back to mock retrieval when Qdrant is unavailable.
- Add embedding query support to retrieval.

## Open Questions

- Which markdown files are the approved knowledge sources?
- Should ingestion remain mock-embedding only, or include a funded Vertex embedding provider?
- Should ingestion run as a local CLI, CI job, or admin-triggered operation?
