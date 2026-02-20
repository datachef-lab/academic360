import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { getStudentImageUrl } from "@/lib/student-image";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SidebarItemsType } from "../data";

const AVATAR_COLORS = [
  "#4F46E5",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#5B21B6",
  "#6D28D9",
];

function getAvatarColorForChar(char: string): string {
  const code = char.toUpperCase().charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function SidebarItem({ item, props }: { item: SidebarItemsType; props: DrawerContentComponentProps }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const uid = (user?.payload as { uid?: string })?.uid;
  const studentImageUrl = getStudentImageUrl(uid);

  useEffect(() => {
    setImageError(false);
  }, [uid]);

  const isActive = pathname.endsWith(item.path as string);
  const isProfile = item.path === "/console/profile";
  const showProfileImage = isProfile && studentImageUrl && !imageError;
  const initial = user?.name?.charAt(0) || "?";

  return (
    <Pressable
      key={item.label}
      onPress={() => {
        router.push(item.path);
        props.navigation.closeDrawer(); // Closes the drawer after navigation
      }}
      className=" rounded-xl"
      style={{
        backgroundColor: isActive
          ? colorScheme === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(79, 70, 229, 0.1)"
          : "transparent",
        borderBottomWidth: 1,
        borderBottomStartRadius: 0,
        borderBottomEndRadius: 0,
        borderBottomColor: theme.border,
      }}
    >
      <View className="flex-row items-center justify-between px-3 py-3">
        {/* Left section */}
        <View className="flex-row items-center gap-3">
          {isProfile ? (
            showProfileImage ? (
              <Image
                source={{ uri: studentImageUrl }}
                onError={() => setImageError(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: getAvatarColorForChar(initial),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{initial.toUpperCase()}</Text>
              </View>
            )
          ) : (
            <item.icon size={20} color={isActive ? (colorScheme === "dark" ? "#a5b4fc" : "#4f46e5") : theme.text} />
          )}

          <View className="gap-1">
            <Text
              style={{
                color: isActive ? (colorScheme === "dark" ? "#a5b4fc" : "#4f46e5") : theme.text,
                fontWeight: "600",
              }}
              className={isProfile ? "uppercase" : ""}
            >
              {isProfile ? (user?.name ?? item.label) : item.label}
            </Text>

            <Text
              className="text-xs"
              style={{
                color: isActive ? (colorScheme === "dark" ? "#a5b4fc" : "#4f46e5") : theme.text,
                opacity: 0.8,
              }}
            >
              {item.oneLiner}
            </Text>
          </View>
        </View>

        {/* Right arrow */}
        <ChevronRightIcon size={20} color={isActive ? (colorScheme === "dark" ? "#a5b4fc" : "#4f46e5") : theme.text} />
      </View>
    </Pressable>
  );
}
