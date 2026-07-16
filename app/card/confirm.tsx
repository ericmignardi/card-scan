import React, { useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { insertCard } from "@/services/cardsService";
import { getCardImagePublicUrl, removeCardImages } from "@/services/storageService";
import { useAuth } from "@/context/AuthContext";
import { AICardResult, CardFields } from "@/types/card";
import { CardForm } from "@/components/CardForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export default function ConfirmCardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { frontPath, backPath, aiResult } = params;
  const initialData: Partial<AICardResult> = aiResult ? JSON.parse(aiResult as string) : {};

  const [saving, setSaving] = useState(false);

  // getPublicUrl is a pure client-side string build (no network call), so this can be
  // computed directly instead of stashed in state behind a useEffect.
  const frontUrl = useMemo(() => (frontPath ? getCardImagePublicUrl(frontPath as string) : null), [frontPath]);
  const backUrl = useMemo(() => (backPath ? getCardImagePublicUrl(backPath as string) : null), [backPath]);

  async function handleSave(fields: CardFields) {
    if (!user || !frontUrl || !backUrl) {
      Alert.alert("Error", "No authenticated session. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      await insertCard({
        ...fields,
        user_id: user.id,
        front_image_url: frontUrl,
        back_image_url: backUrl,
      });

      Alert.alert("Success", "Card added to your collection!", [
        {
          text: "OK",
          onPress: () => {
            router.dismissAll();
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("Database Error", err.message || "Failed to save card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    Alert.alert(
      "Discard Card",
      "Are you sure you want to discard this card scan? Uploaded images will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (frontPath && backPath) {
              await removeCardImages([frontPath as string, backPath as string]);
            }
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-12">
      <ScreenHeader title="Confirm Details" onBack={handleCancel} />

      <CardForm
        initialValues={initialData}
        frontUrl={frontUrl}
        backUrl={backUrl}
        submitting={saving}
        submitLabel="Add to Collection"
        submitIcon="checkmark-circle-outline"
        onSubmit={handleSave}
        cancelLabel="Discard Scan"
        cancelIcon="trash-outline"
        cancelVariant="danger-outline"
        onCancel={handleCancel}
      />
    </ScrollView>
  );
}
