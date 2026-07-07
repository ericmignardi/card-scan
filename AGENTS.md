# Expo HAS CHANGED

This project targets Expo SDK 57. Read the exact versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Expo Go only runs the current SDK — if `npx expo-doctor` and `npx expo install --check`
both pass but Expo Go still refuses to load the app, the SDK this project targets has
likely fallen behind the SDK Expo Go supports. Check `npm view expo dist-tags` and
run `npm install expo@latest && npx expo install --fix` to catch up.
