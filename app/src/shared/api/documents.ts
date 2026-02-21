export type DocumentRecord = {
  id: string;
  title: string;
  createdAt: number; // epoch ms
  excerpt: string;
};

export type DocumentWithText = DocumentRecord & {
  text: string;
};

/**
 *  we can swap in a real backend implementation without touching UI code
 */
export interface DocumentsApi {
  list(): Promise<DocumentRecord[]>;
  get(id: string): Promise<DocumentWithText | null>;
  save(text: string, title?: string): Promise<DocumentRecord>;
  delete(id: string): Promise<void>;
}