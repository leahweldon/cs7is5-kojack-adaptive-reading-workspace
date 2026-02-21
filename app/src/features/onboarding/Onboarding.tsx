import { Preferences, ReadingGoal, SupportLevel, useApp } from "@/shared/state/AppContext";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Step = 1 | 2;

type Preset = {
  id: "default" | "adhd" | "dyslexia" | "lowvision";
  title: string;
  desc: string;
  patch: Partial<Preferences>;
};

const PRESETS: Preset[] = [
  {
    id: "default",
    title: "Default",
    desc: "Standard configuration",
    patch: {
      readingGoal: "understand",
      supportLevel: "medium",
      bionicReading: false,
      chunking: false,
      glossary: true,
      adaptivePrompts: true,
      progressIndicators: true,
      promptFrequency: "medium",
      fontSize: 16,
      lineSpacing: 1.6,
      maxLineWidth: 720,
      theme: "light",
    },
  },
  {
    id: "adhd",
    title: "ADHD-friendly",
    desc: "Chunking on, prompts on, shorter line width",
    patch: {
      supportLevel: "high",
      chunking: true,
      adaptivePrompts: true,
      promptFrequency: "high",
      maxLineWidth: 620,
      progressIndicators: true,
    },
  },
  {
    id: "dyslexia",
    title: "Dyslexia-friendly",
    desc: "Larger text, wider spacing, bionic reading",
    patch: {
      supportLevel: "high",
      bionicReading: true,
      fontSize: 18,
      lineSpacing: 1.9,
      maxLineWidth: 760,
      glossary: true,
    },
  },
  {
    id: "lowvision",
    title: "Low Vision",
    desc: "High contrast, large font, wide spacing",
    patch: {
      theme: "high-contrast",
      supportLevel: "high",
      fontSize: 22,
      lineSpacing: 2.0,
      maxLineWidth: 900,
      glossary: true,
      progressIndicators: true,
    },
  },
];

const PREVIEW_TEXT = `Reading preview: the quick brown fox jumps over the lazy dog.

Tap glossary terms like AI or VWFA in the workspace.`;

function applyBionicPreview(word: string) {
  const boldLen = Math.max(1, Math.ceil(word.length * 0.4));
  return (
    <span>
      <span className="bionic-bold">{word.slice(0, boldLen)}</span>
      {word.slice(boldLen)}
    </span>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { userName, setUserName, preferences, setPreferences, resetSession } = useApp();

  const [step, setStep] = useState<Step>(1);
  const [nameDraft, setNameDraft] = useState(userName);
  const [selectedPreset, setSelectedPreset] = useState<Preset["id"] | null>(null);

  const canContinue = useMemo(() => nameDraft.trim().length > 0, [nameDraft]);

  const goToStep2 = () => {
    if (!canContinue) return;
    setUserName(nameDraft.trim());
    setStep(2);
  };

  const finishSetup = () => {
    resetSession();
    navigate("/documents");
  };

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setPreferences(preset.patch);
  };

  const previewContent = useMemo(() => {
    if (!preferences.bionicReading) return PREVIEW_TEXT;

    const parts = PREVIEW_TEXT.split(/(\s+)/);
    return parts.map((p, i) => {
      if (/^\s+$/.test(p)) return <span key={i}>{p}</span>;
      return <span key={i}>{applyBionicPreview(p)}</span>;
    });
  }, [preferences.bionicReading]);

  // Light chunking preview
  const previewBlocks = useMemo(() => {
    if (!preferences.chunking) return [previewContent];
    return [
      <span key="a">{previewContent}</span>,
      <span key="b">{/* intentional empty second block for spacing */}</span>,
    ];
  }, [preferences.chunking, previewContent]);

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex justify-center pt-2">
          <img src="/logo.png" alt="Clarity Layer" className="h-16 w-auto object-contain" />
        </div>

        <div className="text-center space-y-2">
          <Badge variant="secondary">Personalise your experience</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-muted-foreground">
            Configure your workspace for focus comfort and control.
          </p>
        </div>

        {step === 1 ? (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-medium">Step 1 Start a session</h2>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Your name</label>
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Enter your name"
                onKeyDown={(e) => e.key === "Enter" && goToStep2()}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={goToStep2} disabled={!canContinue}>
                Continue
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              No account required. This is a proof of concept demo.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Presets */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-medium">Set your preferences</h2>
                <p className="text-sm text-muted-foreground">
                  These can be changed at any time from the reading workspace.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Start from a profile</div>
                <p className="text-sm text-muted-foreground">
                  Pick a preset to initialise sensible defaults. Everything stays fully editable.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-left rounded-xl border px-4 py-4 transition ${
                      selectedPreset === p.id
                        ? "border-primary bg-accent"
                        : "hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Live preview */}
            <Card className="p-6 space-y-3">
              <div className="text-sm font-medium">Preview</div>
              <div
                className="rounded-xl border bg-card px-5 py-4"
                style={{
                  fontSize: `${preferences.fontSize}px`,
                  lineHeight: preferences.lineSpacing,
                  maxWidth: `${Math.min(preferences.maxLineWidth, 860)}px`,
                  margin: "0 auto",
                }}
              >
                {preferences.chunking ? (
                  <div className="space-y-3">
                    <div className="chunk-highlight">{previewBlocks[0]}</div>
                    <div className="chunk-highlight">{previewBlocks[0]}</div>
                  </div>
                ) : (
                  <div>{previewContent}</div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                This preview updates as you change settings.
              </div>
            </Card>

            {/* Reading goal */}
            <Card className="p-6 space-y-4">
              <div className="text-sm font-medium">Reading goal</div>
              <Tabs
                value={preferences.readingGoal}
                onValueChange={(v) => setPreferences({ readingGoal: v as ReadingGoal })}
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="skim">Skim</TabsTrigger>
                  <TabsTrigger value="understand">Understand</TabsTrigger>
                  <TabsTrigger value="study">Study</TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            {/* Support level */}
            <Card className="p-6 space-y-4">
              <div className="text-sm font-medium">Support level</div>
              <Tabs
                value={preferences.supportLevel}
                onValueChange={(v) => setPreferences({ supportLevel: v as SupportLevel })}
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="low">Low</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            {/* Features */}
            <Card className="p-6 space-y-3">
              <div className="text-sm font-medium">Features</div>

              <ToggleRow label="Bionic reading" value={preferences.bionicReading} onChange={(v) => setPreferences({ bionicReading: v })} />
              <ToggleRow label="Chunking" value={preferences.chunking} onChange={(v) => setPreferences({ chunking: v })} />
              <ToggleRow label="Glossary" value={preferences.glossary} onChange={(v) => setPreferences({ glossary: v })} />
              <ToggleRow label="Adaptive prompts" value={preferences.adaptivePrompts} onChange={(v) => setPreferences({ adaptivePrompts: v })} />
              <ToggleRow label="Progress indicators" value={preferences.progressIndicators} onChange={(v) => setPreferences({ progressIndicators: v })} />
            </Card>

            {/* Accessibility */}
            <Card className="p-6 space-y-5">
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
                min={400}
                max={1000}
                step={20}
                format={(v) => `${v}px`}
                onChange={(v) => setPreferences({ maxLineWidth: v })}
              />

              <div className="flex justify-end pt-2">
                <Button onClick={finishSetup}>Continue to documents</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
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
    <div className="space-y-2 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}