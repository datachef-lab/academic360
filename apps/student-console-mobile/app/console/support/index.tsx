import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  IndianRupee,
  KeyRound,
  LifeBuoy,
  Mail,
  MessageSquare,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

const TOPICS: { id: string; label: string; desc: string; icon: LucideIcon; tone: string }[] = [
  {
    id: "fees",
    label: "Fees & payments",
    desc: "Dues, receipts, refunds",
    icon: IndianRupee,
    tone: "#14b8a6",
  },
  {
    id: "exams",
    label: "Exams & results",
    desc: "Forms, admit cards, marks",
    icon: GraduationCap,
    tone: "#6366f1",
  },
  {
    id: "library",
    label: "Library",
    desc: "Loans, dues, e-books",
    icon: BookOpen,
    tone: "#f59e0b",
  },
  {
    id: "docs",
    label: "Documents",
    desc: "Certificates, marksheets",
    icon: FileText,
    tone: "#3b82f6",
  },
  {
    id: "login",
    label: "Login & account",
    desc: "OTP, password, access",
    icon: KeyRound,
    tone: "#f43f5e",
  },
  {
    id: "other",
    label: "Something else",
    desc: "Anything not listed here",
    icon: CircleHelp,
    tone: "#8b5cf6",
  },
];

export default function SupportScreen() {
  const { theme, colorScheme } = useTheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View
        className="rounded-2xl p-5 mb-5 items-center"
        style={{ backgroundColor: accentBg, borderWidth: 1, borderColor: cardBorder }}
      >
        <View
          className="rounded-2xl items-center justify-center mb-3"
          style={{ width: 52, height: 52, backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
        >
          <LifeBuoy size={24} color="#ffffff" />
        </View>
        <Text style={{ color: theme.text }} className="text-base font-bold">
          How can we help?
        </Text>
        <Text
          style={{ color: theme.text, opacity: 0.6, textAlign: "center", marginTop: 4 }}
          className="text-xs"
        >
          Pick a topic below, or reach the office directly.
        </Text>
      </View>

      {/* Topics */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        BROWSE BY TOPIC
      </Text>
      <View
        className="flex-row flex-wrap mb-5"
        style={{ justifyContent: "space-between", rowGap: 12 }}
      >
        {TOPICS.map((t) => {
          const Icon = t.icon;
          return (
            <Pressable
              key={t.id}
              onPress={() => router.push("/console/faqs")}
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
                style={{ width: 38, height: 38, backgroundColor: t.tone }}
              >
                <Icon size={18} color="#ffffff" />
              </View>
              <Text style={{ color: theme.text }} className="text-sm font-semibold">
                {t.label}
              </Text>
              <Text style={{ color: theme.text, opacity: 0.55 }} className="text-xs mt-0.5">
                {t.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Still need help */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        STILL NEED HELP?
      </Text>
      <View
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {[
          {
            icon: CircleHelp,
            label: "Read the FAQs",
            hint: "Quick answers to common questions",
            onPress: () => router.push("/console/faqs"),
          },
          {
            icon: MessageSquare,
            label: "Raise a service request",
            hint: "ID card, concession, certificates",
            onPress: () => router.push("/console/service-requests"),
          },
          {
            icon: Mail,
            label: "Contact the college",
            hint: "Department desks & office hours",
            onPress: () => router.push("/console/contact"),
          },
        ].map((r, i, arr) => {
          const Icon = r.icon;
          return (
            <Pressable
              key={r.label}
              onPress={r.onPress}
              className="flex-row items-center px-4 py-3.5"
              style={{
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: cardBorder,
              }}
            >
              <View
                className="rounded-lg items-center justify-center mr-3"
                style={{ width: 32, height: 32, backgroundColor: accentBg }}
              >
                <Icon size={16} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-medium">
                  {r.label}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.5, marginTop: 1 }} className="text-xs">
                  {r.hint}
                </Text>
              </View>
              <ChevronRight size={17} color={theme.text} opacity={0.4} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => Linking.openURL("mailto:admission@thebges.edu.in").catch(() => {})}
        className="flex-row items-center justify-center rounded-xl py-3 mt-4"
        style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
      >
        <Mail size={15} color="#ffffff" />
        <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "700", marginLeft: 7 }}>
          Email the office
        </Text>
      </Pressable>
    </ScrollView>
  );
}
