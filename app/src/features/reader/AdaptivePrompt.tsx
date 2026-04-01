import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Preferences, useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useRef, useState } from "react";

type TriggerKind = "pause" | "reread";
type TogglePrefKey = keyof Pick<
  Preferences,
  | "bionicReading"
  | "chunking"
  | "glossary"
  | "progressIndicators"
  | "encouragementNudges"
  | "distractionPrompts"
>;

type AdaptiveCandidate = {
  id: string;
  patch: Partial<Preferences>;
  text: string;
  changeSummary: string;
};

type Prompt = {
  patch: Partial<Preferences>;
  text: string;
  reason: string;
  changeSummary: string;
  autoApplied?: boolean;
  previousPreferences?: Preferences;
};

const TOGGLE_KEYS: TogglePrefKey[] = [
  "bionicReading",
  "chunking",
  "glossary",
  "progressIndicators",
  "encouragementNudges",
  "distractionPrompts",
];

function profileLabel(profile: string) {
  switch (profile) {
    case "adhd":
      return "ADHD Focus";
    case "dyslexia":
      return "Dyslexia Support";
    case "lowvision":
      return "Visual Impairment";
    default:
      return "Default";
  }
}

function patchDiffers(preferences: Preferences, patch: Partial<Preferences>) {
  return Object.entries(patch).some(([key, value]) => preferences[key as keyof Preferences] !== value);
}

function pickCandidate(
  preferences: Preferences,
  candidates: AdaptiveCandidate[],
  recentCandidateIds: string[]
) {
  const applicable = candidates.filter((candidate) => patchDiffers(preferences, candidate.patch));
  if (applicable.length === 0) return null;

  const preferred = applicable.filter((candidate) => !recentCandidateIds.includes(candidate.id));
  const pool = preferred.length > 0 ? preferred : applicable;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] ?? null;
}

function buildPromptForProfile(
  profile: string,
  trigger: TriggerKind,
  preferences: Preferences,
  recentCandidateIds: string[]
): AdaptiveCandidate | null {
  if (profile === "adhd") {
    const candidates: AdaptiveCandidate[] = trigger === "reread"
      ? [
          {
            id: "adhd-reread-chunking-on",
            patch: { chunking: true },
            text: "Turn on chunking to reduce rereading?",
            changeSummary: "enabled chunking",
          },
          {
            id: "adhd-reread-width-narrow",
            patch: { maxLineWidth: 600 },
            text: "Narrow the line width to make scanning easier?",
            changeSummary: "narrowed the line width",
          },
          {
            id: "adhd-reread-progress-on",
            patch: { progressIndicators: true },
            text: "Keep progress visible to support focus?",
            changeSummary: "enabled progress indicators",
          },
          {
            id: "adhd-reread-encouragement-on",
            patch: { encouragementNudges: true },
            text: "Turn on encouragement nudges for extra focus support?",
            changeSummary: "enabled encouragement nudges",
          },
          {
            id: "adhd-reread-distraction-on",
            patch: { distractionPrompts: true },
            text: "Turn on distraction prompts to catch rereading earlier?",
            changeSummary: "enabled distraction prompts",
          },
          {
            id: "adhd-reread-bionic-off",
            patch: { bionicReading: false },
            text: "Turn off bionic reading if the emphasis pattern is getting distracting?",
            changeSummary: "disabled bionic reading to reduce visual distraction",
          },
          {
            id: "adhd-reread-glossary-off",
            patch: { glossary: false },
            text: "Turn off glossary popups if they are interrupting your flow?",
            changeSummary: "disabled glossary popups",
          },
        ]
      : [
          {
            id: "adhd-pause-chunking-on",
            patch: { chunking: true },
            text: "Break this into shorter chunks for easier focus?",
            changeSummary: "enabled chunking",
          },
          {
            id: "adhd-pause-width-narrow",
            patch: { maxLineWidth: 620 },
            text: "Shorten the line width to reduce visual drift?",
            changeSummary: "tightened the reading width",
          },
          {
            id: "adhd-pause-progress-on",
            patch: { progressIndicators: true },
            text: "Keep progress visible while you work through this section?",
            changeSummary: "enabled progress indicators",
          },
          {
            id: "adhd-pause-encouragement-on",
            patch: { encouragementNudges: true },
            text: "Add encouragement nudges to help maintain momentum?",
            changeSummary: "enabled encouragement nudges",
          },
        ];

    return pickCandidate(preferences, candidates, recentCandidateIds);
  }

  if (profile === "dyslexia") {
    const candidates: AdaptiveCandidate[] = trigger === "reread"
      ? [
          {
            id: "dyslexia-reread-bionic-on",
            patch: { bionicReading: true },
            text: "Turn on bionic reading to strengthen word anchoring?",
            changeSummary: "enabled bionic reading",
          },
          {
            id: "dyslexia-reread-chunking-on",
            patch: { chunking: true },
            text: "Turn on chunking to reduce reading load?",
            changeSummary: "enabled chunking",
          },
          {
            id: "dyslexia-reread-glossary-on",
            patch: { glossary: true },
            text: "Turn on glossary support for unfamiliar terms?",
            changeSummary: "enabled glossary support",
          },
          {
            id: "dyslexia-reread-font-up",
            patch: { fontSize: 18 },
            text: "Increase text size for readability?",
            changeSummary: "increased font size",
          },
          {
            id: "dyslexia-reread-spacing-up",
            patch: { lineSpacing: 1.9 },
            text: "Increase line spacing to reduce crowding?",
            changeSummary: "increased line spacing",
          },
          {
            id: "dyslexia-reread-width-adjust",
            patch: { maxLineWidth: 760 },
            text: "Adjust the line width to make the passage easier to track?",
            changeSummary: "adjusted the line width for readability",
          },
          {
            id: "dyslexia-reread-progress-off",
            patch: { progressIndicators: false },
            text: "Turn off progress indicators to reduce screen clutter?",
            changeSummary: "disabled progress indicators",
          },
        ]
      : [
          {
            id: "dyslexia-pause-font-up",
            patch: { fontSize: 18 },
            text: "Increase the text size for this section?",
            changeSummary: "increased font size",
          },
          {
            id: "dyslexia-pause-spacing-up",
            patch: { lineSpacing: 1.9 },
            text: "Increase line spacing for this section?",
            changeSummary: "increased line spacing",
          },
          {
            id: "dyslexia-pause-bionic-on",
            patch: { bionicReading: true },
            text: "Turn on bionic reading for dense text?",
            changeSummary: "enabled bionic reading",
          },
          {
            id: "dyslexia-pause-glossary-on",
            patch: { glossary: true },
            text: "Turn on glossary support for this section?",
            changeSummary: "enabled glossary support",
          },
        ];

    return pickCandidate(preferences, candidates, recentCandidateIds);
  }

  if (profile === "lowvision") {
    const candidates: AdaptiveCandidate[] = trigger === "reread"
      ? [
          {
            id: "lowvision-reread-contrast-on",
            patch: { theme: "high-contrast" },
            text: "Switch to high contrast for easier tracking?",
            changeSummary: "enabled high contrast",
          },
          {
            id: "lowvision-reread-font-up",
            patch: { fontSize: 22 },
            text: "Increase text size for easier tracking?",
            changeSummary: "increased font size",
          },
          {
            id: "lowvision-reread-spacing-up",
            patch: { lineSpacing: 2.0 },
            text: "Increase line spacing to separate the text more clearly?",
            changeSummary: "increased line spacing",
          },
          {
            id: "lowvision-reread-width-down",
            patch: { maxLineWidth: 780 },
            text: "Reduce the line width to shorten eye travel?",
            changeSummary: "reduced the line width",
          },
          {
            id: "lowvision-reread-progress-on",
            patch: { progressIndicators: true },
            text: "Keep progress visible to support orientation?",
            changeSummary: "enabled progress indicators",
          },
          {
            id: "lowvision-reread-bionic-off",
            patch: { bionicReading: false },
            text: "Turn off bionic reading if the weight changes are visually noisy?",
            changeSummary: "disabled bionic reading",
          },
        ]
      : [
          {
            id: "lowvision-pause-contrast-on",
            patch: { theme: "high-contrast" },
            text: "Switch to a higher-contrast view?",
            changeSummary: "enabled high contrast",
          },
          {
            id: "lowvision-pause-font-up",
            patch: { fontSize: 22 },
            text: "Switch to larger text?",
            changeSummary: "increased font size",
          },
          {
            id: "lowvision-pause-spacing-up",
            patch: { lineSpacing: 2.0 },
            text: "Increase spacing between lines?",
            changeSummary: "increased line spacing",
          },
          {
            id: "lowvision-pause-width-down",
            patch: { maxLineWidth: 800 },
            text: "Shorten the tracking distance across each line?",
            changeSummary: "shortened the line width",
          },
        ];

    return pickCandidate(preferences, candidates, recentCandidateIds);
  }

  const defaultCandidates: AdaptiveCandidate[] = trigger === "reread"
    ? [
        {
          id: "default-reread-glossary-on",
          patch: { glossary: true },
          text: "Turn on glossary support for this section?",
          changeSummary: "enabled glossary support",
        },
        {
          id: "default-reread-spacing-up",
          patch: { lineSpacing: 1.7 },
          text: "Increase spacing slightly to make the paragraph easier to scan?",
          changeSummary: "increased line spacing slightly",
        },
        {
          id: "default-reread-chunking-on",
          patch: { chunking: true },
          text: "Turn on chunking to break the section into smaller parts?",
          changeSummary: "enabled chunking",
        },
        {
          id: "default-reread-bionic-off",
          patch: { bionicReading: false },
          text: "Turn off bionic reading if it is making the text harder to scan?",
          changeSummary: "disabled bionic reading",
        },
      ]
    : [
        {
          id: "default-pause-chunking-on",
          patch: { chunking: true },
          text: "Break this section into smaller chunks for easier reading?",
          changeSummary: "enabled chunking for a gentler reading flow",
        },
        {
          id: "default-pause-progress-on",
          patch: { progressIndicators: true },
          text: "Keep your progress visible while working through this section?",
          changeSummary: "enabled progress indicators",
        },
        {
          id: "default-pause-glossary-on",
          patch: { glossary: true },
          text: "Turn on glossary support for unfamiliar terms?",
          changeSummary: "enabled glossary support",
        },
      ];

  return pickCandidate(preferences, defaultCandidates, recentCandidateIds);
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
    userModel,
    setUserModel,
  } = useApp();

  const [active, setActive] = useState<Prompt | null>(null);
  const recentCandidateIdsRef = useRef<string[]>([]);

  // Reread prompt can re-trigger after every +2 scroll-backs.
  const lastRereadTriggerCountRef = useRef(0);
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

  useEffect(() => {
    const promptsOffForLowSupport = preferences.supportLevel === "low";

    // Reset tracking refs when prompts are disabled so re-enabling starts fresh.
    if (promptsOffForLowSupport || promptsDisabled || !preferences.adaptivePrompts) {
      lastRereadTriggerCountRef.current = 0;
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

    // Fired after every additional 2 scroll-backs.
    const rereadTriggered = session.scrollBackCount >= lastRereadTriggerCountRef.current + 2;

    if (!pauseTriggered && !rereadTriggered) return;

    // Prioritise reread
    const triggerKey = rereadTriggered ? "reread" : "pause";

    const basePrompt = buildPromptForProfile(
      userModel.selectedPreset,
      triggerKey,
      preferences,
      recentCandidateIdsRef.current
    );

    if (!basePrompt) return; // all features already enabled — nothing to suggest

    const reason =
      triggerKey === "pause"
        ? "You've been on this section a while — it might be worth adjusting the layout."
        : `You scrolled back ${session.scrollBackCount} time${session.scrollBackCount !== 1 ? "s" : ""} — possibly re-reading a tricky part.`;

    const nextPrompt: Prompt = { ...basePrompt, reason };

    const applyPreferencePatch = (patch: Partial<Preferences>) => {
      setPreferences(patch);

      for (const key of TOGGLE_KEYS) {
        if (key in patch && preferences[key] !== patch[key]) {
          bumpToggle(key);
        }
      }

      setUserModel({
        glossaryPreference: patch.glossary ?? preferences.glossary,
        bionicPreference: patch.bionicReading ?? preferences.bionicReading,
      });
    };

    const shouldAutoApply = preferences.supportLevel === "high" && !layoutLocked;
    if (shouldAutoApply) {
      const previousPreferences = { ...preferences };
      applyPreferencePatch(basePrompt.patch);

      addChange(
        `Auto-adjustment applied for ${profileLabel(userModel.selectedPreset)}: ${basePrompt.changeSummary}.`,
        "auto"
      );
      nextPrompt.reason = "Changed automatically because support intensity is high.";
      nextPrompt.text = `${basePrompt.changeSummary}.`;
      nextPrompt.autoApplied = true;
      nextPrompt.previousPreferences = previousPreferences;
    }

    if (triggerKey === "pause") {
      lastPausePromptRef.current = now;
    } else {
      lastRereadTriggerCountRef.current = session.scrollBackCount;
    }
    recentCandidateIdsRef.current = [basePrompt.id, ...recentCandidateIdsRef.current].slice(0, 2);
    lastShownAtRef.current = now;
    addChange(`Adaptive prompt shown: "${basePrompt.text}"`, "suggestion");
    setActive(nextPrompt);
  }, [
    promptsDisabled,
    preferences,
    active,
    session.readingTimeSec,
    session.longPauseCount,
    session.scrollBackCount,
    cooldownMs,
    PAUSE_REPROMPT_MS,
    addChange,
  ]);

  if (!active) return null;

  const accept = () => {
    if (active.autoApplied) {
      setActive(null);
      return;
    }

    if (layoutLocked) {
      addChange("Adaptive prompt accepted, but auto-change blocked because layout lock is enabled.", "info");
      setActive(null);
      return;
    }

    setPreferences(active.patch);
    for (const key of TOGGLE_KEYS) {
      if (key in active.patch && preferences[key] !== active.patch[key]) {
        bumpToggle(key);
      }
    }
    setUserModel({
      glossaryPreference: active.patch.glossary ?? preferences.glossary,
      bionicPreference: active.patch.bionicReading ?? preferences.bionicReading,
    });

    addChange(`Suggested adaptation applied for ${profileLabel(userModel.selectedPreset)}: ${active.changeSummary}.`, "auto");
    setActive(null);
  };

  const undoAutoApplied = () => {
    if (!active || !active.autoApplied || !active.previousPreferences) return;

    setPreferences(active.previousPreferences);
    setUserModel({
      glossaryPreference: active.previousPreferences.glossary,
      bionicPreference: active.previousPreferences.bionicReading,
    });

    addChange("Automatic adaptive change undone by user.", "info");
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
          {!active.autoApplied && (
            <Button size="sm" onClick={accept}>
              Accept
            </Button>
          )}
          {active.autoApplied && (
            <Button size="sm" onClick={undoAutoApplied}>
              Undo
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={dismiss}>
            {active.autoApplied ? "OK" : "Dismiss"}
          </Button>
          <Button size="sm" variant="ghost" onClick={dontAskAgain}>
            Don't ask again
          </Button>
        </div>
      </Card>
    </div>
  );
}
