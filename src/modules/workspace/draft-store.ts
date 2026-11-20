export interface QueuedSyncItem {
  clientMutationId: string;
  idempotencyKey: string;
  baseVersion: number;
  payload: Record<string, unknown>;
}

export interface FieldDraft {
  id: string;
  interactionId?: string;
  values: Record<string, unknown>;
  queuedSyncItems?: QueuedSyncItem[];
  updatedAt: string;
}

export interface DraftStore {
  get(id: string): Promise<FieldDraft | null>;
  put(draft: FieldDraft): Promise<void>;
  remove(id: string): Promise<void>;
  list(): Promise<FieldDraft[]>;
}

const DB_NAME = "surelm-drafts";
const STORE_NAME = "drafts";

function memoryDrafts(): Map<string, FieldDraft> {
  const globalRef = globalThis as { __surelmMemoryDrafts?: Map<string, FieldDraft> };
  if (!globalRef.__surelmMemoryDrafts) {
    globalRef.__surelmMemoryDrafts = new Map();
  }
  return globalRef.__surelmMemoryDrafts;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    });
  }
  return dbPromise;
}

async function withStore<T>(operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  const request = operation(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function indexedDbDraftStore(): DraftStore {
  return {
    async get(id) {
      const result = await withStore((store) => store.get(id));
      return (result ?? null) as FieldDraft | null;
    },
    async put(draft) {
      await withStore((store) => store.put(draft));
    },
    async remove(id) {
      await withStore((store) => store.delete(id));
    },
    async list() {
      return (await withStore((store) => store.getAll())) as FieldDraft[];
    },
  };
}

function memoryDraftStore(): DraftStore {
  const drafts = memoryDrafts();
  return {
    async get(id) {
      return drafts.get(id) ?? null;
    },
    async put(draft) {
      drafts.set(draft.id, draft);
    },
    async remove(id) {
      drafts.delete(id);
    },
    async list() {
      return [...drafts.values()];
    },
  };
}

let storePromise: Promise<DraftStore> | null = null;

export async function drafts(): Promise<DraftStore> {
  if (!storePromise) {
    storePromise = isIndexedDbAvailable()
      ? Promise.resolve(indexedDbDraftStore())
      : Promise.resolve(memoryDraftStore());
  }
  return storePromise;
}
