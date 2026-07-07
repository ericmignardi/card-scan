import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCards } from "@/hooks/useCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { Image } from "@/components/ui/Image";
import { colors } from "@/constants/theme";
import { CardSummary } from "@/types/card";
import Ionicons from "@expo/vector-icons/Ionicons";

const CATEGORIES = [
  { id: "all", label: "All Cards" },
  { id: "Baseball", label: "Baseball" },
  { id: "Basketball", label: "Basketball" },
  { id: "Football", label: "Football" },
  { id: "Soccer", label: "Soccer" },
  { id: "Hockey", label: "Hockey" },
  { id: "rookies", label: "Rookies 🌟" },
  { id: "autographs", label: "Autographs ✍️" },
];

export default function InventoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { cards, loading, refreshing, refresh } = useCards(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredCards = useMemo(() => {
    let result = [...cards];

    if (selectedCategory !== "all") {
      if (selectedCategory === "rookies") {
        result = result.filter((c) => c.is_rookie);
      } else if (selectedCategory === "autographs") {
        result = result.filter((c) => c.is_autographed);
      } else {
        result = result.filter((c) => c.sport === selectedCategory);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.player_name.toLowerCase().includes(query) ||
          c.brand.toLowerCase().includes(query) ||
          c.year.toString().includes(query)
      );
    }

    return result;
  }, [cards, selectedCategory, searchQuery]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all";

  const renderCardItem = ({ item }: { item: CardSummary }) => (
    <TouchableOpacity
      className="w-[48%] bg-background-card border border-border rounded-2xl overflow-hidden mb-4 shadow-sm"
      onPress={() => router.push(`/card/${item.id}`)}
    >
      <View className="aspect-[3/4] w-full bg-slate-900 relative">
        <Image source={{ uri: item.front_image_url }} className="w-full h-full" contentFit="cover" />

        {item.is_rookie && (
          <View className="absolute top-2 left-2 bg-rookie px-2 py-0.5 rounded-md border border-yellow-400/20 shadow">
            <Text className="text-black text-[9px] font-black">RC</Text>
          </View>
        )}

        <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-md">
          <Text className="text-white text-[9px] font-semibold">{item.sport}</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-white font-bold text-sm" numberOfLines={1}>
          {item.player_name}
        </Text>
        <Text className="text-foreground-muted text-[11px] mt-0.5" numberOfLines={1}>
          {item.year} {item.brand}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-6 mb-4">
        <Text className="text-3xl font-extrabold text-white">
          Inventory<Text className="text-primary">.</Text>
        </Text>
        <Text className="text-foreground-muted text-sm mt-0.5">
          Browsing {cards.length} cards in your catalog
        </Text>
      </View>

      <View className="px-6 mb-4">
        <View className="bg-background-card border border-border rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color={colors.foregroundMuted} style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search by player, brand, or year..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`mr-2.5 px-4 py-2 rounded-full border ${
                  isActive ? "bg-primary border-primary" : "bg-background-card border-border"
                }`}
              >
                <Text className={`font-bold text-xs ${isActive ? "text-white" : "text-foreground-muted"}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredCards.length > 0 ? (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={renderCardItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
        >
          <EmptyState
            icon="albums-outline"
            title={hasActiveFilters ? "No matches found" : "Your catalog is empty"}
            subtitle={
              hasActiveFilters
                ? "Try adjusting your search criteria or resetting filters."
                : "Tap the Scanner tab at the bottom to crop and identify your first sports card!"
            }
            actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
            onAction={
              hasActiveFilters
                ? () => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }
                : undefined
            }
          />
        </ScrollView>
      )}
    </View>
  );
}
