# Hybrid Search Preparation

## Status

- PostgreSQL is running locally and migrated.
- `KnowledgeDocument` and `KnowledgeChunk` tables store ingested chunk text.
- `KnowledgeChunk.searchVector` is a generated tsvector column with a GIN index.
- `ProductRule.searchVector` is also generated and indexed.
- Ingestion now syncs chunk text into PostgreSQL while upserting vectors into Qdrant.
- `hybridRetrieve` combines Qdrant vector results with PostgreSQL full-text results.
- `RerankerProvider` supports a mock passthrough and an external reranker seam.

## Vertex AI Reranker

- Set `RERANKER_PROVIDER=vertex`.
- Set `GCP_PROJECT_ID`, and optionally `GCP_LOCATION` and `VERTEX_RANKER_MODEL`.
- Local auth uses `gcloud auth application-default login`.
- Cloud Run uses the metadata server for access tokens.
- Default model: `semantic-ranker-fast@latest`.

## Next Steps

- Set `FEATURE_HYBRID_SEARCH=true` to enable hybrid retrieval.
- Configure `RERANKER_PROVIDER` and credentials when using an external reranker.
- Measure retrieval quality before adding more advanced reranking.
