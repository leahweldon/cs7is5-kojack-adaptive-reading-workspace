import AppShell from "@/shared/layout/AppShell";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import DocumentUpload from "@/features/documents/DocumentUpload";
import Onboarding from "@/features/onboarding/Onboarding";
import Reader from "@/features/reader/Reader";
import Summary from "@/features/summary/Summary";
import SignIn from "@/features/auth/SignIn";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import { useApp } from "@/shared/state/AppContext";

function RootFlow() {
  const { userName } = useApp();
  if (userName?.trim()) {
    return <Navigate to="/documents" replace />;
  }
  return <Onboarding />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in/*" element={<SignIn />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<RootFlow />} />
          <Route path="/settings" element={<Onboarding />} />
          <Route path="/documents" element={<DocumentUpload />} />
          <Route path="/reader" element={<Reader />} />
          <Route path="/summary" element={<Summary />} />
        </Route>

        <Route path="*" element={<div className="p-8">Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}