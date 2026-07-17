import { useTheme } from "@/hooks/use-theme";
import {
  BookOpen,
  Clock,
  GraduationCap,
  IndianRupee,
  Mail,
  MapPin,
  Globe,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

const DESKS: {
  id: string;
  name: string;
  email: string;
  hours: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    id: "admission",
    name: "Admissions Office",
    email: "admission@thebges.edu.in",
    hours: "Mon–Sat · 10:00 AM – 4:00 PM",
    icon: GraduationCap,
    tone: "#6366f1",
  },
  {
    id: "fees",
    name: "Fees & Accounts",
    email: "feeupdate@thebges.edu.in",
    hours: "Mon–Fri · 10:30 AM – 3:30 PM",
    icon: IndianRupee,
    tone: "#14b8a6",
  },
  {
    id: "library",
    name: "Library Desk",
    email: "library@thebges.edu.in",
    hours: "Mon–Sat · 9:00 AM – 6:00 PM",
    icon: BookOpen,
    tone: "#f59e0b",
  },
];

export default function ContactScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Campus card */}
      <View
        className="rounded-2xl p-5 mb-5"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        <Text style={{ color: theme.text }} className="text-base font-bold">
          The Bhawanipur Education Society College
        </Text>
        <View className="flex-row items-start mt-3">
          <MapPin size={15} color={accent} style={{ marginTop: 2 }} />
          <Text
            style={{ color: theme.text, opacity: 0.65, marginLeft: 10, flex: 1, lineHeight: 19 }}
            className="text-xs"
          >
            5, Lala Lajpat Rai Sarani, Bhowanipore, Kolkata — 700020, West Bengal
          </Text>
        </View>
        <View className="flex-row items-center mt-3">
          <Clock size={15} color={accent} />
          <Text style={{ color: theme.text, opacity: 0.65, marginLeft: 10 }} className="text-xs">
            Office hours · Mon–Sat, 10:00 AM – 4:00 PM
          </Text>
        </View>

        <View className="flex-row gap-2.5 mt-4">
          <Pressable
            onPress={() => open("https://www.thebges.edu.in")}
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
          >
            <Globe size={14} color="#ffffff" />
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700", marginLeft: 6 }}>
              Website
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              open("https://maps.google.com/?q=The+Bhawanipur+Education+Society+College")
            }
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}
          >
            <MapPin size={14} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", marginLeft: 6 }}>
              Directions
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Department desks */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        DEPARTMENT DESKS
      </Text>
      <View className="gap-3">
        {DESKS.map((d) => {
          const Icon = d.icon;
          return (
            <Pressable
              key={d.id}
              onPress={() => open(`mailto:${d.email}`)}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 42, height: 42, backgroundColor: d.tone }}
              >
                <Icon size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {d.name}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6, marginTop: 2 }} className="text-xs">
                  {d.email}
                </Text>
                <Text
                  style={{ color: theme.text, opacity: 0.45, marginTop: 2 }}
                  className="text-xs"
                >
                  {d.hours}
                </Text>
              </View>
              <Mail size={17} color={accent} />
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Desk hours shown are indicative — please check the noticeboard for changes.
      </Text>
    </ScrollView>
  );
}
