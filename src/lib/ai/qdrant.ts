export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

function headers(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "api-key": apiKey } : {}),
  };
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function ensureCollection(
  url: string,
  apiKey: string,
  collection: string,
  vectorSize: number,
): Promise<void> {
  const baseUrl = normalizeUrl(url);
  const response = await fetch(`${baseUrl}/collections/${collection}`, {
    headers: headers(apiKey),
  });

  if (response.ok) {
    return;
  }

  if (response.status !== 404) {
    throw new Error(`Failed to inspect Qdrant collection: ${response.status} ${response.statusText}`);
  }

  const createResponse = await fetch(`${baseUrl}/collections/${collection}`, {
    method: "PUT",
    headers: headers(apiKey),
    body: JSON.stringify({
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create Qdrant collection: ${createResponse.status} ${createResponse.statusText}`);
  }
}

export async function upsertPoints(
  url: string,
  apiKey: string,
  collection: string,
  points: QdrantPoint[],
): Promise<void> {
  if (points.length === 0) {
    return;
  }

  const response = await fetch(`${normalizeUrl(url)}/collections/${collection}/points?wait=true`, {
    method: "PUT",
    headers: headers(apiKey),
    body: JSON.stringify({ points }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert Qdrant points: ${response.status} ${response.statusText}`);
  }
}
