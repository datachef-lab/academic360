import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { Text, View } from "react-native";

export default function ConsoleScreen() {
  const { theme } = useTheme();
  console.log(theme);

  return (
    <View style={{ backgroundColor: theme.background }} className="h-full">
      <Text style={{ color: theme.text }}>ConsoleScreen</Text>
    </View>
  );
}
