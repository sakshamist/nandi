import assert from "node:assert/strict";
import test from "node:test";

import { buildPointId, chunkMarkdown } from "../src/lib/ai/ingestion.ts";

test("chunkMarkdown returns source and content hash", () => {
  const chunks = chunkMarkdown("# Title\n\nFirst paragraph.\n\nSecond paragraph.", "rules.md");
  assert.ok(chunks.length > 0);
  assert.equal(chunks[0].source, "rules.md");
  assert.match(chunks[0].contentHash, /^[a-f0-9]{64}$/);
});

test("buildPointId is deterministic and UUID-shaped", () => {
  const first = buildPointId("rules.md", 0, "abc");
  const second = buildPointId("rules.md", 0, "abc");
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});
