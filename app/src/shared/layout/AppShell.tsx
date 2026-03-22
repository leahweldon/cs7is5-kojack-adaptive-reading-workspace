import { useApp } from "@/shared/state/AppContext";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { preferences, userName, session, documentText } = useApp();

  const isReaderRoute = location.pathname === "/reader";
  const readerTitle = (documentText.split("\n")[0]?.trim() || "Untitled document").slice(0, 28);
  const mins = Math.floor(session.readingTimeSec / 60);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (preferences.theme === "dark") root.classList.add("dark");
    if (preferences.theme === "high-contrast") root.classList.add("high-contrast");
  }, [preferences.theme]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with brand dropdown */}
      <div className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Clarity Layer" className="h-6 w-auto object-contain" />
          </div>

          {isReaderRoute ? (
            <div className="hidden md:flex min-w-0 items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Clarity Layer</span>
              <Badge variant="secondary" className="text-[10px]">
                {session.sessionMode}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {preferences.supportLevel}
              </Badge>
              <span className="text-muted-foreground truncate">
                {userName ? `Hello, ${userName}` : "Reading session"} • {mins}m • {readerTitle}
              </span>
            </div>
          ) : (
            <div />
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open account menu">
                <Menu className="h-5 w-5" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Signed in as</div>
                  <div className="text-sm font-medium break-all">
                    {user?.emailAddresses[0]?.emailAddress ?? "Not signed in"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                    Return to settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ redirectUrl: "/sign-in" })}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
