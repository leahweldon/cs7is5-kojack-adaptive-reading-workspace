import { DocumentRecord, DocumentsApi, DocumentWithText } from "./documents";

type StoredDoc = DocumentWithText;

const STORAGE_KEY = "claritylayer:docs:v1";
const STORAGE_CURRENT_USER = "claritylayer:currentUserId:v1";

function getDocStorageKey() {
  const userId = localStorage.getItem(STORAGE_CURRENT_USER) ?? "anonymous";
  return `${STORAGE_KEY}:${userId}`;
}

function loadAll(): StoredDoc[] {
  try {
    const raw = localStorage.getItem(getDocStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredDoc[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(docs: StoredDoc[]) {
  localStorage.setItem(getDocStorageKey(), JSON.stringify(docs));
}

function formatTitle(text: string) {
  const firstLine = text.split("\n")[0]?.trim() || "Untitled document";
  return firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;
}

function makeExcerpt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? clean.slice(0, 120) + "…" : clean;
}

export const documentsLocalApi: DocumentsApi = {
  async list(): Promise<DocumentRecord[]> {
    const docs = loadAll()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    return docs.map(({ id, title, createdAt, excerpt }) => ({
      id,
      title,
      createdAt,
      excerpt,
    }));
  },

  async get(id: string): Promise<DocumentWithText | null> {
    const docs = loadAll();
    const found = docs.find((d) => d.id === id);
    return found ?? null;
  },

  async save(text: string, title?: string): Promise<DocumentRecord> {
    const docs = loadAll();
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    const record: StoredDoc = {
      id,
      title: title?.trim() || formatTitle(text),
      createdAt,
      excerpt: makeExcerpt(text),
      text,
    };

    const next = [record, ...docs].slice(0, 8);
    saveAll(next);

    return {
      id: record.id,
      title: record.title,
      createdAt: record.createdAt,
      excerpt: record.excerpt,
    };
  },

  async delete(id: string): Promise<void> {
    const docs = loadAll();
    const next = docs.filter((d) => d.id !== id);
    saveAll(next);
  },
};