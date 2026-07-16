import { useTheme } from "@/hooks/use-theme";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Row = {
  time: string;
  end?: string;
  title: string;
  room?: string;
  type: "class" | "break" | "lab";
};

// Placeholder weekly timetable — wire to the student's real timetable later.
const WEEK: Record<string, Row[]> = {
  Mon: [
    { time: "09:00", end: "10:00", title: "Mathematics", room: "201", type: "class" },
    { time: "10:00", end: "10:15", title: "Short Break", type: "break" },
    { time: "10:15", end: "11:15", title: "Business Economics", room: "105", type: "class" },
    { time: "11:30", end: "12:30", title: "Statistics", room: "302", type: "class" },
    { time: "13:30", end: "15:30", title: "Programming Lab", room: "Lab 1", type: "lab" },
  ],
  Tue: [
    { time: "09:00", end: "10:00", title: "English", room: "204", type: "class" },
    { time: "10:15", end: "11:15", title: "Mathematics", room: "201", type: "class" },
    { time: "11:30", end: "12:30", title: "Statistics", room: "302", type: "class" },
  ],
  Wed: [
    { time: "09:00", end: "10:00", title: "Business Economics", room: "105", type: "class" },
    { time: "10:15", end: "12:15", title: "Programming Lab", room: "Lab 1", type: "lab" },
  ],
  Thu: [
    { time: "09:00", end: "10:00", title: "Statistics", room: "302", type: "class" },
    { time: "10:15", end: "11:15", title: "English", room: "204", type: "class" },
  ],
  Fri: [
    { time: "09:00", end: "10:00", title: "Mathematics", room: "201", type: "class" },
    { time: "10:15", end: "11:15", title: "Business Economics", room: "105", type: "class" },
  ],
  Sat: [],
};

function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function TimetableScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#818cf8" : "#4f46e5";
  const chipActive = isDark ? "#4338ca" : "#4f46e5";
  const chipBg = isDark ? "rgba(255,255,255,0.06)" : "#eef2ff";

  const [day, setDay] = useState<string>("Mon");
  const rows = WEEK[day] ?? [];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="mb-5"
      >
        {DAYS.map((d) => {
          const active = d === day;
          return (
            <Pressable
              key={d}
              onPress={() => setDay(d)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: active ? chipActive : chipBg }}
            >
              <Text
                style={{
                  color: active ? "#ffffff" : theme.text,
                  opacity: active ? 1 : 0.7,
                  fontWeight: active ? "700" : "500",
                  fontSize: 13,
                }}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Table header */}
      <View
        className="flex-row px-1 pb-2"
        style={{ borderBottomWidth: 1, borderBottomColor: cardBorder }}
      >
        <Text
          style={{ width: 74, color: theme.text, opacity: 0.5, fontSize: 11, fontWeight: "700" }}
        >
          TIME
        </Text>
        <Text style={{ flex: 1, color: theme.text, opacity: 0.5, fontSize: 11, fontWeight: "700" }}>
          CLASS
        </Text>
        <Text
          style={{
            width: 60,
            textAlign: "right",
            color: theme.text,
            opacity: 0.5,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          ROOM
        </Text>
      </View>

      {rows.length === 0 ? (
        <View className="py-16 items-center">
          <Text style={{ color: theme.text, opacity: 0.5 }}>No classes on {day}</Text>
        </View>
      ) : (
        rows.map((r, i) => {
          const isBreak = r.type === "break";
          const color = isBreak ? "#f59e0b" : r.type === "lab" ? "#22c55e" : accent;
          return (
            <View
              key={`${r.time}-${i}`}
              className="flex-row items-center px-1 py-3"
              style={{
                borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                borderBottomColor: cardBorder,
                backgroundColor: isBreak
                  ? isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)"
                  : "transparent",
              }}
            >
              <View style={{ width: 74 }}>
                <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: "700" }}>
                  {fmt(r.time)}
                </Text>
                {r.end && (
                  <Text style={{ color: theme.text, fontSize: 11, opacity: 0.55 }}>
                    {fmt(r.end)}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center" style={{ flex: 1, paddingRight: 8 }}>
                <View
                  style={{
                    width: 4,
                    height: 22,
                    borderRadius: 2,
                    backgroundColor: color,
                    marginRight: 10,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.text,
                    fontSize: 14,
                    fontWeight: isBreak ? "500" : "600",
                    opacity: isBreak ? 0.7 : 1,
                    flex: 1,
                  }}
                >
                  {r.title}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  width: 60,
                  textAlign: "right",
                  color: theme.text,
                  opacity: 0.6,
                  fontSize: 12,
                }}
              >
                {r.room || "—"}
              </Text>
            </View>
          );
        })
      )}

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-4">
        Sample timetable — will load your class timetable
      </Text>
    </ScrollView>
  );
}
