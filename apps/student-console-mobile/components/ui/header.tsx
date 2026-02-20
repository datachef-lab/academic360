import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { getStudentImageUrl } from "@/lib/student-image";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

// Cohesive palette aligned with app theme (indigo/violet) - soft, professional
const AVATAR_COLORS_LIGHT = [
  "#4F46E5",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#A78BFA",
  "#6366F1",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#059669",
  "#4F46E5",
  "#5B21B6",
  "#6D28D9",
  "#7C3AED",
  "#8B5CF6",
];

const AVATAR_COLORS_DARK = [
  "#6366F1",
  "#818CF8",
  "#A78BFA",
  "#C4B5FD",
  "#DDD6FE",
  "#818CF8",
  "#38BDF8",
  "#22D3EE",
  "#2DD4BF",
  "#34D399",
  "#10B981",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#A78BFA",
  "#C4B5FD",
];

function getAvatarColorForChar(char: string, isDark: boolean): string {
  const palette = isDark ? AVATAR_COLORS_DARK : AVATAR_COLORS_LIGHT;
  const code = char.toUpperCase().charCodeAt(0);
  return palette[code % palette.length];
}

export function Header() {
  const navigation: any = useNavigation();
  const { user } = useAuth();
  const { theme, colorScheme, toggleTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const uid = (user?.payload as { uid?: string })?.uid;
  const studentImageUrl = getStudentImageUrl(uid);

  useEffect(() => {
    setImageError(false);
  }, [uid]);

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

  return (
    <View
      style={{ backgroundColor: theme.background, borderColor: theme.border }}
      className="min-h-10 flex-row items-center justify-between p-4  border-b"
    >
      {/* Left: Logo + Title */}
      <View className="flex-row items-center gap-2">
        <Image
          source={{
            uri: "https://besc.academic360.app/api/api/v1/settings/file/4",
          }}
          className="h-9 w-9 rounded-full"
        />
        <View>
          <Text style={{ color: theme.text }} className="text-base font-semibold">
            BESC Console
          </Text>
          <Text style={{ color: theme.text }}>{user?.payload?.uid}</Text>
        </View>
      </View>

      {/* Right: Avatar */}
      <View className="flex-row items-center gap-6">
        <TouchableOpacity onPress={() => toggleTheme()}>
          {colorScheme == "dark" ? <Sun color={theme.text} /> : <Moon color={theme.text} />}
        </TouchableOpacity>
        {/* <Pressable>
          <Bell color={theme.text} />
        </Pressable> */}
        <TouchableOpacity onPress={openDrawer} className="h-9 w-9">
          {studentImageUrl && !imageError ? (
            <Image
              source={{ uri: studentImageUrl }}
              className="h-9 w-9 rounded-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{
                backgroundColor: getAvatarColorForChar(user?.name?.charAt(0) || "?", colorScheme === "dark"),
              }}
            >
              <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                {(user?.name?.charAt(0) || "?").toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
