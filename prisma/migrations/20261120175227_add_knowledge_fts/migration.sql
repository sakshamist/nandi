-- Add full-text search vector to knowledge chunks
ALTER TABLE "KnowledgeChunk"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce("heading", '') || ' ' || coalesce("text", ''))) STORED;

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_searchVector_idx"
ON "KnowledgeChunk" USING GIN ("searchVector");

-- Add full-text search vector to product rules
ALTER TABLE "ProductRule"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce("ruleType", '') || ' ' || coalesce("ruleKey", '') || ' ' || coalesce("conditionsJson", ''))) STORED;

CREATE INDEX IF NOT EXISTS "ProductRule_searchVector_idx"
ON "ProductRule" USING GIN ("searchVector");
