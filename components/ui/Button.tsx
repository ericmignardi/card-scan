import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { colors } from "@/constants/theme";

type ButtonVariant = "primary" | "outline" | "danger" | "danger-outline";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  className?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: "bg-primary",
    text: "text-white",
    spinner: "#ffffff",
  },
  outline: {
    container: "border border-border",
    text: "text-foreground-muted",
    spinner: colors.foregroundMuted,
  },
  danger: {
    container: "bg-red-600/90 border border-red-500/30",
    text: "text-white",
    spinner: "#ffffff",
  },
  "danger-outline": {
    container: "border border-red-500/20 bg-red-950/10",
    text: "text-red-500",
    spinner: colors.danger,
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  className = "",
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <TouchableOpacity
      className={`py-4 rounded-xl shadow-lg flex-row justify-center items-center ${styles.container} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      style={{ opacity: disabled && !loading ? 0.5 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color={styles.spinner} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={styles.spinner} style={{ marginRight: 8 }} />}
          <Text className={`text-center font-bold text-lg ${styles.text}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
