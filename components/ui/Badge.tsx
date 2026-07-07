import React from "react";
import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  className?: string;
  textClassName?: string;
}

export function Badge({ label, className = "bg-primary", textClassName = "text-white" }: BadgeProps) {
  return (
    <View className={`px-3 py-1.5 rounded-lg mr-2 mb-2 border border-white/10 ${className}`}>
      <Text className={`text-xs font-black ${textClassName}`}>{label}</Text>
    </View>
  );
}
