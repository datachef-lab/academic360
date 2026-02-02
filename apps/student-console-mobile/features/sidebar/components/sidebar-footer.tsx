import { useTheme } from "@/hooks/use-theme";
import Constants from "expo-constants";
import { LogOutIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function SidebarFooter() {
  const { theme, colorScheme } = useTheme();

  const year = new Date().getFullYear();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.background,
      }}
    >
      {/* Logout */}
      <Pressable
        onPress={() => {
          // TODO: handle logout
          console.log("Logout pressed");
        }}
        className="flex-row items-center gap-3 mb-3"
      >
        <LogOutIcon size={18} color={colorScheme === "dark" ? "#ff6b6b" : "#d32f2f"} />
        <Text
          style={{
            color: colorScheme === "dark" ? "#ff6b6b" : "#d32f2f",
            fontWeight: "600",
          }}
        >
          Logout
        </Text>
      </Pressable>

      {/* Meta info */}
      <View className="items-center gap-1">
        <Text className="text-xs" style={{ color: theme.text, opacity: 0.6 }}>
          © {year} BESC. All rights reserved
        </Text>

        <Text className="text-xs" style={{ color: theme.text, opacity: 0.5 }}>
          Version {version}
        </Text>
      </View>
    </View>
  );
}
