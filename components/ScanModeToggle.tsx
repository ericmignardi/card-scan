import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type ScanMode = "single" | "lot";

const MODES: { id: ScanMode; label: string }[] = [
  { id: "single", label: "Single Card" },
  { id: "lot", label: "Lot / Group" },
];

interface ScanModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export function ScanModeToggle({ mode, onChange }: ScanModeToggleProps) {
  return (
    <View className="flex-row bg-black/50 border border-white/15 rounded-full p-1 self-center">
      {MODES.map((option) => {
        const isActive = mode === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(option.id)}
            className={`px-5 py-2 rounded-full ${isActive ? "bg-primary" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-foreground-muted"}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
