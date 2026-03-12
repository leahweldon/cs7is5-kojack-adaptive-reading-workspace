import { Preferences, ReadingGoal, ThemeMode, useApp } from "@/shared/state/AppContext";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Personas from "../personas/Personas";
import { ChevronDown, ChevronUp } from "lucide-react";

type Step = 1 | 2;
type Preset = {
  id: "default" | "adhd" | "dyslexia" | "lowvision";
  title: string;
  desc: string;
  patch: Partial<Preferences>;
  image: string;
};

const PRESETS: Preset[] = [
  {
    id: "default",
    title: "Default",
    desc: "Standard settings for general use.",
    image: "/images/persona1 .png", // Updated path
    patch: {
      readingGoal: "understand",
      supportLevel: "medium",
      bionicReading: false,
      chunking: false,
      glossary: true,
      adaptivePrompts: true,
      progressIndicators: true,
      fontSize: 16,
      lineSpacing: 1.6,
      maxLineWidth: 720,
      theme: "light",
    },
  },
  {
    id: "adhd",
    title: "ADHD Focus",
    desc: "Short chunks and prompts to maintain attention.",
    image: "/images/persona2.png", // Updated path
    patch: {
      supportLevel: "high",
      chunking: true,
      adaptivePrompts: true,
      maxLineWidth: 620,
      progressIndicators: true,
      // ... other defaults
    },
  },
  {
    id: "dyslexia",
    title: "Dyslexia Support",
    desc: "Optimized for dyslexia with bionic reading and chunking.",
    image: "/images/persona4.png", // Updated path
    patch: {
      readingGoal: "understand",
      supportLevel: "high",
      bionicReading: true,
      chunking: true,
      glossary: true,
      adaptivePrompts: true,
      progressIndicators: true,
      fontSize: 18,
      lineSpacing: 1.9,
      maxLineWidth: 760,
      theme: "light",
    },
  },
  {
    id: "lowvision",
    title: "Visual Impairment",
    desc: "High contrast and progress indicators.",
    image: "/images/persona3.png", // Updated path
    patch: {
      theme: "high-contrast",
      supportLevel: "high",
      fontSize: 22,
      lineSpacing: 2.0,
      maxLineWidth: 900,
      glossary: true,
      progressIndicators: true,
      // ... other defaults
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
  const [selectedPreset, setSelectedPreset] = useState<Preset["id"]>("default");

  const canContinue = useMemo(() => nameDraft.trim().length > 0, [nameDraft]);

  const [collapsed, setCollapsed] = useState(false);

  const goToStep2 = () => {
    if (!canContinue) return;
    setStep(2);
  };

  const finishSetup = () => {
    setUserName(nameDraft.trim());
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

           {/* Live preview */}
<div className="sticky top-6 z-20">
  <Card className="relative p-4 space-y-2 bg-accent/40">

    {/* Header */}
    <div className="text-sm font-medium">
      Preview
    </div>
        {/* Collapsible preview */}
        {!collapsed && (
          <>
            <div
              className="rounded-xl border bg-card px-5 py-2"
              style={{
                fontSize: `${preferences.fontSize}px`,
                lineHeight: preferences.lineSpacing,
                maxWidth: `${Math.min(preferences.maxLineWidth, 860)}px`,
                margin: "0 auto",
              }}
            >
              {preferences.chunking ? (
                <div className="space-y-2">
                  <div className="chunk-highlight">{previewBlocks[0]}</div>
                  <div className="chunk-highlight">{previewBlocks[0]}</div>
                </div>
              ) : (
                <div>{previewContent}</div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
            </div>
          </>
        )}

        {/* Arrow button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition"
        >
          <span>{collapsed ? "Show preview" : "Hide preview"}</span>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

      </Card>
    </div>

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
                  Pick a persona to initialise sensible defaults. Everything stays fully editable.
                </p>
              </div>

              <div className="grid gap-4 grid-cols-4">
                {PRESETS.map((p) => (
                  <Card
                    key={p.id}
                    className={`p-6 text-center space-y-4 flex flex-col justify-between cursor-pointer ${
                      selectedPreset === p.id
                        ? "border-2 border-primary bg-accent"
                        : "border border-border bg-card"
                    }`}
                    onClick={() => applyPreset(p)}
                  >
                    <div>
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-20 h-20 mx-auto rounded-full object-cover"
                      />
                      <div className="mt-4">
                        <h3 className="text-lg font-medium">{p.title}</h3>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
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
                  <TooltipTrigger value="skim" tooltip="Get the main points quickly without reading every word.">Skim</TooltipTrigger>
                  <TooltipTrigger value="understand" tooltip="Read carefully to grasp the meaning and key ideas.">Understand</TooltipTrigger>
                  <TooltipTrigger value="study" tooltip="Read in depth to retain and review the content.">Study</TooltipTrigger>
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

              <div className="space-y-3 rounded-lg border px-4 py-4">
                <div className="text-sm font-medium">Theme</div>
                <Tabs
                  value={preferences.theme}
                  onValueChange={(v) => setPreferences({ theme: v as ThemeMode })}
                >
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="light">Light</TabsTrigger>
                    <TabsTrigger value="dark">Dark</TabsTrigger>
                    <TabsTrigger value="high-contrast">High contrast</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

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

// Wraps TabsTrigger with CSS tooltip for explanations when hovering over reading goal.
function TooltipTrigger({
  value,
  tooltip,
  children,
}: {
  value: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <TabsTrigger value={value} className="w-full">{children}</TabsTrigger>
      <div className={[
        "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
        "w-max max-w-48 rounded border bg-popover text-popover-foreground",
        "text-xs px-2 py-1 text-center shadow-md z-50",
        "opacity-0 group-hover:opacity-100 transition-opacity",
      ].join(" ")}>
        {tooltip}
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
