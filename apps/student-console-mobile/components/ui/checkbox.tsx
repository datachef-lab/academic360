import { useTheme } from "@/hooks/use-theme";
import { Check } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, disabled = false }: CheckboxProps) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const uncheckedBorder = isDark ? "rgba(255,255,255,0.5)" : theme.border;

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className="flex-row items-start gap-3 py-2"
    >
      <View
        className="w-5 h-5 rounded border items-center justify-center"
        style={{
          borderColor: checked ? accent : uncheckedBorder,
          backgroundColor: checked ? accent : "transparent",
          borderWidth: 2,
        }}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </View>
      <Text style={{ color: theme.text, fontSize: 15, flex: 1, lineHeight: 22 }}>{label}</Text>
    </Pressable>
  );
}
