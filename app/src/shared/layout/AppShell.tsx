import { useApp } from "@/shared/state/AppContext";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export default function AppShell() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { preferences } = useApp();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (preferences.theme === "dark") root.classList.add("dark");
    if (preferences.theme === "high-contrast") root.classList.add("high-contrast");
  }, [preferences.theme]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user menu */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.emailAddresses[0]?.emailAddress}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ redirectUrl: "/sign-in" })}
                >
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
