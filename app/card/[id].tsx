import { CardDetails } from "@/types/card";
import { supabase } from "@/utils/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CardDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<CardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Fetch card details on mount
  useEffect(() => {
    async function fetchCardDetails() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("cards")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        setCard(data);
      } catch (err: any) {
        console.error("Error fetching card details:", err);
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

  // Utility to extract storage path from public URL
  function getStoragePathFromUrl(url: string): string | null {
    if (!url) return null;
    // Public URL format: .../storage/v1/object/public/card-images/user_id/filename.jpg
    const separator = "/card-images/";
    const parts = url.split(separator);
    if (parts.length > 1) {
      return parts[1];
    }
    return null;
  }

  async function handleDelete() {
    if (!card) return;

    Alert.alert(
      "Delete Card",
      "Are you sure you want to permanently delete this card from your collection? This will also remove the card images from storage.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              // 1. Delete images from Supabase Storage
              const frontPath = getStoragePathFromUrl(card.front_image_url);
              const backPath = getStoragePathFromUrl(card.back_image_url);
              const pathsToRemove = [frontPath, backPath].filter(
                Boolean,
              ) as string[];

              if (pathsToRemove.length > 0) {
                const { error: storageError } = await supabase.storage
                  .from("card-images")
                  .remove(pathsToRemove);

                if (storageError) {
                  console.warn(
                    "Storage deletion warning:",
                    storageError.message,
                  );
                }
              }

              // 2. Delete row from Database
              const { error: dbError } = await supabase
                .from("cards")
                .delete()
                .eq("id", card.id);

              if (dbError) {
                throw dbError;
              }

              Alert.alert(
                "Deleted",
                "Card has been removed from your collection.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.back();
                    },
                  },
                ],
              );
            } catch (err: any) {
              Alert.alert("Delete Failed", err.message || "An error occurred.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!card) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-white text-lg">Card not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-6 pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-background-card rounded-full border border-border"
          disabled={deleting}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Card details</Text>
        <TouchableOpacity
          onPress={handleDelete}
          className="p-2 bg-red-950/20 border border-red-500/20 rounded-full"
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>

      {/* Card Visuals (Side-by-Side Images) */}
      <View className="flex-row justify-between mb-6">
        <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
          <Image
            source={{ uri: card.front_image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute bottom-2 left-2 bg-primary px-3 py-1 rounded-lg">
            <Text className="text-white text-[10px] font-bold">Front</Text>
          </View>
        </View>

        <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
          <Image
            source={{ uri: card.back_image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute bottom-2 left-2 bg-rookie px-3 py-1 rounded-lg">
            <Text className="text-white text-[10px] font-bold">Back</Text>
          </View>
        </View>
      </View>

      {/* Card Detail Card */}
      <View className="bg-background-card p-5 rounded-2xl border border-border mb-6 space-y-4">
        {/* Player Name */}
        <View>
          <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
            Player
          </Text>
          <Text className="text-white text-2xl font-black">
            {card.player_name}
          </Text>
        </View>

        {/* Brand & Card Number (Row) */}
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
              Brand
            </Text>
            <Text className="text-white text-base font-bold">{card.brand}</Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
              Card Number
            </Text>
            <Text className="text-white text-base font-bold">
              #{card.card_number}
            </Text>
          </View>
        </View>

        {/* Year & Sport (Row) */}
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
              Release Year
            </Text>
            <Text className="text-white text-base font-bold">{card.year}</Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
              Sport
            </Text>
            <Text className="text-white text-base font-bold">{card.sport}</Text>
          </View>
        </View>

        {/* Dynamic Badge Display */}
        {(card.is_rookie ||
          card.is_autographed ||
          card.is_insert ||
          card.is_memorabilia) && (
          <>
            <View className="border-t border-border/50 my-1" />
            <View>
              <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-2">
                Attributes
              </Text>
              <View className="flex-row flex-wrap">
                {card.is_rookie && (
                  <View className="bg-rookie px-3 py-1.5 rounded-lg mr-2 mb-2 border border-yellow-400/20">
                    <Text className="text-black text-xs font-black">
                      🌟 Rookie Card
                    </Text>
                  </View>
                )}
                {card.is_autographed && (
                  <View className="bg-blue-600/90 px-3 py-1.5 rounded-lg mr-2 mb-2 border border-blue-500/20">
                    <Text className="text-white text-xs font-bold">
                      ✍️ Autographed
                    </Text>
                  </View>
                )}
                {card.is_insert && (
                  <View className="bg-purple-600/90 px-3 py-1.5 rounded-lg mr-2 mb-2 border border-purple-500/20">
                    <Text className="text-white text-xs font-bold">
                      ✨ Insert / Subset
                    </Text>
                  </View>
                )}
                {card.is_memorabilia && (
                  <View className="bg-teal-600/90 px-3 py-1.5 rounded-lg mr-2 mb-2 border border-teal-500/20">
                    <Text className="text-white text-xs font-bold">
                      🎫 Relic / Memorabilia
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Parallel Attributes Details */}
        {(card.parallel_attributes?.serial_num ||
          card.parallel_attributes?.color ||
          card.parallel_attributes?.variation) && (
          <>
            <View className="border-t border-border/50 my-1" />
            <View>
              <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-2">
                Parallel Details
              </Text>
              <View className="flex-row justify-between">
                <View className="w-[31%] bg-background p-2.5 rounded-xl border border-border items-center">
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">
                    Serial
                  </Text>
                  <Text
                    className="text-white text-xs font-bold mt-1"
                    numberOfLines={1}
                  >
                    {card.parallel_attributes.serial_num || "None"}
                  </Text>
                </View>
                <View className="w-[31%] bg-background p-2.5 rounded-xl border border-border items-center">
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">
                    Color
                  </Text>
                  <Text
                    className="text-white text-xs font-bold mt-1"
                    numberOfLines={1}
                  >
                    {card.parallel_attributes.color || "Base"}
                  </Text>
                </View>
                <View className="w-[31%] bg-background p-2.5 rounded-xl border border-border items-center">
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">
                    Variation
                  </Text>
                  <Text
                    className="text-white text-xs font-bold mt-1"
                    numberOfLines={1}
                  >
                    {card.parallel_attributes.variation || "None"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Spacer for bottom padding on scroll */}
      <View className="h-16" />
    </ScrollView>
  );
}
