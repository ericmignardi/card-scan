import React, { useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";

type ScanStep = "front" | "back" | "review";

export default function ScanScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
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

  async function preprocessImage(uri: string): Promise<string> {
    const context = ImageManipulator.manipulate(uri);
    const rendered = await context.resize({ width: 1200 }).renderAsync();
    const result = await rendered.saveAsync({
      compress: 0.7,
      format: SaveFormat.JPEG,
    });
    context.release();
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
        Alert.alert("Capture Error", "Failed to take photo. Please try again.");
      } finally {
        setProcessing(false);
      }
    }
  }

  function resetScanner() {
    setFrontImage(null);
    setBackImage(null);
    setStep("front");
    setIdentifying(false);
  }

  // Upload file helper utilizing React Native FormData format
  async function uploadImageToStorage(uri: string, isFront: boolean): Promise<string> {
    if (!user) throw new Error("User must be authenticated to upload assets.");
    
    const fileExtension = "jpg";
    const filename = `${user.id}/${Date.now()}_${isFront ? "front" : "back"}.${fileExtension}`;
    
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: isFront ? "front.jpg" : "back.jpg",
      type: "image/jpeg",
    } as any);

    const { data, error } = await supabase.storage
      .from("card-images")
      .upload(filename, formData, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      throw error;
    }
    return data.path;
  }

  async function startIdentification() {
    if (!frontImage || !backImage) return;
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to scan cards.");
      return;
    }

    setIdentifying(true);

    try {
      // 1. Upload both front and back images to Supabase Storage
      const [frontPath, backPath] = await Promise.all([
        uploadImageToStorage(frontImage, true),
        uploadImageToStorage(backImage, false),
      ]);

      // 2. Call the serverless Edge Function to identify the card details
      const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke("identify-card", {
        body: { frontPath, backPath },
      });

      if (edgeError || !edgeResponse?.success) {
        throw new Error(edgeError?.message || edgeResponse?.error || "AI could not identify the card.");
      }

      // 3. Navigate user to confirmation screen, passing image paths and parsed metadata
      router.push({
        pathname: "/card/confirm",
        params: {
          frontPath,
          backPath,
          aiResult: JSON.stringify(edgeResponse.data),
        },
      });
    } catch (err: any) {
      console.error("Scanning process failed:", err);
      Alert.alert("Identification Failed", err.message || "Failed to identify card. Try again under better lighting.");
      setIdentifying(false);
    }
  }

  // Analyzing Page Loading View
  if (identifying) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white text-xl font-bold mt-6 text-center animate-pulse">Analyzing Card...</Text>
        <Text className="text-foreground-muted text-sm text-center mt-2 max-w-xs">
          Our AI is reading logos, card numbers, player stats, and detecting rookie status. This takes 4-6 seconds.
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
            <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
              {frontImage && (
                <Image source={{ uri: frontImage }} className="w-full h-full" resizeMode="cover" />
              )}
              <View className="absolute bottom-3 left-3 bg-primary/90 px-3 py-1 rounded-lg">
                <Text className="text-white text-xs font-bold">Front</Text>
              </View>
            </View>

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
                borderColor: isFront ? "#3b82f6" : "#eab308",
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
              style={{ backgroundColor: isFront ? "#3b82f6" : "#eab308" }}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="camera" size={32} color="#ffffff" />
              )}
            </TouchableOpacity>

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
