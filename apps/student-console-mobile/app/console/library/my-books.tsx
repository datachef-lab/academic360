import { BookCover } from "@/components/library/BookCover";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { fetchMyCirculation, type CirculationRow } from "@/services/library";
import { History, IndianRupee, Library as LibraryIcon } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

type TabKey = "loans" | "history" | "fines";
const DAY = 24 * 60 * 60 * 1000;

function fmtDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function dueLabel(due: string): { text: string; color: string } {
  const days = Math.ceil((new Date(due).getTime() - Date.now()) / DAY);
  if (days < 0) return { text: `Overdue by ${-days}d`, color: "#ef4444" };
  if (days === 0) return { text: "Due today", color: "#d97706" };
  if (days <= 3) return { text: `Due in ${days}d`, color: "#d97706" };
  return { text: `Due ${fmtDate(due)}`, color: "#16a34a" };
}

export default function MyBooksScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const userId = (user as { id?: number } | undefined)?.id;

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";

  const [rows, setRows] = useState<CirculationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("loans");

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchMyCirculation(userId)
      .then((r) => !cancelled && setRows(r))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loans = useMemo(() => rows.filter((r) => r.status === "ISSUED"), [rows]);
  const history = useMemo(() => rows.filter((r) => r.status === "RETURNED"), [rows]);
  const fines = useMemo(() => rows.filter((r) => (Number(r.netFine) || 0) > 0), [rows]);

  const tabs: TabItem<TabKey>[] = [
    { id: "loans", label: "Loans", icon: LibraryIcon },
    { id: "history", label: "History", icon: History },
    { id: "fines", label: "Fines", icon: IndianRupee },
  ];

  const list = tab === "loans" ? loans : tab === "history" ? history : fines;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </View>

      {loading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={accent} />
        </View>
      ) : list.length === 0 ? (
        <View className="py-16 items-center">
          <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm text-center">
            {tab === "loans"
              ? "You have no books on loan."
              : tab === "history"
                ? "No borrowing history yet."
                : "No outstanding fines. 🎉"}
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {list.map((r) => {
            const due = dueLabel(r.returnTimestamp);
            const fine = Number(r.netFine) || 0;
            return (
              <View
                key={r.id}
                className="flex-row rounded-2xl p-3"
                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
              >
                <BookCover uri={r.frontCover} title={r.title} width={46} height={64} />
                <View className="flex-1" style={{ marginLeft: 12 }}>
                  <Text
                    numberOfLines={2}
                    style={{ color: theme.text }}
                    className="text-sm font-semibold"
                  >
                    {r.title || "Book"}
                  </Text>
                  {r.author ? (
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.text, opacity: 0.6, marginTop: 2 }}
                      className="text-xs"
                    >
                      {r.author}
                    </Text>
                  ) : null}

                  {tab === "loans" ? (
                    <View className="flex-row items-center justify-between mt-2">
                      <Text style={{ color: due.color, fontSize: 12, fontWeight: "600" }}>
                        {due.text}
                      </Text>
                      <Pressable
                        onPress={() =>
                          Alert.alert("Renewed", "Loan renewed (sample — renewals coming soon).")
                        }
                        className="rounded-lg px-3 py-1"
                        style={{
                          backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)",
                        }}
                      >
                        <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>
                          Renew
                        </Text>
                      </Pressable>
                    </View>
                  ) : tab === "history" ? (
                    <Text
                      style={{ color: theme.text, opacity: 0.55, marginTop: 2 }}
                      className="text-xs"
                    >
                      Returned {r.actualReturnTimestamp ? fmtDate(r.actualReturnTimestamp) : "—"}
                    </Text>
                  ) : (
                    <View className="flex-row items-center justify-between mt-2">
                      <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "700" }}>
                        ₹{fine}
                      </Text>
                      <Pressable
                        onPress={() =>
                          Alert.alert("Pay fine", "In-app fine payment is coming soon.")
                        }
                        className="rounded-lg px-3 py-1"
                        style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Pay</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-4">
        Renew & pay are samples — coming soon.
      </Text>
    </ScrollView>
  );
}
