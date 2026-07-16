import { BookCard } from "@/components/library/BookCard";
import { useTheme } from "@/hooks/use-theme";
import { fetchBook, fetchReadingListItems, type ReadingListItem } from "@/services/library";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

type Resolved = {
  key: string;
  title: string;
  author?: string | null;
  cover?: string | null;
  bookId?: number;
  url?: string | null;
};

export default function ReadingListDetailScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const params = useLocalSearchParams<{ id: string }>();
  const listId = Number(params.id);

  const [items, setItems] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!listId) {
      setLoading(false);
      return;
    }
    (async () => {
      const raw: ReadingListItem[] = await fetchReadingListItems(listId);
      // Resolve book titles/covers for book items (external items use their own title).
      const resolved = await Promise.all(
        raw.map(async (it, i): Promise<Resolved> => {
          if (it.bookId) {
            const b = await fetchBook(it.bookId);
            return {
              key: `b-${it.id ?? i}`,
              title: b?.title || it.externalTitle || `Book #${it.bookId}`,
              author:
                (b?.authors ?? [])
                  .map((a) => a?.name)
                  .filter(Boolean)
                  .join(", ") || null,
              cover: b?.frontCover ?? null,
              bookId: it.bookId,
            };
          }
          return {
            key: `e-${it.id ?? i}`,
            title: it.externalTitle || "Resource",
            author: it.notes ?? null,
            url: it.externalUrl ?? null,
          };
        }),
      );
      if (!cancelled) {
        setItems(resolved);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={accent} />
        </View>
      ) : items.length === 0 ? (
        <View className="py-16 items-center">
          <Text style={{ color: theme.text, opacity: 0.55 }} className="text-sm text-center">
            This reading list is empty.
          </Text>
        </View>
      ) : (
        items.map((it) => (
          <BookCard
            key={it.key}
            title={it.title}
            author={it.author}
            cover={it.cover}
            onPress={() => {
              if (it.bookId) router.push(`/console/library/book/${it.bookId}` as any);
              else if (it.url) WebBrowser.openBrowserAsync(it.url);
            }}
          />
        ))
      )}
    </ScrollView>
  );
}
