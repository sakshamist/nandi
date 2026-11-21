import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("chunkMarkdown attributes source and sha256 content hash to every chunk", () => {
  const source = read("src/lib/ai/ingestion.ts");
  assert.match(source, /export interface KnowledgeChunk/);
  assert.match(source, /source: string;/);
  assert.match(source, /contentHash: string;/);
  assert.match(source, /export function chunkMarkdown\(content: string, source: string\): KnowledgeChunk\[\]/);
  assert.match(source, /function createChunk\(source: string, heading: string, index: number, text: string\): KnowledgeChunk/);
  assert.match(source, /contentHash: crypto\.createHash\("sha256"\)\.update\(normalized\)\.digest\("hex"\)/);
});

test("buildPointId is deterministic and UUID-shaped", () => {
  const source = read("src/lib/ai/ingestion.ts");
  assert.match(source, /export function buildPointId\(source: string, index: number, contentHash: string\): string/);
  assert.match(source, /\.update\(`\$\{source\}:\$\{index\}:\$\{contentHash\}`\)/);
  assert.match(source, /hash\.slice\(0, 8\)}-\$\{/);
  assert.match(source, /hash\.slice\(20, 32\)}/);
});
