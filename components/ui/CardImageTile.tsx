import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { Image } from "@/components/ui/Image";

interface CardImageTileProps {
  uri: string | null | undefined;
  side: "front" | "back";
}

export function CardImageTile({ uri, side }: CardImageTileProps) {
  const label = side === "front" ? "Front" : "Back";
  const badgeClassName = side === "front" ? "bg-primary" : "bg-rookie";

  return (
    <View className="w-[48%] aspect-[3/4] bg-background-card border border-border rounded-2xl overflow-hidden relative shadow-md">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" contentFit="cover" />
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
