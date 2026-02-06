import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <View>
      {label && (
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", opacity: 0.9, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={theme.text}
        style={[
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor:
              props.editable === false ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)") : theme.background,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
