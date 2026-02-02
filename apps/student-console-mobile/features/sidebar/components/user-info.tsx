import * as images from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { ArrowDownToLineIcon, ExternalLink } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function UserInfo() {
  const { theme } = useTheme();

  return (
    <View className="w-full gap-4">
      {/* User row */}
      <View className="gap-5">
        <Text style={{ color: theme.text }} className="text-xl font-semibold">
          B.Sc. Mathematics (H)
        </Text>
        <View className="items-center">
          <View className="flex-row w-full">
            <Text
              className="w-1/2 p-1 text-center"
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              Roll No.
            </Text>
            <Text
              className="w-1/2 p-1 text-center"
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              111-111-111-111
            </Text>
          </View>
          <View className="flex-row w-full">
            <Text
              className="w-1/2 p-1 text-center"
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              Registration No.
            </Text>
            <Text
              className="w-1/2 p-1 text-center"
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              2222-222-2222
            </Text>
          </View>
        </View>
      </View>

      {/* QR Code */}
      <View className="w-full">
        <Image
          source={images.sampleQrcode}
          resizeMode="contain"
          style={{
            width: "100%",
            aspectRatio: 1, // keeps QR square
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            //   backgroundColor: "#fff", // VERY important for QR
          }}
        />
        <View className="flex-row justify-center my-4 items-center gap-3">
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: theme.border }}
            className="flex w-1/2 flex-row items-center justify-center gap-2 px-4 py-2 rounded-md"
          >
            <ArrowDownToLineIcon color={theme.text} />
            <Text style={{ color: theme.text }}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: theme.border }}
            className="flex w-1/2 flex-row items-center justify-center gap-2 px-4 py-2 rounded-md"
          >
            <ExternalLink color={theme.text} />
            <Text style={{ color: theme.text }} className="text-center">
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
