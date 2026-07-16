import { AvailabilityBadge, BookCover } from "@/components/library/BookCover";
import { useTheme } from "@/hooks/use-theme";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function BookCard({
  title,
  author,
  subtitle,
  cover,
  available,
  onPress,
}: {
  title: string;
  author?: string | null;
  subtitle?: string | null;
  cover?: string | null;
  available?: boolean;
  onPress?: () => void;
}) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl p-3"
      style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
    >
      <BookCover uri={cover} title={title} width={48} height={66} />
      <View className="flex-1" style={{ marginLeft: 12 }}>
        <Text numberOfLines={2} style={{ color: theme.text }} className="text-sm font-semibold">
          {title}
        </Text>
        {author ? (
          <Text
            numberOfLines={1}
            style={{ color: theme.text, opacity: 0.6, marginTop: 2 }}
            className="text-xs"
          >
            {author}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{ color: theme.text, opacity: 0.45, marginTop: 2, fontSize: 11 }}
          >
            {subtitle}
          </Text>
        ) : null}
        {available !== undefined ? (
          <View style={{ marginTop: 6 }}>
            <AvailabilityBadge available={available} isDark={isDark} />
          </View>
        ) : null}
      </View>
      {onPress ? (
        <ChevronRight size={18} color={theme.text} style={{ opacity: 0.4, marginLeft: 6 }} />
      ) : null}
    </Pressable>
  );
}
