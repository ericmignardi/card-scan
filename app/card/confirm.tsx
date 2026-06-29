import React, { useState, useEffect } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View, ScrollView, Image, ActivityIndicator, Switch } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function ConfirmCardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse details passed from Scanner
  const { frontPath, backPath, aiResult } = params;
  const initialData = aiResult ? JSON.parse(aiResult as string) : {};

  // Form states
  const [playerName, setPlayerName] = useState(initialData.player_name || "");
  const [year, setYear] = useState(initialData.year?.toString() || "");
  const [brand, setBrand] = useState(initialData.brand || "");
  const [cardNumber, setCardNumber] = useState(initialData.card_number || "");
  const [sport, setSport] = useState(initialData.sport || "Baseball");
  const [isRookie, setIsRookie] = useState(initialData.is_rookie || false);
  const [isInsert, setIsInsert] = useState(initialData.is_insert || false);
  const [isAutographed, setIsAutographed] = useState(initialData.is_autographed || false);
  const [isMemorabilia, setIsMemorabilia] = useState(initialData.is_memorabilia || false);
  
  // Parallel attributes
  const [serialNum, setSerialNum] = useState(initialData.parallel_attributes?.serial_num || "");
  const [color, setColor] = useState(initialData.parallel_attributes?.color || "");
  const [variation, setVariation] = useState(initialData.parallel_attributes?.variation || "");

  const [saving, setSaving] = useState(false);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  // Fetch public URLs for images to display on screen
  useEffect(() => {
    if (frontPath && backPath) {
      const { data: frontData } = supabase.storage.from("card-images").getPublicUrl(frontPath as string);
      const { data: backData } = supabase.storage.from("card-images").getPublicUrl(backPath as string);
      setFrontUrl(frontData.publicUrl);
      setBackUrl(backData.publicUrl);
    }
  }, [frontPath, backPath]);

  async function handleSave() {
    if (!playerName || !year || !brand || !cardNumber) {
      Alert.alert("Error", "Please fill in all core details (Player, Year, Brand, Card #).");
      return;
    }

    if (!user) {
      Alert.alert("Error", "No authenticated session. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      // Insert card into database
      const { error } = await supabase.from("cards").insert({
        user_id: user.id,
        front_image_url: frontUrl,
        back_image_url: backUrl,
        sport,
        player_name: playerName.trim(),
        year: parseInt(year, 10),
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

      if (error) {
        throw error;
      }

      Alert.alert("Success", "Card added to your collection!", [
        {
          text: "OK",
          onPress: () => {
            // Reset routing stack and go to collection index
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
            // Delete files from storage to prevent orphans
            if (frontPath && backPath) {
              await supabase.storage.from("card-images").remove([frontPath as string, backPath as string]);
            }
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-12">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={handleCancel} className="p-2 bg-background-card rounded-full border border-border">
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Confirm Details</Text>
        <View className="w-10" />
      </View>

      {/* Card Preview Images */}
      <View className="flex-row justify-between mb-6">
        <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
          {frontUrl ? (
            <Image source={{ uri: frontUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <ActivityIndicator size="small" color="#3b82f6" className="m-auto" />
          )}
          <View className="absolute bottom-2 left-2 bg-primary px-3 py-1 rounded-lg">
            <Text className="text-white text-[10px] font-bold">Front</Text>
          </View>
        </View>

        <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
          {backUrl ? (
            <Image source={{ uri: backUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <ActivityIndicator size="small" color="#eab308" className="m-auto" />
          )}
          <View className="absolute bottom-2 left-2 bg-rookie px-3 py-1 rounded-lg">
            <Text className="text-white text-[10px] font-bold">Back</Text>
          </View>
        </View>
      </View>

      {/* Edit Form */}
      <View className="bg-background-card p-5 rounded-2xl border border-border mb-8 space-y-4">
        {/* Player Name */}
        <View>
          <Text className="text-foreground-muted text-xs font-semibold mb-1">Player Name</Text>
          <TextInput
            className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary text-base"
            value={playerName}
            onChangeText={setPlayerName}
          />
        </View>

        {/* Brand & Card Number (Row) */}
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold mb-1">Brand/Series</Text>
            <TextInput
              className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary text-base"
              value={brand}
              onChangeText={setBrand}
            />
          </View>
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold mb-1">Card Number (#)</Text>
            <TextInput
              className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary text-base"
              value={cardNumber}
              onChangeText={setCardNumber}
            />
          </View>
        </View>

        {/* Year & Sport (Row) */}
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold mb-1">Year</Text>
            <TextInput
              className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary text-base"
              keyboardType="number-pad"
              value={year}
              onChangeText={setYear}
            />
          </View>
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold mb-1">Sport</Text>
            <TextInput
              className="bg-background text-white border border-border rounded-xl px-4 py-3 focus:border-primary text-base"
              value={sport}
              onChangeText={setSport}
            />
          </View>
        </View>

        <View className="border-t border-border/50 my-2" />

        {/* Attribute Toggles */}
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

        {/* Parallel Attributes */}
        <View className="space-y-4">
          <Text className="text-white font-bold text-sm">Parallel & Variations</Text>
          <View className="flex-row justify-between">
            <View className="w-[31%]">
              <Text className="text-foreground-muted text-xs mb-1">Serial Num</Text>
              <TextInput
                className="bg-background text-white border border-border rounded-xl px-3 py-2 text-sm focus:border-primary"
                placeholder="e.g. 99/99"
                placeholderTextColor="#64748b"
                value={serialNum}
                onChangeText={setSerialNum}
              />
            </View>
            <View className="w-[31%]">
              <Text className="text-foreground-muted text-xs mb-1">Color/Refractor</Text>
              <TextInput
                className="bg-background text-white border border-border rounded-xl px-3 py-2 text-sm focus:border-primary"
                placeholder="e.g. Gold"
                placeholderTextColor="#64748b"
                value={color}
                onChangeText={setColor}
              />
            </View>
            <View className="w-[31%]">
              <Text className="text-foreground-muted text-xs mb-1">Variation</Text>
              <TextInput
                className="bg-background text-white border border-border rounded-xl px-3 py-2 text-sm focus:border-primary"
                placeholder="e.g. Holo"
                placeholderTextColor="#64748b"
                value={variation}
                onChangeText={setVariation}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 pb-16">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl shadow-lg flex-row justify-center items-center"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="text-white text-center font-bold text-lg">Add to Collection</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-red-500/20 bg-red-950/10 py-4 rounded-xl flex-row justify-center items-center"
          onPress={handleCancel}
          disabled={saving}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text className="text-red-500 text-center font-bold text-lg">Discard Scan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
