import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { Copy } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function SidebarHeader() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const avatarSize = 36;

  return (
    <View
      className="flex-row items-center justify-between border-b px-4 py-4"
      style={{ borderColor: theme.border }}
    >
      <View className="flex-row items-center gap-2">
        <Image
          source={{
            uri: "https://besc.academic360.app/api/api/v1/settings/file/4",
          }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
        />
        <View>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700" }}>BESC Console</Text>
          <Text style={{ color: theme.text, fontSize: 12, opacity: 0.65 }}>
            {user?.payload?.uid}
          </Text>
        </View>
      </View>
      <TouchableOpacity>
        <Copy size={16} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}
