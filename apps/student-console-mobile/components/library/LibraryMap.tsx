import { useTheme } from "@/hooks/use-theme";
import { MapPin } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

type Tone = "accent" | "soft" | "stack" | "muted";
type Zone = { id: string; label: string; x: number; y: number; w: number; h: number; tone: Tone };

// Dummy branch floor-plan (percentages of the container). Swap for real
// floor-plan/zone data later. Stack ids match a book's rack (e.g. "stack-a").
const ZONES: Zone[] = [
  { id: "reference", label: "Reference", x: 3, y: 4, w: 28, h: 26, tone: "soft" },
  { id: "reading", label: "Reading Area", x: 3, y: 33, w: 28, h: 40, tone: "soft" },
  { id: "digital", label: "Digital Zone", x: 3, y: 76, w: 28, h: 20, tone: "accent" },
  { id: "stack-a", label: "A", x: 35, y: 4, w: 13, h: 18, tone: "stack" },
  { id: "stack-b", label: "B", x: 50, y: 4, w: 13, h: 18, tone: "stack" },
  { id: "stack-c", label: "C", x: 35, y: 25, w: 13, h: 18, tone: "stack" },
  { id: "stack-d", label: "D", x: 50, y: 25, w: 13, h: 18, tone: "stack" },
  { id: "stack-e", label: "E", x: 35, y: 46, w: 13, h: 18, tone: "stack" },
  { id: "stack-f", label: "F", x: 50, y: 46, w: 13, h: 18, tone: "stack" },
  { id: "desk", label: "Circulation Desk", x: 35, y: 68, w: 28, h: 12, tone: "accent" },
  { id: "entrance", label: "Entrance", x: 40, y: 84, w: 18, h: 12, tone: "muted" },
  { id: "periodicals", label: "Periodicals", x: 68, y: 4, w: 29, h: 22, tone: "soft" },
  { id: "study", label: "Study Rooms", x: 68, y: 29, w: 29, h: 34, tone: "soft" },
  { id: "help", label: "Help Desk", x: 68, y: 66, w: 29, h: 14, tone: "accent" },
];

/** Map a rack name like "Rack A" / "A-3" to a stack zone id. */
export function rackToZoneId(rack?: string | null): string | null {
  const letter = rack?.match(/[A-Fa-f]/)?.[0]?.toLowerCase();
  return letter ? `stack-${letter}` : null;
}

export function LibraryMap({
  highlightId,
  height = 300,
}: {
  highlightId?: string | null;
  height?: number;
}) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const roomBg = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc";
  const roomBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  const toneStyle = (tone: Tone, active: boolean) => {
    if (active) return { bg: isDark ? "#6366f1" : "#4f46e5", fg: "#ffffff", border: "#4f46e5" };
    switch (tone) {
      case "accent":
        return {
          bg: isDark ? "rgba(99,102,241,0.22)" : "rgba(79,70,229,0.12)",
          fg: isDark ? "#c4b5fd" : "#4f46e5",
          border: isDark ? "rgba(99,102,241,0.3)" : "rgba(79,70,229,0.25)",
        };
      case "stack":
        return {
          bg: isDark ? "rgba(20,184,166,0.18)" : "rgba(13,148,136,0.1)",
          fg: isDark ? "#5eead4" : "#0d9488",
          border: isDark ? "rgba(20,184,166,0.3)" : "rgba(13,148,136,0.25)",
        };
      case "muted":
        return {
          bg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          fg: theme.text,
          border: roomBorder,
        };
      default:
        return {
          bg: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
          fg: theme.text,
          border: roomBorder,
        };
    }
  };

  return (
    <View
      style={{
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: roomBorder,
        backgroundColor: roomBg,
        overflow: "hidden",
      }}
    >
      {ZONES.map((z) => {
        const active = highlightId === z.id;
        const s = toneStyle(z.tone, active);
        const isStack = z.tone === "stack";
        return (
          <View
            key={z.id}
            style={{
              position: "absolute",
              left: `${z.x}%`,
              top: `${z.y}%`,
              width: `${z.w}%`,
              height: `${z.h}%`,
              backgroundColor: s.bg,
              borderColor: s.border,
              borderWidth: 1,
              borderRadius: isStack ? 6 : 10,
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
          >
            {active ? <MapPin size={15} color="#ffffff" style={{ marginBottom: 1 }} /> : null}
            <Text
              numberOfLines={2}
              style={{
                color: s.fg,
                fontSize: isStack ? 12 : 10.5,
                fontWeight: isStack ? "800" : "600",
                textAlign: "center",
              }}
            >
              {z.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
