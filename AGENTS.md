# Expo HAS CHANGED

This project targets Expo SDK 54. Read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Deliberately pinned below npm's `latest` tag (SDK 57 as of 2026-07): the primary test
device's Expo Go app has no further update available from the App Store (likely an iOS
version ceiling) and only supports SDK 54. Don't "fix" this by upgrading to `expo@latest`
— check with whoever owns the test device before changing the target SDK again.

Expo Go only runs the current SDK — if `npx expo-doctor` and `npx expo install --check`
both pass but Expo Go still refuses to load the app, compare `npm view expo dist-tags`
against the Expo Go app's reported SDK version (Profile tab in the app). Two directions:
- Project SDK < npm `latest`/`next`: the project fell behind — run
  `npm install expo@latest && npx expo install --fix`.
- Expo Go SDK < project SDK and Expo Go has no further App Store update available: the
  test device is capped — downgrade the project to match
  (`npm install expo@<major>.<minor>.<patch> && npx expo install --fix`) instead of
  upgrading, since Expo Go on that device can't go any higher.

`app.json`'s `plugins` array must only list packages that actually ship an
`app.plugin.js` (check with `node_modules/<pkg>/app.plugin.js`). Packages without one
(e.g. `expo-status-bar`, `expo-image`) don't need a plugins entry — on Node 22.6+/24,
listing one anyway makes `expo start`/`expo-doctor` crash with
`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`, because Expo's config-plugin resolver
falls back to `require()`-ing the package's raw TypeScript source, which Node refuses to
type-strip inside `node_modules`.
