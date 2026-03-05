import { useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import AdaptivePrompt from "./AdaptivePrompt";
import ContentPane from "./ContentPane";
import Nudges from "./Nudges";
import SidePanel from "./SidePanel";

export default function Reader() {
  const navigate = useNavigate();
  const { userName, preferences, session, setSession, documentText } = useApp();
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(true);

  useEffect(() => {
    if (!documentText || documentText.trim().length === 0) {
      navigate("/documents");
    }
  }, [documentText, navigate]);

  useEffect(() => {
    if (!session.startTime) {
      setSession((prev) => ({ ...prev, startTime: new Date() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSession((prev) => ({ ...prev, readingTimeSec: prev.readingTimeSec + 1 }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [setSession]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (preferences.theme === "dark") root.classList.add("dark");
    if (preferences.theme === "high-contrast") root.classList.add("high-contrast");
  }, [preferences.theme]);

  const mins = useMemo(() => Math.floor(session.readingTimeSec / 60), [session.readingTimeSec]);

  const docTitle = useMemo(() => {
    const firstLine = documentText.split("\n")[0]?.trim() || "Untitled document";
    return firstLine.length > 44 ? firstLine.slice(0, 44) + "…" : firstLine;
  }, [documentText]);

  const progress = useMemo(() => {
    const pct = Number.isFinite(session.progressPct) ? session.progressPct : 0;
    return Math.min(100, Math.max(0, pct));
  }, [session.progressPct]);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <header className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="Clarity Layer" className="h-6 w-auto object-contain" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Clarity Layer</span>
              <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                {session.sessionMode}
              </Badge>
              <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                {preferences.supportLevel}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground hidden sm:block">
              {userName ? `Hello, ${userName}` : "Reading session"} • {mins}m • {docTitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/documents")}>
            Documents
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="hidden md:inline-flex"
            onClick={() => setDesktopPanelOpen((prev) => !prev)}
          >
            {desktopPanelOpen ? "Hide controls" : "Show controls"}
          </Button>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline">
                  Controls
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-[360px]">
                <SidePanel />
              </SheetContent>
            </Sheet>
          </div>

          <Button size="sm" onClick={() => navigate("/summary")}>
            Finish session
          </Button>
        </div>
      </header>

      <Nudges />

      {preferences.progressIndicators && (
        <div
          className={`fixed top-14 left-0 right-0 ${
            desktopPanelOpen ? "md:right-[360px]" : "md:right-0"
          } z-30 bg-background/95 backdrop-blur border-b px-6 py-3`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Reading progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT COLUMN */}
        <section className="flex-1 min-h-0 overflow-hidden relative">
          <ContentPane />
        </section>

        {/* RIGHT COLUMN */}
        {desktopPanelOpen && (
          <aside className="w-[360px] border-l hidden md:block min-h-0 overflow-hidden">
            <SidePanel />
          </aside>
        )}
      </main>

      <AdaptivePrompt />
    </div>
  );
}
