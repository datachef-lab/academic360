import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

import { getStudentImageUrl } from "@/lib/student-image";

const COLOR_PALETTE = [
  "#4F46E5",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#F97316",
  "#EF4444",
];

function hashName(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initialsFromName(name?: string | null): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "S";
}

function colorFromName(name?: string | null): string {
  if (!name) return COLOR_PALETTE[0];
  return COLOR_PALETTE[hashName(name) % COLOR_PALETTE.length];
}

type Props = {
  uid?: string | null;
  name?: string | null;
  size?: number;
};

export function StudentAvatar({ uid, name, size = 40 }: Props) {
  const [errored, setErrored] = useState(false);
  const url = getStudentImageUrl(uid);

  useEffect(() => {
    setErrored(false);
  }, [uid]);

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (url && !errored) {
    return <Image source={{ uri: url }} onError={() => setErrored(true)} style={dimension} />;
  }

  return (
    <View
      style={{
        ...dimension,
        backgroundColor: colorFromName(name),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "600", fontSize: size * 0.4 }}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}
