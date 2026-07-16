import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/Button";
import { CardImageTile } from "@/components/ui/CardImageTile";
import { colors } from "@/constants/theme";
import { useCardScanner } from "@/hooks/useCardScanner";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const {
    cameraRef,
    step,
    frontImage,
    backImage,
    processing,
    identifying,
    takePicture,
    resetScanner,
    startIdentification,
  } = useCardScanner();

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

  // Analyzing Page Loading View
  if (identifying) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-white text-xl font-bold mt-6 text-center">Analyzing Card...</Text>
        <Text className="text-foreground-muted text-sm text-center mt-2 max-w-xs">
          Our AI is reading logos, card numbers, and player stats, and detecting rookie and Hall of Fame status.
          This takes a few seconds.
        </Text>
      </View>
    );
  }

  if (step === "review") {
    return (
      <View className="flex-1 bg-background px-6 pt-16 pb-10 justify-between">
        <View>
          <Text className="text-2xl font-bold text-white text-center mb-1">Verify Images</Text>
          <Text className="text-foreground-muted text-sm text-center mb-8">
            Ensure details, logos, and card numbers are legible.
          </Text>

          <View className="flex-row justify-between mb-6">
            <CardImageTile uri={frontImage} side="front" />
            <CardImageTile uri={backImage} side="back" />
          </View>
        </View>

        <View className="space-y-3">
          <Button title="Identify Card" onPress={startIdentification} />
          <Button title="Retake Photos" onPress={resetScanner} variant="outline" className="mt-3" />
        </View>
      </View>
    );
  }

  const isFront = step === "front";

  return (
    <View className="flex-1 bg-black">
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef}>
        <View className="flex-1 justify-between bg-black/40 py-16 px-6">
          <View className="items-center">
            <Text className="text-2xl font-black text-white text-center tracking-wide">
              {isFront ? "Scan FRONT" : "Scan BACK"}
            </Text>
            <Text className="text-foreground-muted text-sm text-center mt-1 max-w-xs">
              {isFront
                ? "Position the FRONT of the card inside the guide frame."
                : "Flip card. Position the BACK inside the guide frame."}
            </Text>
          </View>

          <View className="w-full aspect-[3/4] self-center items-center justify-center">
            <View
              style={{
                width: "85%",
                height: "85%",
                borderWidth: 3,
                borderColor: isFront ? colors.primary : colors.rookie,
                borderRadius: 24,
                borderStyle: "dashed",
              }}
            />
          </View>

          <View className="flex-row justify-between items-center px-8">
            <View className="w-12 h-12" />

            <TouchableOpacity
              onPress={takePicture}
              disabled={processing}
              className={`w-20 h-20 rounded-full border-4 border-white justify-center items-center shadow-2xl ${
                processing ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: isFront ? colors.primary : colors.rookie }}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="camera" size={32} color="#ffffff" />
              )}
            </TouchableOpacity>

            {frontImage || step !== "front" ? (
              <TouchableOpacity
                onPress={resetScanner}
                className="w-12 h-12 bg-background-card/80 border border-border rounded-full justify-center items-center shadow-md"
              >
                <Ionicons name="refresh" size={20} color="#f8fafc" />
              </TouchableOpacity>
            ) : (
              <View className="w-12 h-12" />
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}
