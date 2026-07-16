import { AuthProvider, useAuth } from "@/context/AuthContext";
import "@/global.css";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// These reject when there is no splash screen currently showing — already hidden, or none
// registered for the view controller at all. That is a state we neither control nor need
// to act on, so it is swallowed rather than left to surface as an unhandled rejection.
function ignoreMissingSplash(err: unknown) {
  console.debug("Splash screen already dismissed:", err);
}

SplashScreen.preventAutoHideAsync().catch(ignoreMissingSplash);

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Both the auth state and the root navigation state have to be ready before we can know
  // where to send the user.
  const isReady = !isLoading && !!navigationState?.key;

  // Kept apart from the redirect effect below. That one re-runs on every navigation
  // because it depends on `segments`, and hiding the splash from inside it meant
  // hideAsync fired again on each route change, rejecting every time after the first.
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(ignoreMissingSplash);
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isReady, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="card"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
