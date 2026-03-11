import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { GLOSSARY } from "./glossary";

function applyBionic(word: string) {
  const boldLen = Math.max(1, Math.ceil(word.length * 0.4));
  return (
    <span>
      <span className="bionic-bold">{word.slice(0, boldLen)}</span>
      {word.slice(boldLen)}
    </span>
  );
}

export default function ContentPane() {
  const {
    documentText,
    preferences,
    addChange,
    userModel,
    setUserModel,
    bumpScrollBack,
    bumpLongPause,
    setSession,
  } = useApp();

  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const pauseTimeout = useRef<number | null>(null);

  const paragraphs = useMemo(() => {
    return documentText.split("\n\n").filter((p) => p.trim().length > 0);
  }, [documentText]);

  const chunks = useMemo(() => {
    if (!preferences.chunking) return paragraphs;

    return paragraphs.flatMap((p) => {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      if (sentences.length <= 2) return [p];
      const mid = Math.ceil(sentences.length / 2);
      return [sentences.slice(0, mid).join(" "), sentences.slice(mid).join(" ")];
    });
  }, [paragraphs, preferences.chunking]);

  const markDifficultyAt = (index: number) => {
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, chunks.length - 1)));
  const label = `Section ${safeIndex + 1}`;

  // Only log and update if this section hasn't been recorded before
  if (userModel.detectedDifficultySections.includes(label)) return;

  setUserModel({
    detectedDifficultySections: [...userModel.detectedDifficultySections, label],
  });

  // Only add to Why tab log once per section
  addChange(`You seemed to struggle around ${label}.`, "info");
};

  const armPauseTimer = () => {
    if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);

    pauseTimeout.current = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      const pct = computePct(el);

      if (pct < 90) {
        bumpLongPause();
        addChange("Long pause detected (might be a tricky bit).", "info");

        const sectionIndex = Math.min(
          Math.floor((el.scrollTop / Math.max(1, el.scrollHeight)) * chunks.length),
          Math.max(0, chunks.length - 1)
        );
        markDifficultyAt(sectionIndex);
      }

      // Re-arm so the timer keeps firing while the user stays idle.
      // Each scroll event also re-arms (resetting the countdown), so this
      // only keeps accumulating when the user is not scrolling.
      armPauseTimer();
    }, 3 * 60 * 1000); // 3 minutes 
  };

  useEffect(() => {
    armPauseTimer();
    return () => {
      if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);
    };
  }, []);

  // pause the timer when the user switches tabs or minimises the window 
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (pauseTimeout.current) {
          window.clearTimeout(pauseTimeout.current);
          pauseTimeout.current = null;
        }
      } else {
        armPauseTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // reset progress when doc changes
  useEffect(() => {
    lastScrollTop.current = 0;
    setSession((prev) => ({ ...prev, progressPct: 0 }));
  }, [documentText, setSession]);

  const computePct = (el: HTMLDivElement) => {
    const denom = el.scrollHeight - el.clientHeight;
    if (denom <= 0) return 0;
    return Math.max(0, Math.min(100, (el.scrollTop / denom) * 100));
  };

  const computeWindowPct = () => {
    const doc = document.documentElement;
    const denom = doc.scrollHeight - window.innerHeight;
    if (denom <= 0) return 0;
    return Math.max(0, Math.min(100, (window.scrollY / denom) * 100));
  };

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const pct = computePct(el);
    setSession((prev) => ({ ...prev, progressPct: pct }));

    const diff = el.scrollTop - lastScrollTop.current;

    if (diff < -60) {
  bumpScrollBack();
  if (session.scrollBackCount === 0) {
    addChange("Scroll-back detected (possible reread).", "info");
  }

      const sectionIndex = Math.min(
        Math.floor((el.scrollTop / Math.max(1, el.scrollHeight)) * chunks.length),
        Math.max(0, chunks.length - 1)
      );
      markDifficultyAt(sectionIndex);
    }

    lastScrollTop.current = el.scrollTop;
    armPauseTimer();
  };

  // Fallback for cases where page-level scrolling happens instead of pane scrolling.
  useEffect(() => {
    const onWindowScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      // Prefer pane progress whenever pane itself is scrollable.
      if (el.scrollHeight - el.clientHeight > 1) return;

      const pct = computeWindowPct();
      setSession((prev) => ({ ...prev, progressPct: pct }));
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    window.addEventListener("resize", onWindowScroll);
    onWindowScroll();

    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      window.removeEventListener("resize", onWindowScroll);
    };
  }, [setSession]);

  // glossary
  const renderGlossaryWord = (raw: string) => {
    if (!preferences.glossary) return null;

    const cleaned = raw.replace(/[^\w-]/g, "");
    if (!cleaned) return null;

    const match =
      Object.keys(GLOSSARY).find((k) => k.toLowerCase() === cleaned.toLowerCase()) ?? null;

    if (!match) return null;

    return (
      <button
        type="button"
        className="glossary-term"
        onClick={() => {
          setGlossaryTerm(match);
          addChange(`Glossary opened for "${match}".`, "info");
        }}
      >
        {raw}
      </button>
    );
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\s+)/);

    return parts.map((part, i) => {
      if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;

      const glossaryBtn = renderGlossaryWord(part);
      if (glossaryBtn) return <span key={i}>{glossaryBtn}</span>;

      if (preferences.bionicReading) return <span key={i}>{applyBionic(part)}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-6"
        style={{
          fontSize: `${preferences.fontSize}px`,
          lineHeight: preferences.lineSpacing,
          maxWidth: `${preferences.maxLineWidth}px`,
          margin: "0 auto",
          paddingTop: preferences.progressIndicators ? "84px" : "24px",
          paddingBottom: "24px",
        }}
      >
        {chunks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No document loaded.</div>
        ) : (
          chunks.map((c, idx) => (
            <div key={idx} className={`mb-4 ${preferences.chunking ? "chunk-highlight" : ""}`}>
              <p>{renderText(c)}</p>
            </div>
          ))
        )}
      </div>

      {glossaryTerm && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
          <Card className="p-4 shadow-sm">
            <div className="text-sm font-medium mb-1">{glossaryTerm}</div>
            <div className="text-sm text-muted-foreground mb-3">{GLOSSARY[glossaryTerm]}</div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setGlossaryTerm(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
