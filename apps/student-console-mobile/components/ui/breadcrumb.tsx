import { GlassSurface } from "@/components/ui/glass-surface";
import { useTheme } from "@/hooks/use-theme";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export const CONSOLE_BREADCRUMB_HEIGHT = 36;

const SEGMENT_LABELS: Record<string, string> = {
  console: "Home",
  academics: "Academics",
  "subject-selection": "Subject Selection",
  "cu-registration": "Adm. Reg",
  "cu-exam-form-upload": "CU Exam Form Upload",
  "current-status": "Current Status",
  profile: "Profile",
  "service-requests": "Service Requests",
  events: "Events",
  documents: "Documents",
  notifications: "Notifications",
  settings: "Settings",
  support: "Support",
  faqs: "FAQs",
  contact: "Contact",
  "study-notes": "Study Notes",
  fees: "Fees",
  exams: "Exams",
  library: "Library",
};

function segmentToLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function Breadcrumb({ glass = false }: { glass?: boolean }) {
  const { theme, colorScheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "(tabs)"); // Hide (tabs) group from display

  // Hide breadcrumb on home/console
  const isHome =
    pathname === "/" ||
    pathname === "/console" ||
    pathname === "/console/" ||
    (segments.length === 1 && segments[0] === "console");
  if (isHome) {
    return null;
  }

  if (segments.length === 0) {
    return (
      <BreadcrumbShell glass={glass} isDark={isDark}>
        <Text style={{ color: theme.text, opacity: 0.7, fontSize: 13 }}>Home</Text>
      </BreadcrumbShell>
    );
  }

  const breadcrumbs = segments.map((seg, i) => ({
    segment: seg,
    label: segmentToLabel(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <BreadcrumbShell glass={glass} isDark={isDark}>
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={crumb.path}>
          {i > 0 && (
            <Text
              style={{
                color: theme.text,
                fontSize: 14,
                marginHorizontal: 4,
                fontWeight: "600",
                opacity: 0.8,
              }}
            >
              ›
            </Text>
          )}
          {crumb.isLast ? (
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
              {crumb.label}
            </Text>
          ) : (
            <Pressable onPress={() => router.push(crumb.path as any)} hitSlop={8}>
              <Text style={{ color: theme.text, opacity: 0.7, fontSize: 13 }} numberOfLines={1}>
                {crumb.label}
              </Text>
            </Pressable>
          )}
        </React.Fragment>
      ))}
    </BreadcrumbShell>
  );
}

function BreadcrumbShell({
  glass,
  isDark,
  children,
}: {
  glass: boolean;
  isDark: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.shell}>
      {glass ? <GlassSurface isDark={isDark} /> : null}
      <View
        className="flex-row items-center flex-wrap gap-1 px-4 py-2"
        style={[
          styles.inner,
          !glass && {
            borderBottomWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: CONSOLE_BREADCRUMB_HEIGHT,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    zIndex: 1,
  },
});
