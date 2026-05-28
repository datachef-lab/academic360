import { GlassSurface } from "@/components/ui/glass-surface";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { getStudentImageUrl } from "@/lib/student-image";
import { usePathname, useRouter } from "expo-router";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const CONSOLE_HEADER_HEIGHT = 72;

const AVATAR_COLORS_LIGHT = [
  "#4F46E5",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#A78BFA",
  "#6366F1",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#059669",
  "#4F46E5",
  "#5B21B6",
  "#6D28D9",
  "#7C3AED",
  "#8B5CF6",
];

const AVATAR_COLORS_DARK = [
  "#6366F1",
  "#818CF8",
  "#A78BFA",
  "#C4B5FD",
  "#DDD6FE",
  "#818CF8",
  "#38BDF8",
  "#22D3EE",
  "#2DD4BF",
  "#34D399",
  "#10B981",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#A78BFA",
  "#C4B5FD",
];

function getAvatarColorForChar(char: string, isDark: boolean): string {
  const palette = isDark ? AVATAR_COLORS_DARK : AVATAR_COLORS_LIGHT;
  const code = char.toUpperCase().charCodeAt(0);
  return palette[code % palette.length];
}

export function Header() {
  const navigation: any = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, colorScheme, toggleTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const uid = (user?.payload as { uid?: string })?.uid;
  const studentImageUrl = getStudentImageUrl(uid);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    setImageError(false);
  }, [uid]);

  const openDrawer = () => {
    let parent: any = navigation;
    while (parent) {
      const state = parent.getState?.();
      if (state?.type === "drawer") {
        parent.dispatch(DrawerActions.openDrawer());
        return;
      }
      parent = parent.getParent?.();
    }
    console.log("Drawer navigator not found in parent chain");
  };

  const iconSize = 20;
  const avatarSize = 36;
  const isHome =
    pathname === "/console" || pathname === "/console/" || pathname === "/console/(tabs)";

  return (
    <View style={styles.shell}>
      <GlassSurface isDark={isDark} />
      <View style={styles.content}>
        <View style={styles.sideSlot}>
          {!isHome ? (
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <Text style={{ color: theme.text, fontSize: 24, lineHeight: 24 }}>‹</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.centerBrand, isHome && styles.centerBrandHome]} pointerEvents="none">
          <Image
            source={{
              uri: "https://besc.academic360.app/api/api/v1/settings/file/4",
            }}
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          />
          <View>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700" }}>BESC Console</Text>
            {uid ? (
              <Text style={{ color: theme.text, fontSize: 12, opacity: 0.65 }}>{uid}</Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => toggleTheme()} hitSlop={8}>
            {colorScheme == "dark" ? (
              <Sun color={theme.text} size={iconSize} />
            ) : (
              <Moon color={theme.text} size={iconSize} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer} style={{ width: avatarSize, height: avatarSize }}>
            {studentImageUrl && !imageError ? (
              <Image
                source={{ uri: studentImageUrl }}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: getAvatarColorForChar(
                    user?.name?.charAt(0) || "?",
                    colorScheme === "dark",
                  ),
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>
                  {(user?.name?.charAt(0) || "?").toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: CONSOLE_HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  sideSlot: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBrand: {
    position: "absolute",
    left: 56,
    right: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  centerBrandHome: {
    left: 12,
    right: 88,
    justifyContent: "flex-start",
  },
});
