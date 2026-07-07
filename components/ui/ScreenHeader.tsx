import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  backDisabled?: boolean;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, backDisabled = false, rightSlot }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <TouchableOpacity
        onPress={onBack}
        className="p-2 bg-background-card rounded-full border border-border"
        disabled={backDisabled}
      >
        <Ionicons name="arrow-back" size={24} color="#f8fafc" />
      </TouchableOpacity>
      <Text className="text-xl font-bold text-white">{title}</Text>
      {rightSlot ?? <View className="w-10" />}
    </View>
  );
}
