import { useApp } from "@/shared/state/AppContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import AdaptivePrompt from "./AdaptivePrompt";
import ContentPane from "./ContentPane";
import Nudges from "./Nudges";
import SidePanel from "./SidePanel";

export default function Reader() {
  const navigate = useNavigate();
  const { preferences, session, setSession, documentText } = useApp();
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

  // Reading timer — paused when the tab is hidden so hidden time doesn't
  // count toward triggers that require a minimum reading duration.
  useEffect(() => {
    let id: number | null = null;

    const start = () => {
      if (id !== null || document.hidden) return;
      id = window.setInterval(() => {
        setSession((prev) => ({ ...prev, readingTimeSec: prev.readingTimeSec + 1 }));
      }, 1000);
    };

    const stop = () => {
      if (id !== null) {
        window.clearInterval(id);
        id = null;
      }
    };

    const onVisibilityChange = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [setSession]);

  const progress = useMemo(() => {
    const pct = Number.isFinite(session.progressPct) ? session.progressPct : 0;
    return Math.min(100, Math.max(0, pct));
  }, [session.progressPct]);

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden bg-background flex flex-col">
      <header className="h-14 border-b bg-background flex items-center gap-4 px-4">
        {preferences.progressIndicators && (
          <div className="hidden md:block flex-1 min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Reading progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
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

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT COLUMN */}
        <section
          className={cn("flex-1 min-h-0 overflow-hidden relative")}
        >
          <ContentPane />
        </section>

        {/* RIGHT COLUMN */}
        {desktopPanelOpen && (
          <aside className="w-[360px] border-l hidden md:block min-h-0 overflow-hidden pt-2">
            <SidePanel />
          </aside>
        )}
      </main>

      <AdaptivePrompt />
    </div>
  );
}
