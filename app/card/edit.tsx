import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCard, updateCard } from "@/services/cardsService";
import { CardDetails, CardFields } from "@/types/card";
import { CardForm } from "@/components/CardForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/theme";

export default function EditCardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<CardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCardDetails() {
      try {
        setCard(await getCard(id as string));
      } catch (err) {
        console.error("Error fetching card for edit:", err);
        Alert.alert("Error", "Could not load card details.");
        router.back();
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCardDetails();
    }
  }, [id, router]);

  async function handleSave(fields: CardFields) {
    if (!card) return;

    setSaving(true);

    try {
      await updateCard(card.id, fields);
      Alert.alert("Saved", "Card details updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Update Failed", err.message || "Failed to update card.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!card) return null;

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-12">
      <ScreenHeader title="Edit Card" onBack={() => router.back()} backDisabled={saving} />

      <CardForm
        initialValues={card}
        frontUrl={card.front_image_url}
        backUrl={card.back_image_url}
        backEmptyText="No back image (lot scan)"
        submitting={saving}
        submitLabel="Save Changes"
        submitIcon="save-outline"
        onSubmit={handleSave}
        cancelLabel="Cancel"
        cancelIcon="close-outline"
        onCancel={() => router.back()}
      />
    </ScrollView>
  );
}
