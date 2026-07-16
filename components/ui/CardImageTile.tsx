import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/constants/theme";
import { Image } from "@/components/ui/Image";

interface CardImageTileProps {
  uri: string | null | undefined;
  side: "front" | "back";
  // Shown instead of a spinner when the image is absent by design rather than still
  // loading — a lot-scanned card genuinely has no back photo and never will.
  emptyText?: string;
}

export function CardImageTile({ uri, side, emptyText }: CardImageTileProps) {
  const label = side === "front" ? "Front" : "Back";
  const badgeClassName = side === "front" ? "bg-primary" : "bg-rookie";

  return (
    <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" contentFit="cover" />
      ) : emptyText ? (
        <View className="w-full h-full items-center justify-center px-3">
          <Ionicons name="image-outline" size={24} color={colors.foregroundMuted} />
          <Text className="text-foreground-muted text-[10px] font-semibold text-center mt-2">{emptyText}</Text>
        </View>
      ) : (
        <View className="w-full h-full items-center justify-center">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <View className={`absolute bottom-2 left-2 px-3 py-1 rounded-lg ${badgeClassName}`}>
        <Text className="text-white text-[10px] font-bold">{label}</Text>
      </View>
    </View>
  );
}
