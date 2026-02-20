import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import { ClipboardCheck, FileTextIcon, HouseIcon, IndianRupeeIcon, LibraryIcon, LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View className="h-full">
      {/* <Header /> */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 75,
            paddingTop: 12,
            paddingBottom: 15,
            width: "100%",
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",

            tabBarIcon: () => <TabBarIcon name="Home" icon={HouseIcon} />,
          }}
        />
        <Tabs.Screen
          name="study-notes"
          options={{
            title: "Study Notes",

            tabBarIcon: () => <TabBarIcon name="Study Notes" icon={FileTextIcon} />,
          }}
        />

        <Tabs.Screen
          name="fees"
          options={{
            title: "Fees",
            tabBarIcon: () => <TabBarIcon name="Fees" icon={IndianRupeeIcon} />,
          }}
        />

        <Tabs.Screen
          name="exams"
          options={{
            title: "Exams",
            tabBarIcon: () => <TabBarIcon name="Exams" icon={ClipboardCheck} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: () => <TabBarIcon name="Library" icon={LibraryIcon} />,
          }}
        />
      </Tabs>
    </View>
  );
}

function TabBarIcon({ name, icon: Icon }: { name: string; icon: LucideIcon }) {
  const { theme } = useTheme();

  return (
    <View className="gap-1 items-center w-full justify-center">
      <Icon className="w-full text-center" color={theme.text} size={22} />
      <Text
        numberOfLines={1}
        // ellipsizeMode="tail"
        style={{
          color: theme.text,
          fontSize: 12,
          minWidth: 70,
          textAlign: "center",
        }}
      >
        {name}
      </Text>
    </View>
  );
}
