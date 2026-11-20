import { PrismaClient } from "@prisma/client";

import { createRerankerProvider, type RerankCandidate } from "./reranker.ts";

export interface HybridSearchResult {
  id: string;
  text: string;
  score: number;
  source: "vector" | "full_text";
}

export async function fullTextSearchKnowledge(
  query: string,
  limit = 10,
): Promise<HybridSearchResult[]> {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; text: string; score: number }>
    >`
      SELECT "id", "text",
        ts_rank("searchVector", plainto_tsquery('english', ${query})) AS score
      FROM "KnowledgeChunk"
      WHERE "searchVector" @@ plainto_tsquery('english', ${query})
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      score: Number(row.score),
      source: "full_text",
    }));
  } finally {
    await prisma.$disconnect();
  }
}

export async function hybridRetrieve(input: {
  query: string;
  vectorResults: HybridSearchResult[];
  limit?: number;
}): Promise<HybridSearchResult[]> {
  const limit = input.limit ?? 10;
  const fullTextResults = await fullTextSearchKnowledge(input.query, limit);
  const candidates: RerankCandidate[] = [
    ...input.vectorResults.map((result) => ({ ...result })),
    ...fullTextResults.map((result) => ({ ...result })),
  ];

  const deduped = new Map<string, RerankCandidate>();
  for (const candidate of candidates) {
    const existing = deduped.get(candidate.id);
    if (!existing || candidate.score > existing.score) {
      deduped.set(candidate.id, candidate);
    }
  }

  const reranker = createRerankerProvider();
  let reranked: RerankCandidate[];
  try {
    reranked = await reranker.rerank(input.query, [...deduped.values()]);
  } catch {
    reranked = [...deduped.values()].sort((left, right) => right.score - left.score);
  }

  return reranked.slice(0, limit).map((candidate) => ({
    id: candidate.id,
    text: candidate.text,
    score: candidate.score,
    source: candidate.source,
  }));
}
