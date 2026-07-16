import { Avatar } from "@/components/ui/Avatar";
import { GlassSurface } from "@/components/ui/glass-surface";
import { useBranding } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { Moon, Sun } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const CONSOLE_HEADER_HEIGHT = 72;

export function Header() {
  const navigation: any = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, colorScheme, toggleTheme } = useTheme();
  const { logoUrl } = useBranding();
  const uid = (user?.payload as { uid?: string })?.uid;
  const isDark = colorScheme === "dark";

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
        {/* Left: (back) + logo + brand/uid — shown on every screen */}
        <View style={styles.left}>
          {!isHome ? (
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <Text style={{ color: theme.text, fontSize: 26, lineHeight: 26 }}>‹</Text>
            </Pressable>
          ) : null}
          <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
          <View style={styles.brandBox}>
            <Text style={[styles.brand, { color: theme.text }]} numberOfLines={1}>
              BESC Console
            </Text>
            {uid ? (
              <Text style={[styles.uid, { color: theme.text }]} numberOfLines={1}>
                {uid}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right: theme toggle + avatar (opens drawer) */}
        <View style={styles.right}>
          <TouchableOpacity onPress={() => toggleTheme()} hitSlop={8}>
            {isDark ? (
              <Sun color={theme.text} size={iconSize} />
            ) : (
              <Moon color={theme.text} size={iconSize} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer}>
            <Avatar uid={uid} name={user?.name} size={avatarSize} shape="square" />
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
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  brandBox: {
    flexShrink: 1,
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
  },
  uid: {
    fontSize: 12,
    opacity: 0.65,
  },
  backButton: {
    width: 24,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
});
