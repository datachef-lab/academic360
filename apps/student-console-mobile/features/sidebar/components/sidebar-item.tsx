import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { ChevronRightIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SidebarItemsType } from "../data";

export default function SidebarItem({
  item,
  props,
}: {
  item: SidebarItemsType;
  props: DrawerContentComponentProps;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const uid = (user?.payload as { uid?: string })?.uid;

  const itemPath = String(item.path);
  const isHomeItem = itemPath === "/console";
  const isActive = isHomeItem
    ? pathname === "/console" || pathname === "/console/" || pathname === "/console/(tabs)"
    : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  const isProfile = item.path === "/console/profile";
  const activeColor = colorScheme === "dark" ? "#a5b4fc" : "#4f46e5";

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
            <Avatar uid={uid} name={user?.name} size={40} />
          ) : (
            <item.icon size={20} color={isActive ? activeColor : theme.text} />
          )}

          <View className="gap-1">
            <Text
              style={{ color: isActive ? activeColor : theme.text, fontWeight: "600" }}
              className={isProfile ? "uppercase" : ""}
            >
              {isProfile ? (user?.name ?? item.label) : item.label}
            </Text>

            <Text
              className="text-xs"
              style={{ color: isActive ? activeColor : theme.text, opacity: 0.8 }}
            >
              {item.oneLiner}
            </Text>
          </View>
        </View>

        {/* Right arrow */}
        <ChevronRightIcon size={20} color={isActive ? activeColor : theme.text} />
      </View>
    </Pressable>
  );
}
