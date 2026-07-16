import { deleteCard, getCard } from "@/services/cardsService";
import { CardDetails } from "@/types/card";
import { Badge } from "@/components/ui/Badge";
import { CardImageTile } from "@/components/ui/CardImageTile";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CardDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [card, setCard] = useState<CardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCardDetails() {
      try {
        setLoading(true);
        setCard(await getCard(id as string));
      } catch (err) {
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

  function handleDelete() {
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
              await deleteCard(card);
              Alert.alert("Deleted", "Card has been removed from your collection.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert("Delete Failed", err.message || "An error occurred.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
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
      <ScreenHeader
        title="Card details"
        onBack={() => router.back()}
        backDisabled={deleting}
        rightSlot={
          <TouchableOpacity
            onPress={handleDelete}
            className="p-2 bg-red-950/20 border border-red-500/20 rounded-full"
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </TouchableOpacity>
        }
      />

      <View className="flex-row justify-between mb-6">
        <CardImageTile uri={card.front_image_url} side="front" />
        <CardImageTile uri={card.back_image_url} side="back" />
      </View>

      <View className="bg-background-card p-5 rounded-2xl border border-border mb-6 space-y-4">
        <View>
          <Text className="text-foreground-muted text-xs font-semibold uppercase tracking-wider mb-0.5">
            Player
          </Text>
          <Text className="text-white text-2xl font-black">{card.player_name}</Text>
        </View>

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
            <Text className="text-white text-base font-bold">#{card.card_number}</Text>
          </View>
        </View>

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

        {(card.is_rookie ||
          card.is_hall_of_famer ||
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
                {card.is_rookie && <Badge label="🌟 Rookie Card" className="bg-rookie" textClassName="text-black" />}
                {card.is_hall_of_famer && <Badge label="🏆 Hall of Famer" className="bg-hof" />}
                {card.is_autographed && <Badge label="✍️ Autographed" className="bg-blue-600/90" />}
                {card.is_insert && <Badge label="✨ Insert / Subset" className="bg-purple-600/90" />}
                {card.is_memorabilia && <Badge label="🎫 Relic / Memorabilia" className="bg-teal-600/90" />}
              </View>
            </View>
          </>
        )}

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
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">Serial</Text>
                  <Text className="text-white text-xs font-bold mt-1" numberOfLines={1}>
                    {card.parallel_attributes.serial_num || "None"}
                  </Text>
                </View>
                <View className="w-[31%] bg-background p-2.5 rounded-xl border border-border items-center">
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">Color</Text>
                  <Text className="text-white text-xs font-bold mt-1" numberOfLines={1}>
                    {card.parallel_attributes.color || "Base"}
                  </Text>
                </View>
                <View className="w-[31%] bg-background p-2.5 rounded-xl border border-border items-center">
                  <Text className="text-foreground-muted text-[10px] uppercase font-bold">Variation</Text>
                  <Text className="text-white text-xs font-bold mt-1" numberOfLines={1}>
                    {card.parallel_attributes.variation || "None"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

      <View className="h-16" />
    </ScrollView>
  );
}
