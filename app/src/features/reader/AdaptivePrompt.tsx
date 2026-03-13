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

// (Trigger-specific feature suggestions)
// 1. Adaptive Prompt for long pauses: Chunking is the best first suggestion
function bestPromptForPause(preferences: Preferences): Omit<Prompt, "reason"> | null {
  if (!preferences.chunking)
    return { key: "chunking", text: "Break this section into smaller chunks for easier reading?" };
  if (!preferences.bionicReading)
    return { key: "bionicReading", text: "Enable bionic reading to help anchor focus on dense text?" };
  if (!preferences.glossary)
    return { key: "glossary", text: "Turn on the glossary to surface definitions inline?" };
  return null; // all relevant features already enabled — nothing to suggest
}

// 2. Adaptive Prompt for repeated scroll-backs: Glossary is the best first suggestion
function bestPromptForReread(preferences: Preferences): Omit<Prompt, "reason"> | null {
  if (!preferences.glossary)
    return { key: "glossary", text: "Turn on the glossary — unfamiliar terms may be causing re-reads?" };
  if (!preferences.chunking)
    return { key: "chunking", text: "Enable chunking to make passages easier to follow on re-reads?" };
  if (!preferences.bionicReading)
    return { key: "bionicReading", text: "Enable bionic reading to help your eyes track the text?" };
  return null;
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
  } = useApp();

  const [active, setActive] = useState<Prompt | null>(null);

  // Reread prompt shows once per session.
  const rereadShownRef = useRef(false);
  // Pause prompt re-triggers after 5 minutes
  const lastPausePromptRef = useRef<number | null>(null);
  const PAUSE_REPROMPT_MS = 5 * 60 * 1000;

  // Minimum gap between any two consecutive prompts
  const cooldownMs = useMemo(() => {
    if (preferences.supportLevel === "low") return 25000;
    if (preferences.supportLevel === "high") return 8000;
    return 15000;
  }, [preferences.supportLevel]);

  const lastShownAtRef = useRef<number | null>(null);
  // Stable ref so addChange never causes the effect to re-run
  const addChangeRef = useRef(addChange);
  useEffect(() => {
    addChangeRef.current = addChange;
  });

  useEffect(() => {
    // Reset tracking refs when prompts are disabled so re-enabling starts fresh.
    if (promptsDisabled || !preferences.adaptivePrompts) {
      rereadShownRef.current = false;
      lastPausePromptRef.current = null;
      lastShownAtRef.current = null;
      return;
    }

    if (active) return;
    if (session.readingTimeSec < 30) return; // wait 30s before showing anything

    const now = Date.now();
    if (lastShownAtRef.current && now - lastShownAtRef.current < cooldownMs) return;

    // Fired by ContentPane after 3 min of inactivity; re-triggers every 5 min while still idle.
    const pauseTriggered =
      session.longPauseCount >= 1 &&
      (lastPausePromptRef.current === null || now - lastPausePromptRef.current >= PAUSE_REPROMPT_MS);

    // Fired after 2 scroll-backs - once per session (can increase num scroll backs / amount per session)
    const rereadTriggered = session.scrollBackCount >= 2 && !rereadShownRef.current;

    if (!pauseTriggered && !rereadTriggered) return;

    // Prioritise reread
    const triggerKey = rereadTriggered ? "reread" : "pause";

    const basePrompt =
      triggerKey === "pause"
        ? bestPromptForPause(preferences)
        : bestPromptForReread(preferences);

    if (!basePrompt) return; // all features already enabled — nothing to suggest

    const reason =
      triggerKey === "pause"
        ? "You've been on this section a while — it might be worth adjusting the layout."
        : `You scrolled back ${session.scrollBackCount} time${session.scrollBackCount !== 1 ? "s" : ""} — possibly re-reading a tricky part.`;

    const nextPrompt = { ...basePrompt, reason };
    if (triggerKey === "pause") lastPausePromptRef.current = now;
    else rereadShownRef.current = true;
    lastShownAtRef.current = now;
    setActive(nextPrompt);
    addChange(`Adaptive prompt shown: "${basePrompt.text}"`, "suggestion");


  }, [
    promptsDisabled,
    preferences,
    active,
    session.readingTimeSec,
    session.longPauseCount,
    session.scrollBackCount,
    cooldownMs,
    PAUSE_REPROMPT_MS,
  ]);

  if (!active) return null;

  const accept = () => {
    setPreferences({ [active.key]: true });
    bumpToggle(active.key);

    // Keep userModel in sync so 'Your Model' panel reflects the change.
    if (active.key === "glossary") setUserModel({ glossaryPreference: true });
    if (active.key === "bionicReading") setUserModel({ bionicPreference: true });

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
            Don't ask again
          </Button>
        </div>
      </Card>
    </div>
  );
}
