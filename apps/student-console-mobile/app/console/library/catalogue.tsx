import { BookCard } from "@/components/library/BookCard";
import { useTheme } from "@/hooks/use-theme";
import { searchCatalogue, type LibraryHit } from "@/services/library";
import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function CatalogueScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<LibraryHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await searchCatalogue(term, { limit: 30 });
      if (cancelled) return;
      setHits(res);
      setLoading(false);
      setSearched(true);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Search input */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View
          className="flex-row items-center rounded-2xl px-4"
          style={{ height: 50, backgroundColor: inputBg, borderWidth: 1, borderColor: border }}
        >
          <Search size={18} color={theme.text} style={{ opacity: 0.5 }} />
          <TextInput
            ref={inputRef}
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search books, authors, ISBN…"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
            className="flex-1 text-base"
            style={{ color: theme.text, marginLeft: 10 }}
            returnKeyType="search"
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <X size={18} color={theme.text} style={{ opacity: 0.5 }} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={accent} />
          </View>
        ) : searched && hits.length === 0 ? (
          <View className="py-16 items-center">
            <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm">
              No results for “{q.trim()}”.
            </Text>
          </View>
        ) : !searched ? (
          <View className="py-16 items-center px-8">
            <Search size={40} color={theme.text} style={{ opacity: 0.25 }} />
            <Text style={{ color: theme.text, opacity: 0.5 }} className="text-sm text-center mt-3">
              Search the library catalogue by title, author or ISBN.
            </Text>
          </View>
        ) : (
          hits.map((h) => (
            <BookCard
              key={`${h.type}-${h.id}`}
              title={h.title}
              author={h.author}
              subtitle={[h.publisher, h.edition, h.meta].filter(Boolean).join(" · ") || undefined}
              available={(h.quantity ?? 0) > 0}
              onPress={() => router.push(`/console/library/book/${h.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
