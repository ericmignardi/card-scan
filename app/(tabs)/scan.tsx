import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/Button";
import { LotScanFlow } from "@/components/LotScanFlow";
import { ScanMode } from "@/components/ScanModeToggle";
import { SingleScanFlow } from "@/components/SingleScanFlow";
import { colors } from "@/constants/theme";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>("single");

  if (!permission) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <View className="w-16 h-16 bg-primary/10 rounded-full justify-center items-center mb-4 border border-primary/20">
          <Ionicons name="camera" size={32} color={colors.primary} />
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">Camera Access Required</Text>
        <Text className="text-foreground-muted text-sm text-center mb-6 max-w-xs">
          We need access to your camera to capture and identify your sports cards.
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} className="w-full max-w-xs" />
      </View>
    );
  }

  // Each flow owns its own scanner hook, so rendering one at a time keeps the other's
  // capture state from lingering: switching modes starts genuinely fresh.
  return mode === "lot" ? (
    <LotScanFlow mode={mode} onModeChange={setMode} />
  ) : (
    <SingleScanFlow mode={mode} onModeChange={setMode} />
  );
}
