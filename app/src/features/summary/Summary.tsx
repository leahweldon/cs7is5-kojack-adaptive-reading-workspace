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
  const { userName, session, changeLog, preferences, documentText, userModel, addChange } = useApp();

  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [feedbackDetail, setFeedbackDetail] = useState("");

  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
      { name: "Key terms identified", confidence: 85 },
      { name: "Main idea", confidence: 70 },
      { name: "Supporting details", confidence: 55 },
      { name: "Examples recalled", confidence: 60 },
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

  const handleSubmitFeedback = () => {
    const msg = `User feedback (${feedback ?? "none"}): ${feedbackDetail.trim()}`;
    addChange(msg, "suggestion");
    setFeedbackDetail("");
    setFeedbackSubmitted(true);
    // optionally collapse or clear feedback selection:
    // setFeedback(null);
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
            className={`w-full flex items-center justify-between text-left ${
              changeLog.length > 1 ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (changeLog.length > 1) setIsExpanded((prev) => !prev);
            }}
            aria-expanded={isExpanded}
          >
            <div className="text-sm font-medium">Recent adaptation log</div>
            {changeLog.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Show all</span>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4" />
                  : <ChevronDown className="h-4 w-4" />
                }
              </div>
            )}
          </button>

          {/* Always show the latest entry or placeholder */}
          {changeLog.length === 0 ? (
            <div className="text-sm text-muted-foreground">No changes recorded.</div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border px-4 py-3">
              <Badge variant="secondary" className="text-xs">
                {changeLog[0]?.type || "info"}
              </Badge>
              <div className="text-sm">{changeLog[0]?.message || ""}</div>
            </div>
          )}

          {/* Expanded panel showing remaining entries (skip the first one) */}
          {isExpanded && changeLog.length > 1 && (
            <div className="space-y-2 border-t pt-3">
              {changeLog.slice(1).map((e) => (
                <div key={e?.id} className="flex items-start gap-3 rounded-xl border px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {e?.type || "info"}
                  </Badge>
                  <div className="text-sm">{e?.message || ""}</div>
                </div>
              ))}
            </div>
          )}
        </Card>



        <Card className="p-6 space-y-3">
          <div className="text-sm font-medium">Was this helpful?</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant={feedback === "yes" ? "default" : "outline"}
              onClick={() => setFeedback("yes")}
              disabled={feedbackSubmitted}
            >
              Yes
            </Button>
            <Button
              variant={feedback === "no" ? "default" : "outline"}
              onClick={() => setFeedback("no")}
              disabled={feedbackSubmitted}
            >
              Not really
            </Button>
          </div>

          {feedback && !feedbackSubmitted && (
            <>
              {/* small text field shown once the user clicks yes/no */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  placeholder="Additional comments (optional)"
                  value={feedbackDetail}
                  onChange={(e) => setFeedbackDetail(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90"
                  onClick={handleSubmitFeedback}
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {feedbackSubmitted && (
            <div className="text-sm text-muted-foreground mt-1">
              Thanks — feedback submitted.
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