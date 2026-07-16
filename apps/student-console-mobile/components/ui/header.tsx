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

/** Maps a console route to the title shown in the header. The brand + student
 * identity live in the drawer, so inner screens show their own title instead
 * of repeating "BESC Console". */
function getScreenTitle(pathname: string): string {
  const routes: [string, string][] = [
    ["/console/academics/current-status", "Academic Status"],
    ["/console/academics/adm-registration", "Registration"],
    ["/console/academics/subject-selection-instructions", "Subject Selection"],
    ["/console/academics/subject-selection", "Subject Selection"],
    ["/console/academics/cu-exam-form-upload", "CU Form Upload"],
    ["/console/academics", "Academics"],
    ["/console/service-requests", "Service Requests"],
    ["/console/notifications", "Notifications"],
    ["/console/documents", "Documents"],
    ["/console/events", "Events"],
    ["/console/settings", "Settings"],
    ["/console/support", "Help & Support"],
    ["/console/faqs", "FAQs"],
    ["/console/contact", "Contact College"],
    ["/console/profile", "Profile"],
    ["/console/study-notes", "Study Notes"],
    ["/console/library", "Library"],
    ["/console/fees", "Fees"],
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
  const isHome =
    pathname === "/console" || pathname === "/console/" || pathname === "/console/(tabs)";
  const title = getScreenTitle(pathname);

  return (
    <View style={styles.shell}>
      <GlassSurface isDark={isDark} />
      <View style={styles.content}>
        {/* Left: brand on Home, back + title elsewhere */}
        <View style={styles.left}>
          {isHome ? (
            <>
              <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
              <Text style={[styles.brand, { color: theme.text }]}>BESC Console</Text>
            </>
          ) : (
            <>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
                <Text style={{ color: theme.text, fontSize: 26, lineHeight: 26 }}>‹</Text>
              </Pressable>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
            </>
          )}
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
            <Avatar uid={uid} name={user?.name} size={avatarSize} />
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
  brand: {
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
  },
  backButton: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
});
