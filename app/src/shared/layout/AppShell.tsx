import { useApp } from "@/shared/state/AppContext";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function AppShell() {
  const { preferences } = useApp();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (preferences.theme === "dark") root.classList.add("dark");
    if (preferences.theme === "high-contrast") root.classList.add("high-contrast");
  }, [preferences.theme]);

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
