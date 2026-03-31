# CS7IS5 – Adaptive Applications  
## Clarity Layer (Team Kojack)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Enabled-38BDF8)
![License](https://img.shields.io/badge/License-MIT-green)
---

## Project Overview

**Clarity Layer** is a scrutable adaptive reading web application designed to support users with diverse cognitive and learning needs when reading digital documents.

The system adapts text presentation (e.g., chunking, bionic emphasis, glossary support) based on explicit user preferences and lightweight behavioural signals, while ensuring all adaptive decisions remain transparent and user-controllable.

This repository contains the frontend proof-of-concept implementation.

---

## Implemented Features

### Onboarding
- Two-step setup flow
- Support level selection (low / medium / high)
- Stereotype-based presets (e.g., ADHD, Dyslexia)
- Accessibility settings:
  - Font size
  - Line spacing
  - Theme (light / dark / high contrast)
- Live preview of adaptation effects

### Document Management
- Paste text input
- Simulated document upload
- Document history view
- Client-side persistence (localStorage)

### Reading Workspace
- Bionic reading mode
- Intelligent chunking
- Glossary term support
- Reading progress indicator
- Support intensity controls
- Layout lock option
- Adaptive prompts (rule-based)
- Encouragement and distraction nudges
- Scrutability panel:
  - **Your Model**
  - **Why This Changed**
  - **Controls**

### Session Summary
- Reading time statistics
- Interaction tracking (scroll-backs, pauses, toggles)
- Model change log
- Concept confidence (simulated)
- Low-effort feedback options
- Adaptation log export

---

## Technology Stack

### Frontend
- React (TypeScript)
- Vite
- Tailwind CSS
- shadcn/ui (Radix-based components)
- Lucide icons

### Storage
- `localStorage` (proof-of-concept persistence layer)

### Architecture
- Client-side rule-based adaptation
- Context-based global state management
- Modular feature-based folder structure

---

## Getting Started

### 1. Navigate to the frontend application

```bash
cd app
```

### 2. Configure environment variables

Create an `app/.env.local` file and add the team's Clerk publishable key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

For more detail, see `app/CLERK_SETUP.md`.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the development server

```bash
npm run dev
```

The application will start locally at:
http://localhost:5173

---

## Environment Requirements

- Node.js 20.19+ (22+ recommended)
- npm 10+

Check your versions:

```bash
node -v
npm -v
```

If using nvm to upgrade Node:

```bash
nvm install 22
nvm use 22
```

---

## Build for Production

From the `app` directory, generate a production build with:

```bash
npm run build
```

From the `app` directory, preview the production build locally with:

```bash
npm run preview
```

---

## Current Scope

This repository contains the frontend proof-of-concept implementation of **Clarity Layer**.

Adaptive behaviour is implemented using:
- Rule-based decision logic
- Explicit user preferences
- Lightweight interaction tracking
- Client-side persistence (localStorage)

Backend integration can be added in future iterations via the shared API layer.

---

## Demo Flow

1. Complete onboarding (choose support level and optional stereotype).
2. Paste text or simulate document upload.
3. Enable chunking or bionic reading.
4. Scroll slowly to trigger adaptive prompts.
5. Open glossary terms.
6. Finish session to view summary analytics.

---

## Project Structure

``` 
app/
  src/
    app/             # App-level routing
    features/        # Feature modules (auth, documents, onboarding, personas, reader, summary)
    shared/          # Shared API, layout, and state
    components/      # Reusable UI components (shadcn)
    lib/             # Utilities
docs/                # Reports, diagrams, documentation
```

---

## License

This project is licensed under the MIT License.
See the LICENSE file for details.

---

## Authors

- Leah Weldon - weldonl@tcd.ie - 21363670
- Martha Ryan - ryanm86@tcd.ie - 21364383
- Petra Marcokova - marcokop@tcd.ie - 21365998
- Tanmay Dilip Birari - birarit@tcd.ie - 25337064
- Liam Byrne - byrnel57@tcd.ie - 21364304

---
