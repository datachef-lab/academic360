import { BookCover } from "@/components/library/BookCover";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchMyCirculation,
  searchCatalogue,
  type CirculationRow,
  type LibraryHit,
} from "@/services/library";
import { router } from "expo-router";
import { BookMarked, ChevronRight, ListChecks, MapPin, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const DAY = 24 * 60 * 60 * 1000;

export default function LibraryHomeScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const userId = (user as { id?: number } | undefined)?.id;

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const [loans, setLoans] = useState<CirculationRow[]>([]);
  const [featured, setFeatured] = useState<LibraryHit[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (userId) {
      fetchMyCirculation(userId).then((rows) => !cancelled && setLoans(rows));
    }
    searchCatalogue("a", { type: "BOOK", limit: 12 }).then((h) => !cancelled && setFeatured(h));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const summary = useMemo(() => {
    const current = loans.filter((l) => l.status === "ISSUED");
    const now = Date.now();
    const dueSoon = current.filter(
      (l) => new Date(l.returnTimestamp).getTime() - now <= 3 * DAY,
    ).length;
    const fine = loans.reduce((sum, l) => sum + (Number(l.netFine) || 0), 0);
    return { borrowed: current.length, dueSoon, fine };
  }, [loans]);

  const tiles = [
    {
      id: "catalogue",
      label: "Catalogue",
      desc: "Search books",
      icon: Search,
      path: "/console/library/catalogue",
    },
    {
      id: "my-books",
      label: "My Books",
      desc: "Loans & fines",
      icon: BookMarked,
      path: "/console/library/my-books",
    },
    {
      id: "lists",
      label: "Reading Lists",
      desc: "For your course",
      icon: ListChecks,
      path: "/console/library/reading-lists",
    },
    {
      id: "map",
      label: "Library Map",
      desc: "Find your way",
      icon: MapPin,
      path: "/console/library/map",
    },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.push("/console/library/catalogue")}
        className="flex-row items-center rounded-2xl px-4 mb-5"
        style={{ height: 50, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        <Search size={18} color={theme.text} style={{ opacity: 0.5 }} />
        <Text style={{ color: theme.text, opacity: 0.5, marginLeft: 10 }} className="text-base">
          Search books, authors, ISBN…
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/console/library/my-books")}
        className="rounded-2xl p-4 mb-5 flex-row items-center"
        style={{ backgroundColor: accentBg, borderWidth: 1, borderColor: cardBorder }}
      >
        <View
          className="rounded-2xl items-center justify-center mr-3"
          style={{
            width: 48,
            height: 48,
            backgroundColor: isDark ? "rgba(99,102,241,0.3)" : "#ffffff",
          }}
        >
          <BookMarked size={24} color={accent} />
        </View>
        <View className="flex-row flex-1" style={{ gap: 18 }}>
          <Stat label="Borrowed" value={String(summary.borrowed)} theme={theme} />
          <Stat label="Due soon" value={String(summary.dueSoon)} theme={theme} />
          <Stat label="Fine" value={`₹${summary.fine}`} theme={theme} />
        </View>
        <ChevronRight size={18} color={theme.text} style={{ opacity: 0.4 }} />
      </Pressable>

      <View
        className="flex-row flex-wrap mb-6"
        style={{ justifyContent: "space-between", rowGap: 12 }}
      >
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Pressable
              key={t.id}
              onPress={() => router.push(t.path as any)}
              className="rounded-2xl p-4"
              style={{
                width: "48.5%",
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: cardBorder,
              }}
            >
              <View
                className="rounded-xl items-center justify-center mb-2.5"
                style={{ width: 40, height: 40, backgroundColor: accentBg }}
              >
                <Icon size={20} color={accent} />
              </View>
              <Text style={{ color: theme.text }} className="text-base font-semibold">
                {t.label}
              </Text>
              <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                {t.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {featured.length > 0 ? (
        <>
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: theme.text }} className="text-lg font-bold">
              From the catalogue
            </Text>
            <Pressable onPress={() => router.push("/console/library/catalogue")}>
              <Text style={{ color: accent }} className="text-sm font-semibold">
                See all
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {featured.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push(`/console/library/book/${b.id}` as any)}
                style={{ width: 96 }}
              >
                <BookCover title={b.title} width={96} height={132} />
                <Text numberOfLines={2} style={{ color: theme.text, fontSize: 12, marginTop: 6 }}>
                  {b.title}
                </Text>
                {b.author ? (
                  <Text
                    numberOfLines={1}
                    style={{ color: theme.text, opacity: 0.55, fontSize: 11 }}
                  >
                    {b.author}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: { text: string } }) {
  return (
    <View>
      <Text style={{ color: theme.text }} className="text-lg font-bold">
        {value}
      </Text>
      <Text style={{ color: theme.text, opacity: 0.6, fontSize: 11 }}>{label}</Text>
    </View>
  );
}
