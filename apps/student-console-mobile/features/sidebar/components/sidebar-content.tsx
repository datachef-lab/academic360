import { useTheme } from "@/hooks/use-theme";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";

import { usePathname } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sidebarItems } from "../data";
import SidebarFooter from "./sidebar-footer";
import SidebarHeader from "./sidebar-header";
import SidebarItem from "./sidebar-item";
import UserInfo from "./user-info";

export default function SidebarContent(props: DrawerContentComponentProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <SidebarHeader />
      {/* SCROLLABLE */}
      <DrawerContentScrollView
        className="p-0 m-0"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Prevent automatic safe-area/content inset adjustments on mobile
        contentContainerStyle={{ paddingTop: 0, marginTop: 0 }}
        style={{ paddingTop: 0, marginTop: 0 }}
        contentInsetAdjustmentBehavior="never"
      >
        <View className="py-2 m-0 gap-3">
          <UserInfo />
        </View>
        {sidebarItems.map((item) => (
          <SidebarItem item={item} props={props} />
        ))}
        <SidebarFooter />
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}
