import {
  Preferences,
  SessionMode,
  SupportLevel,
  ThemeMode,
  useApp,
} from "@/shared/state/AppContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FileQuestion, Settings, User } from "lucide-react";

type PrefToggleKey = keyof Pick<
  Preferences,
  | "bionicReading"
  | "chunking"
  | "glossary"
  | "adaptivePrompts"
  | "progressIndicators"
  | "encouragementNudges"
  | "distractionPrompts"
>;

export default function SidePanel() {
  const {
    preferences,
    setPreferences,
    userModel,
    setUserModel,
    changeLog,
    addChange,
    bumpToggle,
    layoutLocked,
    setLayoutLocked,
    promptsDisabled,
    setPromptsDisabled,
    session,
    setSession,
  } = useApp();

  const supportMap: Record<SupportLevel, number> = { low: 1, medium: 2, high: 3 };
  const reverseSupportMap: Record<number, SupportLevel> = { 1: "low", 2: "medium", 3: "high" };

  const toggle = (key: PrefToggleKey, value: boolean) => {
    setPreferences({ [key]: value });
    bumpToggle(key);
    addChange(`${key} ${value ? "enabled" : "disabled"} by user.`, "info");

    // keep visible model in sync for scrutability (not "truth", just current state)
    if (key === "bionicReading") setUserModel({ bionicPreference: value });
    if (key === "glossary") setUserModel({ glossaryPreference: value });
  };

  const setMode = (mode: SessionMode) => {
    setSession((prev) => ({ ...prev, sessionMode: mode }));
    addChange(`Session mode set to ${mode}.`, "info");

    // simple mapping to keep demo behaviour predictable
    if (mode === "skim") setPreferences({ supportLevel: "low" });
    if (mode === "study") setPreferences({ supportLevel: "high" });
    if (mode === "revise") setPreferences({ supportLevel: "medium" });
  };

  const clearDifficulty = () => {
    if (userModel.detectedDifficultySections.length === 0) return;
    setUserModel({ detectedDifficultySections: [] });
    addChange("Cleared detected difficulty sections.", "info");
  };

  return (
    <div className="h-full bg-background">
      <Tabs defaultValue="controls" className="h-full flex flex-col">
        <TabsList className="mx-3 mb-3 grid grid-cols-3 rounded-xl bg-muted p-1">
          <TabsTrigger value="model" className="gap-1.5 text-xs">
            <User className="h-3.5 w-3.5" />
            Your Model
          </TabsTrigger>
          <TabsTrigger value="why" className="gap-1.5 text-xs">
            <FileQuestion className="h-3.5 w-3.5" />
            Why
          </TabsTrigger>
          <TabsTrigger value="controls" className="gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Controls
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {/* MODEL */}
          <TabsContent value="model" className="mt-0 space-y-3">
            <Card className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium">User model</div>
                <div className="text-xs text-muted-foreground">
                  This is what the system believes right now. You can override anything.
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <Row label="Support level" value={userModel.supportLevel} />
                <Row label="Glossary preference" value={String(userModel.glossaryPreference)} />
                <Row label="Bionic preference" value={String(userModel.bionicPreference)} />
                <Row label="Session mode" value={session.sessionMode} />
              </div>

              <div className="pt-1">
                <div className="text-xs text-muted-foreground mb-2">Detected difficulty</div>

                <div className="flex flex-wrap gap-1.5">
                  {userModel.detectedDifficultySections.length === 0 ? (
                    <span className="text-xs text-muted-foreground">None yet</span>
                  ) : (
                    userModel.detectedDifficultySections.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <Button size="sm" variant="outline" onClick={clearDifficulty}>
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* WHY */}
          <TabsContent value="why" className="mt-0 space-y-3">
            <Card className="p-4 space-y-3">
              <div>
                <div className="text-sm font-medium">Why this changed</div>
                <div className="text-xs text-muted-foreground">
                  A plain-language record of triggers, suggestions, and your actions.
                </div>
              </div>

              {changeLog.length === 0 ? (
                <div className="text-sm text-muted-foreground">No changes yet.</div>
              ) : (
                <div className="space-y-2">
                  {changeLog   .filter((e, index, arr) => {     if (e.type === "auto" || e.type === "suggestion") return true;     if (e.message.startsWith("Scroll-back detected")) {       const prevSameIndex = arr.findIndex(         (prev, i) => i > index && prev.message.startsWith("Scroll-back detected")       );       return prevSameIndex === -1;     }     return true;   })   .slice(0, 14)   .map((e) => (
                    <div key={e.id} className="rounded-xl border px-3 py-2">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={
                            e.type === "auto"
                              ? "default"
                              : e.type === "suggestion"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] mt-0.5"
                        >
                          {e.type}
                        </Badge>
                        <div className="text-xs leading-relaxed">{e.message}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {e.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* CONTROLS */}
          <TabsContent value="controls" className="mt-0 space-y-3">
            <Card className="p-4 space-y-5">
              <div className="text-sm font-medium">Session</div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Session mode</div>
                <Tabs value={session.sessionMode} onValueChange={(v) => setMode(v as SessionMode)}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="study" className="text-xs">Study</TabsTrigger>
                    <TabsTrigger value="revise" className="text-xs">Revise</TabsTrigger>
                    <TabsTrigger value="skim" className="text-xs">Skim</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Support intensity</span>
                  <span>{preferences.supportLevel}</span>
                </div>
                <Slider
                  value={[supportMap[preferences.supportLevel]]}
                  min={1}
                  max={3}
                  step={1}
                  onValueChange={([v]) => {
                    const level = reverseSupportMap[v];
                    setPreferences({ supportLevel: level });
                    setUserModel({ supportLevel: level });
                    addChange(`Support level set to ${level}.`, "info");
                  }}
                />
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="text-sm font-medium">Features</div>

              <ToggleRow label="Bionic reading" checked={preferences.bionicReading} onChange={(v) => toggle("bionicReading", v)} />
              <ToggleRow label="Chunking" checked={preferences.chunking} onChange={(v) => toggle("chunking", v)} />
              <ToggleRow label="Glossary" checked={preferences.glossary} onChange={(v) => toggle("glossary", v)} />
              <ToggleRow label="Progress indicator" checked={preferences.progressIndicators} onChange={(v) => toggle("progressIndicators", v)} />

              <ToggleRow
                label="Adaptive prompts"
                checked={preferences.adaptivePrompts && !promptsDisabled}
                onChange={(v) => {
                  setPreferences({ adaptivePrompts: v });
                  setPromptsDisabled(!v);
                  addChange(`Adaptive prompts ${v ? "enabled" : "disabled"} by user.`, "info");
                }}
              />
            </Card>

            {/* Nudges section */}
            <Card className="p-4 space-y-3">
              <div className="text-sm font-medium">Nudges</div>

              <ToggleRow
                label="Encouragement nudges"
                checked={preferences.encouragementNudges}
                onChange={(v) => toggle("encouragementNudges", v)}
              />

              <ToggleRow
                label="Distraction prompts"
                checked={preferences.distractionPrompts}
                onChange={(v) => toggle("distractionPrompts", v)}
              />

              <div className="text-xs text-muted-foreground">
                These are optional and non-invasive. You can turn them off any time.
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="text-sm font-medium">Accessibility</div>

              <SliderRow
                label="Font size"
                value={preferences.fontSize}
                min={12}
                max={28}
                step={1}
                format={(v) => `${v}px`}
                onChange={(v) => setPreferences({ fontSize: v })}
              />

              <SliderRow
                label="Line spacing"
                value={Math.round(preferences.lineSpacing * 10)}
                min={12}
                max={24}
                step={1}
                format={(v) => (v / 10).toFixed(1)}
                onChange={(v) => setPreferences({ lineSpacing: v / 10 })}
              />

              <SliderRow
                label="Max line width"
                value={preferences.maxLineWidth}
                min={420}
                max={980}
                step={20}
                format={(v) => `${v}px`}
                onChange={(v) => setPreferences({ maxLineWidth: v })}
              />

              <div className="space-y-3 rounded-xl border px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {preferences.theme === "high-contrast"
                      ? "High contrast"
                      : preferences.theme}
                  </span>
                </div>
                <Tabs
                  value={preferences.theme}
                  onValueChange={(v) => {
                    const theme = v as ThemeMode;
                    setPreferences({ theme });
                    addChange(`Theme changed to ${theme}.`, "info");
                  }}
                >
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="light" className="text-xs">Light</TabsTrigger>
                    <TabsTrigger value="dark" className="text-xs">Dark</TabsTrigger>
                    <TabsTrigger value="high-contrast" className="text-xs">
                      Contrast
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="text-sm font-medium">Stability</div>

              <ToggleRow
                label="Lock layout"
                checked={layoutLocked}
                onChange={(v) => {
                  setLayoutLocked(v);
                  addChange(`Layout lock ${v ? "enabled" : "disabled"} by user.`, "info");
                }}
              />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
