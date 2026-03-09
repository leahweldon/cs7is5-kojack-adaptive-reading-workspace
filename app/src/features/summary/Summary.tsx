import { useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";

type Concept = { name: string; confidence: number };

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

export default function Summary() {
  const navigate = useNavigate();
  const { userName, session, changeLog, preferences, documentText, userModel } = useApp();

  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [adaptationLogExpanded, setAdaptationLogExpanded] = useState(false);

  useEffect(() => {
    if (!session.startTime || !documentText || documentText.trim().length === 0) {
      navigate("/documents");
    }
  }, [session.startTime, documentText, navigate]);

  const enabledFeatures = useMemo(() => {
    const items: string[] = [];
    if (preferences.bionicReading) items.push("Bionic");
    if (preferences.chunking) items.push("Chunking");
    if (preferences.glossary) items.push("Glossary");
    if (preferences.adaptivePrompts) items.push("Prompts");
    if (preferences.progressIndicators) items.push("Progress");
    return items;
  }, [
    preferences.bionicReading,
    preferences.chunking,
    preferences.glossary,
    preferences.adaptivePrompts,
    preferences.progressIndicators,
  ]);

  const adjustments = useMemo(() => {
    const toggles = Object.values(session.toggleUsage).reduce((a, b) => a + b, 0);
    return toggles + session.scrollBackCount + session.longPauseCount;
  }, [session.toggleUsage, session.scrollBackCount, session.longPauseCount]);

  const modelChanges = useMemo(() => {
    return userModel.detectedDifficultySections.length;
  }, [userModel.detectedDifficultySections.length]);

  const concepts: Concept[] = useMemo(() => {
    return [
      { name: "Key terms", confidence: 85 },
      { name: "Main idea", confidence: 70 },
      { name: "Supporting details", confidence: 55 },
      { name: "Examples", confidence: 60 },
      { name: "Definitions", confidence: 45 },
      { name: "Implications", confidence: 35 },
    ];
  }, []);

  const exportLog = () => {
    const lines: string[] = [];
    lines.push("Clarity Layer — Scrutability Log Export");
    lines.push(`User: ${userName || "Unknown"}`);
    lines.push(`Session mode: ${session.sessionMode}`);
    lines.push(`Reading goal: ${preferences.readingGoal}`);
    lines.push(`Support level: ${preferences.supportLevel}`);
    lines.push(`Time: ${formatTime(session.readingTimeSec)}`);
    lines.push(`Scroll-backs: ${session.scrollBackCount}`);
    lines.push(`Long pauses: ${session.longPauseCount}`);
    lines.push(`Enabled features: ${enabledFeatures.length ? enabledFeatures.join(", ") : "None"}`);
    lines.push("");
    lines.push("Log entries (newest first):");
    lines.push("----------------------------------------");

    if (changeLog.length === 0) {
      lines.push("(No entries)");
    } else {
      for (const e of changeLog) {
        lines.push(`[${e.type}] ${e.timestamp.toLocaleTimeString()} — ${e.message}`);
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `clarity-layer-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Brand header */}
        <div className="flex justify-center pt-2">
          <img src="/logo.png" alt="Clarity Layer" className="h-12 w-auto object-contain" />
        </div>

        <div className="text-center space-y-2">
          <Badge variant="secondary">Finish session</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Session summary</h1>
          <p className="text-sm text-muted-foreground">
            A recap of the session, the changes made, and what the system inferred.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 text-center space-y-1">
            <div className="text-sm font-semibold">{formatTime(session.readingTimeSec)}</div>
            <div className="text-xs text-muted-foreground">Reading time</div>
          </Card>

          <Card className="p-5 text-center space-y-1">
            <div className="text-sm font-semibold">{adjustments}</div>
            <div className="text-xs text-muted-foreground">Adjustments</div>
          </Card>

          <Card className="p-5 text-center space-y-1">
            <div className="text-sm font-semibold">{modelChanges}</div>
            <div className="text-xs text-muted-foreground">Model changes</div>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Concept confidence (simulated)</div>
              <div className="text-xs text-muted-foreground">
                Shown here to support reflection in the proof-of-concept demo.
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={exportLog}>
              Export log
            </Button>
          </div>

          <div className="space-y-3">
            {concepts.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.confidence}%</span>
                </div>
                <Progress value={c.confidence} />
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            Enabled features: {enabledFeatures.length ? enabledFeatures.join(", ") : "None"}
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          {/* Clickable header toggles the log open/closed */}
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setAdaptationLogExpanded((prev) => !prev)}
            aria-expanded={adaptationLogExpanded}
          >
            <div className="text-sm font-medium">Recent adaptation log</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{changeLog.length} {changeLog.length === 1 ? "entry" : "entries"}</span>
              {adaptationLogExpanded
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </div>
          </button>

          {!adaptationLogExpanded && (
            <div className="text-xs text-muted-foreground">
              {changeLog.length === 0
                ? "No changes recorded."
                : "Click above to expand and view the full adaptation history."}
            </div>
          )}

          {adaptationLogExpanded && (
            <>
              {changeLog.length === 0 ? (
                <div className="text-sm text-muted-foreground">No changes recorded.</div>
              ) : (
                <div className="space-y-2">
                  {changeLog.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 rounded-xl border px-4 py-3">
                      <Badge variant={
                        e.type === "auto" ? "default" : e.type === "suggestion" ? "secondary" : "outline"
                      } className="text-xs shrink-0">
                        {e.type}
                      </Badge>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm">{e.message}</div>
                        {(e.triggerReason || e.triggerSection) && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {e.triggerReason && <div><span className="font-medium">Trigger:</span> {e.triggerReason}</div>}
                            {e.triggerSection && <div><span className="font-medium">Location:</span> {e.triggerSection}</div>}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {e.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <div className="text-sm font-medium">Was this helpful?</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant={feedback === "yes" ? "default" : "outline"}
              onClick={() => setFeedback("yes")}
            >
              Yes
            </Button>
            <Button
              variant={feedback === "no" ? "default" : "outline"}
              onClick={() => setFeedback("no")}
            >
              Not really
            </Button>
          </div>

          {feedback && (
            <div className="text-sm text-muted-foreground">
              Thanks — feedback recorded for this demo session.
            </div>
          )}
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/reader")}>
            Back to reading
          </Button>
          <Button variant="outline" onClick={() => navigate("/documents")}>
            Documents
          </Button>
          <Button onClick={() => navigate("/")}>New session</Button>
        </div>
      </div>
    </div>
  );
}