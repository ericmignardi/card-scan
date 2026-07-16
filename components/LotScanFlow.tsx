import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/Button";
import { Image } from "@/components/ui/Image";
import { LotResults } from "@/components/LotResults";
import { ScanMode, ScanModeToggle } from "@/components/ScanModeToggle";
import { colors } from "@/constants/theme";
import { useLotScanner } from "@/hooks/useLotScanner";

interface LotScanFlowProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
}

export function LotScanFlow({ mode, onModeChange }: LotScanFlowProps) {
  const {
    cameraRef,
    step,
    lotImage,
    processing,
    identifying,
    saving,
    detected,
    includedCount,
    takePicture,
    resetScanner,
    startIdentification,
    toggleCard,
    saveDetectedCards,
  } = useLotScanner();

  if (identifying) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-white text-xl font-bold mt-6 text-center">Analyzing Lot...</Text>
        <Text className="text-foreground-muted text-sm text-center mt-2 max-w-xs">
          Our AI is locating every card in the photo and identifying each one. This takes longer than a single
          card — usually well under a minute.
        </Text>
      </View>
    );
  }

  if (step === "results") {
    return (
      <LotResults
        detected={detected}
        includedCount={includedCount}
        saving={saving}
        onToggle={toggleCard}
        onSave={saveDetectedCards}
        onRetake={resetScanner}
      />
    );
  }

  if (step === "review") {
    return (
      <View className="flex-1 bg-background px-6 pt-16 pb-10 justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white text-center mb-1">Verify Photo</Text>
          <Text className="text-foreground-muted text-sm text-center mb-6">
            Every card should be fully visible, flat, and not overlapping.
          </Text>

          <View className="flex-1 bg-background-card border border-border rounded-2xl overflow-hidden">
            {lotImage ? (
              <Image source={{ uri: lotImage }} className="w-full h-full" contentFit="contain" />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
        </View>

        <View className="space-y-3 pt-6">
          <Button title="Identify Cards" onPress={startIdentification} />
          <Button title="Retake Photo" onPress={resetScanner} variant="outline" className="mt-3" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* CameraView does not support children — the overlay is a sibling laid over it. */}
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />
      <View style={StyleSheet.absoluteFill} className="justify-between bg-black/40 py-16 px-6">
        <View className="items-center">
          <View className="mb-4">
            <ScanModeToggle mode={mode} onChange={onModeChange} />
          </View>

          <Text className="text-2xl font-black text-white text-center tracking-wide">Scan LOT</Text>
          <Text className="text-foreground-muted text-sm text-center mt-1 max-w-xs">
            Lay the cards out face up in a grid, without overlapping, and fit them all inside the frame.
          </Text>
        </View>

        <View className="w-full aspect-square self-center items-center justify-center">
          <View
            style={{
              width: "92%",
              height: "92%",
              borderWidth: 3,
              borderColor: colors.accent,
              borderRadius: 24,
              borderStyle: "dashed",
            }}
          />
        </View>

        <View className="items-center">
          <Text className="text-foreground-muted text-xs text-center mb-4 max-w-xs">
            Fronts only — card numbers and serial numbers printed on the backs won&apos;t be captured.
          </Text>

          <TouchableOpacity
            onPress={takePicture}
            disabled={processing}
            className={`w-20 h-20 rounded-full border-4 border-white justify-center items-center shadow-2xl ${
              processing ? "opacity-50" : ""
            }`}
            style={{ backgroundColor: colors.accent }}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="grid" size={30} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
