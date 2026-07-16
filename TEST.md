# Manual Test Plan — CardScanner

Go through each section in order. Sections 1–3 must pass before later sections are
meaningful (you need an authenticated session with a card in inventory to test
detail/edit/delete). Check off each step as you complete it.

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

## 3. Single Scan Flow — Happy Path

- [ ] Sign in, go to the **Scanner** tab. It should open in **Single Card** mode by default,
      with a Single Card / Lot toggle visible above the guide frame.
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
      (player, year, brand, card #, sport, rookie/Hall of Famer/insert/autograph/
      memorabilia toggles, parallel attributes) pre-filled from the AI result.
- [ ] Spot-check the AI-filled values are reasonable for the actual card scanned (player
      name, year, brand, sport at minimum).
- [ ] Scan a card for a player who is **definitely** in the Hall of Fame (e.g. a Mantle,
      Jordan, Gretzky, or Montana card) — the Hall of Famer toggle should come back ON.
      Note this is judged from the player, not the card, so it should be on even for a
      rookie card printed decades before induction.
- [ ] Scan a card for a **current active player** — the Hall of Famer toggle should come
      back OFF, no matter how strong the player is.
- [ ] Scan a card for a player inducted very recently (within the last year or two) — this
      is the case most likely to come back wrong, since it may fall past the model's
      knowledge cutoff. A miss here is expected and correctable, not a bug.
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
- [ ] Toggle each switch: Rookie Card, Hall of Famer, Insert Card, Autographed,
      Memorabilia/Relic — switches should visibly flip on/off.
- [ ] The Hall of Famer row should show a hint line under its label reminding you to
      double-check recent inductions.
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

## 6. Lot / Group Scan

Lay out a handful of real cards face up in a grid (3×5 is a good target; try 6 first). A
plain, contrasting surface helps. Mix in at least one Hall of Famer and one rookie.

- [ ] On the Scanner tab, tap **Lot / Group** — the prompt changes to "Scan LOT", the guide
      frame turns teal and square, and the shutter shows a grid icon.
- [ ] The capture screen warns that fronts only are captured and back-printed card/serial
      numbers won't be picked up.
- [ ] Take a photo of the layout — you land on **Verify Photo** showing the full shot.
- [ ] Tap "Retake Photo" — returns to the camera with the photo cleared.
- [ ] Retake, then tap "Identify Cards" — expect an "Analyzing Lot..." screen (slower than
      a single card).
- [ ] You land on a results list headed "Found N cards". **N should match the number of
      cards you actually laid out** — this is the single most important check in this
      section.
- [ ] Each row shows a cropped image of **that one card** (not the whole group photo, not a
      neighbouring card). A wrong crop here means bounding boxes are misaligned.
- [ ] Rows are in reading order (left to right, top to bottom) matching your layout.
- [ ] Player names/years/brands are plausible for the cards you laid out.
- [ ] Rookie cards show an RC badge; Hall of Famers show an HOF badge.
- [ ] Card number and serial fields being blank is **expected** here, not a bug — there is
      no back photo to read them from.
- [ ] Tap a row — it dims and its check clears. The "Add N Cards" button count decrements.
- [ ] Deselect every row — the Add button should disable.
- [ ] Re-select a few, tap "Add N Cards to Collection" — expect a success alert naming the
      count, then a return to Inventory.
- [ ] Exactly the selected cards appear in Inventory, each with its own cropped image.
      Deselected ones must **not** appear.
- [ ] Open a lot-scanned card's details — the back image tile should read "No back image
      (lot scan)" rather than spinning forever.
- [ ] Edit a lot-scanned card and save — should work identically to a single-scanned card.
- [ ] Delete a lot-scanned card — should succeed despite having no back image.
- [ ] (Optional, needs Supabase dashboard access) Check `card-images`: the group photo
      should **not** be there (it's removed once identification returns), and there should
      be exactly one cropped image per saved card.
- [ ] Run a lot scan and abandon it at the results list (switch tabs / back out) without
      saving. Confirm no new images were left in the bucket.
- [ ] Photograph a surface with **no cards** on it, tap Identify — expect a graceful "no
      cards found" style alert, not a crash or an empty results screen.
- [ ] Switch from Lot back to Single Card mode — the scanner should reset cleanly to the
      "Scan FRONT" step with no leftover lot state.

## 7. Inventory — Browse, Search, Filter

- [ ] Inventory tab header shows the correct total card count ("Browsing N cards...").
- [ ] Each card tile shows the correct front image, player name, year + brand.
- [ ] Cards marked Rookie during scan show the "RC" badge on their tile.
- [ ] Cards marked Hall of Famer show a bronze "HOF" badge on their tile.
- [ ] A card marked **both** Rookie and Hall of Famer shows both badges side by side,
      neither overlapping nor clipped off the tile.
- [ ] Each tile shows the correct sport label in the bottom-right corner.
- [ ] Type a player name into the search box — grid should filter to matches only (also
      test partial/lowercase matches).
- [ ] Search by brand name and by year — both should filter correctly.
- [ ] Clear the search — full list returns.
- [ ] Tap each sport category chip (Baseball, Basketball, etc.) — grid filters to that
      sport only; selected chip highlights.
- [ ] Tap "Rookies 🌟" — only rookie-flagged cards shown.
- [ ] Tap "Hall of Famers 🏆" — only Hall of Famer-flagged cards shown.
- [ ] Tap "Autographs ✍️" — only autographed cards shown.
- [ ] Tap "All Cards" — full list returns.
- [ ] Combine a search query + a category filter — results should satisfy both.
- [ ] Search/filter to something with no matches — expect the "No matches found" empty
      state with a working "Reset Filters" button.
- [ ] With zero cards in the account (fresh account, no filters), expect the "Your
      catalog is empty" empty state pointing at the Scanner tab.
- [ ] Pull down on the grid to refresh — loading indicator briefly shows, list
      reloads without duplicating entries.

## 8. Card Details

- [ ] Tap any card tile from Inventory — should open the Card Details modal.
- [ ] Front and back images display correctly at full size.
- [ ] Player, Brand, Card Number, Year, Sport all match what was saved.
- [ ] Attribute badges (Rookie/Hall of Famer/Autographed/Insert/Memorabilia) only appear
      for attributes that were actually toggled on; section is hidden entirely if none are
      set.
- [ ] Parallel Details section (Serial/Color/Variation) shows entered values, or
      "None"/"Base" placeholders for blanks; section is hidden if all three are empty.
- [ ] Tap the back arrow — returns to Inventory.

## 9. Card Edit

- [ ] Open a card's details — the header should show a pencil (edit) icon next to the
      trash icon.
- [ ] Tap the pencil — the **Edit Card** screen opens with every field pre-filled from the
      saved card (player, year, brand, card #, sport chip, all five toggles, parallel
      fields), and both card images shown.
- [ ] Tap "Cancel" — returns to Card Details with nothing changed.
- [ ] Tap the pencil again, clear the Player Name, and tap "Save Changes" — expect the
      same validation alert as the confirm screen, no save.
- [ ] Change the Player Name and flip the **Hall of Famer** toggle, then "Save Changes" —
      expect a "Saved" alert, then return to Card Details.
- [ ] Card Details should show the new values immediately on return (this screen refetches
      on focus — a stale card here is a regression).
- [ ] Go back to Inventory — the tile should reflect the edit too (e.g. the HOF badge
      appears/disappears), and the "Hall of Famers 🏆" filter should now include/exclude
      the card accordingly.
- [ ] Edit a card and change only the sport chip — confirm the sport updates on the detail
      screen and the card moves between sport filters.

## 10. Card Delete

- [ ] Open a card's details, tap the trash icon — expect a confirmation alert.
- [ ] Tap "Cancel" — card should remain untouched.
- [ ] Tap the trash icon again, confirm "Delete" — expect a "Deleted" success alert,
      then return to Inventory with the card gone from the grid.
- [ ] (Optional, needs Supabase dashboard access) Verify the deleted card's row is gone
      from the `cards` table and its images are gone from `card-images` storage.

## 11. Navigation & Session Edge Cases

- [ ] With an active session, manually navigate to `/(auth)/login` (or force it via deep
      link) — app should redirect you back into the tabs instead of showing the login
      screen.
- [ ] While signed out, try to reach a `/card/[id]` or `/card/confirm` route directly —
      should redirect to Sign In rather than crash or show broken data.
- [ ] Background the app mid-scan (before completing front/back capture), then resume —
      app should not crash; camera should still function.
- [ ] Turn off Wi-Fi/data mid-"Analyzing Card..." — expect a graceful "Identification
      Failed" alert (not a hang or crash), and you should be able to retry.
- [ ] (Optional, needs Supabase dashboard access) After that failed identification, check
      the `card-images` bucket — the images uploaded by the failed attempt should have
      been cleaned up, not left orphaned. Repeat the failure a couple of times and confirm
      the bucket does not accumulate files.

## 12. Cross-Platform Sanity (if testing beyond the one iPhone)

- [ ] Repeat sections 3–4 on a second device/OS if available (Android via Expo Go, or
      `npx expo start --web`) to confirm no platform-specific regressions from the SDK
      54 downgrade — pay particular attention to camera capture and image upload, which
      are the most platform-sensitive parts of this app.

---

**Known environment note:** this project intentionally targets Expo SDK 54 (not the
npm-`latest` SDK) because the primary test device's Expo Go app is capped at SDK 54 with
no further update available. See `AGENTS.md` before changing Expo/SDK versions.
