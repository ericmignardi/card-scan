import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { insertCard } from "@/services/cardsService";
import { getCardImagePublicUrl, removeCardImages } from "@/services/storageService";
import { useAuth } from "@/context/AuthContext";
import { AICardResult } from "@/types/card";
import { SPORTS, Sport } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { CardImageTile } from "@/components/ui/CardImageTile";
import { FormField } from "@/components/ui/FormField";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export default function ConfirmCardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { frontPath, backPath, aiResult } = params;
  const initialData: Partial<AICardResult> = aiResult ? JSON.parse(aiResult as string) : {};

  const [playerName, setPlayerName] = useState(initialData.player_name || "");
  const [year, setYear] = useState(initialData.year?.toString() || "");
  const [brand, setBrand] = useState(initialData.brand || "");
  const [cardNumber, setCardNumber] = useState(initialData.card_number || "");
  const [sport, setSport] = useState<Sport>(initialData.sport || "Baseball");
  const [isRookie, setIsRookie] = useState(initialData.is_rookie || false);
  const [isInsert, setIsInsert] = useState(initialData.is_insert || false);
  const [isAutographed, setIsAutographed] = useState(initialData.is_autographed || false);
  const [isMemorabilia, setIsMemorabilia] = useState(initialData.is_memorabilia || false);

  const [serialNum, setSerialNum] = useState(initialData.parallel_attributes?.serial_num || "");
  const [color, setColor] = useState(initialData.parallel_attributes?.color || "");
  const [variation, setVariation] = useState(initialData.parallel_attributes?.variation || "");

  const [saving, setSaving] = useState(false);

  // getPublicUrl is a pure client-side string build (no network call), so this can be
  // computed directly instead of stashed in state behind a useEffect.
  const frontUrl = useMemo(() => (frontPath ? getCardImagePublicUrl(frontPath as string) : null), [frontPath]);
  const backUrl = useMemo(() => (backPath ? getCardImagePublicUrl(backPath as string) : null), [backPath]);

  async function handleSave() {
    const parsedYear = parseInt(year, 10);

    if (!playerName.trim() || !brand.trim() || !cardNumber.trim() || !year || Number.isNaN(parsedYear)) {
      Alert.alert("Error", "Please fill in all core details (Player, Year, Brand, Card #).");
      return;
    }

    if (!user || !frontUrl || !backUrl) {
      Alert.alert("Error", "No authenticated session. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      await insertCard({
        user_id: user.id,
        front_image_url: frontUrl,
        back_image_url: backUrl,
        sport,
        player_name: playerName.trim(),
        year: parsedYear,
        brand: brand.trim(),
        card_number: cardNumber.trim(),
        is_rookie: isRookie,
        is_insert: isInsert,
        is_autographed: isAutographed,
        is_memorabilia: isMemorabilia,
        parallel_attributes: {
          serial_num: serialNum.trim(),
          color: color.trim(),
          variation: variation.trim(),
        },
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

      <View className="flex-row justify-between mb-6">
        <CardImageTile uri={frontUrl} side="front" />
        <CardImageTile uri={backUrl} side="back" />
      </View>

      <View className="bg-background-card p-5 rounded-2xl border border-border mb-8 space-y-4">
        <FormField label="Player Name" value={playerName} onChangeText={setPlayerName} />

        <View className="flex-row justify-between">
          <FormField
            label="Brand/Series"
            containerClassName="w-[48%]"
            value={brand}
            onChangeText={setBrand}
          />
          <FormField
            label="Card Number (#)"
            containerClassName="w-[48%]"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
        </View>

        <View className="flex-row justify-between">
          <FormField
            label="Year"
            containerClassName="w-[48%]"
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
          />
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-sm font-semibold mb-2">Sport</Text>
            <View className="flex-row flex-wrap">
              {SPORTS.map((option) => {
                const isActive = sport === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSport(option)}
                    className={`mr-1.5 mb-1.5 px-3 py-1.5 rounded-full border ${
                      isActive ? "bg-primary border-primary" : "bg-background border-border"
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-foreground-muted"}`}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View className="border-t border-border/50 my-2" />

        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-sm font-semibold">Rookie Card (RC)</Text>
            <Switch value={isRookie} onValueChange={setIsRookie} trackColor={{ true: "#3b82f6" }} />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-sm font-semibold">Insert Card</Text>
            <Switch value={isInsert} onValueChange={setIsInsert} trackColor={{ true: "#3b82f6" }} />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-sm font-semibold">Autographed</Text>
            <Switch value={isAutographed} onValueChange={setIsAutographed} trackColor={{ true: "#3b82f6" }} />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-sm font-semibold">Memorabilia/Relic</Text>
            <Switch value={isMemorabilia} onValueChange={setIsMemorabilia} trackColor={{ true: "#3b82f6" }} />
          </View>
        </View>

        <View className="border-t border-border/50 my-2" />

        <View className="space-y-4">
          <Text className="text-white font-bold text-sm">Parallel & Variations</Text>
          <View className="flex-row justify-between">
            <FormField
              label="Serial Num"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. 99/99"
              value={serialNum}
              onChangeText={setSerialNum}
            />
            <FormField
              label="Color/Refractor"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. Gold"
              value={color}
              onChangeText={setColor}
            />
            <FormField
              label="Variation"
              small
              containerClassName="w-[31%]"
              placeholder="e.g. Holo"
              value={variation}
              onChangeText={setVariation}
            />
          </View>
        </View>
      </View>

      <View className="space-y-3 pb-16">
        <Button title="Add to Collection" onPress={handleSave} loading={saving} icon="checkmark-circle-outline" />
        <Button
          title="Discard Scan"
          onPress={handleCancel}
          disabled={saving}
          variant="danger-outline"
          icon="trash-outline"
          className="mt-3"
        />
      </View>
    </ScrollView>
  );
}
