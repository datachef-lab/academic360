import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { Pressable, View } from "react-native";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: checked ? accent : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
        justifyContent: "center",
        paddingHorizontal: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#fff",
          alignSelf: checked ? "flex-end" : "flex-start",
        }}
      />
    </Pressable>
  );
}
