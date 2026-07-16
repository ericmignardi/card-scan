import React from "react";
import { Switch, Text, View } from "react-native";
import { colors } from "@/constants/theme";

interface ToggleRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({ label, hint, value, onValueChange }: ToggleRowProps) {
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-1 pr-4">
        <Text className="text-white text-sm font-semibold">{label}</Text>
        {hint ? <Text className="text-foreground-muted text-xs mt-0.5">{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary }}
        accessibilityLabel={label}
      />
    </View>
  );
}
