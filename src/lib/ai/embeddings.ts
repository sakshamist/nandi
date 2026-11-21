import crypto from "node:crypto";

export interface EmbeddingProvider {
  name: string;
  model: string;
  dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

export function createMockEmbeddingProvider(dimensions = 768): EmbeddingProvider {
  return {
    name: "mock",
    model: "mock-hash-embedding-v1",
    dimensions,
    async embed(texts: string[]): Promise<number[][]> {
      return texts.map((text) => hashToVector(text, dimensions));
    },
  };
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const configured = process.env.EMBEDDING_PROVIDER ?? "mock";
  if (configured !== "mock") {
    throw new Error(`Unsupported embedding provider: ${configured}`);
  }

  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);
  if (!Number.isFinite(dimensions) || dimensions <= 0) {
    throw new Error("EMBEDDING_DIMENSIONS must be a positive number");
  }

  return createMockEmbeddingProvider(dimensions);
}

function hashToVector(text: string, dimensions: number): number[] {
  const digest = crypto.createHash("sha256").update(text).digest();
  const vector = new Array<number>(dimensions);

  for (let index = 0; index < dimensions; index += 1) {
    const byte = digest[index % digest.length];
    vector[index] = (byte / 255) * 2 - 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}
