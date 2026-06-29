# Developer Sprint Implementation Plan (PLAN.md)

Welcome to the implementation plan for your **Sports Card Scanner**! This document is structured as a series of agile sprints. Since you are building this application yourself to maximize your learning, each sprint contains a list of tasks, along with **Key Concepts to Learn** and **Implementation Details** to guide you in the right direction without writing the code for you.

---

## 🏃 Sprint Roadmap Overview
1.  **Sprint 1**: Supabase Backend & Database Schema
2.  **Sprint 2**: Navigation Shell, NativeWind & Design Tokens
3.  **Sprint 3**: Supabase Authentication & Auth UI
4.  **Sprint 4**: Double-Capture Camera Flow (Expo Camera)
5.  **Sprint 5**: Edge Functions & Gemini Multimodal AI Integration
6.  **Sprint 6**: Inventory Dashboard, Search & Details Screen
7.  **Sprint 7**: Polish, Loading Skeletons & Error Handling

---

## 📦 Sprint 1: Supabase Backend & Database Setup
**Goal**: Initialize your database, storage buckets, and security policies locally using the Supabase CLI.

### 🛠️ Tasks
- [ ] **Task 1.1**: Install and initialize the Supabase CLI in the project root.
  *   *Command*: `supabase init`
  *   *Note*: Ensure Docker is running on your machine, then run `supabase start` to launch your local backend services.
- [ ] **Task 1.2**: Write a SQL migration script for the database schema.
  *   Create the migration file: `supabase migration new init_schema`
  *   Define the `profiles` table (automatically synced to auth users via a trigger) and the `cards` table (refer to the schema in `PRD.md`).
  *   Add a CHECK constraint on the `sport` column to restrict values to `('Baseball', 'Basketball', 'Football', 'Soccer', 'Hockey', 'Other')`.
- [ ] **Task 1.3**: Configure Row-Level Security (RLS) policies.
  *   Enable RLS on both tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  *   Write policies restricting insert/update/delete operations on `cards` to only the owner of the card (`auth.uid() = user_id`).
- [ ] **Task 1.4**: Setup the Storage Bucket.
  *   Create a bucket named `card-images` inside Supabase.
  *   Write storage RLS policies enabling authenticated users to upload and read images under their own folder: `(role() = 'authenticated')` and path checking for `auth.uid()`.

### 📚 Key Concepts to Learn
*   **Migrations**: Why database schema changes should be written as incremental files rather than executed manually.
*   **Row-Level Security (RLS)**: The core security model in Supabase that prevents users from accessing or modifying other users' data.
*   **PostgreSQL Triggers**: Automatically copying a new user record from Supabase Auth (`auth.users`) to your public profiles table.

---

## 🎨 Sprint 2: Navigation Shell, NativeWind & Design System
**Goal**: Verify your NativeWind setup and construct the file-based navigation layouts using Expo Router.

### 🛠️ Tasks
- [ ] **Task 2.1**: Set up and verify Tailwind CSS (NativeWind) in your project.
  *   Verify configuration in `tailwind.config.js` and `global.css`.
  *   Confirm that standard Tailwind classes (like `className="flex-1 bg-slate-900 justify-center items-center"`) render correctly.
- [ ] **Task 2.2**: Structure Expo Router folders.
  *   Set up a tab-based navigation shell in `app/(tabs)/_layout.tsx`.
  *   Create three main screens:
      *   `app/(tabs)/index.tsx` (Inventory Screen - default landing)
      *   `app/(tabs)/scan.tsx` (Scanner Camera Screen)
      *   `app/(tabs)/profile.tsx` (User Profile / Auth Settings Screen)
- [ ] **Task 2.3**: Establish your Theme & Design Tokens.
  *   Customize `tailwind.config.js` to support card-collecting aesthetics:
      *   *Primary Background*: Sleek dark color (e.g., slate/zinc 950).
      *   *Accent Color*: Electric blue or neon teal (for scanning effects).
      *   *Rookie Color*: Rich gold (for displaying rookie tags).
      *   *Font Family*: Custom Outfit or Inter fonts (configured in `app.json` and loaded via `expo-font`).

### 📚 Key Concepts to Learn
*   **File-Based Routing**: How Expo Router uses the file tree inside the `/app` directory to generate mobile screens and stacks.
*   **NativeWind**: The translation layer between utility-first CSS classes and React Native's `StyleSheet` objects.

---

## 🔑 Sprint 3: Authentication & Auth UI
**Goal**: Connect your frontend to Supabase Auth and design screens to handle signing in, signing up, and profile management.

### 🛠️ Tasks
- [ ] **Task 3.1**: Create a Supabase Client helper.
  *   Install the JS client: `npm install @supabase/supabase-js @react-native-async-storage/async-storage`
  *   Initialize the client in a `utils/supabase.ts` file. Use `AsyncStorage` to persist the user's session.
  *   Retrieve your Supabase URL and Anon Key from local configurations and save them in `.env.local` using `EXPO_PUBLIC_` prefixes.
- [ ] **Task 3.2**: Create an Auth Context provider.
  *   Build a custom context (e.g., `context/AuthContext.tsx`) or custom hooks that track the active session user, handling loading states.
- [ ] **Task 3.3**: Create Auth Screens.
  *   In `app/auth.tsx` (or group directory `(auth)`), create an login/registration UI.
  *   If a user is not logged in, redirect them to the auth screens automatically using Expo Router's `Redirect` or `useRootNavigationState`.
- [ ] **Task 3.4**: Create Profile Tab UI.
  *   Add a simple layout to `app/(tabs)/profile.tsx` displaying the logged-in email and a styled "Log Out" button.

### 📚 Key Concepts to Learn
*   **JWT Sessions**: How user sessions are maintained on-device securely.
*   **Persistent Storage in React Native**: Managing token storage with `AsyncStorage` so users don't have to log in every time they open the app.

---

## 📷 Sprint 4: Double-Capture Camera Flow
**Goal**: Build a state-driven camera scanner interface using `expo-camera` that prompts the user to capture the front, then the back, and preview the results.

### 🛠️ Tasks
- [ ] **Task 4.1**: Handle Camera Permissions.
  *   Request permission using `Camera.requestCameraPermissionsAsync()` on mount.
  *   Render a user-friendly "Camera Permission Required" screen with a call-to-action button if denied.
- [ ] **Task 4.2**: Design the Scanning overlay UI.
  *   Render the live camera viewport.
  *   Overlay a semi-transparent dark mask with a clear, rounded-corner card-shaped rectangle in the center.
  *   Add dynamic overlay instructions at the top: e.g. "Step 1: Align Card FRONT" (in blue) or "Step 2: Align Card BACK" (in gold).
- [ ] **Task 4.3**: Build the Scan State Machine.
  *   Define states: `IDLE`, `CAPTURING_FRONT`, `CAPTURING_BACK`, `REVIEWING`.
  *   When the user presses the shutter button:
      1. Capture the image using `cameraRef.current.takePictureAsync()`.
      2. If in `CAPTURING_FRONT`, save the file URI, transition status, and prompt the user to flip the card.
      3. If in `CAPTURING_BACK`, save the file URI and transition to `REVIEWING`.
- [ ] **Task 4.4**: Implement Image Preprocessing & Compression.
  *   Install `expo-image-manipulator`.
  *   Write a function to resize the images to a maximum width of 1200px and compress to JPEG format at 0.7 quality to reduce upload latency.
- [ ] **Task 4.5**: Create the Review Layout.
  *   Display the front and back images side-by-side with clear labels ("Front", "Back").
  *   Include two buttons: "Retake Scan" (resets state) and "Identify Card" (triggers next step).

### 📚 Key Concepts to Learn
*   **Hardware Access**: Requesting and handling OS permissions in React Native.
*   **State Machine Pattern**: Organizing complex multi-step UI flows using clean state variables.
*   **Image Compression**: Balance between detail required by OCR/AI and upload speed/bandwidth limits.

---

## ⚡ Sprint 5: Edge Functions & Gemini AI Integration
**Goal**: Build the Deno-based Supabase Edge Function to safely make requests to the Gemini API and send the structured card properties back to the client.

### 🛠️ Tasks
- [ ] **Task 5.1**: Initialize the Edge Function.
  *   Create the function skeleton: `supabase functions new identify-card`
  *   Add your Gemini API Key to your local Supabase secrets configuration: `supabase secrets set GEMINI_API_KEY=your_key`
- [ ] **Task 5.2**: Client-side Upload Logic.
  *   In your React Native app, write a function that uploads the compressed front/back JPEGs to your Supabase `card-images` bucket.
  *   *Tip*: Use `SupabaseStorage` with paths structured by user ID and timestamps: `${userId}/${Date.now()}_front.jpg`.
- [ ] **Task 5.3**: Write the Edge Function core logic (TypeScript/Deno).
  *   Read the incoming request to fetch the storage paths (`frontPath`, `backPath`).
  *   Use the Supabase service role client within the function to fetch/download the binary files of both images from the bucket.
  *   Load the `@google/generative-ai` package in the Edge Function.
  *   Construct the multimodal API request, converting the front/back images into inline data blocks (`inlineData`).
  *   Send the system instructions and structured JSON response schema to `gemini-1.5-flash` (refer to instructions in `PRD.md`).
  *   Return the JSON output back to the client app.
- [ ] **Task 5.4**: Front-End Triggering.
  *   In the React Native app, call your Edge Function using `supabase.functions.invoke('identify-card', { body: { frontPath, backPath } })`.
  *   Store the returned JSON in the state and navigate the user to the Card Detail confirmation screen.

### 📚 Key Concepts to Learn
*   **Edge Computing**: Executing serverless functions globally close to the user, optimizing latency.
*   **Multimodal AI Prompting**: How to pass text instructions and multiple images to a model to parse relationships (front/back of same item).
*   **Deno Ecosystem**: Third-party package imports in Deno via URLs or import maps instead of npm.

---

## 🗂️ Sprint 6: Inventory Dashboard & Card Detail Confirmation
**Goal**: Build the UI to allow users to review/edit the AI's findings, save the card to their database, and view their collected inventory.

### 🛠️ Tasks
- [ ] **Task 6.1**: Build the Card Detail Confirmation/Edit Screen.
  *   Display card attributes (Player, Year, Brand, Card #) in standard TextInput components so the user can correct minor mistakes.
  *   Display checkboxes or toggles for flags: `Rookie Card`, `Insert`, `Autographed`, `Memorabilia`.
  *   Render text blocks showing the parallel attributes (serial number, color).
  *   Provide a "Save to Collection" button.
- [ ] **Task 6.2**: Database Save Handler.
  *   On save, insert a row into the `cards` table containing all details and the public URLs of the stored front/back images.
  *   Clean up: If the user decides to *cancel/discard* instead of save, delete the front/back images from Supabase Storage to avoid wasting storage space.
- [ ] **Task 6.3**: Build the Collection Dashboard.
  *   In `app/(tabs)/index.tsx`, query all user cards from Supabase: `supabase.from('cards').select('*')`.
  *   Render the list in a grid using a `FlatList` or `FlashList` for optimal mobile scrolling performance.
  *   Display each card with its front image, player name, brand, year, and a gold badge if `is_rookie` is true.
- [ ] **Task 6.4**: Add Search and Filters.
  *   Add a TextInput at the top of the collection screen to filter items locally by `player_name` or `brand`.
  *   Implement filtering tabs (e.g. "All", "Baseball", "Basketball", "Football", "Rookies", "Autographs").
- [ ] **Task 6.5**: Create the Card Detail Viewer.
  *   Add a details sheet or stack screen (e.g., `app/card/[id].tsx`) showing the high-resolution front and back images, full metadata breakdown, and a prominent "Delete Card" button.

### 📚 Key Concepts to Learn
*   **FlatList Optimization**: Reusing cell views during list scrolling to prevent frame drops in React Native.
*   **JSONB Queries**: Accessing nested properties inside PostgreSQL's flexible JSONB columns (for parallel attributes).

---

## 💫 Sprint 7: Polish, Loading States & Offline Capabilities
**Goal**: Enhance UX with loading states, handle error states gracefully, and implement caching for offline inventory reading.

### 🛠️ Tasks
- [ ] **Task 7.1**: Design the AI Analyzing Screen.
  *   Create a beautiful "Analyzing Card..." screen shown during the Edge Function invocation.
  *   Use NativeWind styling to add a pulse effect or scanning animation overlay.
  *   Display rotating text tips (e.g., "Reading serial numbers...", "Detecting Rookie logos...") to keep the user engaged during the 5-7 second wait.
- [ ] **Task 7.2**: Implement Error Fallbacks.
  *   If the Edge Function or Gemini fails, display a clear error message (e.g. "Could not identify card. Please try again with better lighting or enter details manually.").
  *   Allow the user to fill out a completely blank card form as a fallback.
- [ ] **Task 7.3**: Offline Caching.
  *   Store the fetched inventory cards in local storage (or use a library like `@tanstack/react-query` or `redux-toolkit` with persistence) so the inventory screen loads instantly and works offline.
- [ ] **Task 7.4**: Perform Manual Testing.
  *   Run the app on your physical device via Expo Go.
  *   Test scanning under different lighting conditions.
  *   Verify RLS policies by logging in with a second account and ensuring you cannot see the first user's collection.

### 📚 Key Concepts to Learn
*   **Perceived Performance**: How animations and micro-copy (tips) make loading times feel shorter to users.
*   **Offline First Architecture**: Accessing cached local data before syncing over the network.
