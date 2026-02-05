import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import Constants from "expo-constants";
import { LogOutIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function SidebarFooter() {
  const { theme, colorScheme } = useTheme();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

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
      <Pressable onPress={handleLogout} disabled={loggingOut} className="flex-row items-center gap-3 mb-3">
        {loggingOut ? (
          <ActivityIndicator size="small" color={colorScheme === "dark" ? "#ff6b6b" : "#d32f2f"} />
        ) : (
          <LogOutIcon size={18} color={colorScheme === "dark" ? "#ff6b6b" : "#d32f2f"} />
        )}
        <Text
          style={{
            color: colorScheme === "dark" ? "#ff6b6b" : "#d32f2f",
            fontWeight: "600",
          }}
        >
          {loggingOut ? "Logging out..." : "Logout"}
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
