import { Outlet } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export default function AppShell() {
  const { signOut } = useAuth();
  const { user } = useUser();

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