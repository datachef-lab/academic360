import { StudentDto } from "@/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { ArrowDownToLineIcon, ExternalLink } from "lucide-react-native";
import React, { useRef } from "react";
import { Alert, Platform, Share, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function UserInfo() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const qrRef = useRef<any>(null);
  const uid = (user?.payload as StudentDto)?.uid;
  const hasValidUid = typeof uid === "string" && uid.trim().length > 0;

  const handleDownload = () => {
    if (!hasValidUid || !qrRef.current) return;
    qrRef.current.toDataURL(async (dataUrl: string) => {
      try {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const filename = `qrcode-${uid}.png`;
        if (Platform.OS === "web") {
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = filename;
          link.click();
        } else {
          const FileSystem = await import("expo-file-system/legacy");
          const MediaLibrary = await import("expo-media-library");
          const Sharing = await import("expo-sharing");
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(fileUri);
            Alert.alert("Saved", "QR code saved to your photos.");
          } else {
            await Sharing.shareAsync(fileUri);
          }
        }
      } catch (e) {
        Alert.alert("Error", "Could not save QR code.");
      }
    });
  };

  const handleShare = () => {
    if (!hasValidUid || !qrRef.current) return;
    qrRef.current.toDataURL(async (dataUrl: string) => {
      try {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const filename = `qrcode-${uid}.png`;
        if (Platform.OS === "web") {
          if (navigator.share) {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], filename, { type: "image/png" });
            await navigator.share({
              title: "Student ID QR Code",
              text: `Student UID: ${uid}`,
              files: [file],
            });
          } else {
            navigator.clipboard.writeText(uid);
            Alert.alert("Copied", "UID copied to clipboard.");
          }
        } else {
          const FileSystem = await import("expo-file-system/legacy");
          const Sharing = await import("expo-sharing");
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(fileUri, {
              mimeType: "image/png",
              dialogTitle: "Share QR Code",
            });
          } else {
            await Share.share({
              message: `Student UID: ${uid}`,
              title: "Student ID",
            });
          }
        }
      } catch (e) {
        Alert.alert("Error", "Could not share QR code.");
      }
    });
  };

  return (
    <View className="w-full gap-4">
      {/* User row */}
      <View className="gap-5">
        <Text style={{ color: theme.text }} className="text-xl font-semibold">
          {(user?.payload as StudentDto)?.programCourse?.shortName}
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
              {(user?.payload as StudentDto)?.rollNumber ?? "N/A"}
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
              {(user?.payload as StudentDto)?.registrationNumber ?? "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* QR Code - encodes UID for scanning */}
      <View className="w-full items-center">
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 12,
            backgroundColor: "#fff",
          }}
        >
          {hasValidUid ? (
            <QRCode
              getRef={(c) => (qrRef.current = c)}
              value={uid}
              size={200}
              color="#000000"
              backgroundColor="#ffffff"
            />
          ) : (
            <View
              style={{
                width: 200,
                height: 200,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 14 }}>UID not available</Text>
            </View>
          )}
        </View>
        <View className="flex-row justify-center my-4 items-center gap-3">
          <TouchableOpacity
            onPress={handleDownload}
            disabled={!hasValidUid}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: hasValidUid ? 1 : 0.5,
            }}
            activeOpacity={0.7}
          >
            <ArrowDownToLineIcon color={theme.text} size={18} />
            <Text style={{ color: theme.text, fontWeight: "600" }}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            disabled={!hasValidUid}
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: hasValidUid ? 1 : 0.5,
            }}
            activeOpacity={0.7}
          >
            <ExternalLink color={theme.text} size={18} />
            <Text style={{ color: theme.text, fontWeight: "600" }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
