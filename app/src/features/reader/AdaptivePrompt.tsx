import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Preferences, useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useRef, useState } from "react";

type PromptKey = keyof Pick<Preferences, "chunking" | "bionicReading" | "glossary">;

type Prompt = {
  key: PromptKey;
  text: string;
  reason: string;
};

export default function AdaptivePrompt() {
  const {
    preferences,
    setPreferences,
    addChange,
    promptsDisabled,
    setPromptsDisabled,
    session,
    bumpToggle,
    layoutLocked,
  } = useApp();

  const [active, setActive] = useState<Prompt | null>(null);

  // To prrevent spamming we only show at most once per session unless user re-enables prompts
  const shownOnceRef = useRef(false);

  const eligiblePrompt = useMemo(() => {
    if (!preferences.chunking) {
      return { key: "chunking" as const, text: "Try chunking to make this section easier to follow?" };
    }
    if (!preferences.bionicReading) {
      return { key: "bionicReading" as const, text: "Enable bionic reading for easier scanning?" };
    }
    if (!preferences.glossary) {
      return { key: "glossary" as const, text: "Turn on glossary support for tricky terms?" };
    }
    return null;
  }, [preferences.chunking, preferences.bionicReading, preferences.glossary]);

  const cooldownMs = useMemo(() => {
    if (preferences.promptFrequency === "low") return 25000;
    if (preferences.promptFrequency === "high") return 8000;
    return 15000;
  }, [preferences.promptFrequency]);

  const lastShownAtRef = useRef<number | null>(null);

  useEffect(() => {
    // If prompts are disabled, reset shown once so enabling later works
    if (promptsDisabled || !preferences.adaptivePrompts) {
      shownOnceRef.current = false;
      return;
    }

    if (!eligiblePrompt) return;
    if (active) return;

    const now = Date.now();
    if (lastShownAtRef.current && now - lastShownAtRef.current < cooldownMs) return;

    const pauseTriggered = session.longPauseCount >= 1;
    const rereadTriggered = session.scrollBackCount >= 1;

    if (!pauseTriggered && !rereadTriggered) return;

    if (shownOnceRef.current) return;

    const reason = pauseTriggered
      ? "You paused mid-document."
      : "You scrolled back (possible reread).";

    const t = window.setTimeout(() => {
      setActive({ ...eligiblePrompt, reason });
      shownOnceRef.current = true;
      lastShownAtRef.current = Date.now();
      addChange(`Adaptive prompt shown: "${eligiblePrompt.text}"`, "suggestion");
    }, 0);

    return () => window.clearTimeout(t);
  }, [
    promptsDisabled,
    preferences.adaptivePrompts,
    preferences.promptFrequency,
    eligiblePrompt,
    active,
    session.longPauseCount,
    session.scrollBackCount,
    cooldownMs,
    addChange,
  ]);

  if (!active) return null;

  const accept = () => {
    setPreferences({ [active.key]: true });
    bumpToggle(active.key);
    addChange(`${active.key} enabled via adaptive prompt.`, "auto");
    setActive(null);
  };

  const dismiss = () => {
    addChange("User dismissed adaptive prompt.", "info");
    setActive(null);
  };

  const dontAskAgain = () => {
    setPromptsDisabled(true);
    setPreferences({ adaptivePrompts: false });
    addChange("User disabled future adaptive prompts.", "info");
    setActive(null);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2">
      <Card className="p-4 shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">
          {active.reason}
          {layoutLocked ? " (layout locked)" : ""}
        </div>

        <div className="text-sm mb-3">{active.text}</div>

        <div className="flex gap-2">
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Dismiss
          </Button>
          <Button size="sm" variant="ghost" onClick={dontAskAgain}>
            Don’t ask again
          </Button>
        </div>
      </Card>
    </div>
  );
}