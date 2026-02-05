import type { ExamCandidateDto, ExamDto } from "@repo/db/dtos/exams";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { API_BASE_URL } from "@/lib/api";
import { fetchExamCandidates } from "@/services/exam-api";
import { Download } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface PaperDetails {
  paperCode: string;
  startTime: Date;
  endTime: Date;
  room: string;
  floor: string;
  seatNumber: string;
}

interface ExamPapersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamDto | null;
  studentId: number;
}

export function ExamPapersModal({ open, onOpenChange, exam, studentId }: ExamPapersModalProps) {
  const { theme, colorScheme } = useTheme();
  const { accessToken } = useAuth();
  const [candidates, setCandidates] = useState<ExamCandidateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";

  useEffect(() => {
    if (!open || !exam?.id || !studentId) {
      setCandidates([]);
      return;
    }
    const examId = Number(exam.id);
    const sid = Number(studentId);
    if (isNaN(examId) || examId <= 0 || isNaN(sid) || sid <= 0) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    fetchExamCandidates(examId, sid)
      .then((res) => {
        const payload = res.payload;
        setCandidates(Array.isArray(payload) ? payload : []);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [open, exam?.id, studentId]);

  const getPaperDetails = (): PaperDetails[] => {
    if (!exam || !candidates.length) return [];
    return candidates
      .map((candidate) => {
        const data =
          (candidate as unknown as { exam_candidates?: Record<string, unknown> })?.exam_candidates ?? candidate;
        const examRoomId = (data as Record<string, unknown>)?.examRoomId;
        const examSubjectId = (data as Record<string, unknown>)?.examSubjectId;
        const seatNumber = (data as Record<string, unknown>)?.seatNumber as string | undefined;
        const paper = candidate?.paper;

        if (!paper || !examRoomId || !examSubjectId) return null;

        const examRoom = exam.locations?.find((loc) => loc?.id === examRoomId);
        if (!examRoom?.room) return null;

        const examSubject = exam.examSubjects?.find((s) => s?.id === examSubjectId);
        if (!examSubject) return null;

        return {
          paperCode: (paper as { code?: string })?.code ?? "",
          startTime: new Date(examSubject.startTime),
          endTime: new Date(examSubject.endTime),
          room: examRoom.room?.name ?? "",
          floor: examRoom.room?.floor?.name ?? "",
          seatNumber: seatNumber ?? "",
        };
      })
      .filter((d): d is PaperDetails => d !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  const handleDownloadAdmitCard = async () => {
    if (!exam?.id || !studentId) return;
    const examId = Number(exam.id);
    const sid = Number(studentId);
    if (isNaN(examId) || examId <= 0 || isNaN(sid) || sid <= 0) return;

    const now = Date.now();
    const start = exam.admitCardStartDownloadDate ? new Date(exam.admitCardStartDownloadDate).getTime() : null;
    const end = exam.admitCardLastDownloadDate ? new Date(exam.admitCardLastDownloadDate).getTime() : null;
    if (!start || now < start || (end && now > end)) return;

    setDownloading(true);
    try {
      const url = `${API_BASE_URL}/api/exams/schedule/admit-card/download/single?examId=${examId}&studentId=${sid}`;
      const filename = `admit-card-${examId}-${sid}.pdf`;

      if (Platform.OS === "web") {
        const { default: axios } = await import("axios");
        const res = await axios.get(url, {
          responseType: "blob",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const blob = res.data;
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      } else {
        const FileSystem = await import("expo-file-system/legacy");
        const Sharing = await import("expo-sharing");
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.downloadAsync(url, fileUri, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/pdf",
            dialogTitle: "Admit Card",
          });
        } else {
          Alert.alert("Downloaded", "Admit card saved to cache.");
        }
      }
    } catch {
      Alert.alert("Error", "Failed to download admit card.");
    } finally {
      setDownloading(false);
    }
  };

  const paperDetails = getPaperDetails();
  const showDownload =
    paperDetails.length > 0 &&
    exam?.admitCardStartDownloadDate &&
    (() => {
      const now = Date.now();
      const start = new Date(exam.admitCardStartDownloadDate!).getTime();
      const end = exam.admitCardLastDownloadDate ? new Date(exam.admitCardLastDownloadDate).getTime() : null;
      return now >= start && (!end || now <= end);
    })();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => onOpenChange(false)}>
        <Pressable
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "90%",
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: accent,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>Exam Schedule</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {showDownload && (
                <Pressable
                  onPress={handleDownloadAdmitCard}
                  disabled={downloading || loading}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Download size={20} color="#fff" />}
                </Pressable>
              )}
              <Pressable onPress={() => onOpenChange(false)} style={{ padding: 8 }}>
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "500" }}>Close</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={{ padding: 48, alignItems: "center" }}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={{ color: theme.text, marginTop: 12 }}>Loading exam papers...</Text>
            </View>
          ) : paperDetails.length === 0 ? (
            <View style={{ padding: 48, alignItems: "center" }}>
              <Text style={{ color: theme.text, opacity: 0.8 }}>No exam papers found.</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {paperDetails.map((detail, idx) => (
                <View
                  key={idx}
                  style={{
                    padding: 14,
                    marginBottom: 10,
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: cardBorder,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
                      {formatDate(detail.startTime)}
                    </Text>
                    <Text style={{ color: accent, fontSize: 13, fontWeight: "600" }}>{detail.paperCode}</Text>
                  </View>
                  <Text style={{ color: theme.text, opacity: 0.8, fontSize: 13 }}>
                    {formatTime(detail.startTime)} – {formatTime(detail.endTime)}
                  </Text>
                  <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Text style={{ color: theme.text, fontSize: 13 }}>Room: {detail.room}</Text>
                    {detail.floor && (
                      <Text style={{ color: theme.text, opacity: 0.7, fontSize: 13 }}>• {detail.floor}</Text>
                    )}
                    {detail.seatNumber && (
                      <Text
                        style={{
                          color: accent,
                          fontSize: 12,
                          fontWeight: "600",
                          backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "#eef2ff",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        Seat: {detail.seatNumber}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Default export for Expo Router (even though this is a component, not a route)
export default ExamPapersModal;
