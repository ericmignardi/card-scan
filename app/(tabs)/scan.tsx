import React, { useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type ScanStep = "front" | "back" | "review";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <View className="w-16 h-16 bg-primary/10 rounded-full justify-center items-center mb-4 border border-primary/20">
          <Ionicons name="camera" size={32} color="#3b82f6" />
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">Camera Access Required</Text>
        <Text className="text-foreground-muted text-sm text-center mb-6 max-w-xs">
          We need access to your camera to capture and identify your sports cards.
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-4 rounded-xl shadow-lg w-full max-w-xs"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-center text-lg">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preprocess image: crop & compress to JPEG format at 0.7 quality
  async function preprocessImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Compress width to 1200px (preserves aspect ratio)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async function takePicture() {
    if (cameraRef.current && !processing) {
      try {
        setProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo?.uri) {
          const compressedUri = await preprocessImage(photo.uri);

          if (step === "front") {
            setFrontImage(compressedUri);
            setStep("back");
          } else if (step === "back") {
            setBackImage(compressedUri);
            setStep("review");
          }
        }
      } catch (err) {
        console.error("Capture Error:", err);
      } finally {
        setProcessing(false);
      }
    }
  }

  function resetScanner() {
    setFrontImage(null);
    setBackImage(null);
    setStep("front");
  }

  function startIdentification() {
    // Navigates to the details confirmation flow, passing both card images
    router.push({
      pathname: "/(tabs)/index", // Placeholders, will connect in Sprint 5
      params: { frontImage, backImage },
    });
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
            {/* Front Image Card */}
            <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
              {frontImage && (
                <Image source={{ uri: frontImage }} className="w-full h-full" resizeMode="cover" />
              )}
              <View className="absolute bottom-3 left-3 bg-primary/90 px-3 py-1 rounded-lg">
                <Text className="text-white text-xs font-bold">Front</Text>
              </View>
            </View>

            {/* Back Image Card */}
            <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
              {backImage && (
                <Image source={{ uri: backImage }} className="w-full h-full" resizeMode="cover" />
              )}
              <View className="absolute bottom-3 left-3 bg-rookie/90 px-3 py-1 rounded-lg">
                <Text className="text-white text-xs font-bold">Back</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="space-y-3">
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl shadow-lg"
            onPress={startIdentification}
          >
            <Text className="text-white text-center font-bold text-lg">Identify Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-border py-4 rounded-xl"
            onPress={resetScanner}
          >
            <Text className="text-foreground-muted text-center font-semibold text-lg">Retake Photos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isFront = step === "front";

  return (
    <View className="flex-1 bg-black">
      <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef}>
        {/* Transparent layout overlay */}
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

          {/* Card Bounding Frame Overlay */}
          <View className="w-full aspect-[3/4] self-center items-center justify-center">
            <View
              style={{
                width: "85%",
                height: "85%",
                borderWidth: 3,
                borderColor: isFront ? "#3b82f6" : "#eab308", // Blue for Front, Gold for Back
                borderRadius: 24,
                borderStyle: "dashed",
              }}
            />
          </View>

          {/* Controls Footer */}
          <View className="flex-row justify-between items-center px-8">
            {/* Left Spacer to balance row */}
            <View className="w-12 h-12" />

            {/* Shutter Button */}
            <TouchableOpacity
              onPress={takePicture}
              disabled={processing}
              className={`w-20 h-20 rounded-full border-4 border-white justify-center items-center shadow-2xl ${
                processing ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: isFront ? "#3b82f6" : "#eab308" }}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="camera" size={32} color="#ffffff" />
              )}
            </TouchableOpacity>

            {/* Cancel/Reset Button */}
            {(frontImage || step !== "front") ? (
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
