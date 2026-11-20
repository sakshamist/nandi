export interface RetrievedDocument {
  id: string;
  text: string;
  score: number;
}

export interface RetrievalClient {
  collection: string;
  retrieve(query: string, limit?: number): Promise<RetrievedDocument[]>;
}

export const DEFAULT_QDRANT_COLLECTION = "surelm_product_knowledge";

const MOCK_DOCUMENTS: RetrievedDocument[] = [
  {
    id: "product-rule-mock-1",
    text: "Tag inspection is required before issuance when the insurer requires a livestock tag.",
    score: 1,
  },
  {
    id: "product-rule-mock-2",
    text: "A veterinary health certificate is required when the insurer enables VHC requirements.",
    score: 0.9,
  },
  {
    id: "guideline-mock-1",
    text: "Referral creation does not block recommendation, selection, or tagging inspection.",
    score: 0.8,
  },
];

export function createRetrievalClient(
  collection: string = process.env.QDRANT_COLLECTION ?? DEFAULT_QDRANT_COLLECTION,
): RetrievalClient {
  return {
    collection,
    async retrieve(query: string, limit = 3): Promise<RetrievedDocument[]> {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return MOCK_DOCUMENTS.slice(0, limit);
      }
      return MOCK_DOCUMENTS.filter((document) => {
        return document.text.toLowerCase().includes(normalized) || document.id.includes(normalized);
      })
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
    },
  };
}
