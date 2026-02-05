import type { ExamDto } from "@repo/db/dtos/exams";
import type { StudentDto } from "@repo/db/dtos/user";
import { examDetailsImage } from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useExamSocketRefresh } from "@/providers/exam-socket-provider";
import { fetchExamById, fetchExamCandidates } from "@/services/exam-api";
import { Calendar, Clock, Download } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";

const BANNER_ASPECT = 16 / 9;

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

interface PaperDetail {
  paperCode: string;
  subjectName: string;
  startTime: Date;
  endTime: Date;
  room: string;
  floor: string;
  seatNumber: string;
}

export default function ExamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, colorScheme } = useTheme();
  const { user, accessToken } = useAuth();
  const student = user?.payload as StudentDto | undefined;

  const [exam, setExam] = useState<ExamDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paperDetails, setPaperDetails] = useState<PaperDetail[]>([]);
  const [downloading, setDownloading] = useState(false);

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb";

  const refetchExam = useCallback(() => {
    const examId = id ? Number(id) : NaN;
    if (isNaN(examId) || examId <= 0) return;
    fetchExamById(examId)
      .then((res) => setExam(res.payload ?? null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load exam");
        setExam(null);
      });
  }, [id]);

  useEffect(() => {
    const examId = id ? Number(id) : NaN;
    if (isNaN(examId) || examId <= 0) {
      setLoading(false);
      setError("Invalid exam");
      return;
    }
    setLoading(true);
    setError(null);
    fetchExamById(examId)
      .then((res) => {
        setExam(res.payload ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load exam");
        setExam(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useExamSocketRefresh(refetchExam);

  useEffect(() => {
    if (!exam?.id || !student?.id) {
      setPaperDetails([]);
      return;
    }
    const examId = Number(exam.id);
    const sid = Number(student.id);
    if (isNaN(sid) || sid <= 0) {
      setPaperDetails([]);
      return;
    }
    fetchExamCandidates(examId, sid)
      .then((res) => {
        const candidates = Array.isArray(res.payload) ? res.payload : [];
        const currentPromotionId = student?.currentPromotion?.id;
        const seenSubjects = new Set<number>();
        const details: PaperDetail[] = candidates
          .map((candidate) => {
            const data =
              (candidate as unknown as { exam_candidates?: Record<string, unknown> })?.exam_candidates ?? candidate;
            const promotionId = (data as Record<string, unknown>)?.promotionId as number | undefined;
            const examRoomId = (data as Record<string, unknown>)?.examRoomId;
            const examSubjectId = (data as Record<string, unknown>)?.examSubjectId as number | undefined;
            const seatNumber = (data as Record<string, unknown>)?.seatNumber as string | undefined;
            const paper = candidate?.paper;
            if (!paper || !examRoomId || !examSubjectId) return null;
            if (currentPromotionId != null && promotionId != null && promotionId !== currentPromotionId) return null;
            if (examSubjectId != null && seenSubjects.has(examSubjectId)) return null;
            if (examSubjectId != null) seenSubjects.add(examSubjectId);
            const examRoom = exam.locations?.find((loc) => loc?.id === examRoomId);
            const examSubject = exam.examSubjects?.find((s) => s?.id === examSubjectId);
            if (!examRoom?.room || !examSubject) return null;
            return {
              paperCode: (paper as { code?: string })?.code ?? "",
              subjectName: examSubject.subject?.name ?? "",
              startTime: new Date(examSubject.startTime),
              endTime: new Date(examSubject.endTime),
              room: examRoom.room?.name ?? "",
              floor: examRoom.room?.floor?.name ?? "",
              seatNumber: seatNumber ?? "",
            };
          })
          .filter((d): d is PaperDetail => d !== null)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        setPaperDetails(details);
      })
      .catch(() => setPaperDetails([]));
  }, [exam?.id, exam?.locations, exam?.examSubjects, student?.id, student?.currentPromotion?.id]);

  const handleDownloadAdmitCard = async () => {
    if (!exam?.id || !student?.id) return;
    const examId = Number(exam.id);
    const sid = Number(student.id);
    const now = Date.now();
    const start = exam.admitCardStartDownloadDate ? new Date(exam.admitCardStartDownloadDate).getTime() : null;
    const end = exam.admitCardLastDownloadDate ? new Date(exam.admitCardLastDownloadDate).getTime() : null;
    if (!start || now < start || (end && now > end)) {
      Alert.alert("Not available", "Admit card download is not available at this time.");
      return;
    }
    setDownloading(true);
    try {
      const { API_BASE_URL } = await import("@/lib/api");
      const url = `${API_BASE_URL}/api/exams/schedule/admit-card/download/single?examId=${examId}&studentId=${sid}`;
      const filename = `admit-card-${examId}-${sid}.pdf`;
      if (Platform.OS === "web") {
        const { default: axios } = await import("axios");
        const res = await axios.get(url, {
          responseType: "blob",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(res.data);
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
          Alert.alert("Downloaded", "Admit card saved.");
        }
      }
    } catch {
      Alert.alert("Error", "Failed to download admit card.");
    } finally {
      setDownloading(false);
    }
  };

  const showDownload =
    exam?.admitCardStartDownloadDate &&
    (() => {
      const now = Date.now();
      const start = new Date(exam.admitCardStartDownloadDate!).getTime();
      const end = exam.admitCardLastDownloadDate ? new Date(exam.admitCardLastDownloadDate).getTime() : null;
      return now >= start && (!end || now <= end);
    })();

  const bannerWidth = Dimensions.get("window").width;
  const bannerHeight = bannerWidth / BANNER_ASPECT;
  const screenWidth = Dimensions.get("window").width;
  const colGap = 8;
  const availableWidth = screenWidth - 32 - 24 - colGap * 2;
  const colName = Math.floor(availableWidth * 0.4);
  const colTime = Math.floor(availableWidth * 0.3);
  const colLocation = Math.floor(availableWidth * 0.3);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading exam...</Text>
      </View>
    );
  }

  if (error || !exam) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 16, textAlign: "center" }}>{error ?? "Exam not found"}</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: accent,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: showDownload ? 100 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner - YouTube video style */}
        <View style={{ width: bannerWidth, height: bannerHeight, backgroundColor: isDark ? "#1a1a1a" : "#e5e7eb" }}>
          <Image source={examDetailsImage} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        </View>

        {/* Content - YouTube info section style */}
        <View style={{ padding: 16, paddingTop: 20 }}>
          {/* Title row */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>
                {exam.examType?.name ?? "Exam"}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  alignSelf: "flex-start",
                  backgroundColor: isDark ? "rgba(99,102,241,0.25)" : "#eef2ff",
                }}
              >
                <Text style={{ color: accent, fontSize: 13, fontWeight: "600" }}>{exam.class?.name ?? ""}</Text>
              </View>
            </View>
          </View>

          {/* Description with date/time - above admit card */}
          {paperDetails.length > 0 && (
            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                borderWidth: 1,
                borderColor: cardBorder,
              }}
            >
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Schedule</Text>
              {paperDetails.map((p, idx) => (
                <View key={idx} style={{ marginBottom: idx < paperDetails.length - 1 ? 8 : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Calendar size={14} color={theme.text} style={{ opacity: 0.8 }} />
                    <Text style={{ color: theme.text, fontSize: 13 }}>{formatDate(p.startTime)}</Text>
                    <Clock size={14} color={theme.text} style={{ opacity: 0.8 }} />
                    <Text style={{ color: theme.text, fontSize: 13 }}>
                      {formatTime(p.startTime)} – {formatTime(p.endTime)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Reminder */}
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe",
              borderWidth: 1,
              borderColor: isDark ? "rgba(59,130,246,0.3)" : "#93c5fd",
            }}
          >
            <Clock size={18} color="#1e40af" />
            <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
              Please arrive 15 minutes prior to the start time of all exams.
            </Text>
          </View>

          {/* Exam Subjects/Paper section - table with name, time, location */}
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginTop: 24, marginBottom: 12 }}>
            Exam Subjects / Papers
          </Text>
          {paperDetails.length === 0 ? (
            <View
              style={{
                padding: 20,
                borderRadius: 12,
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: cardBorder,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.text, opacity: 0.7 }}>No schedule details available.</Text>
            </View>
          ) : (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: cardBorder,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: cardBorder,
                }}
              >
                <View style={{ width: colName, marginRight: colGap }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                    Name
                  </Text>
                </View>
                <View style={{ width: colTime, marginRight: colGap }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                    Time
                  </Text>
                </View>
                <View style={{ width: colLocation }}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                    Location
                  </Text>
                </View>
              </View>
              {/* Table rows */}
              {paperDetails.map((p, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    backgroundColor: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    borderBottomWidth: idx < paperDetails.length - 1 ? 1 : 0,
                    borderBottomColor: cardBorder,
                  }}
                >
                  <View style={{ width: colName, marginRight: colGap }}>
                    <Text style={{ color: theme.text, fontSize: 13 }} numberOfLines={2}>
                      {p.subjectName} ({p.paperCode})
                    </Text>
                  </View>
                  <View style={{ width: colTime, marginRight: colGap }}>
                    <Text style={{ color: theme.text, fontSize: 12, opacity: 0.9 }} numberOfLines={2}>
                      {formatTime(p.startTime)} – {formatTime(p.endTime)}
                    </Text>
                  </View>
                  <View style={{ width: colLocation }}>
                    <Text style={{ color: theme.text, fontSize: 12, opacity: 0.9 }} numberOfLines={2}>
                      {p.room}
                      {p.floor ? `, ${p.floor}` : ""}
                      {p.seatNumber ? ` • Seat ${p.seatNumber}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating admit card button - fixed at bottom, full width */}
      {showDownload && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 24,
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: cardBorder,
          }}
        >
          <Pressable
            onPress={handleDownloadAdmitCard}
            disabled={downloading}
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: accent,
            }}
          >
            {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Download size={20} color="#fff" />}
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Download Admit Card</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
