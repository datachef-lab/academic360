import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  Info,
  Moon,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const { theme, colorScheme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";
  const trackOn = isDark ? "#6366f1" : "#4f46e5";

  const [pushAlerts, setPushAlerts] = useState(true);
  const [feeReminders, setFeeReminders] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [libraryDues, setLibraryDues] = useState(false);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-5">
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        {title}
      </Text>
      <View
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {children as never}
      </View>
    </View>
  );

  const Row = ({
    icon: Icon,
    label,
    hint,
    last,
    right,
    onPress,
  }: {
    icon: LucideIcon;
    label: string;
    hint?: string;
    last?: boolean;
    right?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center px-4 py-3"
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: cardBorder }}
    >
      <View
        className="rounded-lg items-center justify-center mr-3"
        style={{ width: 32, height: 32, backgroundColor: accentBg }}
      >
        <Icon size={16} color={accent} />
      </View>
      <View className="flex-1">
        <Text style={{ color: theme.text }} className="text-sm font-medium">
          {label}
        </Text>
        {hint ? (
          <Text style={{ color: theme.text, opacity: 0.5, marginTop: 1 }} className="text-xs">
            {hint}
          </Text>
        ) : null}
      </View>
      {(right as never) ??
        (onPress ? <ChevronRight size={17} color={theme.text} opacity={0.4} /> : null)}
    </Pressable>
  );

  const toggle = (value: boolean, onValueChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: isDark ? "#334155" : "#cbd5e1", true: trackOn }}
      thumbColor="#ffffff"
    />
  );

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Section title="APPEARANCE">
        <Row
          icon={Moon}
          label="Dark mode"
          hint={isDark ? "On" : "Off"}
          last
          right={toggle(isDark, () => toggleTheme())}
        />
      </Section>

      <Section title="NOTIFICATIONS">
        <Row icon={Bell} label="Push notifications" right={toggle(pushAlerts, setPushAlerts)} />
        <Row icon={Bell} label="Fee reminders" right={toggle(feeReminders, setFeeReminders)} />
        <Row icon={Bell} label="Exam & result alerts" right={toggle(examAlerts, setExamAlerts)} />
        <Row
          icon={Bell}
          label="Library due dates"
          last
          right={toggle(libraryDues, setLibraryDues)}
        />
      </Section>

      <Section title="ACCOUNT">
        <Row
          icon={ShieldCheck}
          label="Privacy & security"
          hint="Sessions, password"
          onPress={() => Alert.alert("Privacy & security", "Coming soon.")}
        />
        <Row
          icon={Globe}
          label="Language"
          hint="English"
          last
          onPress={() => Alert.alert("Language", "More languages coming soon.")}
        />
      </Section>

      <Section title="ABOUT">
        <Row
          icon={FileText}
          label="Terms & conditions"
          onPress={() => Alert.alert("Terms & conditions", "Coming soon.")}
        />
        <Row icon={Info} label="Help & support" onPress={() => router.push("/console/support")} />
        <Row icon={Smartphone} label="App version" hint="1.0.0 (beta)" last />
      </Section>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center">
        Preferences are stored on this device for now — sync coming soon.
      </Text>
    </ScrollView>
  );
}
