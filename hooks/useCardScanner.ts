import { useAuth } from "@/context/AuthContext";
import { identifyCard } from "@/services/identifyService";
import { uploadCardImage } from "@/services/storageService";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useRef, useState } from "react";
import { Alert } from "react-native";

export type ScanStep = "front" | "back" | "review";

async function preprocessImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const rendered = await context.resize({ width: 1200 }).renderAsync();
    try {
      return (await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })).uri;
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}

// Owns the double-capture -> upload -> identify flow for the Scan tab, so the screen
// component can stay focused on rendering the camera/review UI.
export function useCardScanner() {
  const { user } = useAuth();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<ScanStep>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [identifying, setIdentifying] = useState(false);

  async function takePicture() {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;

      const compressedUri = await preprocessImage(photo.uri);

      if (step === "front") {
        setFrontImage(compressedUri);
        setStep("back");
      } else if (step === "back") {
        setBackImage(compressedUri);
        setStep("review");
      }
    } catch (err) {
      console.error("Capture Error:", err);
      Alert.alert("Capture Error", "Failed to take photo. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  function resetScanner() {
    setFrontImage(null);
    setBackImage(null);
    setStep("front");
    setIdentifying(false);
  }

  async function startIdentification() {
    if (!frontImage || !backImage) return;
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to scan cards.");
      return;
    }

    setIdentifying(true);

    try {
      const [frontPath, backPath] = await Promise.all([
        uploadCardImage(user.id, frontImage, "front"),
        uploadCardImage(user.id, backImage, "back"),
      ]);

      const aiResult = await identifyCard(frontPath, backPath);

      router.push({
        pathname: "/card/confirm",
        params: { frontPath, backPath, aiResult: JSON.stringify(aiResult) },
      });
    } catch (err: any) {
      console.error("Scanning process failed:", err);
      Alert.alert("Identification Failed", err.message || "Failed to identify card. Try again under better lighting.");
      setIdentifying(false);
    }
  }

  return {
    cameraRef,
    step,
    frontImage,
    backImage,
    processing,
    identifying,
    takePicture,
    resetScanner,
    startIdentification,
  };
}
