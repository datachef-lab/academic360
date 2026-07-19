import { PaytmWebCheckout } from "@/components/fees/paytm-web-checkout";
import {
  ensureFeeChallan,
  fetchPaytmConfig,
  initiateFeePayment,
  resolveBackendAssetUrl,
  type StudentFeeMapping,
} from "@/services/fees-api";
import {
  feeMappingSubtitle,
  feeMappingTitle,
  formatInr,
  hasChallan,
  isFeeMappingPaid,
} from "@/lib/fee-utils";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { BouncingDots } from "@/components/ui/BouncingDots";
import { Check, Download, FileText, History, IndianRupeeIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";

type FeeDetailSheetProps = {
  visible: boolean;
  mapping: StudentFeeMapping | null;
  onClose: () => void;
  onRefresh: () => void;
};

export function FeeDetailSheet({ visible, mapping, onClose, onRefresh }: FeeDetailSheetProps) {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";

  const [busy, setBusy] = useState<"challan" | "pay" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paytmVisible, setPaytmVisible] = useState(false);
  const [paytmSession, setPaytmSession] = useState<{
    mid: string;
    host: string;
    orderId: string;
    txnToken: string;
  } | null>(null);

  if (!mapping) return null;

  const paid = isFeeMappingPaid(mapping);
  const payable = Number(mapping.totalPayable ?? 0);
  const paidAmount = Number(mapping.amountPaid ?? 0);
  const due = Math.max(0, payable - paidAmount);
  const challanReady = hasChallan(mapping);
  const paidAtRaw =
    mapping.transactionDate ||
    mapping.challanGeneratedAt ||
    (mapping.updatedAt as string | undefined);
  const mappingId = Number(mapping.id ?? 0);
  const feeStructureId = Number(mapping.feeStructure?.id ?? 0);

  const handleDownloadChallan = async () => {
    if (!student?.id || !feeStructureId) return;
    try {
      setBusy("challan");
      setMessage(null);
      const res = await ensureFeeChallan(student.id, feeStructureId);
      const url = res.payload?.url;
      if (!url) {
        setMessage("Could not generate challan. Please try again.");
        return;
      }
      const remoteUrl = resolveBackendAssetUrl(url);
      if (Platform.OS === "web") {
        await Linking.openURL(remoteUrl);
      } else {
        // Receipt numbers contain slashes ("0804250001/02-FA") — raw use made
        // downloadAsync treat the name as a nonexistent subdirectory.
        const safeName = String(mapping.receiptNumber || mappingId || Date.now()).replace(
          /[^\w.-]+/g,
          "-",
        );
        const fileName = `fee-challan-${safeName}.pdf`;
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.downloadAsync(remoteUrl, localUri);
        const openedDirectly = await openPdfInViewer(localUri);
        if (!openedDirectly) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, {
              mimeType: "application/pdf",
              dialogTitle: "Save or share challan",
            });
          } else {
            await Linking.openURL(localUri);
          }
        }
      }
      onRefresh();
      setMessage("Challan is ready.");
    } catch (e) {
      console.error(e);
      setMessage("Failed to generate challan.");
    } finally {
      setBusy(null);
    }
  };

  const handlePayOnline = async () => {
    if (!student?.id || paid || !mappingId || !feeStructureId) return;
    try {
      setBusy("pay");
      setMessage(null);

      if (!challanReady) {
        const res = await ensureFeeChallan(student.id, feeStructureId);
        if (!res.payload?.url) {
          setMessage("Generate challan before paying online.");
          return;
        }
        onRefresh();
      }

      const returnUrl = Linking.createURL("console/fees", {
        queryParams: {
          payment: "success",
          mappingId: String(mappingId),
        },
      });

      const [configRes, initRes] = await Promise.all([
        fetchPaytmConfig(),
        initiateFeePayment({
          feeStudentMappingId: mappingId,
          amount: String(due || payable),
          studentId: student.id,
          email: (student as { personalEmail?: string }).personalEmail,
          mobile: (student as { mobile?: string }).mobile ?? undefined,
          firstName: (user?.name || "").split(" ")[0] || undefined,
          lastName: (user?.name || "").split(" ").slice(1).join(" ") || undefined,
          returnUrl,
        }),
      ]);

      const config = configRes.payload;
      const init = initRes.payload;
      if (!config?.mid || !config?.host || !init?.orderId || !init?.txnToken) {
        setMessage("Payment could not be started. Please try again.");
        return;
      }

      setPaytmSession({
        mid: config.mid,
        host: config.host,
        orderId: init.orderId,
        txnToken: init.txnToken,
      });
      setPaytmVisible(true);
    } catch (e) {
      console.error(e);
      setMessage("Failed to start online payment.");
    } finally {
      setBusy(null);
    }
  };

  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} bg={theme.background}>
        {busy === "challan" ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)",
            }}
          >
            <BouncingDots
              color={isDark ? "#a5b4fc" : "#4f46e5"}
              shadowColor={isDark ? "rgba(165,180,252,0.3)" : "rgba(79,70,229,0.35)"}
              size={12}
            />
            <Text style={{ color: theme.text, marginTop: 22, fontSize: 14, fontWeight: "600" }}>
              Preparing challan…
            </Text>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>Fee details</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ color: theme.text, fontSize: 22, lineHeight: 22 }}>×</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.text, fontSize: 14, opacity: 0.65, marginTop: 6 }}>
              {feeMappingSubtitle(mapping)}
            </Text>

            <View
              style={{
                // marginTop: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: cardBorder,
                overflow: "hidden",
              }}
            >
              <InfoRow
                label="Receipt type"
                value={mapping.feeStructure?.receiptType?.name || "—"}
                themeText={theme.text}
                isDark={isDark}
              />
              <InfoRow
                label="Academic year"
                value={mapping.feeStructure?.academicYear?.year || "—"}
                themeText={theme.text}
                isDark={isDark}
              />
              <InfoRow
                label="Semester"
                value={mapping.feeStructure?.class?.name || "—"}
                themeText={theme.text}
                isDark={isDark}
              />
              <InfoRow
                label="Total amount"
                value={formatInr(payable)}
                themeText={theme.text}
                isDark={isDark}
              />
              <InfoRow
                label="Receipt number"
                value={mapping.receiptNumber || "Not generated"}
                themeText={theme.text}
                isDark={isDark}
              />
              <InfoRow
                label="Paid at"
                value={formatPaidAt(paidAtRaw)}
                themeText={theme.text}
                isDark={isDark}
                isLast
              />
            </View>
          </View>

          {message ? (
            <Text style={{ color: isDark ? "#fca5a5" : "#b91c1c", fontSize: 13, marginBottom: 12 }}>
              {message}
            </Text>
          ) : null}

          {paid ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 14,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7",
                marginBottom: 12,
              }}
            >
              <Check size={22} color={isDark ? "#86efac" : "#15803d"} />
              <Text style={{ color: isDark ? "#86efac" : "#15803d", fontWeight: "600", flex: 1 }}>
                Payment completed for this fee.
              </Text>
            </View>
          ) : null}

          <ActionButton
            icon={FileText}
            label={challanReady ? "View / download challan" : "Generate challan"}
            subtitle="PDF receipt for bank or cash payment"
            onPress={handleDownloadChallan}
            loading={busy === "challan"}
            themeText={theme.text}
            isDark={isDark}
          />

          {!paid ? (
            <>
              <ActionButton
                icon={IndianRupeeIcon}
                label="Pay online (Paytm)"
                subtitle="UPI, cards, and wallets"
                onPress={handlePayOnline}
                loading={busy === "pay"}
                themeText={theme.text}
                isDark={isDark}
                primary
                accent={accent}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: cardBorder,
                }}
              >
                <History size={18} color={theme.text} style={{ marginTop: 2, opacity: 0.7 }} />
                <Text style={{ color: theme.text, fontSize: 12, opacity: 0.75, flex: 1 }}>
                  For cash payment, generate the challan and pay at the college counter. Online
                  payment requires challan to be generated first.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>

      {paytmSession ? (
        <PaytmWebCheckout
          visible={paytmVisible}
          mid={paytmSession.mid}
          host={paytmSession.host}
          orderId={paytmSession.orderId}
          txnToken={paytmSession.txnToken}
          onClose={() => {
            setPaytmVisible(false);
            if (Platform.OS !== "web") {
              Alert.alert(
                "Payment",
                "If you completed payment, pull to refresh or reopen this screen to see updated status.",
              );
            }
            onRefresh();
          }}
          onNavigationChange={(url) => {
            if (url.includes("payment=success") || url.includes("console/fees")) {
              setPaytmVisible(false);
              onRefresh();
              onClose();
            }
          }}
        />
      ) : null}
    </>
  );
}

function Row({
  label,
  value,
  themeText,
  bold,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  themeText: string;
  bold?: boolean;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <View
      style={{
        alignItems: "flex-start",
        justifyContent: "center",
        minHeight: 56,
        width: "100%",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    >
      <Text style={{ color: themeText, opacity: 0.65, fontSize: 12, marginBottom: 2 }}>
        {label}
      </Text>
      <Text
        style={{
          color: highlight ? accent : themeText,
          fontSize: bold ? 16 : 14,
          fontWeight: bold ? "700" : "500",
          textAlign: "left",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatPaidAt(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  const day = date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${day}, ${time}`;
}

function InfoRow({
  label,
  value,
  themeText,
  isDark,
  isLast = false,
}: {
  label: string;
  value: string;
  themeText: string;
  isDark: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        paddingHorizontal: 12,
        paddingVertical: 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
      }}
    >
      <View
        style={{
          width: "44%",
          justifyContent: "center",
          paddingVertical: 10,
          paddingRight: 10,
          borderRightWidth: 1,
          borderRightColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }}
      >
        <Text style={{ color: themeText, opacity: 0.7, fontSize: 12, textAlign: "left" }}>
          {label}
        </Text>
      </View>
      <View
        style={{ width: "56%", justifyContent: "center", paddingVertical: 10, paddingLeft: 10 }}
      >
        <Text
          style={{
            color: themeText,
            fontSize: 13,
            fontWeight: "600",
            textAlign: "left",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Open the downloaded PDF straight in the system viewer (Android). Returns
 * false when it can't — expo-intent-launcher missing from the installed dev
 * client, no PDF viewer app, or non-Android — so the caller can fall back to
 * the share sheet. */
async function openPdfInViewer(localUri: string): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const contentUri = await FileSystem.getContentUriAsync(localUri);
    const IntentLauncher = await import("expo-intent-launcher");
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: "application/pdf",
    });
    return true;
  } catch {
    return false;
  }
}

function ActionButton({
  icon: Icon,
  label,
  subtitle,
  onPress,
  loading,
  themeText,
  isDark,
  primary,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  subtitle: string;
  onPress: () => void;
  loading: boolean;
  themeText: string;
  isDark: boolean;
  primary?: boolean;
  accent?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: primary ? accent : isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
        borderWidth: primary ? 0 : 1,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#fff" : accent} />
      ) : (
        <Icon size={20} color={primary ? "#fff" : themeText} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: primary ? "#fff" : themeText, fontWeight: "600", fontSize: 15 }}>
          {label}
        </Text>
        <Text
          style={{
            color: primary ? "rgba(255,255,255,0.85)" : themeText,
            fontSize: 12,
            opacity: 0.7,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      {!primary ? <Download size={18} color={themeText} style={{ opacity: 0.5 }} /> : null}
    </Pressable>
  );
}
