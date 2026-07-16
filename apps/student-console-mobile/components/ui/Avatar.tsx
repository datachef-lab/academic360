import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { avatarColor, avatarInitials } from "@/lib/avatar";
import { getStudentImageUrl } from "@/lib/student-image";

type Props = {
  uid?: string | null;
  name?: string | null;
  size?: number;
};

/** Student avatar: cached remote photo (expo-image) with a deterministic
 * initials fallback rendered on 404 / no-UID. */
export function Avatar({ uid, name, size = 40 }: Props) {
  const [errored, setErrored] = useState(false);
  const url = getStudentImageUrl(uid);

  useEffect(() => setErrored(false), [uid]);

  const box = { width: size, height: size, borderRadius: size / 2 } as const;

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
      <Text style={{ color: "#fff", fontWeight: "600", fontSize: size * 0.4 }}>
        {avatarInitials(name)}
      </Text>
    </View>
  );
}
