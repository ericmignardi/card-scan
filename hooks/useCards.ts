import { listCards } from "@/services/cardsService";
import { CardSummary } from "@/types/card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

// Loads the signed-in user's cards, backed by an on-device cache so the inventory
// screen has something to show immediately while the network fetch is in flight.
export function useCards(userId: string | undefined) {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cacheKey = userId ? `cached_cards_${userId}` : null;

  const loadCachedCards = useCallback(async () => {
    if (!cacheKey) return;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) setCards(JSON.parse(cached));
    } catch (err) {
      console.warn("Failed to load cached cards:", err);
    }
  }, [cacheKey]);

  const fetchCards = useCallback(async () => {
    if (!userId) return;
    try {
      const fetched = await listCards(userId);
      setCards(fetched);
      if (cacheKey) await AsyncStorage.setItem(cacheKey, JSON.stringify(fetched));
    } catch (err) {
      console.error("Error fetching cards from network:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cacheKey]);

  useFocusEffect(
    useCallback(() => {
      loadCachedCards().then(() => fetchCards());
    }, [loadCachedCards, fetchCards])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchCards();
  }, [fetchCards]);

  return { cards, loading, refreshing, refresh };
}
