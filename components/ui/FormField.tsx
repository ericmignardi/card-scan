import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  containerClassName?: string;
  small?: boolean;
}

export function FormField({ label, containerClassName = "", small = false, ...inputProps }: FormFieldProps) {
  return (
    <View className={containerClassName}>
      <Text className={`text-foreground-muted font-semibold mb-1 ${small ? "text-xs" : "text-sm mb-2"}`}>
        {label}
      </Text>
      <TextInput
        className={`bg-background text-white border border-border rounded-xl focus:border-primary ${
          small ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"
        }`}
        placeholderTextColor="#64748b"
        {...inputProps}
      />
    </View>
  );
}
