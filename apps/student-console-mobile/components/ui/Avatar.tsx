import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { avatarColor } from "@/lib/avatar";
import { getStudentImageUrl } from "@/lib/student-image";

type Props = {
  uid?: string | null;
  name?: string | null;
  size?: number;
  /** "circle" (default) or "square" (rounded corners, button-like). */
  shape?: "circle" | "square";
};

function firstChar(name?: string | null): string {
  const c = name?.trim()?.charAt(0);
  return (c || "S").toUpperCase();
}

/** Student avatar: cached remote photo (expo-image, resolved from the UID) with
 * a deterministic first-initial fallback on 404 / no-UID. */
export function Avatar({ uid, name, size = 40, shape = "circle" }: Props) {
  const [errored, setErrored] = useState(false);
  const url = getStudentImageUrl(uid);

  useEffect(() => setErrored(false), [uid]);

  const radius = shape === "square" ? Math.round(size * 0.28) : size / 2;
  const box = { width: size, height: size, borderRadius: radius } as const;

  if (url && !errored) {
    return (
      <Image
        source={{ uri: url }}
        onError={() => setErrored(true)}
        style={box}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[
        box,
        { backgroundColor: avatarColor(name), alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.42 }}>
        {firstChar(name)}
      </Text>
    </View>
  );
}
