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

// Bottom-tab roots show the brand; every deeper (nested) screen shows its own title.
const TAB_ROOTS = new Set([
  "/console",
  "/console/",
  "/console/(tabs)",
  "/console/study-notes",
  "/console/fees",
  "/console/exams",
  "/console/library",
]);

function getScreenTitle(pathname: string): string {
  const routes: [string, string][] = [
    ["/console/academics/current-status", "Academic Status"],
    ["/console/academics/adm-registration", "Registration"],
    ["/console/academics/subject-selection-instructions", "Subject Selection"],
    ["/console/academics/subject-selection", "Subject Selection"],
    ["/console/academics/cu-exam-form-upload", "Exam Form"],
    ["/console/academics/admit-card", "Admit Card"],
    ["/console/academics/timetable", "Time Table"],
    ["/console/academics/notes", "Notes"],
    ["/console/academics", "Academics"],
    ["/console/library/reading-lists", "Reading Lists"],
    ["/console/library/catalogue", "Catalogue"],
    ["/console/library/my-books", "My Books"],
    ["/console/library/map", "Library Map"],
    ["/console/library/book/", "Book"],
    ["/console/service-requests", "Service Requests"],
    ["/console/notifications", "Notifications"],
    ["/console/documents", "Documents"],
    ["/console/events", "Events"],
    ["/console/settings", "Settings"],
    ["/console/support", "Help & Support"],
    ["/console/contact", "Contact College"],
    ["/console/profile", "Profile"],
    // Bottom tabs (except Home, which shows the brand)
    ["/console/study-notes", "Notes"],
    ["/console/fees", "Fees"],
    ["/console/library", "Library"],
    ["/console/exams/", "Exam"],
    ["/console/exams", "Exams"],
  ];
  for (const [prefix, title] of routes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title;
  }
  return "";
}

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
  const isTabRoot = TAB_ROOTS.has(pathname);
  const isHome =
    pathname === "/console" || pathname === "/console/" || pathname === "/console/(tabs)";
  const title = getScreenTitle(pathname);

  return (
    <View style={styles.shell}>
      <GlassSurface isDark={isDark} />
      <View style={styles.content}>
        {/* Left: (back on nested) + college logo (always) + heading — "BESC Console"
            on tab roots, the screen title on nested — with the UID kept underneath. */}
        <View style={styles.left}>
          {!isTabRoot ? (
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <Text style={{ color: theme.text, fontSize: 26, lineHeight: 26 }}>‹</Text>
            </Pressable>
          ) : null}
          <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
          <View style={styles.brandBox}>
            <Text style={[styles.brand, { color: theme.text }]} numberOfLines={1}>
              {isHome ? "BESC Console" : title}
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
  },
  backButton: {
    width: 24,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
});
