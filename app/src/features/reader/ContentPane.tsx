import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  } = useApp();

  // glossary UI
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const lastScrollTop = useRef(0);
  const pauseTimeout = useRef<number | null>(null);

  const paragraphs = useMemo(() => {
    return documentText.split("\n\n").filter((p) => p.trim().length > 0);
  }, [documentText]);

  // Chunking
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
    if (userModel.detectedDifficultySections.includes(label)) return;

    setUserModel({
      detectedDifficultySections: [...userModel.detectedDifficultySections, label],
    });

    addChange(`You seemed to struggle around ${label}.`, "info");
  };

  // pause detection
  const armPauseTimer = () => {
    if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);

    pauseTimeout.current = window.setTimeout(() => {
      // only mid-document so it doesn't fire at the top/bottom
      if (progressRef.current > 10 && progressRef.current < 90) {
        bumpLongPause();
        addChange("Long pause detected (might be a tricky bit).", "info");

        const el = containerRef.current;
        if (!el) return;

        const sectionIndex = Math.min(
          Math.floor((el.scrollTop / Math.max(1, el.scrollHeight)) * chunks.length),
          Math.max(0, chunks.length - 1)
        );
        markDifficultyAt(sectionIndex);
      }
    }, 4500); // can change responsiveness here
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // start pause timer immediately
    armPauseTimer();

    const onScroll = () => {
      const denom = el.scrollHeight - el.clientHeight;
      const pct = denom > 0 ? (el.scrollTop / denom) * 100 : 0;
      progressRef.current = Number.isFinite(pct) ? pct : 0;

      const diff = el.scrollTop - lastScrollTop.current;

      // scroll-back
      if (diff < -60) {
        bumpScrollBack();
        addChange("Scroll-back detected (possible reread).", "info");

        const sectionIndex = Math.min(
          Math.floor((el.scrollTop / Math.max(1, el.scrollHeight)) * chunks.length),
          Math.max(0, chunks.length - 1)
        );
        markDifficultyAt(sectionIndex);
      }

      lastScrollTop.current = el.scrollTop;
      armPauseTimer();
    };

    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks.length]);

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

      // glossary has priority
      const glossaryBtn = renderGlossaryWord(part);
      if (glossaryBtn) return <span key={i}>{glossaryBtn}</span>;

      // otherwise bionic or plain
      if (preferences.bionicReading) return <span key={i}>{applyBionic(part)}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  const progress = Math.min(Math.max(progressRef.current, 0), 100);

  return (
    <div className="h-full flex flex-col">
      {preferences.progressIndicators && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Reading progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{
          fontSize: `${preferences.fontSize}px`,
          lineHeight: preferences.lineSpacing,
          maxWidth: `${preferences.maxLineWidth}px`,
          margin: "0 auto",
        }}
      >
        {chunks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No document loaded.</div>
        ) : (
          chunks.map((c, idx) => (
            <div key={idx} className={`mb-4 ${preferences.chunking ? "chunk-highlight" : ""}`}>
              {/* IMPORTANT: no leading-* class here, it overrides the slider */}
              <p>{renderText(c)}</p>
            </div>
          ))
        )}
      </div>

      {/* Glossary card */}
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