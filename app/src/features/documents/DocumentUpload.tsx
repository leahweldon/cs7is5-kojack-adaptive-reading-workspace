import { useApp } from "@/shared/state/AppContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { DocumentRecord } from "@/shared/api/documents";
import { documentsLocalApi } from "@/shared/api/documents.local";

const SAMPLE_TEXT = `The neurobiology of reading explains how the brain learns to recognise written symbols.

When you look at a word, your primary visual cortex processes the shapes of the letters. These are then sent to the “visual word form area” (VWFA), sometimes called the brain’s letterbox.

From there, the information splits. One path leads to regions responsible for phonology (the sounds of language), and another leads to semantic centres (the meaning of words).`;

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { setDocumentText, resetSession } = useApp();

  const [text, setText] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const refreshDocs = async () => {
    setLoadingDocs(true);
    const list = await documentsLocalApi.list();
    setDocs(list);
    setLoadingDocs(false);
  };

  useEffect(() => {
    const load = async () => {
      await refreshDocs();
    };
    load();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const simulatePdf = () => {
    setPdfLoaded(true);
    setText(SAMPLE_TEXT);
  };

  const startReading = async (docText: string) => {
    setDocumentText(docText);
    resetSession();

    await documentsLocalApi.save(docText);
    await refreshDocs();

    navigate("/reader");
  };

  const handleStart = async () => {
    const finalText = text.trim() || (pdfLoaded ? SAMPLE_TEXT : "");
    if (!finalText) return;
    await startReading(finalText);
  };

  const openSavedDoc = async (id: string) => {
    const doc = await documentsLocalApi.get(id);
    if (!doc) return;
    setDocumentText(doc.text);
    resetSession();
    navigate("/reader");
  };

  const deleteSavedDoc = async (id: string) => {
    await documentsLocalApi.delete(id);
    await refreshDocs();
  };

  const pasteFromClipboard = async () => {
    setClipboardError(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip || !clip.trim()) {
        setClipboardError("Clipboard is empty.");
        return;
      }
      setText(clip);
    } catch (e) {
      setClipboardError("Clipboard access was blocked. Try Cmd+V, or check browser permissions.");
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Brand header */}
        <div className="flex justify-center pt-2">
          <img src="/logo.png" alt="Clarity Layer" className="h-12 w-auto object-contain" />
        </div>

        <div className="text-center space-y-2">
          <Badge variant="secondary">Documents</Badge>
          <h1 className="text-2xl font-semibold">Add your reading material</h1>
          <p className="text-sm text-muted-foreground">
            Paste text or simulate a PDF upload. Recent documents appear below.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-medium">Quick start</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={pasteFromClipboard}>
                Paste from clipboard
              </Button>
              <Button variant="outline" onClick={simulatePdf}>
                Simulate PDF upload
              </Button>
            </div>
          </div>

          {clipboardError && <div className="text-sm text-destructive">{clipboardError}</div>}

          <Textarea
            placeholder="Paste your text here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (pasted && pasted.length > 0) {
                e.preventDefault();
                setText((prev) => (prev.length === 0 ? pasted : prev + "\n" + pasted));
              }
            }}
            rows={8}
          />

          <div className="flex justify-end">
            <Button onClick={handleStart} disabled={!text.trim() && !pdfLoaded}>
              Start reading
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="font-medium">Recent documents</div>

          {loadingDocs ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No saved documents yet.</div>
          ) : (
            <div className="space-y-3">
              {docs.map((d) => (
                <div key={d.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">{d.excerpt}</div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => void openSavedDoc(d.id)}>
                        Open
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void deleteSavedDoc(d.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
