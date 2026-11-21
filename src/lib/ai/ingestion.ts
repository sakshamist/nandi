import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { createEmbeddingProvider } from "./embeddings.ts";
import { ensureCollection, upsertPoints } from "./qdrant.ts";

export interface KnowledgeChunk {
  source: string;
  heading: string;
  index: number;
  text: string;
  contentHash: string;
}

export interface IngestionOptions {
  docsDir?: string;
  collection?: string;
  qdrantUrl?: string;
  qdrantApiKey?: string;
  dryRun?: boolean;
  limit?: number;
}

export interface IngestionResult {
  files: number;
  chunks: number;
  points: number;
  collection: string;
  dryRun: boolean;
}

interface MarkdownSection {
  heading: string;
  body: string;
}

const MAX_CHUNK_CHARS = 1000;
const CHUNK_OVERLAP_CHARS = 150;

export async function readMarkdownFiles(docsDir: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  await visit(docsDir);
  return files.sort();
}

export function chunkMarkdown(content: string, source: string): KnowledgeChunk[] {
  const sections = splitSections(content, source);
  const chunks: KnowledgeChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const paragraphs = section.body
      .trim()
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    let current = "";
    for (const paragraph of paragraphs) {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
      if (candidate.length > MAX_CHUNK_CHARS && current) {
        chunks.push(createChunk(source, section.heading, chunkIndex, current));
        chunkIndex += 1;
        current = `${current.slice(-CHUNK_OVERLAP_CHARS)}\n\n${paragraph}`.trim();
      } else {
        current = candidate;
      }
    }

    if (current.trim()) {
      chunks.push(createChunk(source, section.heading, chunkIndex, current));
      chunkIndex += 1;
    }
  }

  return chunks;
}

export function buildPointId(source: string, index: number, contentHash: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${source}:${index}:${contentHash}`)
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function ingestKnowledge(options: IngestionOptions = {}): Promise<IngestionResult> {
  const docsDir = options.docsDir ?? process.env.KNOWLEDGE_DIR ?? "knowledge";
  const collection = options.collection ?? process.env.QDRANT_COLLECTION ?? "surelm_product_knowledge";
  const qdrantUrl = options.qdrantUrl ?? process.env.QDRANT_URL;
  const qdrantApiKey = options.qdrantApiKey ?? process.env.QDRANT_API_KEY ?? "";
  const dryRun = options.dryRun ?? false;
  const limit = options.limit;

  const files = await readMarkdownFiles(docsDir);
  const chunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const source = path.relative(docsDir, file).split(path.sep).join("/");
    chunks.push(...chunkMarkdown(content, source));
  }

  const selectedChunks = typeof limit === "number" ? chunks.slice(0, limit) : chunks;

  if (dryRun) {
    return {
      files: files.length,
      chunks: selectedChunks.length,
      points: 0,
      collection,
      dryRun: true,
    };
  }

  if (!qdrantUrl) {
    throw new Error("QDRANT_URL is required for ingestion");
  }

  const provider = createEmbeddingProvider();
  const vectors = await provider.embed(selectedChunks.map((chunk) => chunk.text));
  const ingestedAt = new Date().toISOString();
  const points = selectedChunks.map((chunk, index) => ({
    id: buildPointId(chunk.source, chunk.index, chunk.contentHash),
    vector: vectors[index],
    payload: {
      source: chunk.source,
      heading: chunk.heading,
      chunkIndex: chunk.index,
      contentHash: chunk.contentHash,
      text: chunk.text,
      embeddingModel: provider.model,
      embeddingDimensions: provider.dimensions,
      ingestedAt,
    },
  }));

  const prisma = new PrismaClient();
  try {
    const grouped = new Map<string, KnowledgeChunk[]>();
    for (const chunk of selectedChunks) {
      const existing = grouped.get(chunk.source) ?? [];
      existing.push(chunk);
      grouped.set(chunk.source, existing);
    }

    for (const [source, sourceChunks] of grouped) {
      await prisma.knowledgeDocument.deleteMany({ where: { source } });
      const document = await prisma.knowledgeDocument.create({
        data: {
          source,
          title: path.basename(source),
          contentHash: crypto
            .createHash("sha256")
            .update(sourceChunks.map((chunk) => chunk.text).join("\\n"))
            .digest("hex"),
          metadataJson: JSON.stringify({
            embeddingModel: provider.model,
            embeddingDimensions: provider.dimensions,
            ingestedAt,
          }),
        },
      });

      await prisma.knowledgeChunk.createMany({
        data: sourceChunks.map((chunk) => ({
          documentId: document.id,
          chunkIndex: chunk.index,
          heading: chunk.heading,
          text: chunk.text,
          contentHash: chunk.contentHash,
        })),
      });
    }
  } finally {
    await prisma.$disconnect();
  }

  await ensureCollection(qdrantUrl, qdrantApiKey, collection, provider.dimensions);
  await upsertPoints(qdrantUrl, qdrantApiKey, collection, points);

  return {
    files: files.length,
    chunks: selectedChunks.length,
    points: points.length,
    collection,
    dryRun: false,
  };
}

function splitSections(content: string, source: string): MarkdownSection[] {
  const lines = content.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let heading = path.basename(source, path.extname(source));
  let body: string[] = [];

  function flush(): void {
    const text = body.join("\n").trim();
    if (text) {
      sections.push({ heading, body: text });
    }
    body = [];
  }

  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      flush();
      heading = match[1].trim();
    } else {
      body.push(line);
    }
  }

  flush();
  return sections.length ? sections : [{ heading, body: content.trim() }];
}

function createChunk(source: string, heading: string, index: number, text: string): KnowledgeChunk {
  const normalized = text.trim();
  return {
    source,
    heading,
    index,
    text: normalized,
    contentHash: crypto.createHash("sha256").update(normalized).digest("hex"),
  };
}
