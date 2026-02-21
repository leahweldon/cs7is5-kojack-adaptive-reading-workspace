import AppShell from "@/shared/layout/AppShell";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import DocumentUpload from "@/features/documents/DocumentUpload";
import Onboarding from "@/features/onboarding/Onboarding";
import Reader from "@/features/reader/Reader";
import Summary from "@/features/summary/Summary";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Onboarding />} />
          <Route path="/documents" element={<DocumentUpload />} />
          <Route path="/reader" element={<Reader />} />
          <Route path="/summary" element={<Summary />} />
        </Route>

        <Route path="*" element={<div className="p-8">Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}