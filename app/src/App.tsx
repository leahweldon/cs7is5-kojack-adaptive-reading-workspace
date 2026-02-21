import AppRouter from "@/app/router";
import { AppProvider } from "@/shared/state/AppContext";

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}