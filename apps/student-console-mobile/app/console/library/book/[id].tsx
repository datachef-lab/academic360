import { AvailabilityBadge, BookCover } from "@/components/library/BookCover";
import { useTheme } from "@/hooks/use-theme";
import {
  fetchBook,
  fetchCopies,
  startCdlSession,
  type LibraryBook,
  type OpacCopy,
} from "@/services/library";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import { BookOpen, Bookmark, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function BookDetailScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = Number(params.id);

  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#818cf8" : "#4f46e5";

  const [book, setBook] = useState<LibraryBook | null>(null);
  const [copies, setCopies] = useState<OpacCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!bookId) {
      setLoading(false);
      return;
    }
    Promise.all([fetchBook(bookId), fetchCopies("BOOK", bookId)])
      .then(([b, c]) => {
        if (cancelled) return;
        setBook(b);
        setCopies(c);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const readEbook = async () => {
    if (!book) return;
    setOpening(true);
    const session = await startCdlSession(book.id);
    setOpening(false);
    if (session?.signedUrl) {
      await WebBrowser.openBrowserAsync(session.signedUrl);
    } else {
      Alert.alert("Unavailable", "This e-book can't be opened right now.");
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  if (!book) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: theme.background }}
      >
        <Text style={{ color: theme.text, opacity: 0.6 }} className="text-center">
          Book not found.
        </Text>
      </View>
    );
  }

  const author = (book.authors ?? [])
    .map((a) => a?.name)
    .filter(Boolean)
    .join(", ");
  const available = copies.some((c) => !c.availableDate);
  const firstRack = copies.find((c) => c.rack)?.rack;
  const meta: [string, string | number | null | undefined][] = [
    ["Publisher", book.publisher?.name],
    ["Edition", book.edition],
    ["ISBN", book.isbn],
    ["Language", book.language?.name],
    ["Published", book.publishedYear],
    ["Type", book.documentType?.name],
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row" style={{ gap: 16 }}>
        <BookCover uri={book.frontCover} title={book.title} width={110} height={150} />
        <View className="flex-1">
          <Text style={{ color: theme.text }} className="text-xl font-bold">
            {book.title}
          </Text>
          {book.subTitle ? (
            <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mt-1">
              {book.subTitle}
            </Text>
          ) : null}
          {author ? (
            <Text style={{ color: theme.text, opacity: 0.65 }} className="text-sm mt-2">
              {author}
            </Text>
          ) : null}
          <View className="mt-3">
            <AvailabilityBadge available={available} isDark={isDark} />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row mt-5" style={{ gap: 10 }}>
        {book.cdlEnabled ? (
          <Pressable
            onPress={readEbook}
            disabled={opening}
            className="flex-1 flex-row items-center justify-center rounded-xl py-3"
            style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
          >
            {opening ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <BookOpen size={18} color="#fff" />
            )}
            <Text className="text-white font-semibold" style={{ marginLeft: 8 }}>
              Read e-book
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() =>
            Alert.alert(
              "Reserved",
              "Your hold has been placed (sample — reservations coming soon).",
            )
          }
          className="flex-1 flex-row items-center justify-center rounded-xl py-3"
          style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
        >
          <Bookmark size={18} color={accent} />
          <Text style={{ color: theme.text, marginLeft: 8 }} className="font-semibold">
            Reserve
          </Text>
        </Pressable>
      </View>

      {/* Metadata */}
      <View
        className="rounded-2xl mt-5 overflow-hidden"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {meta
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v], i, arr) => (
            <View
              key={k}
              className="flex-row justify-between px-4 py-3"
              style={{
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: cardBorder,
              }}
            >
              <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm">
                {k}
              </Text>
              <Text style={{ color: theme.text }} className="text-sm font-medium">
                {String(v)}
              </Text>
            </View>
          ))}
      </View>

      {/* Availability / location */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mt-6 mb-3"
      >
        AVAILABILITY
      </Text>
      <View className="gap-2">
        {copies.length === 0 ? (
          <Text style={{ color: theme.text, opacity: 0.55 }} className="text-sm">
            No copy information available.
          </Text>
        ) : (
          copies.slice(0, 8).map((c, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View>
                <Text style={{ color: theme.text }} className="text-sm font-medium">
                  {[c.rack, c.shelf].filter(Boolean).join(" · ") || "Stacks"}
                </Text>
                {c.accessNumber ? (
                  <Text style={{ color: theme.text, opacity: 0.55, fontSize: 12 }}>
                    Access {c.accessNumber}
                  </Text>
                ) : null}
              </View>
              <AvailabilityBadge available={!c.availableDate} isDark={isDark} />
            </View>
          ))
        )}
      </View>

      {firstRack ? (
        <Pressable
          onPress={() =>
            router.push({ pathname: "/console/library/map", params: { rack: firstRack } } as any)
          }
          className="flex-row items-center justify-center rounded-xl py-3 mt-4"
          style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
        >
          <MapPin size={18} color={accent} />
          <Text style={{ color: theme.text, marginLeft: 8 }} className="font-semibold">
            Find on library map
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
