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

/**
 * Returns a short human-readable label describing roughly where in the document
 * the reader currently is, based on scroll progress percentage.
 */
function estimateSectionLabel(progressPct: number): string {
  if (progressPct < 15) return "Introduction (0–15%)";
  if (progressPct < 35) return `Early section (~${Math.round(progressPct)}%)`;
  if (progressPct < 65) return `Middle section (~${Math.round(progressPct)}%)`;
  if (progressPct < 85) return `Later section (~${Math.round(progressPct)}%)`;
  return `Near end (~${Math.round(progressPct)}%)`;
}

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
    setUserModel,
    userModel,
  } = useApp();

  const [active, setActive] = useState<Prompt | null>(null);

  // To prevent spamming we only show at most once per session unless user re-enables prompts
  const shownOnceRef = useRef(false);

  const eligiblePrompt = useMemo(() => {
    if (!preferences.chunking) {
      return {
        key: "chunking" as const,
        text: "Try chunking to make this section easier to follow?",
      };
    }
    if (!preferences.bionicReading) {
      return {
        key: "bionicReading" as const,
        text: "Enable bionic reading for easier scanning?",
      };
    }
    if (!preferences.glossary) {
      return {
        key: "glossary" as const,
        text: "Turn on glossary support for tricky terms?",
      };
    }
    return null;
  }, [preferences.chunking, preferences.bionicReading, preferences.glossary]);

  // Cooldown is derived from support level
  const cooldownMs = useMemo(() => {
    if (preferences.supportLevel === "low") return 25000;
    if (preferences.supportLevel === "high") return 8000;
    return 15000;
  }, [preferences.supportLevel]);

  const lastShownAtRef = useRef<number | null>(null);

  useEffect(() => {
    // If prompts are disabled, reset shownOnce so re-enabling works
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

      // Log the suggestion to the Why tab, including what triggered it
      addChange(
        `Adaptive prompt shown: "${eligiblePrompt.text}"`,
        "suggestion",
        { triggerReason: reason }
      );
    }, 0);

    return () => window.clearTimeout(t);
  }, [
    promptsDisabled,
    preferences.adaptivePrompts,
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

    // Determine where in the document the difficulty occurred
    const sectionLabel = estimateSectionLabel(session.progressPct);

    // 1) Log the accepted adaptive change to the Why tab with full context
    addChange(
      `${active.key} enabled via adaptive prompt. Trigger: ${active.reason} Location: ${sectionLabel}.`,
      "auto",
      { triggerReason: active.reason, triggerSection: sectionLabel }
    );

    // 2) Update the user model — add the section to Detected Difficulty Sections
    //    so it shows up in the "Your Model" tab
    const alreadyLogged = userModel.detectedDifficultySections.includes(sectionLabel);
    if (!alreadyLogged) {
      setUserModel({
        detectedDifficultySections: [
          ...userModel.detectedDifficultySections,
          sectionLabel,
        ],
      });
    }

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
            Don't ask again
          </Button>
        </div>
      </Card>
    </div>
  );
}
