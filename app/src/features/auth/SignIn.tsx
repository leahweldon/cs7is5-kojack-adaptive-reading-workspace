import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Clarity Layer" className="h-12 w-auto object-contain" />
        </div>
        <ClerkSignIn path="/sign-in" routing="path" />
      </div>
    </div>
  );
}
