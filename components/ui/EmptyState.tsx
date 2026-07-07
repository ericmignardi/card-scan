import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center pb-24 px-6">
      <Ionicons name={icon} size={64} color="#334155" />
      <Text className="text-white text-xl font-bold mt-4 text-center">{title}</Text>
      <Text className="text-foreground-muted text-sm text-center mt-2 max-w-xs">{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} className="mt-6 border border-border px-5 py-2.5 rounded-full">
          <Text className="text-primary font-bold text-sm">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
