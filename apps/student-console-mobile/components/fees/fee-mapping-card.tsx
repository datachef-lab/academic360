import type { StudentFeeMapping } from "@/services/fees-api";
import { feeMappingSubtitle, feeMappingTitle, formatInr, isFeeMappingPaid } from "@/lib/fee-utils";
import { useTheme } from "@/hooks/use-theme";
import { ChevronRightIcon, IndianRupeeIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type FeeMappingCardProps = {
  mapping: StudentFeeMapping;
  onPress: () => void;
};

export function FeeMappingCard({ mapping, onPress }: FeeMappingCardProps) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const paid = isFeeMappingPaid(mapping);
  const payable = Number(mapping.totalPayable ?? 0);

  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const statusBg = paid
    ? isDark
      ? "rgba(34,197,94,0.2)"
      : "#dcfce7"
    : isDark
      ? "rgba(245,158,11,0.2)"
      : "#fef3c7";
  const statusColor = paid ? (isDark ? "#86efac" : "#15803d") : isDark ? "#fcd34d" : "#b45309";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: cardBorder,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(99,102,241,0.25)" : "rgba(79,70,229,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IndianRupeeIcon size={22} color={accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }} numberOfLines={2}>
            {feeMappingTitle(mapping)}
          </Text>
          <Text
            style={{ color: theme.text, fontSize: 13, opacity: 0.65, marginTop: 4 }}
            numberOfLines={2}
          >
            {feeMappingSubtitle(mapping)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>
              {formatInr(payable)}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: statusBg,
              }}
            >
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: "600" }}>
                {paid ? "Paid" : "Pending"}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRightIcon size={20} color={theme.text} style={{ opacity: 0.45, marginTop: 4 }} />
      </View>
    </Pressable>
  );
}
