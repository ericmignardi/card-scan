import React, { useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, Image, ScrollView } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface Card {
  id: string;
  player_name: string;
  brand: string;
  year: number;
  sport: string;
  front_image_url: string;
  is_rookie: boolean;
  is_autographed: boolean;
}

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
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch cards from Supabase
  const fetchCards = async (showLoader = true) => {
    if (!user) return;
    if (showLoader) setLoading(true);

    try {
      let query = supabase
        .from("cards")
        .select("id, player_name, brand, year, sport, front_image_url, is_rookie, is_autographed")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setCards(data || []);
      applyFiltersAndSearch(data || [], selectedCategory, searchQuery);
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch every time this tab screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCards(cards.length === 0); // Only show loading spinner on initial load
    }, [user])
  );

  // Apply filters and searches locally for instantaneous feedback
  const applyFiltersAndSearch = (allCards: Card[], category: string, search: string) => {
    let result = [...allCards];

    // 1. Apply category filter
    if (category !== "all") {
      if (category === "rookies") {
        result = result.filter((c) => c.is_rookie);
      } else if (category === "autographs") {
        result = result.filter((c) => c.is_autographed);
      } else {
        result = result.filter((c) => c.sport === category);
      }
    }

    // 2. Apply search query
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.player_name.toLowerCase().includes(query) ||
          c.brand.toLowerCase().includes(query) ||
          c.year.toString().includes(query)
      );
    }

    setFilteredCards(result);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    applyFiltersAndSearch(cards, categoryId, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    applyFiltersAndSearch(cards, selectedCategory, text);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCards(false);
  };

  const renderCardItem = ({ item }: { item: Card }) => (
    <TouchableOpacity
      className="w-[48%] bg-background-card border border-border rounded-2xl overflow-hidden mb-4 shadow-sm"
      onPress={() => router.push(`/card/${item.id}`)}
    >
      <View className="aspect-[3/4] w-full bg-slate-900 relative">
        <Image source={{ uri: item.front_image_url }} className="w-full h-full" resizeMode="cover" />
        
        {/* Rookie Badge Overlay */}
        {item.is_rookie && (
          <View className="absolute top-2 left-2 bg-rookie px-2 py-0.5 rounded-md border border-yellow-400/20 shadow">
            <Text className="text-black text-[9px] font-black">RC</Text>
          </View>
        )}

        {/* Sport Badge Overlay */}
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
      {/* Header */}
      <View className="px-6 mb-4">
        <Text className="text-3xl font-extrabold text-white">
          Inventory<Text className="text-primary">.</Text>
        </Text>
        <Text className="text-foreground-muted text-sm mt-0.5">
          Browsing {cards.length} cards in your catalog
        </Text>
      </View>

      {/* Search Input */}
      <View className="px-6 mb-4">
        <View className="bg-background-card border border-border rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search by player, brand, or year..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Horizontal Category Scroller */}
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
                onPress={() => handleCategorySelect(cat.id)}
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

      {/* Collection Grid List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
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
          onRefresh={handleRefresh}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <View className="items-center pb-24">
            <Ionicons name="albums-outline" size={64} color="#334155" />
            <Text className="text-white text-xl font-bold mt-4 text-center">
              {searchQuery || selectedCategory !== "all" ? "No matches found" : "Your catalog is empty"}
            </Text>
            <Text className="text-foreground-muted text-sm text-center mt-2 max-w-xs">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search criteria or resetting filters."
                : "Tap the Scanner tab at the bottom to crop and identify your first sports card!"}
            </Text>
            {(searchQuery || selectedCategory !== "all") && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  applyFiltersAndSearch(cards, "all", "");
                }}
                className="mt-6 border border-border px-5 py-2.5 rounded-full"
              >
                <Text className="text-primary font-bold text-sm">Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
