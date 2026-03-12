# Clerk Authentication Setup Guide

## Step 1: Create a Clerk Account
1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

## Step 2: Get Your Publishable Key
1. Go to your Clerk Dashboard at https://dashboard.clerk.com
2. Navigate to **API Keys** in the left sidebar
3. Copy your **Publishable Key** (looks like: `pk_test_...`)

## Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and paste your Publishable Key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

## Step 4: Configure Allowed Origins (Development)
1. In Clerk Dashboard, go to **Settings** → **API Keys** → **URLs**
2. Add your development URL to **Allowed Origins**:
   ```
   http://localhost:5173
   ```

## Step 5: Test the Setup
1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should be redirected to the sign-in page
4. Sign up or sign in with your Clerk account

## How It Works
- Users must sign in to access the app. The sign-in route is at `/sign-in`
- All authenticated routes are protected by the `ProtectedRoute` component
- User information is available via the `useAuth()` hook from Clerk
- Sessions are automatically managed by Clerk

## Optional: Add User Avatar/Info to AppShell
You can display the user's information in your app header:

```tsx
import { useUser } from "@clerk/clerk-react";

export default function AppShell() {
  const { user } = useUser();
  
  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
    </div>
  );
}
```

## Need Help?
- Clerk Documentation: https://clerk.com/docs
- Dashboard: https://dashboard.clerk.com
