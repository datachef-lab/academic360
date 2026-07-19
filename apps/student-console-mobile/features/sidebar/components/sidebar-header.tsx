import { CONSOLE_HEADER_HEIGHT } from "@/components/ui/header";
import { useBranding } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { Image } from "expo-image";
import { Copy } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SidebarHeader() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const { logoUrl } = useBranding();
  const avatarSize = 36;
  const isDark = colorScheme === "dark";

  // Mirror the main console header: same height and the same surface tint
  // (solid equivalents of GlassSurface's near-opaque Android tints), so the
  // drawer's header lines up with the app header it slides over.
  const surface = isDark ? "#121212" : "#eef0fa";
  const border = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)";

  return (
    <View
      style={{
        height: CONSOLE_HEADER_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        backgroundColor: surface,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Image
          source={logoUrl ? { uri: logoUrl } : require("@/assets/images/icon.png")}
          placeholder={require("@/assets/images/icon.png")}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          contentFit="contain"
          transition={120}
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
