# Product Requirements Document (PRD)

## Sports Card Scanner Mobile App (MVP)

---

## 1. Product Overview
The **Sports Card Scanner** is a React Native/Expo mobile application designed for sports card collectors. It allows users to snap photos of both the **front** and **back** of a sports card (Baseball, Basketball, Football, Soccer, Hockey) and automatically identify it using a Multimodal Large Language Model (Gemini API) via a secure backend (Supabase Edge Functions). Once identified, the card and its metadata are stored in the user's personal digital collection inventory.

### Key Objectives
*   **Automate Cataloging**: Eliminate manual data entry for card collections by using AI-powered image analysis.
*   **Accurate Double-Sided Scanning**: Analyze both front (visual details, player, team, rookie logos) and back (card number, copyright year, statistics, serial numbering) to ensure high-fidelity card identification.
*   **Surface Collectible Significance**: Flag the two attributes that most drive a card's interest — **Rookie Card** status, read from the card itself, and **Hall of Fame** status, which is not printed on the card and must be derived from the identified player's career.
*   **Cloud Inventory**: Save and manage a search-enabled inventory of collected cards securely.
*   **Privacy & Security**: Protect sensitive credentials by proxying all AI requests through serverless backend functions.

---

## 2. Target Audience & Personas
*   **The Hobbyist Collector**: Collects sports cards casually and wants an easy way to track what they own on their phone.
*   **The Rookie Card Hunter**: Actively searches for Rookie Cards (RCs) and needs immediate confirmation if a logo or parallel detail matches rookie specifications.
*   **The Hall of Fame Collector**: Focuses on cards of inducted players and needs to know at a glance which cards in a stack are Hall of Famers — including cards printed long before the player was inducted, where nothing on the card itself gives it away.
*   **The Inventory Cataloger**: Has boxes of cards and wants to get through them fast. Scanning front/back one card at a time does not scale to a shoebox, so this persona is the primary driver of the **lot scan**: lay out a grid of cards, take one photo, catalog them all. Accepts lower per-card fidelity in exchange for throughput.

---

## 3. Tech Stack
*   **Frontend**: React Native, Expo (SDK 54), Expo Router (file-based navigation), Expo Camera, Expo Image Manipulator.
    *   SDK 54 is pinned deliberately below npm's `latest` because the primary test device's Expo Go is capped there. Read `AGENTS.md` before changing it.
*   **Styling**: NativeWind (Tailwind CSS for React Native).
*   **Backend (BaaS)**: Supabase.
    *   **Authentication**: Supabase Auth (Email/Password credentials).
    *   **Database**: PostgreSQL with Row-Level Security (RLS).
    *   **File Storage**: Supabase Storage (for storing scanned card front/back images).
    *   **Serverless Code**: Supabase Edge Functions (Deno/TypeScript) for secure API calls — `identify-card` (single card, front + back) and `identify-lot` (one photo of many cards), sharing prompt text and response schema via `functions/_shared/`.
*   **AI Engine**: Gemini 2.5 Flash, called over the REST API from the Edge Function, for fast, low-cost multimodal image analysis.

---

## 4. Functional Requirements

### 4.1. User Authentication
*   Users must be able to sign up using Email & Password.
*   Users must be able to sign in and persist their session.
*   A "Profile" tab allows logging out and displays the active user email.
*   All card cataloging features require an authenticated session.

### 4.2. Double-Sided Scanning Flow
*   **Launch Camera**: The user opens the Scanner tab, presenting a live camera view with a bounding box overlay guiding card placement.
*   **Capture Front**: User snaps the front of the card. A thumbnail preview of the front image is shown at the bottom.
*   **Capture Back**: Bounding box prompt switches to "Capture Card BACK". User snaps the back of the card.
*   **Review Screen**: Both images are displayed side-by-side. The user can either "Re-scan" (discards images and starts over) or "Identify Card".
*   **Image Compression**: Before uploading, the frontend compresses both images (JPEG format, maximum width/height of 1200px, quality ~0.7) to save bandwidth and storage.

### 4.3. Identification Service
*   On clicking "Identify Card", the app:
    1. Uploads the front image to Supabase Storage (`/card-images/user_id/front_unique_id.jpg`).
    2. Uploads the back image to Supabase Storage (`/card-images/user_id/back_unique_id.jpg`).
    3. Calls the Supabase Edge Function (`identify-card`) passing the storage paths of both images.
*   The Edge Function:
    1. Downloads both images from Storage.
    2. Constructs a prompt for the Gemini API, attaching both images.
    3. Calls the Gemini API using `gemini-2.5-flash` with a strict JSON Schema response requirement.
    4. Parses the JSON response and returns it to the React Native client.

### 4.4. Card Detail & Confirmation
*   The app displays the AI's returned properties:
    *   **Player Name**, **Year**, **Brand** (e.g. Topps, Panini, Bowman), **Card Number** (e.g. "US250", "698", "A-1").
    *   **Sport** (Baseball, Basketball, Football, Soccer, Hockey).
    *   **Attributes Flags**: `is_rookie`, `is_hall_of_famer`, `is_insert`, `is_autographed`, `is_memorabilia`.
    *   **Parallel Details**: Attributes like refractor colors, serial numbers (e.g. "12/99"), or print-run descriptions.
*   **Hall of Fame Status**: `is_hall_of_famer` is the one field not read off the card. Once the player is identified, it is judged from that player's career against the major Hall for their sport (Cooperstown, Naismith, Canton, Hockey HOF, National Soccer HOF). It reflects the player's status *today*, not at the card's print date, and must default to `false` for active players, merely-eligible players, and any case where the model is unsure or cannot identify the player. Because a recent induction may fall past the model's knowledge cutoff, the UI must treat this flag as a suggestion the user is expected to confirm.
*   **Save/Edit Screen**: The user can manually review and edit any field (e.g., in case of AI mismatch) before clicking "Add to Collection".
*   **Discard**: The user can discard the scan, which deletes the files from Supabase Storage and returns to the scanner screen.

### 4.5. Lot / Group Scanning
An alternative to the single-card flow, for cataloging many cards quickly. Selected via a mode toggle on the Scanner tab; the single-card flow is unchanged and remains the default.

*   **Capture**: The user lays cards out face up in a grid, not overlapping, and takes **one** photo of the whole layout.
*   **Fronts only**: A lot scan deliberately does not capture backs. Flipping a laid-out grid mirrors it, and any misalignment would silently attach one card's data to another — a wrong answer presented as a confident one. The cost is accepted explicitly:
    *   **Retained**: player, year, brand, sport, `is_rookie` (front logo), `is_hall_of_famer` (derived from the player, not the card), `is_autographed`, `is_insert`, `is_memorabilia`.
    *   **Lost**: card number confirmation from the back, back-stamped serial numbering. The prompt must instruct the model to return empty values for these rather than infer them.
*   **Detection**: The Edge Function (`identify-lot`) returns one entry per card, each with a `box_2d` bounding box (`[ymin, xmin, ymax, xmax]`, normalized 0–1000) locating that card in the photo. Entries with an unusable box are discarded server-side.
*   **Per-card images**: The client crops each card out of the original full-resolution capture using its bounding box, so every lot-scanned card gets its own front image and is indistinguishable from a single-scanned card in the inventory grid. `back_image_url` is null for these cards.
*   **Review**: Detected cards are listed with their cropped image, identified traits, and rookie/HOF badges. The user deselects false positives and saves the rest in one write. Per-card corrections are made afterwards via the standard edit screen rather than by embedding a form per card in the review list.
*   **Storage discipline**: The group photo is uploaded only so the Edge Function can read it, and is deleted as soon as identification returns. Individual card images are uploaded at save time, so abandoning the review leaves nothing behind.

### 4.6. Collection Inventory Management
*   Displays a list/grid of all saved cards.
*   **Search**: Search cards by Player Name.
*   **Filters**: Filter collection by Sport, Rookie status (`is_rookie`), Hall of Famer status (`is_hall_of_famer`), Autographed status (`is_autographed`), and Brand.
*   **Detail View**: Tapping a card opens a full details screen showing both front/back images, all metadata, a "Delete Card" button (which removes the record from the DB and the corresponding images from Storage), and an "Edit Card" button.
*   **Edit**: Any field on a saved card can be corrected after the fact, using the same form as the confirm screen. A card's images and owner are fixed at scan time and are not editable. This matters most for `is_hall_of_famer`, which can become stale through no fault of the scan — a player gets inducted years after their cards were catalogued.

---

## 5. Non-Functional Requirements
*   **Performance (Latency)**: Card identification (including uploads and Gemini API call) should complete in under 8 seconds under normal network conditions.
*   **Security**: No Gemini API keys or admin Supabase service role keys may be stored in the React Native client. The client talks exclusively to Supabase client APIs and the Edge Function using the user's JWT.
*   **Data Integrity**: If a user cancels a scan, deletes a card, or an identification fails after its images were already uploaded, the associated files must be deleted from Supabase Storage to prevent orphaned storage accumulation. Note that uploads precede identification, so a failed scan is a leak path and not just a cosmetic error.
*   **Offline Mode**: Scanned collections are cached locally on-device. When offline, users can browse their inventory, but scanning and adding new cards is disabled.

---

## 6. System Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Collector
    participant App as React Native App
    participant Storage as Supabase Storage
    participant DB as Supabase DB (PostgreSQL)
    participant EF as Supabase Edge Function (Deno)
    participant Gemini as Gemini API (2.5 Flash)

    User->>App: Captures Front & Back of Card
    App->>App: Compresses images
    App->>Storage: Uploads front.jpg & back.jpg
    Storage-->>App: Returns Storage Paths
    App->>EF: POST /identify-card (paths + auth JWT)
    Note over EF: Validates user token
    EF->>Storage: Downloads front.jpg & back.jpg
    EF->>Gemini: Calls Gemini API with both images + structured prompt
    Gemini-->>EF: Returns Structured JSON Card Metadata
    EF-->>App: Returns Card Metadata JSON
    App->>User: Displays metadata for approval/edit
    User->>App: Clicks "Add to Collection"
    App->>DB: INSERT into cards (metadata + storage URLs)
    DB-->>App: Confirm Insert
    App->>User: Display success & return to Inventory
```

---

## 7. Database Schema

We will use two main tables in Supabase: `profiles` (for user profiles) and `cards` (for the card database).

### 7.1. Table: `profiles`
Holds general user details. Connected to Supabase Auth `users` table via trigger.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, References `auth.users(id)` | Matches the user's authentication ID |
| `username` | `text` | Unique, Nullable | Public username |
| `created_at` | `timestamp with time zone` | Default `now()` | Date profile was created |

### 7.2. Table: `cards`
Stores the metadata and image references for scanned cards.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Unique card identifier |
| `user_id` | `uuid` | References `profiles(id)` ON DELETE CASCADE | Owner of the card |
| `front_image_url` | `text` | Not Null | Public URL/path of the front image in Storage |
| `back_image_url` | `text` | Nullable | Public URL/path of the back image in Storage. Null for cards added by a lot scan, which photographs fronts only |
| `sport` | `text` | Not Null, Check Constraint | Must be: 'Baseball', 'Basketball', 'Football', 'Soccer', 'Hockey', or 'Other' |
| `player_name` | `text` | Not Null | Extracted player name |
| `year` | `integer` | Not Null | Copyright/release year of the card |
| `brand` | `text` | Not Null | e.g. Topps, Bowman, Panini, Donruss |
| `card_number` | `text` | Not Null | The identifier on the card (e.g. '698', 'RC-3') |
| `is_rookie` | `boolean` | Not Null, Default `false` | Flag if card is a Rookie Card |
| `is_hall_of_famer` | `boolean` | Not Null, Default `false` | Flag if the player is an inducted Hall of Famer. Property of the player, not the card; partial index on `(user_id) WHERE is_hall_of_famer` backs the inventory filter |
| `is_insert` | `boolean` | Not Null, Default `false` | Flag if card is an insert/subset card |
| `is_autographed`| `boolean` | Not Null, Default `false` | Flag if card is autographed |
| `is_memorabilia`| `boolean` | Not Null, Default `false` | Flag if card contains jersey/patch/bat |
| `parallel_attributes` | `jsonb` | Nullable | Stores details like serial number (e.g. `{"serial_num": "45/99", "color": "Blue"}`) |
| `created_at` | `timestamp with time zone` | Default `now()` | Scanned date |

### 7.3. Row-Level Security (RLS) Policies
*   **Profiles Policies**:
    *   `Enable read access for all users` (authenticated).
    *   `Enable insert/update for users based on ID` (users can only edit their own profile).
*   **Cards Policies**:
    *   `Enable read access for owners`: `auth.uid() = user_id` (users can only query their own collection).
    *   `Enable insert for owners`: `auth.uid() = user_id` (users can only add cards to their own account).
    *   `Enable delete for owners`: `auth.uid() = user_id` (users can only delete their own cards).
    *   `Enable update for owners`: `auth.uid() = user_id` (users can only modify their own cards).

---

## 8. AI Prompt & Structured Output Specification

To ensure high-fidelity card identification, the Supabase Edge Function will invoke the Gemini API using system instructions and structured schema outputs.

### System Instructions
```text
You are an expert sports card appraiser and cataloger. You are given two images:
Image 1 is the FRONT of a sports card.
Image 2 is the BACK of a sports card.

Examine both images meticulously to identify the card.
- Look for the player name, team, brand logo (e.g., Topps, Panini, Bowman, Fleer), and year of release.
- Check if it is a Rookie Card. Rookie cards on the front typically have a 'RC' logo, 'Rookie Card' banner, 'Rated Rookie' logo (Donruss/Panini), or Bowman '1st Bowman' logo.
- Check the back of the card to confirm the copyright year, card number (e.g., in a corner or header, prefixed by '#' or letters), and see if there are serial numbers stamped (e.g., '10/99', '250/250').
- Detect if it is an insert card, an autographed card, or a memorabilia card (patch, jersey piece).

HALL OF FAME:
Unlike every other field, 'is_hall_of_famer' is NOT read off the card. Once you have
identified the player, decide from your own knowledge of that player's career whether
they have been formally inducted into the major Hall of Fame for their sport:
  Baseball   -> National Baseball Hall of Fame (Cooperstown)
  Basketball -> Naismith Memorial Basketball Hall of Fame
  Football   -> Pro Football Hall of Fame (Canton)
  Hockey     -> Hockey Hall of Fame (Toronto)
  Soccer     -> National Soccer Hall of Fame
Rules for this field:
- Set it true ONLY for a player you positively recognize as already inducted.
- A card may show a player years before induction; judge the player's status today,
  not the status at the time the card was printed. A 1951 Mickey Mantle rookie card is
  a Hall of Famer card.
- Set it false for active players, for players who are merely eligible, likely, or
  "future first-ballot" candidates, for college/minor-league Halls of Fame, for team
  or franchise-specific rings of honor, and whenever you are unsure.
- If you cannot confidently identify the player at all, set it false.
Do not let a strong career record alone convince you; induction is a specific event
that either happened or did not.

Return your findings strictly in the requested JSON structure. Do not guess. If a value is unknown, return an empty string or standard defaults.
```

### Expected Output Schema
The Gemini API will be configured to output JSON conforming to the following structure:
```json
{
  "sport": "Baseball" | "Basketball" | "Football" | "Soccer" | "Hockey" | "Other",
  "player_name": "Ronald Acuña Jr.",
  "year": 2018,
  "brand": "Topps Update",
  "card_number": "US250",
  "is_rookie": true,
  "is_hall_of_famer": false,
  "is_insert": false,
  "is_autographed": false,
  "is_memorabilia": false,
  "parallel_attributes": {
    "serial_num": "",
    "color": "Base",
    "variation": "N/A"
  }
}
```
