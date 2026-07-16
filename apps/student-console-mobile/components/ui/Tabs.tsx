import { useTheme } from "@/hooks/use-theme";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Horizontal-scroll pills sized to content (e.g. many tabs / day picker).
   * When false (default), tabs split the row equally. */
  scrollable?: boolean;
};

/** Shared pill tab bar (matches the admission-registration style): filled accent
 * for the active tab, bordered surface for the rest, optional leading icon. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  scrollable = false,
}: TabsProps<T>) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#4338ca" : "#4f46e5";
  const tabBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const tabBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const pills = tabs.map((tab) => {
    const Icon = tab.icon;
    const isActive = value === tab.id;
    return (
      <Pressable
        key={tab.id}
        onPress={() => onChange(tab.id)}
        style={{
          flex: scrollable ? undefined : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 10,
          backgroundColor: isActive ? accent : tabBg,
          borderWidth: 1,
          borderColor: isActive ? accent : tabBorder,
        }}
      >
        {Icon ? <Icon size={15} color={isActive ? "#ffffff" : theme.text} /> : null}
        <Text
          style={{
            color: isActive ? "#ffffff" : theme.text,
            fontSize: 13,
            fontWeight: isActive ? "700" : "500",
            marginLeft: Icon ? 6 : 0,
          }}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {pills}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: "row", gap: 8 }}>{pills}</View>;
}
