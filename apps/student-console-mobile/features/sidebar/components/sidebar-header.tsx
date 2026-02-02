import { useTheme } from "@/hooks/use-theme";
import { Copy } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function SidebarHeader() {
  const { theme } = useTheme();
  return (
    <View className="flex-row items-center gap-3 p-2  " style={{ borderColor: theme.border, borderBottomWidth: 1 }}>
      <Image
        source={{
          uri: "https://besc.academic360.app/api/api/v1/settings/file/4",
        }}
        className="h-9 w-9 rounded-full"
      />
      <View className="mb-4">
        <Text style={{ color: theme.text }} className="text-base font-semibold">
          BESC Console
        </Text>
        <View className="flex-row gap-3 items-center">
          <Text style={{ color: theme.text }}>0804250001</Text>
          <TouchableOpacity>
            <Copy size={15} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
