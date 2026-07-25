import AsyncStorage from "@react-native-async-storage/async-storage";
import { feeDueIllustration } from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { formatInr, isFeeMappingPaid } from "@/lib/fee-utils";
import { fetchStudentFeeMappings, type StudentFeeMapping } from "@/services/fees-api";
import { Check, X } from "lucide-react-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";

/**
 * Mobile twin of the student-console web "Important Notification" fee-due
 * declaration (fees-due-alert-dialog.tsx). Both checkboxes are UI-only —
 * nothing is stored in the DB (explicit product decision); "declared once"
 * lives in AsyncStorage per (student, semesterLabel) so the modal is not
 * shown again on this device.
 */

type MappingView = StudentFeeMapping & {
  feeStructure?: {
    receiptType?: { name?: string | null } | null;
    class?: { name?: string | null } | null;
    academicYear?: { year?: string | null } | null;
  } | null;
};

const isCasualReceipt = (m: MappingView): boolean =>
  String(m.feeStructure?.receiptType?.name ?? "")
    .toLowerCase()
    .includes("casual");

export function computeDueFees(mappings: StudentFeeMapping[]): MappingView[] {
  return (mappings as MappingView[]).filter(
    (m) => Number(m.totalPayable ?? 0) > 0 && !isFeeMappingPaid(m) && !isCasualReceipt(m),
  );
}

export function dueFeesSemesterContext(dueFees: MappingView[]): {
  label: string;
  display: string;
} {
  const names = Array.from(
    new Set(
      dueFees
        .map((fee) =>
          String(fee.feeStructure?.class?.name ?? "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ).sort();
  if (names.length === 0) return { label: "CURRENT", display: "current" };
  return {
    label: names.join(" & "),
    display: names.map((n) => n.replace(/^SEMESTER\s*/i, "").trim() || n).join(" & "),
  };
}

const storageKey = (studentId: number, semesterLabel: string) =>
  `a360:fee-due-declared:${studentId}:${semesterLabel}`;

/**
 * Gate hook for the admit-card download. `check()` resolves to true when the
 * download may proceed directly (no dues, or already declared on this device);
 * otherwise it opens the declaration modal and resolves false — call the
 * download again from `onProceed`.
 */
export function useFeeDueDeclarationGate(studentId?: number) {
  const [dueFees, setDueFees] = useState<MappingView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    fetchStudentFeeMappings(studentId)
      .then((res) => {
        if (cancelled) return;
        setDueFees(computeDueFees(Array.isArray(res.payload) ? res.payload : []));
      })
      .catch(() => {
        // Fees lookup failure must never block the admit card.
        if (!cancelled) setDueFees([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const context = dueFeesSemesterContext(dueFees);

  const isDeclared = useCallback(async (): Promise<boolean> => {
    if (!studentId) return true;
    try {
      return (await AsyncStorage.getItem(storageKey(studentId, context.label))) === "1";
    } catch {
      return false;
    }
  }, [studentId, context.label]);

  const markDeclared = useCallback(async () => {
    if (!studentId) return;
    try {
      await AsyncStorage.setItem(storageKey(studentId, context.label), "1");
    } catch {
      // Storage unavailable — worst case the student declares again next time.
    }
  }, [studentId, context.label]);

  return { dueFees, loaded, context, isDeclared, markDeclared };
}

interface FeeDueDeclarationModalProps {
  visible: boolean;
  onClose: () => void;
  dueFees: MappingView[];
  semesterDisplay: string;
  studentUid?: string | null;
  /** Both boxes ticked + "Generate admit card" pressed. */
  onProceed: () => void;
}

export function FeeDueDeclarationModal({
  visible,
  onClose,
  dueFees,
  semesterDisplay,
  studentUid,
  onProceed,
}: FeeDueDeclarationModalProps) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const cardBorder = isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb";
  const subText = isDark ? "rgba(255,255,255,0.75)" : "#4b5563";

  const [acknowledgeChecked, setAcknowledgeChecked] = useState(false);
  const [consequenceChecked, setConsequenceChecked] = useState(false);

  useEffect(() => {
    if (visible) {
      setAcknowledgeChecked(false);
      setConsequenceChecked(false);
    }
  }, [visible]);

  const canGenerate = acknowledgeChecked && consequenceChecked;
  const totalDue = dueFees.reduce((sum, fee) => sum + Number(fee.totalPayable ?? 0), 0);

  const CheckboxRow = ({
    checked,
    onToggle,
    children,
  }: {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <Pressable
      onPress={onToggle}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          borderWidth: 2,
          // Strong border + solid background so the unchecked box is clearly visible
          borderColor: checked ? accent : isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
          backgroundColor: checked ? accent : isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
      <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19, flex: 1 }}>{children}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            maxHeight: "88%",
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: isDark ? "#1f2130" : "#ffffff",
          }}
        >
          {/* Static title bar with close */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: cardBorder,
            }}
          >
            <Text style={{ color: "#e11d48", fontSize: 18, fontWeight: "700" }}>
              Important Notification:
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6",
              }}
            >
              <X size={18} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
            {/* Cover illustration banner (same artwork as the website) with a light
                dark overlay */}
            <View style={{ height: 150, width: "100%" }}>
              <Image
                source={feeDueIllustration}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              />
            </View>

            <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
              <Text style={{ color: subText, fontSize: 13, lineHeight: 19 }}>
                As per our records, your Semester{" "}
                <Text style={{ fontWeight: "700", fontStyle: "italic", color: theme.text }}>
                  {semesterDisplay}
                </Text>{" "}
                enrolment fee is not paid despite multiple reminders sent to you previously.{" "}
                <Text style={{ fontWeight: "700", fontStyle: "italic", color: theme.text }}>
                  Consequently, you are currently not considered a bonafide student of the College.
                </Text>
              </Text>
              <Text style={{ color: subText, fontSize: 13, lineHeight: 19, marginTop: 10 }}>
                Please note that completing enrolment procedure including payment of the Semester{" "}
                <Text style={{ fontWeight: "700", fontStyle: "italic", color: theme.text }}>
                  {semesterDisplay}
                </Text>{" "}
                fee is mandatory to appear for the Calcutta University End-Semester Examination.
              </Text>

              {studentUid ? (
                <Text style={{ color: subText, fontSize: 12, fontWeight: "600", marginTop: 14 }}>
                  UID: <Text style={{ color: theme.text }}>{studentUid}</Text>
                </Text>
              ) : null}

              {/* Dues — bordered table, matching the web dialog (#, A.Y., Receipt, Sem, Amount) */}
              {dueFees.length > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc",
                      borderBottomWidth: 1,
                      borderBottomColor: cardBorder,
                    }}
                  >
                    {(
                      [
                        ["#", 0.5],
                        ["A.Y.", 1.2],
                        ["Receipt", 1.7],
                        ["Sem", 0.7],
                        ["Amount", 1.3],
                      ] as const
                    ).map(([label, flex], i) => (
                      <View
                        key={label}
                        style={{
                          flex,
                          paddingVertical: 8,
                          paddingHorizontal: 6,
                          borderRightWidth: i < 4 ? 1 : 0,
                          borderRightColor: cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: subText,
                            fontSize: 10,
                            fontWeight: "700",
                            textTransform: "uppercase",
                            textAlign: "center",
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {dueFees.map((fee, idx) => {
                    const cells: [string, number][] = [
                      [`${idx + 1}.`, 0.5],
                      [String(fee.feeStructure?.academicYear?.year ?? "—"), 1.2],
                      [String(fee.feeStructure?.receiptType?.name ?? "Fee"), 1.7],
                      [
                        String(fee.feeStructure?.class?.name ?? "—").replace(/^SEMESTER\s*/i, ""),
                        0.7,
                      ],
                      [formatInr(Number(fee.totalPayable ?? 0)), 1.3],
                    ];
                    return (
                      <View
                        key={fee.id ?? idx}
                        style={{
                          flexDirection: "row",
                          borderBottomWidth: 1,
                          borderBottomColor: cardBorder,
                        }}
                      >
                        {cells.map(([value, flex], i) => (
                          <View
                            key={i}
                            style={{
                              flex,
                              paddingVertical: 8,
                              paddingHorizontal: 6,
                              borderRightWidth: i < 4 ? 1 : 0,
                              borderRightColor: cardBorder,
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: theme.text,
                                fontSize: 11,
                                fontWeight: i === 2 || i === 4 ? "600" : "400",
                                textAlign: "center",
                              }}
                            >
                              {value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                  {/* Total row uses the SAME 5 cells/flexes as the rows above so
                      every column divider lines up exactly */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: isDark ? "rgba(225,29,72,0.15)" : "#fff1f2",
                    }}
                  >
                    {(
                      [
                        ["", 0.5],
                        ["", 1.2],
                        ["Total Due", 1.7],
                        ["", 0.7],
                        [formatInr(totalDue), 1.3],
                      ] as const
                    ).map(([value, flex], i) => (
                      <View
                        key={i}
                        style={{
                          flex,
                          paddingVertical: 9,
                          paddingHorizontal: 6,
                          borderRightWidth: i < 4 ? 1 : 0,
                          borderRightColor: cardBorder,
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: i === 4 ? "#e11d48" : theme.text,
                            fontSize: 12,
                            fontWeight: i === 4 ? "800" : "700",
                            textAlign: "center",
                          }}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Declaration */}
              <View
                style={{
                  marginTop: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(99,102,241,0.4)" : "#e0e7ff",
                  backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(238,242,255,0.5)",
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    color: accent,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Declaration
                </Text>
                <CheckboxRow
                  checked={acknowledgeChecked}
                  onToggle={() => setAcknowledgeChecked((v) => !v)}
                >
                  I acknowledge that my Semester{" "}
                  <Text style={{ fontWeight: "700", fontStyle: "italic" }}>{semesterDisplay}</Text>{" "}
                  enrolment fee is pending and undertake to clear the dues as early as possible.
                </CheckboxRow>
                <CheckboxRow
                  checked={consequenceChecked}
                  onToggle={() => setConsequenceChecked((v) => !v)}
                >
                  I understand that non-payment of my dues may affect my bonafide student status and
                  Calcutta University examination eligibility.
                </CheckboxRow>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              padding: 14,
              borderTopWidth: 1,
              borderTopColor: cardBorder,
            }}
          >
            <Pressable
              onPress={() => {
                onClose();
                router.push("/console/fees" as never);
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: cardBorder,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
                Click to Pay
              </Text>
            </Pressable>
            <Pressable
              onPress={onProceed}
              disabled={!canGenerate}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: canGenerate ? accent : isDark ? "#3a3d52" : "#c7cad4",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                Generate admit card
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
