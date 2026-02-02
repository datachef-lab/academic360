import { useTheme } from "@/hooks/use-theme";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Moon, Sun } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export function Header() {
  const { theme, colorScheme, toggleTheme } = useTheme();
  const navigation: any = useNavigation();

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
          <Text style={{ color: theme.text }}>0804250001</Text>
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
        <TouchableOpacity onPress={openDrawer}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/a/ACg8ocLZ3hwi9ndHXItyyYA_8ZpqcUXTWj6gly7LTAODjPE5WT7lbGAO=s96-c",
            }}
            className="h-9 w-9 rounded-full"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
