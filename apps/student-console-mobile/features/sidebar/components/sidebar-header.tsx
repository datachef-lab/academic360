import { useBranding } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { Image } from "expo-image";
import { Copy } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SidebarHeader() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { logoUrl } = useBranding();
  const avatarSize = 36;

  return (
    <View
      className="flex-row items-center justify-between border-b px-4 py-4"
      style={{ borderColor: theme.border }}
    >
      <View className="flex-row items-center gap-2">
        <Image
          source={{ uri: logoUrl }}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          contentFit="contain"
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
