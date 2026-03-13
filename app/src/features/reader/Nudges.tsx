import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/shared/state/AppContext";
import { Focus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type NudgeKind = "encouragement" | "distraction";

type Nudge = {
  kind: NudgeKind;
  title: string;
  message: string;
  reason: string;
};

export default function Nudges() {
  const { preferences, session, addChange, setPreferences, bumpToggle } = useApp();

  const [active, setActive] = useState<Nudge | null>(null);

  const lastShownAtRef = useRef<number | null>(null);
  const encouragementShownRef = useRef(false);

  // promptFrequency removed — cooldown is now derived from support level (simple + scrutable)
  const cooldownMs = useMemo(() => {
    if (preferences.supportLevel === "low") return 30000;
    if (preferences.supportLevel === "high") return 10000;
    return 18000;
  }, [preferences.supportLevel]);

  // Encouragement nudge: after 60 seconds of reading time (once per session)
  useEffect(() => {
    if (!preferences.encouragementNudges) return;
    if (active) return;

    if (encouragementShownRef.current) return;
    if (session.readingTimeSec < 60) return;

    const now = Date.now();
    if (lastShownAtRef.current && now - lastShownAtRef.current < cooldownMs) return;

    const n: Nudge = {
      kind: "encouragement",
      title: "Nice pace",
      message: "You're making good progress — keep it up!",
      reason: "You've been reading steadily for about a minute.",
    };

    const t = window.setTimeout(() => {
      setActive(n);
      encouragementShownRef.current = true;
      lastShownAtRef.current = Date.now();
      addChange(`Encouragement nudge shown: "${n.message}"`, "suggestion");
      // Auto-dismiss after 7 seconds
      window.setTimeout(() => setActive((cur) => cur?.kind === "encouragement" ? null : cur), 7000);
    }, 0);

    return () => window.clearTimeout(t);
  }, [preferences.encouragementNudges, session.readingTimeSec, active, cooldownMs, addChange]);

  // Distraction prompt: heuristic
  useEffect(() => {
    if (!preferences.distractionPrompts) return;
    if (active) return;

    const triggered = session.scrollBackCount >= 3 && session.longPauseCount >= 1;
    if (!triggered) return;

    const now = Date.now();
    if (lastShownAtRef.current && now - lastShownAtRef.current < cooldownMs) return;

    const n: Nudge = {
      kind: "distraction",
      title: "Want a reset?",
      message: "Try a more guided layout to reduce rereading.",
      reason: "You've scrolled back through this section several times.",
    };

    const t = window.setTimeout(() => {
      setActive(n);
      lastShownAtRef.current = Date.now();
      addChange(`Distraction prompt shown: "${n.message}"`, "suggestion");
    }, 0);

    return () => window.clearTimeout(t);
  }, [
    preferences.distractionPrompts,
    session.scrollBackCount,
    session.longPauseCount,
    active,
    cooldownMs,
    addChange,
  ]);

  if (!active) return null;

  const dismiss = () => {
    addChange("User dismissed nudge.", "info");
    setActive(null);
  };

  const enableChunking = () => {
    if (!preferences.chunking) {
      setPreferences({ chunking: true });
      bumpToggle("chunking");
      addChange("Chunking enabled from nudge.", "auto");
    }
    setActive(null);
  };

  const enableBionic = () => {
    if (!preferences.bionicReading) {
      setPreferences({ bionicReading: true });
      bumpToggle("bionicReading");
      addChange("Bionic reading enabled from nudge.", "auto");
    }
    setActive(null);
  };

  const Icon = active.kind === "encouragement" ? Sparkles : Focus;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-in fade-in-0 slide-in-from-top-2">
      <Card className="p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">{active.reason}</div>
              <div className="text-sm font-medium">{active.title}</div>
            </div>

            <div className="text-sm text-muted-foreground">{active.message}</div>

            {active.kind === "distraction" && (
              <div className="flex gap-2 flex-wrap pt-1">
                {!preferences.chunking && (
                  <Button size="sm" onClick={enableChunking}>
                    Enable chunking
                  </Button>
                )}
                {!preferences.bionicReading && (
                  <Button size="sm" variant="outline" onClick={enableBionic}>
                    Enable bionic
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}