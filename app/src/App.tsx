import { ClerkProvider } from "@clerk/clerk-react";
import AppRouter from "@/app/router";
import { AppProvider } from "@/shared/state/AppContext";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Clerk Publishable Key");
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ClerkProvider>
  );
}