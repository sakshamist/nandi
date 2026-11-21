import { execFileSync } from "node:child_process";

export interface RerankCandidate {
  id: string;
  text: string;
  score: number;
  source: "vector" | "full_text";
}

export interface RerankerProvider {
  name: string;
  rerank(query: string, candidates: RerankCandidate[]): Promise<RerankCandidate[]>;
}

export function createMockReranker(): RerankerProvider {
  return {
    name: "mock",
    async rerank(_query: string, candidates: RerankCandidate[]): Promise<RerankCandidate[]> {
      return [...candidates].sort((left, right) => right.score - left.score);
    },
  };
}

export function createVertexReranker(): RerankerProvider {
  return {
    name: "vertex",
    async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankCandidate[]> {
      if (candidates.length === 0) {
        return [];
      }

      const projectId = process.env.GCP_PROJECT_ID;
      if (!projectId) {
        throw new Error("GCP_PROJECT_ID is required for Vertex reranking");
      }

      const location = process.env.GCP_LOCATION ?? "global";
      const model = process.env.VERTEX_RANKER_MODEL ?? "semantic-ranker-fast@latest";
      const accessToken = await getAccessToken();
      const response = await fetch(
        `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${location}/rankingConfigs/default_ranking_config:rank`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Goog-User-Project": projectId,
          },
          body: JSON.stringify({
            model,
            query,
            top_n: candidates.length,
            records: candidates.map((candidate) => ({
              id: candidate.id,
              title: candidate.id,
              content: candidate.text,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Vertex ranking request failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as {
        rankingRecords?: Array<{ id?: string; score?: number }>;
        records?: Array<{ id?: string; score?: number }>;
        results?: Array<{ id?: string; score?: number }>;
      };
      const ranked = data.rankingRecords ?? data.records ?? data.results ?? [];
      const scoreById = new Map(
        ranked
          .filter((record): record is { id: string; score?: number } => typeof record.id === "string")
          .map((record) => [record.id, Number(record.score ?? 0)]),
      );

      return [...candidates]
        .map((candidate) => ({
          ...candidate,
          score: scoreById.get(candidate.id) ?? candidate.score,
        }))
        .sort((left, right) => right.score - left.score);
    },
  };
}

export function createRerankerProvider(): RerankerProvider {
  const configured = process.env.RERANKER_PROVIDER ?? "mock";
  if (configured === "mock") {
    return createMockReranker();
  }
  if (configured === "vertex") {
    return createVertexReranker();
  }
  throw new Error(`Unsupported reranker provider: ${configured}`);
}

async function getAccessToken(): Promise<string> {
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }

  try {
    const response = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: {
          "Metadata-Flavor": "Google",
        },
      },
    );
    if (response.ok) {
      const data = (await response.json()) as { access_token?: string };
      if (data.access_token) {
        return data.access_token;
      }
    }
  } catch {
    // Fall through to local gcloud credentials.
  }

  const token = execFileSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  ).trim();

  if (!token) {
    throw new Error("Unable to obtain Google Cloud access token");
  }

  return token;
}
