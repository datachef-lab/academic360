import { FeeDetailSheet } from "@/components/fees/fee-detail-sheet";
import { FeeMappingCard } from "@/components/fees/fee-mapping-card";
import { Tabs } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import { isFeeMappingPaid } from "@/lib/fee-utils";
import { useAuth } from "@/providers/auth-provider";
import { useFeeSocketRefresh } from "@/providers/exam-socket-provider";
import { fetchStudentFeeMappings, type StudentFeeMapping } from "@/services/fees-api";
import type { StudentDto } from "@repo/db/dtos/user";
import { useLocalSearchParams } from "expo-router";
import { IndianRupeeIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

type FeeFilter = "all" | "pending" | "paid";

export default function FeesScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const params = useLocalSearchParams<{ payment?: string; mappingId?: string }>();

  const [mappings, setMappings] = useState<StudentFeeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeeFilter>("all");
  const [selected, setSelected] = useState<StudentFeeMapping | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const tabBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const tabBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const loadMappings = useCallback(
    async (isRefresh = false) => {
      if (!student?.id) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const res = await fetchStudentFeeMappings(student.id);
        const list = Array.isArray(res.payload) ? res.payload : [];
        setMappings(list);
      } catch (e) {
        console.error(e);
        setError("Failed to load fees. Pull to refresh.");
        setMappings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [student?.id],
  );

  useEffect(() => {
    void loadMappings();
  }, [loadMappings]);

  useFeeSocketRefresh(() => {
    void loadMappings(true);
  });

  useEffect(() => {
    if (params.payment === "success") {
      void loadMappings(true);
      if (params.mappingId) {
        const id = Number(params.mappingId);
        const match = mappings.find((m) => m.id === id);
        if (match) {
          setSelected(match);
          setSheetOpen(true);
        }
      }
    }
  }, [params.payment, params.mappingId, mappings, loadMappings]);

  const filtered = useMemo(() => {
    if (filter === "pending") return mappings.filter((m) => !isFeeMappingPaid(m));
    if (filter === "paid") return mappings.filter((m) => isFeeMappingPaid(m));
    return mappings;
  }, [mappings, filter]);

  const pendingCount = mappings.filter((m) => !isFeeMappingPaid(m)).length;

  const openDetail = (mapping: StudentFeeMapping) => {
    setSelected(mapping);
    setSheetOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMappings(true)}
            tintColor={accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 12 }} />

        <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
          <Tabs
            tabs={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "paid", label: "Paid" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </View>

        {error ? (
          <View
            style={{
              marginHorizontal: 12,
              padding: 14,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2",
            }}
          >
            <Text style={{ color: isDark ? "#fca5a5" : "#b91c1c", fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 12 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <IndianRupeeIcon
                size={40}
                color={theme.text}
                style={{ opacity: 0.25, marginBottom: 12 }}
              />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
                No fees found
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 14,
                  opacity: 0.6,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {filter === "pending"
                  ? "You have no pending fee payments."
                  : filter === "paid"
                    ? "No completed payments yet."
                    : "Fee mappings will appear here when assigned by the college."}
              </Text>
            </View>
          ) : (
            filtered.map((mapping) => (
              <FeeMappingCard
                key={mapping.id}
                mapping={mapping}
                onPress={() => openDetail(mapping)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FeeDetailSheet
        visible={sheetOpen}
        mapping={selected}
        onClose={() => {
          setSheetOpen(false);
          setSelected(null);
        }}
        onRefresh={() => loadMappings(true)}
      />
    </View>
  );
}
