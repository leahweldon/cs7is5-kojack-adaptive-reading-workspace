export type SavedDoc = {
  id: string;
  title: string;
  createdAt: number;
  excerpt: string;
  text: string;
};

const STORAGE_KEY = "claritylayer:docs:v1";

export function loadDocs(): SavedDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedDoc[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveDoc(doc: SavedDoc) {
  const docs = loadDocs();
  const next = [doc, ...docs.filter((d) => d.id !== doc.id)].slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteDoc(id: string) {
  const docs = loadDocs().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function formatDocTitle(text: string) {
  const firstLine = text.split("\n")[0]?.trim() || "Untitled document";
  return firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;
}

export function excerpt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? clean.slice(0, 120) + "…" : clean;
}