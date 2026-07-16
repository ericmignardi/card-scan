import { useAuth } from "@/context/AuthContext";
import { insertCards } from "@/services/cardsService";
import { identifyLot } from "@/services/identifyService";
import { getCardImagePublicUrl, removeCardImages, uploadCardImage } from "@/services/storageService";
import { AILotCard, CardFields, NewCardInput } from "@/types/card";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useRef, useState } from "react";
import { Alert } from "react-native";

export type LotStep = "capture" | "review" | "results";

// The group photo is only ever read by Gemini, so it is sized for legibility of many small
// cards at once rather than for storage. Individual cards are cropped from the original
// full-resolution capture instead, so their images stay sharp.
const DETECTION_WIDTH = 2400;
const CROP_WIDTH = 900;

export interface DetectedCard {
  fields: CardFields;
  cropUri: string;
  included: boolean;
}

export function useLotScanner() {
  const { user } = useAuth();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<LotStep>("capture");
  const [lotImage, setLotImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detected, setDetected] = useState<DetectedCard[]>([]);

  // Bounding boxes are normalized against the full image, so the original pixel dimensions
  // are needed to turn them back into a crop rectangle.
  const sourceSize = useRef<{ width: number; height: number } | null>(null);

  async function takePicture() {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) return;

      sourceSize.current = { width: photo.width, height: photo.height };
      setLotImage(photo.uri);
      setStep("review");
    } catch (err) {
      console.error("Lot capture error:", err);
      Alert.alert("Capture Error", "Failed to take photo. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  function resetScanner() {
    setLotImage(null);
    setDetected([]);
    setStep("capture");
    setIdentifying(false);
    sourceSize.current = null;
  }

  async function startIdentification() {
    if (!lotImage || !sourceSize.current) return;
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to scan cards.");
      return;
    }

    setIdentifying(true);

    // The group photo exists only so the edge function can read it, and is removed as soon
    // as identification returns. Individual card images are uploaded later, at save time,
    // so abandoning the review leaves nothing behind in Storage.
    let lotPath: string | null = null;

    try {
      const detectionUri = await resizeForDetection(lotImage);
      lotPath = await uploadCardImage(user.id, detectionUri, "lot");

      const cards = await identifyLot(lotPath);

      if (cards.length === 0) {
        throw new Error("No cards were found in that photo. Try again with the cards laid flat and fully visible.");
      }

      const crops = await cropDetectedCards(lotImage, sourceSize.current, cards);
      setDetected(crops);
      setStep("results");
    } catch (err: any) {
      console.error("Lot identification failed:", err);
      Alert.alert("Identification Failed", err.message || "Failed to identify the cards. Try again under better lighting.");
    } finally {
      if (lotPath) await removeCardImages([lotPath]);
      setIdentifying(false);
    }
  }

  function toggleCard(index: number) {
    setDetected((current) =>
      current.map((card, i) => (i === index ? { ...card, included: !card.included } : card))
    );
  }

  async function saveDetectedCards() {
    if (!user) return;

    const keeping = detected.filter((card) => card.included);
    if (keeping.length === 0) {
      Alert.alert("Nothing Selected", "Select at least one card to add to your collection.");
      return;
    }

    setSaving(true);

    // Same discipline as the single scan: track what actually reached Storage so a failure
    // part-way through does not strand images with no row pointing at them.
    const uploadedPaths: string[] = [];

    try {
      const uploads = await Promise.allSettled(
        keeping.map((card, index) => uploadCardImage(user.id, card.cropUri, `lot_${index}`))
      );

      for (const upload of uploads) {
        if (upload.status === "fulfilled") uploadedPaths.push(upload.value);
      }

      const failedUpload = uploads.find((upload): upload is PromiseRejectedResult => upload.status === "rejected");
      if (failedUpload) throw failedUpload.reason;

      const rows: NewCardInput[] = keeping.map((card, index) => ({
        ...card.fields,
        user_id: user.id,
        front_image_url: getCardImagePublicUrl(uploadedPaths[index]),
        back_image_url: null,
      }));

      await insertCards(rows);

      Alert.alert("Success", `Added ${rows.length} card${rows.length === 1 ? "" : "s"} to your collection!`, [
        {
          text: "OK",
          onPress: () => {
            resetScanner();
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      await removeCardImages(uploadedPaths);
      console.error("Saving lot failed:", err);
      Alert.alert("Save Failed", err.message || "Failed to save the cards.");
    } finally {
      setSaving(false);
    }
  }

  return {
    cameraRef,
    step,
    lotImage,
    processing,
    identifying,
    saving,
    detected,
    includedCount: detected.filter((card) => card.included).length,
    takePicture,
    resetScanner,
    startIdentification,
    toggleCard,
    saveDetectedCards,
  };
}

async function resizeForDetection(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const rendered = await context.resize({ width: DETECTION_WIDTH }).renderAsync();
    try {
      return (await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })).uri;
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}

async function cropDetectedCards(
  uri: string,
  size: { width: number; height: number },
  cards: AILotCard[]
): Promise<DetectedCard[]> {
  const crops: DetectedCard[] = [];

  // Sequential rather than parallel: each crop decodes the full-resolution photo, and
  // doing a dozen of those at once is a reliable way to get killed for memory on a phone.
  for (const card of cards) {
    try {
      const cropUri = await cropCard(uri, size, card.box_2d);
      const { box_2d, ...fields } = card;
      crops.push({ fields, cropUri, included: true });
    } catch (err) {
      // A card we cannot crop is one we cannot show or store an image for, so it is
      // dropped rather than saved pointing at the wrong picture.
      console.warn("Skipping card that could not be cropped:", err);
    }
  }

  return crops;
}

async function cropCard(
  uri: string,
  size: { width: number; height: number },
  box: [number, number, number, number]
): Promise<string> {
  const [ymin, xmin, ymax, xmax] = box;

  // Clamp to the image: a box that runs even slightly past the edge makes the crop throw.
  const originX = clamp((xmin / 1000) * size.width, 0, size.width - 1);
  const originY = clamp((ymin / 1000) * size.height, 0, size.height - 1);
  const width = clamp((xmax / 1000) * size.width - originX, 1, size.width - originX);
  const height = clamp((ymax / 1000) * size.height - originY, 1, size.height - originY);

  const context = ImageManipulator.manipulate(uri);
  try {
    const rendered = await context
      .crop({ originX, originY, width, height })
      .resize({ width: Math.min(CROP_WIDTH, Math.round(width)) })
      .renderAsync();
    try {
      return (await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })).uri;
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
