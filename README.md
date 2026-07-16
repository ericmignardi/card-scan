# Sports Card Scanner Mobile App 🃏

An AI-powered React Native/Expo application that scans both the front and back of sports cards (Baseball, Basketball, Football, Soccer, Hockey), identifies them using the Gemini 2.5 Flash API via Supabase Edge Functions, and stores them in a personal cloud inventory database.

Beyond transcribing what's printed on the card, it flags the two attributes collectors care about most: **Rookie Cards**, read from the card's own logos and banners, and **Hall of Famers**, which appear nowhere on the card and are derived from the identified player's career. Because Hall of Fame status can change after a card is catalogued — and can fall past the model's knowledge cutoff — every field on a saved card remains editable.

---

## 📑 Core Reference Documents
*   **[Product Requirements Document (PRD.md)](./PRD.md)**: Defines the app's features, functional scope, database entities/schemas, and system architecture.
*   **[Manual Test Plan (TEST.md)](./TEST.md)**: Ordered, checkbox-driven pass over every screen and flow. There is no automated test suite; this is the regression net.
*   **[Agent/Contributor Notes (AGENTS.md)](./AGENTS.md)**: Expo SDK pinning rules and config-plugin gotchas. **Read before changing the Expo SDK version.**

---

## 📂 Project Directory Structure

```text
card-scan/
├── app/                     # Expo Router (file-based navigation)
│   ├── (tabs)/              # Main screens: Inventory (index), Scanner (scan), Profile (profile)
│   ├── (auth)/              # Authentication screens (login)
│   ├── card/                # Stack screens: Card Details ([id].tsx), Confirm (confirm.tsx), Edit (edit.tsx)
│   ├── _layout.tsx          # Root navigation config & NativeWind styling import
│   └── index.tsx            # Initial routing gatekeeper
├── assets/                  # Images, fonts, and application logos
├── components/              # CardForm — the shared create/edit card form
│   └── ui/                  # Shared UI primitives (Button, FormField, CardImageTile, ToggleRow, etc.)
├── constants/                # Theme colors, sport list
├── context/                  # State management providers (AuthContext)
├── hooks/                    # Screen-level logic (useCards, useCardScanner)
├── services/                 # Supabase data access (cards, storage, identify)
├── supabase/                 # Supabase configuration and serverless code
│   ├── migrations/           # SQL database schema, storage bucket, and RLS scripts
│   └── functions/            # Deno Edge Functions (identify-card)
├── utils/                     # Supabase client setup
├── tailwind.config.js         # NativeWind styling theme configuration
├── package.json                # Frontend node dependencies
└── README.md                   # This document!
```

---

## ⚙️ Prerequisites

1.  **Node.js** (v20 or higher)
2.  A [Supabase](https://supabase.com) project (free tier is fine) — used as the backend for auth, database, storage, and the `identify-card` edge function.
3.  A [Google AI Studio](https://aistudio.google.com/) API key for Gemini, set as the `GEMINI_API_KEY` secret on your Supabase project's edge functions.
4.  **Expo Go** app (latest version from the App Store / Play Store). Expo Go only runs the *current* Expo SDK — if the app fails to load, check `AGENTS.md` for how to catch this project up.

---

## 🚀 Getting Started

### 1. Backend Setup (Supabase)
Create a Supabase project, then link and push this repo's migrations to it (this creates the `profiles`/`cards` tables, the `card-images` storage bucket, and all RLS policies):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Deploy the edge function and set its secret:

```bash
npx supabase functions deploy identify-card
npx supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend Configuration
Create a `.env.local` file in the root directory with your project's API URL and publishable key (found in your Supabase project's API settings):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

### 3. Running the App

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone — your phone and computer need to be on the same Wi-Fi network. Press `a` for an Android emulator or `i` for an iOS simulator if you have one configured.

---

## 🧪 Local Supabase (optional)

For fully offline development, `supabase/config.toml` is set up for the local CLI stack (`npx supabase start`, requires Docker Desktop). Point `.env.local` at `http://127.0.0.1:54321` and the local anon key printed by `supabase start` to use it instead of a hosted project.
