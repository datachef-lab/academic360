import { GlassDock } from "@/components/ui/glass-dock";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/use-theme";
import { useOverlayCount } from "@/lib/overlay-store";
import { Tabs } from "expo-router";
import {
  ClipboardCheck,
  FileTextIcon,
  HouseIcon,
  IndianRupeeIcon,
  LibraryIcon,
  LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 58;
const TAB_BAR_HORIZONTAL_INSET = 0;
const TAB_BAR_BOTTOM_GAP = 0;

export default function TabsLayout() {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  // Hide the tab bar while a sheet/dialog is open so it doesn't sit over it.
  const overlayCount = useOverlayCount();
  const bottomOffset = insets.bottom + TAB_BAR_BOTTOM_GAP;
  // Dock reaches the physical screen bottom: its glass also covers the
  // gesture-nav inset. Previously the bar floated insets.bottom above the
  // edge, and scrolled content showed raw through that gap under the dock.
  const dockHeight = TAB_BAR_HEIGHT + insets.bottom;
  const palette = colorScheme === "dark" ? Colors.dark : Colors.light;
  const pageBg = palette.background;
  const isDark = colorScheme === "dark";
  const dockRadius = 0;

  const dockShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 10 },
    web: {
      boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 28px rgba(0,0,0,0.12)",
    },
    default: {},
  });

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: pageBg,
            paddingBottom: bottomOffset + 4,
          },
          tabBarStyle: {
            display: overlayCount > 0 ? "none" : "flex",
            position: "absolute",
            left: TAB_BAR_HORIZONTAL_INSET,
            right: TAB_BAR_HORIZONTAL_INSET,
            bottom: 0,
            height: dockHeight,
            borderRadius: dockRadius,
            flexDirection: "row",
            paddingTop: 8,
            // Icons stay in the top TAB_BAR_HEIGHT zone; the extra bottom
            // padding keeps them above the gesture-nav inset.
            paddingBottom: 8 + insets.bottom,
            paddingHorizontal: 6,
            borderTopWidth: 0,
            backgroundColor: "transparent",
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => (
            <View pointerEvents="none" style={styles.tabBarBackground}>
              <View
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  paddingHorizontal: TAB_BAR_HORIZONTAL_INSET,
                }}
              >
                <GlassDock
                  isDark={isDark}
                  height={dockHeight}
                  borderRadius={dockRadius}
                  style={dockShadow}
                />
              </View>
            </View>
          ),
          tabBarShowLabel: false,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="Home" icon={HouseIcon} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="study-notes"
          options={{
            title: "Notes",
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="Notes" icon={FileTextIcon} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="fees"
          options={{
            title: "Fees",
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="Fees" icon={IndianRupeeIcon} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="exams"
          options={{
            title: "Exams",
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="Exams" icon={ClipboardCheck} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="Library" icon={LibraryIcon} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="exam-papers-modal"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

function TabBarIcon({
  name,
  icon: Icon,
  focused,
}: {
  name: string;
  icon: LucideIcon;
  focused: boolean;
}) {
  const { theme, colorScheme } = useTheme();
  const muted = colorScheme === "dark" ? Colors.dark.textMuted : Colors.light.textMuted;
  const activeBg = colorScheme === "dark" ? "rgba(99,102,241,0.24)" : "rgba(79,70,229,0.14)";
  const activeColor = colorScheme === "dark" ? "#c4b5fd" : "#4f46e5";

  // Icon and font sizes stay CONSTANT between states — the old focused
  // size-jump (20→22 icon, 10→11 text) reflowed the pill mid-press and
  // squeezed longer labels ("Library") into truncation.
  return (
    <View style={[styles.tabIcon, focused && { backgroundColor: activeBg, borderRadius: 10 }]}>
      <Icon color={focused ? activeColor : theme.text} size={20} strokeWidth={focused ? 2.4 : 2} />
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color: focused ? activeColor : muted,
            fontWeight: focused ? "700" : "500",
          },
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    backgroundColor: "transparent",
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
    margin: 0,
  },
  tabIcon: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 56,
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
  },
});
