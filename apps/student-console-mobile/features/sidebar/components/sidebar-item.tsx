import { useTheme } from "@/hooks/use-theme";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SidebarItemsType } from "../data";

const student = {
  name: "Harsh N. Desai",
  avatar: "https://lh3.googleusercontent.com/a/ACg8ocLZ3hwi9ndHXItyyYA_8ZpqcUXTWj6gly7LTAODjPE5WT7lbGAO=s96-c",
};

export default function SidebarItem({ item, props }: { item: SidebarItemsType; props: DrawerContentComponentProps }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colorScheme } = useTheme();

  const isActive = pathname.endsWith(item.path as string);
  const isProfile = item.path === "/console/profile";

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
            : "rgba(0,122,255,0.1)"
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
            <Image
              source={{ uri: student.avatar }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10, // half of width/height for perfect circle
              }}
            />
          ) : (
            <item.icon size={20} color={colorScheme === "dark" ? "white" : isActive ? "#007aff" : "#000"} />
          )}

          <View className="gap-1">
            <Text
              style={{
                color: colorScheme === "dark" ? "white" : isActive ? "#007aff" : "#000",
                fontWeight: "600",
              }}
              className={isProfile ? "uppercase" : ""}
            >
              {isProfile ? student.name : item.label}
            </Text>

            <Text
              className="text-xs"
              style={{
                color: colorScheme === "dark" ? "white" : isActive ? "#007aff" : "#000",
              }}
            >
              {item.oneLiner}
            </Text>
          </View>
        </View>

        {/* Right arrow */}
        <ChevronRightIcon size={20} color={colorScheme === "dark" ? "white" : isActive ? "#007aff" : "#000"} />
      </View>
    </Pressable>
  );
}
