# Sports Card Scanner Mobile App 🃏

An AI-powered React Native/Expo application that scans both the front and back of sports cards (Baseball, Basketball, Football, Soccer, Hockey), identifies them using the Gemini 1.5 Flash API via Supabase Edge Functions, and stores them in a personal cloud inventory database.

---

## 📑 Core Reference Documents
Before writing any code, familiarize yourself with our project blueprints:
1.  **[Product Requirements Document (PRD.md)](file:///c:/Users/migna/OneDrive/Desktop/card-scan/PRD.md)**: Defines the app's features, functional scope, database entities/schemas, and system architecture.
2.  **[Sprint Implementation Plan (PLAN.md)](file:///c:/Users/migna/OneDrive/Desktop/card-scan/PLAN.md)**: Your step-by-step developer roadmap. Organized into 7 agile sprints with learning guidelines and detailed tasks.

---

## 📂 Project Directory Structure

```text
card-scan/
├── app/                     # Expo Router (file-based navigation)
│   ├── (tabs)/              # Main screens: Inventory (index), Scanner (scan), Profile (profile)
│   ├── (auth)/              # Authentication screens (login, signup)
│   ├── card/                # Stack screens: Card Details ([id].tsx)
│   ├── _layout.tsx          # Root navigation config & NativeWind styling import
│   └── index.tsx            # Initial routing gatekeeper
├── assets/                  # Images, fonts, and application logos
├── components/              # Shared UI components (inputs, card items, buttons, camera overlay)
├── context/                 # State management providers (e.g. AuthContext)
├── supabase/                # Supabase configurations and serverless code
│   ├── migrations/          # SQL database schemas & Row-Level Security (RLS) scripts
│   └── functions/           # Deno Serverless Edge Functions (e.g. identify-card)
├── utils/                   # Shared utility logic (e.g. supabaseClient.ts)
├── tailwind.config.js       # NativeWind styling theme configurations
├── package.json             # Frontend node dependencies
└── README.md                # This document!
```

---

## ⚙️ Prerequisites

To run this application locally, you will need to install and configure the following:
1.  **Node.js** (v20 or higher recommended)
2.  **Docker Desktop** (Required to run the local Supabase emulator)
3.  **Supabase CLI** (For database migrations, local storage setup, and edge functions testing)
    *   *Windows installation via Scoop*: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
    *   *Windows installation via NPM*: `npm install -g supabase`
4.  **Expo Go** app (latest version from App Store / Play Store) or an emulator (Android Studio / Xcode). Note: Expo Go only supports the latest SDK — if your Expo Go version doesn't match, use a [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) instead.

---

## 🚀 Getting Started

Follow these steps to set up the frontend and backend locally:

### 1. Backend Setup (Supabase)
Ensure your Docker Desktop is running before executing backend commands:

```bash
# Initialize local Supabase configurations
supabase init

# Start local Supabase services (downloads Docker containers and seeds database)
supabase start
```

Once started, the CLI will output your local API keys and URL configurations:
*   **Studio URL**: `http://localhost:54321` (database management GUI)
*   **API URL**: `http://localhost:54321`
*   **Anon Key**: (used in client-side config)

Create your Edge Function credentials:
```bash
# Set your Gemini API Key in the local Supabase environment secrets
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend Configuration
1.  Create a `.env.local` file in the root directory.
2.  Populate it with the local Supabase credentials outputted by `supabase start`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_here
```

### 3. Running the App
Install dependencies and launch the Expo development packager:

```bash
# Install NPM dependencies
npm install

# Start the Expo Metro bundler (clear cache on first run)
npx expo start -c
```

*   **iOS Simulator**: Press `i` to open in Xcode simulator.
*   **Android Emulator**: Press `a` to open in Android Studio.
*   **Physical Device**: Scan the QR code shown in the terminal using your phone's camera (iOS) or the Expo Go App (Android). Make sure your mobile device is on the same local Wi-Fi network as your computer!

---

## 🤝 Project Roles & Agile Iterations
*   **Your Role**: Developer / Engineer. You will be writing 100% of the code, learning how to configure navigation, interface with phone cameras, manipulate image compression, upload assets to cloud storage, spin up serverless functions, write SQL queries, and prompt generative models.
*   **My Role (Antigravity)**: Senior Developer / Project Manager. I will guide you, check your work, review code blocks, explain errors, write plans, and ensure that your database structures are safe, performant, and secure.

Refer to **[PLAN.md](file:///c:/Users/migna/OneDrive/Desktop/card-scan/PLAN.md)** to begin Sprint 1!
