import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/Button";
import { Image } from "@/components/ui/Image";
import { colors } from "@/constants/theme";
import { DetectedCard } from "@/hooks/useLotScanner";

interface LotResultsProps {
  detected: DetectedCard[];
  includedCount: number;
  saving: boolean;
  onToggle: (index: number) => void;
  onSave: () => void;
  onRetake: () => void;
}

export function LotResults({
  detected,
  includedCount,
  saving,
  onToggle,
  onSave,
  onRetake,
}: LotResultsProps) {
  return (
    <View className="flex-1 bg-background pt-16">
      <View className="px-6 mb-1">
        <Text className="text-2xl font-bold text-white">
          Found {detected.length} card{detected.length === 1 ? "" : "s"}
        </Text>
        <Text className="text-foreground-muted text-sm mt-1">
          Tap any card to leave it out. Details come from the fronts only, so card numbers and serials may be
          blank — you can correct anything after saving.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {detected.map((card, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onToggle(index)}
            disabled={saving}
            className={`flex-row items-center bg-background-card border rounded-2xl p-3 mb-3 ${
              card.included ? "border-primary/60" : "border-border opacity-40"
            }`}
          >
            <Image
              source={{ uri: card.cropUri }}
              className="w-14 h-20 rounded-lg bg-slate-900"
              contentFit="cover"
            />

            <View className="flex-1 ml-3">
              <Text className="text-white font-bold text-base" numberOfLines={1}>
                {card.fields.player_name || "Unknown player"}
              </Text>
              <Text className="text-foreground-muted text-xs mt-0.5" numberOfLines={1}>
                {[card.fields.year || null, card.fields.brand || null, card.fields.sport]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>

              <View className="flex-row flex-wrap mt-1.5">
                {card.fields.is_rookie && (
                  <View className="bg-rookie px-2 py-0.5 rounded-md mr-1.5">
                    <Text className="text-black text-[9px] font-black">RC</Text>
                  </View>
                )}
                {card.fields.is_hall_of_famer && (
                  <View className="bg-hof px-2 py-0.5 rounded-md mr-1.5">
                    <Text className="text-white text-[9px] font-black">HOF</Text>
                  </View>
                )}
                {card.fields.is_autographed && (
                  <View className="bg-blue-600/90 px-2 py-0.5 rounded-md mr-1.5">
                    <Text className="text-white text-[9px] font-black">AUTO</Text>
                  </View>
                )}
                {card.fields.is_memorabilia && (
                  <View className="bg-teal-600/90 px-2 py-0.5 rounded-md mr-1.5">
                    <Text className="text-white text-[9px] font-black">RELIC</Text>
                  </View>
                )}
              </View>
            </View>

            <Ionicons
              name={card.included ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={card.included ? colors.primary : colors.foregroundMuted}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="px-6 pb-10 pt-2 border-t border-border">
        <Button
          title={`Add ${includedCount} Card${includedCount === 1 ? "" : "s"} to Collection`}
          onPress={onSave}
          loading={saving}
          disabled={includedCount === 0}
          icon="checkmark-circle-outline"
        />
        <Button
          title="Retake Photo"
          onPress={onRetake}
          disabled={saving}
          variant="outline"
          icon="camera-reverse-outline"
          className="mt-3"
        />
      </View>
    </View>
  );
}
