import { Stack } from "expo-router";

export default function CardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
