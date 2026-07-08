# Manual Test Plan — CardScanner

Go through each section in order. Sections 1–3 must pass before later sections are
meaningful (you need an authenticated session with a card in inventory to test
detail/delete). Check off each step as you complete it.

## Setup

- [ ] Run `npx expo-doctor` — should report all checks passed.
- [ ] Run `npm run start` (or `npx expo start`), scan the QR code with Expo Go on the
      test iPhone.
- [ ] App loads without an "incompatible" error and without a red error screen.

## 1. Auth — Sign Up

- [ ] Launch the app while signed out. You should land on the **Sign In** screen (not a
      blank/frozen screen).
- [ ] Tap "Don't have an account? Sign Up" — form should switch to show a Username field.
- [ ] Tap "Create Account" with all fields blank — expect an alert asking you to fill in
      all fields.
- [ ] Fill in email + password but leave Username blank — expect an alert asking for a
      username.
- [ ] Fill in a valid new email, password, and username, then submit — expect a success
      alert telling you to check your email to verify.
- [ ] Check the inbox for that email — confirm a verification email arrives.
- [ ] Try signing up again with the same email — expect a Supabase error alert (not a
      silent failure or crash).

## 2. Auth — Sign In / Sign Out

- [ ] From the Sign In screen, enter a wrong password for an existing account — expect a
      "Sign In Error" alert, not a crash.
- [ ] Enter correct credentials for a verified account — app should navigate into the
      main tab layout (Inventory tab).
- [ ] Force-quit and relaunch the app — you should still be signed in (session persisted
      via AsyncStorage), landing directly on Inventory rather than the login screen.
- [ ] Go to the **Profile** tab, confirm your email address is displayed correctly.
- [ ] Tap "Log Out" — expect to be returned to the Sign In screen.
- [ ] Relaunch the app after logging out — should land back on Sign In (session cleared).

## 3. Scan Flow — Happy Path

- [ ] Sign in, go to the **Scanner** tab.
- [ ] On first launch, expect a camera permission prompt. Tap "Grant Permission" (or
      confirm the OS prompt) — camera view should appear.
- [ ] Camera view shows "Scan FRONT" with a dashed guide frame.
- [ ] Take a photo of a card's front — screen should advance to "Scan BACK" (guide frame
      color changes).
- [ ] Take a photo of the card's back — screen should advance to the **Verify Images**
      review screen showing both captured photos.
- [ ] Tap "Retake Photos" — should reset back to the front-camera step with images
      cleared.
- [ ] Redo both captures, then tap "Identify Card" — expect an "Analyzing Card..."
      loading screen.
- [ ] Wait for analysis to finish — should land on **Confirm Details** with fields
      (player, year, brand, card #, sport, rookie/insert/autograph/memorabilia toggles,
      parallel attributes) pre-filled from the AI result.
- [ ] Spot-check the AI-filled values are reasonable for the actual card scanned (player
      name, year, brand, sport at minimum).
- [ ] Both front/back thumbnails on the Confirm screen display the actual photos taken
      (not broken images).

## 4. Confirm/Save Flow — Validation & Edits

- [ ] On Confirm Details, clear the Player Name field and tap "Add to Collection" —
      expect a validation alert, no navigation.
- [ ] Clear Year (or type non-numeric text) and try saving — expect the same validation
      alert.
- [ ] Manually edit Player Name, Year, Brand, and Card Number — fields should update as
      you type.
- [ ] Tap each sport chip (Baseball/Basketball/Football/Soccer/Hockey) — selected chip
      should highlight, only one active at a time.
- [ ] Toggle each switch: Rookie Card, Insert Card, Autographed, Memorabilia/Relic —
      switches should visibly flip on/off.
- [ ] Enter values in Serial Num, Color/Refractor, Variation fields.
- [ ] Tap "Add to Collection" with valid data — expect a "Success" alert, then
      navigation back to the Inventory tab.
- [ ] New card appears in the Inventory grid immediately (pull-to-refresh not required).

## 5. Confirm Flow — Discard

- [ ] Run the scan flow again (section 3) up to the Confirm Details screen.
- [ ] Tap "Discard Scan" — expect a confirmation alert ("Discard Card...").
- [ ] Tap "Cancel" in that alert — should stay on Confirm Details with data intact.
- [ ] Tap "Discard Scan" again, then confirm "Discard" — should navigate back to the
      Scanner tab, and the card should **not** appear in Inventory.
- [ ] (Optional, needs Supabase dashboard access) Verify the front/back images for the
      discarded scan were actually deleted from the `card-images` storage bucket.

## 6. Inventory — Browse, Search, Filter

- [ ] Inventory tab header shows the correct total card count ("Browsing N cards...").
- [ ] Each card tile shows the correct front image, player name, year + brand.
- [ ] Cards marked Rookie during scan show the "RC" badge on their tile.
- [ ] Each tile shows the correct sport label in the bottom-right corner.
- [ ] Type a player name into the search box — grid should filter to matches only (also
      test partial/lowercase matches).
- [ ] Search by brand name and by year — both should filter correctly.
- [ ] Clear the search — full list returns.
- [ ] Tap each sport category chip (Baseball, Basketball, etc.) — grid filters to that
      sport only; selected chip highlights.
- [ ] Tap "Rookies 🌟" — only rookie-flagged cards shown.
- [ ] Tap "Autographs ✍️" — only autographed cards shown.
- [ ] Tap "All Cards" — full list returns.
- [ ] Combine a search query + a category filter — results should satisfy both.
- [ ] Search/filter to something with no matches — expect the "No matches found" empty
      state with a working "Reset Filters" button.
- [ ] With zero cards in the account (fresh account, no filters), expect the "Your
      catalog is empty" empty state pointing at the Scanner tab.
- [ ] Pull down on the grid to refresh — loading indicator briefly shows, list
      reloads without duplicating entries.

## 7. Card Details

- [ ] Tap any card tile from Inventory — should open the Card Details modal.
- [ ] Front and back images display correctly at full size.
- [ ] Player, Brand, Card Number, Year, Sport all match what was saved.
- [ ] Attribute badges (Rookie/Autographed/Insert/Memorabilia) only appear for
      attributes that were actually toggled on; section is hidden entirely if none are
      set.
- [ ] Parallel Details section (Serial/Color/Variation) shows entered values, or
      "None"/"Base" placeholders for blanks; section is hidden if all three are empty.
- [ ] Tap the back arrow — returns to Inventory.

## 8. Card Delete

- [ ] Open a card's details, tap the trash icon — expect a confirmation alert.
- [ ] Tap "Cancel" — card should remain untouched.
- [ ] Tap the trash icon again, confirm "Delete" — expect a "Deleted" success alert,
      then return to Inventory with the card gone from the grid.
- [ ] (Optional, needs Supabase dashboard access) Verify the deleted card's row is gone
      from the `cards` table and its images are gone from `card-images` storage.

## 9. Navigation & Session Edge Cases

- [ ] With an active session, manually navigate to `/(auth)/login` (or force it via deep
      link) — app should redirect you back into the tabs instead of showing the login
      screen.
- [ ] While signed out, try to reach a `/card/[id]` or `/card/confirm` route directly —
      should redirect to Sign In rather than crash or show broken data.
- [ ] Background the app mid-scan (before completing front/back capture), then resume —
      app should not crash; camera should still function.
- [ ] Turn off Wi-Fi/data mid-"Analyzing Card..." — expect a graceful "Identification
      Failed" alert (not a hang or crash), and you should be able to retry.

## 10. Cross-Platform Sanity (if testing beyond the one iPhone)

- [ ] Repeat sections 3–4 on a second device/OS if available (Android via Expo Go, or
      `npx expo start --web`) to confirm no platform-specific regressions from the SDK
      54 downgrade — pay particular attention to camera capture and image upload, which
      are the most platform-sensitive parts of this app.

---

**Known environment note:** this project intentionally targets Expo SDK 54 (not the
npm-`latest` SDK) because the primary test device's Expo Go app is capped at SDK 54 with
no further update available. See `AGENTS.md` before changing Expo/SDK versions.
