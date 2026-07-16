import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen } from "lucide-react-native";
import React, { useState } from "react";
import { Text } from "react-native";

/** Book cover from a remote URL with a branded placeholder fallback. */
export function BookCover({
  uri,
  title,
  width = 56,
  height = 78,
  radius = 10,
}: {
  uri?: string | null;
  title?: string | null;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const [errored, setErrored] = useState(false);
  const box = { width, height, borderRadius: radius, overflow: "hidden" as const };

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={box}
        contentFit="cover"
        transition={150}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <LinearGradient
      colors={["#6366f1", "#4f46e5", "#7c3aed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[box, { alignItems: "center", justifyContent: "center", padding: 6 }]}
    >
      <BookOpen size={Math.min(width, height) * 0.34} color="rgba(255,255,255,0.92)" />
      {title ? (
        <Text
          numberOfLines={2}
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: 8,
            lineHeight: 10,
            textAlign: "center",
            marginTop: 4,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

export function AvailabilityBadge({ available, isDark }: { available: boolean; isDark: boolean }) {
  const bg = available
    ? isDark
      ? "rgba(34,197,94,0.2)"
      : "#dcfce7"
    : isDark
      ? "rgba(245,158,11,0.2)"
      : "#fef3c7";
  const fg = available ? "#16a34a" : "#d97706";
  return (
    <Text
      style={{
        color: fg,
        backgroundColor: bg,
        fontSize: 10,
        fontWeight: "700",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        overflow: "hidden",
        alignSelf: "flex-start",
      }}
    >
      {available ? "Available" : "On loan"}
    </Text>
  );
}
