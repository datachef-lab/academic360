import { useTheme } from "@/hooks/use-theme";
import { fetchReadingLists, type ReadingList } from "@/services/library";
import { router } from "expo-router";
import { ChevronRight, ListChecks } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

export default function ReadingListsScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchReadingLists()
      .then((l) => !cancelled && setLists(l))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={accent} />
        </View>
      ) : lists.length === 0 ? (
        <View className="py-16 items-center px-8">
          <ListChecks size={40} color={theme.text} style={{ opacity: 0.25 }} />
          <Text style={{ color: theme.text, opacity: 0.55 }} className="text-sm text-center mt-3">
            No reading lists have been shared for your course yet.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {lists.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => router.push(`/console/library/reading-lists/${l.id}` as any)}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 44, height: 44, backgroundColor: accentBg }}
              >
                <ListChecks size={22} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-base font-semibold">
                  {l.title}
                </Text>
                {l.description ? (
                  <Text
                    numberOfLines={2}
                    style={{ color: theme.text, opacity: 0.6 }}
                    className="text-xs mt-0.5"
                  >
                    {l.description}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
