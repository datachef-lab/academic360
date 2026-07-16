import { LibraryMap, rackToZoneId } from "@/components/library/LibraryMap";
import { useTheme } from "@/hooks/use-theme";
import { useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";

const BRANCHES = ["Main Library"];

const LEGEND: { label: string; color: string }[] = [
  { label: "Reading & reference", color: "#94a3b8" },
  { label: "Book stacks", color: "#0d9488" },
  { label: "Service desks", color: "#4f46e5" },
];

export default function LibraryMapScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const params = useLocalSearchParams<{ rack?: string }>();
  const highlightId = rackToZoneId(params.rack);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Branch pill */}
      <View className="flex-row mb-4" style={{ gap: 8 }}>
        {BRANCHES.map((b, i) => (
          <View
            key={b}
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: i === 0 ? accent : cardBg,
              borderWidth: 1,
              borderColor: i === 0 ? accent : cardBorder,
            }}
          >
            <Text style={{ color: i === 0 ? "#fff" : theme.text, fontSize: 13, fontWeight: "600" }}>
              {b}
            </Text>
          </View>
        ))}
      </View>

      {highlightId ? (
        <View
          className="flex-row items-center rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: accentBg, borderWidth: 1, borderColor: cardBorder }}
        >
          <MapPin size={18} color={accent} />
          <Text style={{ color: theme.text, marginLeft: 8 }} className="text-sm">
            Showing the location for <Text style={{ fontWeight: "700" }}>{params.rack}</Text>
          </Text>
        </View>
      ) : null}

      <LibraryMap highlightId={highlightId} height={320} />

      {/* Legend */}
      <View className="flex-row flex-wrap mt-4" style={{ gap: 16 }}>
        {LEGEND.map((l) => (
          <View key={l.label} className="flex-row items-center">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: l.color,
                marginRight: 6,
              }}
            />
            <Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>{l.label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-6">
        Sample floor plan — your branch's live map is coming soon.
      </Text>
    </ScrollView>
  );
}
