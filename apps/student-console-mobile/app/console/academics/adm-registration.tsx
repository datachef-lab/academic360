import type { StudentDto } from "@repo/db/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { useCuRegistrationForm } from "@/hooks/use-cu-registration-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchStudentSubjectSelections } from "@/services/subject-selection";
import { BookOpen, FileText, GraduationCap, Home, Upload, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { getCuRegistrationDocumentSignedUrl } from "@/services/cu-registration-documents";
import type { DocumentKey } from "@/hooks/use-cu-registration-form";

function IntroSectionCard({
  theme,
  isDark,
  number,
  title,
  intro,
  items,
}: {
  theme: { text: string; border: string };
  isDark: boolean;
  number: number;
  title: string;
  intro?: string;
  items: string[];
}) {
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const badgeBg = isDark ? "rgba(59,130,246,0.3)" : "#dbeafe";
  const badgeText = isDark ? "#93c5fd" : "#1e40af";
  const textColor = isDark ? "rgba(255,255,255,0.9)" : "#374151";
  const bulletColor = isDark ? "#60a5fa" : "#2563eb";

  return (
    <View className="rounded-xl p-5" style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}>
      <View className="flex-row items-center mb-4">
        <View className="rounded-full px-2.5 py-1 mr-3" style={{ backgroundColor: badgeBg }}>
          <Text style={{ color: badgeText, fontSize: 14, fontWeight: "500" }}>{number}</Text>
        </View>
        <Text style={{ color: textColor, fontSize: 17, fontWeight: "600", flex: 1 }}>{title}</Text>
      </View>
      {intro ? <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, marginBottom: 12 }}>{intro}</Text> : null}
      {items.map((item, i) => (
        <View key={i} className="flex-row items-start mb-2">
          <Text style={{ color: bulletColor, marginRight: 8, fontSize: 14 }}>•</Text>
          <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const TABS = [
  { id: "introductory", label: "Intro", icon: BookOpen },
  { id: "personal-info", label: "Personal", icon: User },
  { id: "address", label: "Address", icon: Home },
  { id: "subjects", label: "Subjects", icon: GraduationCap },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  classXIIMarksheet: "Class XII Marksheet",
  aadhaarCard: "Aadhaar Card",
  apaarIdCard: "APAAR ID Card",
  fatherPhotoId: "Father Photo ID",
  motherPhotoId: "Mother Photo ID",
  ewsCertificate: "EWS Certificate",
  migrationCertificate: "Migration Certificate",
};

const DOCUMENT_IDS: Record<DocumentKey, number> = {
  classXIIMarksheet: 1,
  aadhaarCard: 2,
  apaarIdCard: 3,
  fatherPhotoId: 4,
  motherPhotoId: 5,
  ewsCertificate: 10,
  migrationCertificate: 11,
};

const DOCUMENT_ID_TO_LABEL: Record<number, string> = {
  1: "Class XII Marksheet",
  2: "Aadhaar Card",
  3: "APAAR ID Card",
  4: "Father's Photo ID",
  5: "Mother's Photo ID",
  10: "EWS Certificate",
  11: "Migration Certificate",
};

function formatFileSize(bytes: number): string {
  const sizeMB = bytes / (1024 * 1024);
  return `${sizeMB.toFixed(2)} MB`;
}

function formatAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

function formatApaarId(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9, 12)}`;
}

export default function CuRegistrationScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const { profileInfo } = useProfile();
  const student = user?.payload as StudentDto | undefined;

  const [activeTab, setActiveTab] = useState<TabId>("introductory");
  const [isCheckingSubjectSelection, setIsCheckingSubjectSelection] = useState(true);
  const [isSubjectSelectionCompleted, setIsSubjectSelectionCompleted] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const hasAutoNavigatedRef = useRef(false);

  const form = useCuRegistrationForm(student);

  const isBBAProgram = React.useMemo(() => {
    const programName = student?.programCourse?.name || student?.currentPromotion?.programCourse?.name || "";
    return programName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .startsWith("BBA");
  }, [student?.programCourse?.name, student?.currentPromotion?.programCourse?.name]);

  const isBcomProgram = React.useMemo(() => {
    const programName = student?.programCourse?.name || student?.currentPromotion?.programCourse?.name || "";
    return programName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .startsWith("BCOM");
  }, [student?.programCourse?.name, student?.currentPromotion?.programCourse?.name]);

  const isMdcProgramForDisplay = isBcomProgram || isBBAProgram;

  const checkSubjectSelection = useCallback(async () => {
    if (!student?.id) return;
    if (isBBAProgram) {
      setIsSubjectSelectionCompleted(true);
      setIsCheckingSubjectSelection(false);
      return;
    }
    try {
      const data = await fetchStudentSubjectSelections(Number(student.id)).catch(() => null);
      const completed = !!(
        data?.hasFormSubmissions ||
        (Array.isArray(data?.actualStudentSelections) && data.actualStudentSelections.length > 0)
      );
      setIsSubjectSelectionCompleted(completed);
    } catch {
      setIsSubjectSelectionCompleted(false);
    } finally {
      setIsCheckingSubjectSelection(false);
    }
  }, [student?.id, isBBAProgram]);

  useEffect(() => {
    checkSubjectSelection();
  }, [checkSubjectSelection]);

  useEffect(() => {
    if (isSubjectSelectionCompleted && activeTab === "subjects" && student?.id) {
      form.loadSubjects();
    }
  }, [isSubjectSelectionCompleted, activeTab, student?.id]);

  const instructionsConfirmedState = form.instructionsConfirmed || !!form.correctionRequest?.introductoryDeclaration;
  const personalDeclaredState = form.personalDeclared || !!form.correctionRequest?.personalInfoDeclaration;
  const addressDeclaredState = form.addressDeclared || !!form.correctionRequest?.addressInfoDeclaration;
  const subjectsDeclaredState = form.subjectsDeclared || !!form.correctionRequest?.subjectsDeclaration;

  const isPersonalTabValid = useCallback(() => {
    const apaarIdDigits = form.personalInfo.apaarId.replace(/\D/g, "");
    return personalDeclaredState && form.personalInfo.apaarId.trim() !== "" && apaarIdDigits.length === 12;
  }, [personalDeclaredState, form.personalInfo.apaarId]);

  const validateAddressFields = useCallback(() => {
    const errors: string[] = [];
    const { residentialAddress: res, mailingAddress: mail } = form;
    if (!res.addressLine.trim()) errors.push("Residential Address Line");
    if (!res.city.trim()) errors.push("Residential City");
    if (!res.district.trim()) errors.push("Residential District");
    if (!res.policeStation.trim()) errors.push("Residential Police Station");
    if (!res.postOffice.trim()) errors.push("Residential Post Office");
    if (!res.pinCode.trim()) errors.push("Residential PIN Code");
    if (!mail.addressLine.trim()) errors.push("Mailing Address Line");
    if (!mail.city.trim()) errors.push("Mailing City");
    if (!mail.district.trim()) errors.push("Mailing District");
    if (!mail.policeStation.trim()) errors.push("Mailing Police Station");
    if (!mail.postOffice.trim()) errors.push("Mailing Post Office");
    if (!mail.pinCode.trim()) errors.push("Mailing PIN Code");
    setAddressErrors(errors);
    return errors.length === 0;
  }, [form.residentialAddress, form.mailingAddress]);

  const isAddressTabValid = useCallback(
    () => addressDeclaredState && addressErrors.length === 0,
    [addressDeclaredState, addressErrors.length],
  );

  const getRequiredDocuments = useCallback((): DocumentKey[] => {
    const required: DocumentKey[] = ["classXIIMarksheet", "apaarIdCard"];
    const family = profileInfo?.studentFamily as {
      members?: { type?: string; name?: string; title?: string }[];
    } | null;
    const father = family?.members?.find((m) => m?.type === "FATHER");
    const mother = family?.members?.find((m) => m?.type === "MOTHER");
    if (father?.name?.trim() && father?.title !== "LATE") required.push("fatherPhotoId");
    if (mother?.name?.trim() && mother?.title !== "LATE") required.push("motherPhotoId");
    if (
      form.personalInfo.nationality === "Indian" &&
      form.personalInfo.aadhaarNumber &&
      form.personalInfo.aadhaarNumber.replace(/\D/g, "").length >= 12
    ) {
      required.push("aadhaarCard");
    }
    if (form.personalInfo.ews === "Yes") required.push("ewsCertificate");
    const migratoryBoards = ["CBSE", "ICSE", "WBCHSE", "NIOS"];
    const boardCode = (profileInfo?.academicInfo as { board?: { code?: string } } | null)?.board?.code;
    if (boardCode && !migratoryBoards.includes(boardCode)) required.push("migrationCertificate");
    return required;
  }, [profileInfo, form.personalInfo.nationality, form.personalInfo.aadhaarNumber, form.personalInfo.ews]);

  const getMissingDocuments = useCallback((): DocumentKey[] => {
    const required = getRequiredDocuments();
    return required.filter((key) => {
      const hasLocal = !!form.documents[key];
      const docId = DOCUMENT_IDS[key];
      const hasUploaded = Array.isArray(form.uploadedDocuments)
        ? (form.uploadedDocuments as { document?: { id?: number }; documentId?: number }[]).some(
            (d) => (d.document?.id ?? d.documentId) === docId,
          )
        : false;
      return !hasLocal && !hasUploaded;
    });
  }, [getRequiredDocuments, form.documents, form.uploadedDocuments]);

  const getVisibleDocumentKeys = useCallback((): DocumentKey[] => {
    const keys: DocumentKey[] = ["classXIIMarksheet", "apaarIdCard"];
    if (form.personalInfo.nationality === "Indian") keys.push("aadhaarCard");
    const family = profileInfo?.studentFamily as {
      members?: { type?: string; name?: string; title?: string }[];
    } | null;
    const father = family?.members?.find((m) => m?.type === "FATHER");
    const mother = family?.members?.find((m) => m?.type === "MOTHER");
    if (father?.name?.trim() && father?.title !== "LATE") keys.push("fatherPhotoId");
    if (mother?.name?.trim() && mother?.title !== "LATE") keys.push("motherPhotoId");
    if (form.personalInfo.ews === "Yes") keys.push("ewsCertificate");
    const migratoryBoards = ["CBSE", "ICSE", "WBCHSE", "NIOS"];
    const boardCode = (profileInfo?.academicInfo as { board?: { code?: string } } | null)?.board?.code;
    if (boardCode && !migratoryBoards.includes(boardCode)) keys.push("migrationCertificate");
    return keys;
  }, [profileInfo, form.personalInfo.nationality, form.personalInfo.ews]);

  const isDocumentsTabValid = useCallback(
    () => form.documentsConfirmed && getMissingDocuments().length === 0,
    [form.documentsConfirmed, getRequiredDocuments, form.documents, form.uploadedDocuments],
  );

  const canReviewConfirm = useCallback(
    () =>
      isPersonalTabValid() &&
      isAddressTabValid() &&
      subjectsDeclaredState &&
      isDocumentsTabValid() &&
      form.documentsConfirmed,
    [isPersonalTabValid, isAddressTabValid, subjectsDeclaredState, isDocumentsTabValid, form.documentsConfirmed],
  );

  useEffect(() => {
    validateAddressFields();
  }, [form.residentialAddress, form.mailingAddress, validateAddressFields]);

  const canNavigateToTab = useCallback(
    (tabId: TabId): boolean => {
      if (!form.isFormEditable) return true;
      const tabOrder: TabId[] = ["introductory", "personal-info", "address", "subjects", "documents"];
      const currentIdx = tabOrder.indexOf(activeTab);
      const targetIdx = tabOrder.indexOf(tabId);
      if (targetIdx <= currentIdx) return true;
      switch (tabId) {
        case "introductory":
          return true;
        case "personal-info":
          return instructionsConfirmedState;
        case "address":
          return instructionsConfirmedState && personalDeclaredState;
        case "subjects":
          return instructionsConfirmedState && personalDeclaredState && addressDeclaredState;
        case "documents":
          return instructionsConfirmedState && personalDeclaredState && addressDeclaredState && subjectsDeclaredState;
        default:
          return false;
      }
    },
    [
      activeTab,
      form.isFormEditable,
      instructionsConfirmedState,
      personalDeclaredState,
      addressDeclaredState,
      subjectsDeclaredState,
    ],
  );

  useEffect(() => {
    if (!instructionsConfirmedState && activeTab !== "introductory") {
      setActiveTab("introductory");
    }
  }, [instructionsConfirmedState, activeTab]);

  // Auto-navigate on load to first incomplete tab (like web)
  useEffect(() => {
    if (!form.correctionRequest || form.correctionRequest?.onlineRegistrationDone) return;
    if (hasAutoNavigatedRef.current) return;

    const i = !!form.correctionRequest?.introductoryDeclaration;
    const p = !!form.correctionRequest?.personalInfoDeclaration;
    const a = !!form.correctionRequest?.addressInfoDeclaration;
    const s = !!form.correctionRequest?.subjectsDeclaration;

    let nextTab: TabId = "introductory";
    if (i && !p) nextTab = "personal-info";
    else if (i && p && !a) nextTab = "address";
    else if (i && p && a && !s) nextTab = "subjects";
    else if (i && p && a && s) nextTab = "documents";

    if (activeTab !== nextTab) {
      setActiveTab(nextTab);
      hasAutoNavigatedRef.current = true;
    }
  }, [form.correctionRequest, activeTab]);

  const handleTabPress = useCallback(
    (tabId: TabId) => {
      if (canNavigateToTab(tabId)) {
        hasAutoNavigatedRef.current = true;
        setActiveTab(tabId);
      }
    },
    [canNavigateToTab],
  );

  const handleSubjectSelectionRedirect = () => router.push("/console/academics/subject-selection");

  const pickDocument = useCallback(
    async (key: DocumentKey) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photo library to upload documents.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        form.handleDocumentSelect(key, {
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: asset.fileName || `document-${key}.jpg`,
        });
      }
    },
    [form],
  );

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const tabBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const tabBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  if (isCheckingSubjectSelection) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Checking subject selection status...</Text>
      </View>
    );
  }

  if (!isSubjectSelectionCompleted) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "center" }}
        style={{ backgroundColor: theme.background }}
      >
        <View
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: isDark ? "rgba(234,179,8,0.15)" : "#fef9c3",
            borderWidth: 1,
            borderColor: isDark ? "rgba(234,179,8,0.4)" : "#fde047",
          }}
        >
          <Text style={{ color: isDark ? "#fde047" : "#854d0e", fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
            Subject Selection Required
          </Text>
          <Text
            style={{
              color: isDark ? "rgba(253,224,71,0.9)" : "#a16207",
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            You need to complete your subject selection before proceeding with Adm. Reg.
          </Text>
          <Pressable
            onPress={handleSubjectSelectionRedirect}
            className="py-3 rounded-xl items-center"
            style={{ backgroundColor: isDark ? "#eab308" : "#ca8a04" }}
          >
            <Text className="text-white font-semibold">Go to Subject Selection</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (form.loading && !form.correctionRequestId) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading form...</Text>
      </View>
    );
  }

  if (form.submitSuccess) {
    return (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "600", textAlign: "center" }}>
          CU Registration submitted successfully!
        </Text>
        <Text style={{ color: theme.text, opacity: 0.8, fontSize: 14, marginTop: 8, textAlign: "center" }}>
          Your application has been submitted. You will receive further instructions via email.
        </Text>
      </View>
    );
  }

  const appNumber = form.correctionRequest?.cuRegistrationApplicationNumber;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        <View className="flex-row items-center justify-between mb-2">
          {appNumber ? (
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", opacity: 0.9 }}>{appNumber}</Text>
          ) : null}
        </View>
        <Text
          style={{
            color: theme.text,
            fontSize: 15,
            fontWeight: "700",
            lineHeight: 22,
          }}
        >
          Admission & Registration Online Data Submission (Part 1 of 2)
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingBottom: 8,
          gap: 6,
          marginBottom: 6,
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const canNavigate = canNavigateToTab(tab.id);
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              disabled={!canNavigate}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: isActive ? accent : tabBg,
                borderWidth: 1,
                borderColor: isActive ? accent : tabBorder,
                opacity: canNavigate ? 1 : 0.5,
              }}
            >
              <Icon size={14} color={isActive ? "#fff" : theme.text} />
              <Text style={{ color: isActive ? "#fff" : theme.text, fontSize: 11, fontWeight: "500", marginLeft: 3 }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-xl p-6" style={{ backgroundColor: tabBg, borderWidth: 1, borderColor: tabBorder }}>
          {/* Introductory - matches web view */}
          {activeTab === "introductory" && (
            <View style={{ gap: 24 }}>
              {/* Important Instructions — light blue card */}
              <View
                className="rounded-xl p-5"
                style={{
                  backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#93c5fd" : "#1e3a8a",
                    fontSize: 18,
                    fontWeight: "600",
                    marginBottom: 12,
                  }}
                >
                  Important Instructions — Please Read Before Proceeding
                </Text>
                <Text
                  style={{
                    color: isDark ? "#93c5fd" : "#1e40af",
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                >
                  To ensure a smooth completion of your Admission & Registration Data Submission, carefully go through
                  the following points before you begin.
                </Text>
              </View>

              {/* Document Preparation - numbered section */}
              <IntroSectionCard
                theme={theme}
                isDark={isDark}
                number={1}
                title="Document Preparation"
                intro="Before proceeding, keep clear scanned copies of the following documents ready for upload:"
                items={[
                  "Your Original Class XII Board Marksheet",
                  "Your Original Aadhaar Card (Applicable only for Indian Nationals)",
                  "Your APAAR (ABC) ID Card (Applicable only for Indian Nationals)",
                  "Father's Government-issued Photo ID Proof, as applicable",
                  "Mother's Government-issued Photo ID Proof, as applicable",
                  "EWS (Economically Weaker Section) Certificate, issued in your name, by the Government of West Bengal (only if applying under EWS category)",
                  "Migration Certificate from your Class XII Board (Applicable only for boards other than CBSE, ISC, WBCHSE, NIOS)",
                  "First and Last Page of your Passport (Applicable only for Foreign Nationals)",
                ]}
              />

              {/* File Format & Size */}
              <IntroSectionCard
                theme={theme}
                isDark={isDark}
                number={2}
                title="File Format & Size"
                items={[
                  "All documents must be uploaded in .jpg or .jpeg format only.",
                  "The maximum allowed file size per document is 1MB.",
                  "Ensure your scans are clearly readable, including the board name & logo, and you crop out any extra parts before uploading.",
                ]}
              />

              {/* Data Review & Submission */}
              <IntroSectionCard
                theme={theme}
                isDark={isDark}
                number={3}
                title="Data Review & Submission"
                items={[
                  "Review every field carefully in each section before final submission.",
                  "After submission, you will not be allowed to make any edits or changes.",
                ]}
              />

              {/* Technical & Process Guidelines */}
              <IntroSectionCard
                theme={theme}
                isDark={isDark}
                number={4}
                title="Technical & Process Guidelines"
                items={[
                  "For the best experience, use a stable internet connection.",
                  "Do not close the app while documents are being uploaded.",
                  "Make sure your registered Mobile number (provided at the time of admission) and Institutional email ID (provided by the college) are active and accessible, as all communication will be sent there.",
                ]}
              />

              {/* Confirmation Checkbox - yellow card */}
              <View
                className="rounded-xl p-5"
                style={{
                  backgroundColor: isDark ? "rgba(234,179,8,0.15)" : "#fefce8",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(234,179,8,0.4)" : "#fef08a",
                }}
              >
                <Checkbox
                  checked={form.instructionsConfirmed}
                  onCheckedChange={async (c) => {
                    try {
                      await form.handleInstructionsConfirm(!!c);
                      if (c) setTimeout(() => setActiveTab("personal-info"), 600);
                    } catch {
                      /* error handled by form */
                    }
                  }}
                  label="I have read and understood the above instructions and confirm that I am ready to proceed with my Admission & Registration Data Submission."
                />
              </View>
            </View>
          )}

          {/* Personal Info */}
          {activeTab === "personal-info" && (
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Personal Information
              </Text>
              <Input
                label="1.1 Full name"
                value={form.personalInfo.fullName}
                onChangeText={(v) => form.setPersonalInfo("fullName", v)}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="1.2 Father / Mother's Name"
                value={form.personalInfo.parentName}
                onChangeText={(v) => form.setPersonalInfo("parentName", v)}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="1.3 Gender"
                value={form.personalInfo.gender}
                onChangeText={(v) => form.setPersonalInfo("gender", v)}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="1.4 Nationality"
                value={form.personalInfo.nationality}
                onChangeText={(v) => form.setPersonalInfo("nationality", v)}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                  1.5 EWS (Economically Weaker Section)
                </Text>
                <Select
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={form.personalInfo.ews}
                  onChange={(v) => form.setPersonalInfo("ews", v)}
                  placeholder="Select"
                  disabled={!form.isFieldEditable}
                />
              </View>
              <Input
                label="1.6 Aadhaar Number"
                value={form.personalInfo.aadhaarNumber}
                onChangeText={(v) => form.setPersonalInfo("aadhaarNumber", formatAadhaar(v).slice(0, 14))}
                placeholder="XXXX-XXXX-XXXX"
                keyboardType="number-pad"
                maxLength={14}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="1.7 APAAR (ABC) ID"
                value={form.personalInfo.apaarId}
                onChangeText={(v) => form.setPersonalInfo("apaarId", formatApaarId(v).slice(0, 15))}
                placeholder="XXX-XXX-XXX-XXX"
                keyboardType="number-pad"
                maxLength={15}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              {form.personalInfo.apaarId.trim() === "" && (
                <Text style={{ color: "#eab308", fontSize: 13, marginBottom: 12 }}>
                  ⚠️ You must enter your APAAR ID to proceed to the next page.
                </Text>
              )}
              {form.isFieldEditable && (
                <Pressable
                  onPress={async () => {
                    const apaarIdDigits = form.personalInfo.apaarId.replace(/\D/g, "");
                    if (form.personalInfo.apaarId.trim() === "" || apaarIdDigits.length !== 12) {
                      Alert.alert("Validation", "Please enter a valid 12-digit APAAR (ABC) ID to proceed.");
                      return;
                    }
                    try {
                      await form.handleSubmitPersonal();
                      setTimeout(() => setActiveTab("address"), 600);
                    } catch {
                      /* error handled by form */
                    }
                  }}
                  disabled={
                    form.personalInfo.apaarId.trim() === "" ||
                    form.personalInfo.apaarId.replace(/\D/g, "").length !== 12
                  }
                  className="py-3 rounded-xl items-center"
                  style={{
                    backgroundColor:
                      form.personalInfo.apaarId.trim() === "" ||
                      form.personalInfo.apaarId.replace(/\D/g, "").length !== 12
                        ? "rgba(79,70,229,0.5)"
                        : accent,
                  }}
                >
                  <Text className="text-white font-semibold">Save Personal Info</Text>
                </Pressable>
              )}
              {form.personalDeclared && (
                <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Personal info saved</Text>
              )}
            </View>
          )}

          {/* Address */}
          {activeTab === "address" && (
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Residential Address
              </Text>
              <Input
                label="Address Line"
                value={form.residentialAddress.addressLine}
                onChangeText={(v) => form.setResidentialAddress({ ...form.residentialAddress, addressLine: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>City</Text>
                <Select
                  options={form.cities.map((c: { id: number; name: string }) => ({ value: c.name, label: c.name }))}
                  value={form.residentialAddress.city}
                  onChange={(v) => form.setResidentialAddress({ ...form.residentialAddress, city: v })}
                  placeholder="Select city"
                  disabled={!form.isFieldEditable}
                />
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>District</Text>
                <Select
                  options={form.districts.map((d) => ({ value: d.name, label: d.name }))}
                  value={form.residentialAddress.district}
                  onChange={(v) => form.setResidentialAddress({ ...form.residentialAddress, district: v })}
                  placeholder="Select district"
                  disabled={!form.isFieldEditable}
                />
              </View>
              <Input
                label="Police Station"
                value={form.residentialAddress.policeStation}
                onChangeText={(v) => form.setResidentialAddress({ ...form.residentialAddress, policeStation: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="Post Office"
                value={form.residentialAddress.postOffice}
                onChangeText={(v) => form.setResidentialAddress({ ...form.residentialAddress, postOffice: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="PIN Code"
                value={form.residentialAddress.pinCode}
                onChangeText={(v) => form.setResidentialAddress({ ...form.residentialAddress, pinCode: v })}
                keyboardType="number-pad"
                maxLength={6}
                editable={form.isFieldEditable}
                style={{ marginBottom: 16 }}
              />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Mailing Address
              </Text>
              <Input
                label="Address Line"
                value={form.mailingAddress.addressLine}
                onChangeText={(v) => form.setMailingAddress({ ...form.mailingAddress, addressLine: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>City</Text>
                <Select
                  options={form.cities.map((c: { id: number; name: string }) => ({ value: c.name, label: c.name }))}
                  value={form.mailingAddress.city}
                  onChange={(v) => form.setMailingAddress({ ...form.mailingAddress, city: v })}
                  placeholder="Select city"
                  disabled={!form.isFieldEditable}
                />
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>District</Text>
                <Select
                  options={form.mailingDistricts.map((d: { id: number; name: string }) => ({
                    value: d.name,
                    label: d.name,
                  }))}
                  value={form.mailingAddress.district}
                  onChange={(v) => form.setMailingAddress({ ...form.mailingAddress, district: v })}
                  placeholder="Select district"
                  disabled={!form.isFieldEditable}
                />
              </View>
              <Input
                label="Police Station"
                value={form.mailingAddress.policeStation}
                onChangeText={(v) => form.setMailingAddress({ ...form.mailingAddress, policeStation: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="Post Office"
                value={form.mailingAddress.postOffice}
                onChangeText={(v) => form.setMailingAddress({ ...form.mailingAddress, postOffice: v })}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="PIN Code"
                value={form.mailingAddress.pinCode}
                onChangeText={(v) => form.setMailingAddress({ ...form.mailingAddress, pinCode: v })}
                keyboardType="number-pad"
                maxLength={6}
                editable={form.isFieldEditable}
                style={{ marginBottom: 12 }}
              />
              {addressErrors.length > 0 && (
                <View
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#fef2f2",
                  }}
                >
                  <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "500", marginBottom: 4 }}>
                    Please fill:
                  </Text>
                  <Text style={{ color: "#dc2626", fontSize: 12 }}>{addressErrors.join(", ")}</Text>
                </View>
              )}
              {form.isFieldEditable && (
                <Pressable
                  onPress={async () => {
                    if (!validateAddressFields()) {
                      Alert.alert("Validation", `Please fill all required fields: ${addressErrors.join(", ")}`);
                      return;
                    }
                    try {
                      await form.handleSubmitAddress();
                      setTimeout(() => setActiveTab("subjects"), 600);
                    } catch {
                      /* error handled by form */
                    }
                  }}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: accent }}
                >
                  <Text className="text-white font-semibold">Save Address</Text>
                </Pressable>
              )}
              {form.addressDeclared && (
                <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Address saved</Text>
              )}
            </View>
          )}

          {/* Subjects */}
          {activeTab === "subjects" && (
            <View>
              <View
                style={{
                  backgroundColor: isDark ? "rgba(147,51,234,0.2)" : "#f5f3ff",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(147,51,234,0.4)" : "#e9e5ff",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: isDark ? "#c4b5fd" : "#5b21b6", fontSize: 14, fontWeight: "600", marginBottom: 8 }}
                >
                  Academic Details - Important Notes
                </Text>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, opacity: 0.9 }}>
                  • The subjects displayed include the mandatory subjects you must study from Semesters I to IV, along
                  with the subjects you selected during the Subject Selection process.
                </Text>
                <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, opacity: 0.9, marginTop: 4 }}>
                  • Please Note: Any request for changing the order of the previously selected subjects will be at the
                  sole discretion of the college.
                </Text>
                {isBBAProgram && (
                  <Text style={{ color: theme.text, fontSize: 12, lineHeight: 18, opacity: 0.9, marginTop: 4 }}>
                    • BBA Students: All subjects displayed are mandatory and cannot be changed.
                  </Text>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
                  3.1 Subjects Overview (Semesters 1-4)
                </Text>
                {!isBBAProgram && form.isFieldEditable && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 12, opacity: 0.8 }}>Request correction</Text>
                    <Switch
                      checked={form.correctionFlags.subjects}
                      onCheckedChange={() => form.handleCorrectionToggle("subjects")}
                      disabled={!form.isFieldEditable}
                    />
                  </View>
                )}
              </View>
              {form.subjectsLoading ? (
                <ActivityIndicator size="small" color={accent} style={{ marginVertical: 24 }} />
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 16 }}>
                    <View style={{ minWidth: 600 }}>
                      {/* Table header */}
                      <View
                        style={{
                          flexDirection: "row",
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                          borderBottomWidth: 0,
                        }}
                      >
                        <View
                          style={{
                            width: 100,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
                            borderRightWidth: 1,
                            borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                          }}
                        >
                          <Text style={{ color: theme.text, fontSize: 12, fontWeight: "600" }}>Category</Text>
                        </View>
                        {["Semester I", "Semester II", "Semester III", "Semester IV"].map((label) => (
                          <View
                            key={label}
                            style={{
                              width: 125,
                              paddingVertical: 10,
                              paddingHorizontal: 6,
                              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
                              borderRightWidth: 1,
                              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                            }}
                          >
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: "600", textAlign: "center" }}>
                              {label}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {/* Table body - matches web: combine mandatory + student subjects, Minor sem4 fallback */}
                      {Object.entries(form.subjectsData)
                        .filter(([cat]) => cat !== "SEC")
                        .map(([category, sems]) => {
                          const categoryLabel = category === "IDC" && isMdcProgramForDisplay ? "MDC" : category;
                          return (
                            <View
                              key={category}
                              style={{
                                flexDirection: "row",
                                borderWidth: 1,
                                borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                                borderTopWidth: 0,
                              }}
                            >
                              <View
                                style={{
                                  width: 100,
                                  paddingVertical: 8,
                                  paddingHorizontal: 8,
                                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f9fafb",
                                  borderRightWidth: 1,
                                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                                }}
                              >
                                <Text style={{ color: theme.text, fontSize: 12, fontWeight: "500" }}>
                                  {categoryLabel}
                                </Text>
                              </View>
                              {(["sem1", "sem2", "sem3", "sem4"] as const).map((semKey) => {
                                const rawMandatory = (form.mandatorySubjects ?? {})[category]?.[semKey];
                                const mandatoryList: string[] = Array.isArray(rawMandatory) ? rawMandatory : [];
                                const studentList =
                                  ((sems as Record<string, string[]>)[semKey] as string[] | undefined) || [];
                                let allSubjects: string[] = [...mandatoryList];
                                studentList.forEach((s) => {
                                  if (!mandatoryList.includes(s)) allSubjects.push(s);
                                });
                                if (category === "Minor" && semKey === "sem4" && allSubjects.length === 0) {
                                  const rawSem3 = (form.mandatorySubjects ?? {})[category]?.sem3;
                                  const sem3Mandatory: string[] = Array.isArray(rawSem3) ? rawSem3 : [];
                                  const rawSem3Student = (sems as Record<string, string[]>).sem3;
                                  const sem3Student: string[] = Array.isArray(rawSem3Student) ? rawSem3Student : [];
                                  sem3Mandatory.forEach((s) => allSubjects.push(s));
                                  sem3Student.forEach((s) => {
                                    if (!sem3Mandatory.includes(s)) allSubjects.push(s);
                                  });
                                }
                                const text = allSubjects.length > 0 ? allSubjects.join(", ") : "Not Applicable";
                                return (
                                  <View
                                    key={semKey}
                                    style={{
                                      width: 125,
                                      paddingVertical: 8,
                                      paddingHorizontal: 6,
                                      borderRightWidth: 1,
                                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: theme.text,
                                        fontSize: 11,
                                        opacity: allSubjects.length > 0 ? 0.95 : 0.6,
                                        fontStyle: allSubjects.length > 0 ? "normal" : "italic",
                                      }}
                                      numberOfLines={4}
                                    >
                                      {text}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })}
                    </View>
                  </ScrollView>
                  <Checkbox
                    checked={form.subjectsDeclared}
                    onCheckedChange={async (c: boolean) => {
                      if (c) {
                        try {
                          await form.handleSubmitSubjects();
                          setTimeout(() => setActiveTab("documents"), 600);
                        } catch {
                          /* error handled by form */
                        }
                      }
                    }}
                    label="I confirm the subjects listed above."
                  />
                  {form.subjectsDeclared && (
                    <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Subjects confirmed</Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* Documents - matches web: notes, uploaded table, conditional cards, thumbnail, file size */}
          {activeTab === "documents" && (
            <View>
              {/* Document Upload Notes */}
              <View
                style={{
                  marginBottom: 20,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(234,88,12,0.15)" : "#fff7ed",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(234,88,12,0.35)" : "#fed7aa",
                }}
              >
                <Text
                  style={{ color: isDark ? "#fdba74" : "#9a3412", fontSize: 16, fontWeight: "600", marginBottom: 12 }}
                >
                  Document Upload - Important Notes
                </Text>
                <View style={{ gap: 6 }}>
                  {[
                    "Upload only scanned originals — photocopies or screenshots will not be accepted.",
                    "Each file must be in .jpg / .jpeg format and under 1 MB.",
                    "Ensure all text, seals, and photographs are clearly visible.",
                    "Upload Photo ID proof of parents (if applicable), issued by the Government.",
                    "EWS Certificate must be issued only by the Government of West Bengal.",
                    "To change a document, select a new file and upload again before confirming.",
                  ].map((item, i) => (
                    <View key={i} className="flex-row items-start">
                      <Text style={{ color: isDark ? "#fdba74" : "#c2410c", marginRight: 8, fontSize: 14 }}>•</Text>
                      <Text
                        style={{
                          color: isDark ? "rgba(253,186,116,0.95)" : "#9a3412",
                          fontSize: 13,
                          lineHeight: 20,
                          flex: 1,
                        }}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                4.1 Document Uploads
              </Text>

              {/* Uploaded Documents Table */}
              {Array.isArray(form.uploadedDocuments) && form.uploadedDocuments.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
                    Uploaded Documents
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {(
                      form.uploadedDocuments as {
                        id?: number;
                        documentId?: number;
                        document?: { name?: string };
                        fileName?: string;
                        fileSize?: number;
                        fileType?: string;
                      }[]
                    ).map((doc, index) => {
                      const documentType =
                        doc.document?.name || DOCUMENT_ID_TO_LABEL[doc.documentId ?? 0] || `Document ${doc.documentId}`;
                      const fileSizeStr = doc.fileSize ? formatFileSize(doc.fileSize) : "—";
                      return (
                        <View
                          key={doc.id ?? index}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderBottomWidth: index < form.uploadedDocuments!.length - 1 ? 1 : 0,
                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              overflow: "hidden",
                              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
                              marginRight: 10,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {doc.fileType?.startsWith("image/") ? (
                              <Text style={{ color: theme.text, fontSize: 10, opacity: 0.7 }}>IMG</Text>
                            ) : (
                              <Text style={{ color: isDark ? "#f87171" : "#dc2626", fontSize: 10 }}>PDF</Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: "500" }} numberOfLines={1}>
                              {documentType}
                            </Text>
                            <Text style={{ color: theme.text, fontSize: 11, opacity: 0.8 }} numberOfLines={1}>
                              {doc.fileName || "—"}
                            </Text>
                          </View>
                          <Text style={{ color: theme.text, fontSize: 11, opacity: 0.8, marginRight: 8 }}>
                            {fileSizeStr}
                          </Text>
                          <Pressable
                            onPress={async () => {
                              try {
                                const url = doc.id ? await getCuRegistrationDocumentSignedUrl(doc.id) : null;
                                if (url) await Linking.openURL(url);
                              } catch {}
                            }}
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: accent,
                            }}
                          >
                            <Text style={{ color: accent, fontSize: 11, fontWeight: "500" }}>Open</Text>
                          </Pressable>
                          <View
                            style={{
                              marginLeft: 8,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 4,
                              backgroundColor: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7",
                            }}
                          >
                            <Text style={{ color: "#22c55e", fontSize: 10, fontWeight: "500" }}>Uploaded</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Upload sections - only when form editable */}
              {form.isFormEditable && (
                <View style={{ gap: 12 }}>
                  {getVisibleDocumentKeys().map((key) => {
                    const docId = DOCUMENT_IDS[key];
                    const uploaded = Array.isArray(form.uploadedDocuments)
                      ? (form.uploadedDocuments as { documentId?: number; document?: { id?: number } }[]).find(
                          (d) => (d.document?.id ?? d.documentId) === docId,
                        )
                      : null;
                    const isRequired = getRequiredDocuments().includes(key);
                    const localFile = form.documents[key];
                    const docLabel =
                      key === "fatherPhotoId"
                        ? "Father's Government-issued Photo ID"
                        : key === "motherPhotoId"
                          ? "Mother's Government-issued Photo ID"
                          : key === "apaarIdCard"
                            ? "APAAR (ABC) ID Card"
                            : DOCUMENT_LABELS[key];

                    return (
                      <View
                        key={key}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderStyle: "dashed",
                          borderColor: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db",
                          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12,
                          }}
                        >
                          <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600", flex: 1 }}>
                            {docLabel}
                          </Text>
                          {isRequired && (
                            <View
                              style={{
                                paddingVertical: 2,
                                paddingHorizontal: 6,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: "#dc2626",
                              }}
                            >
                              <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "500" }}>Required</Text>
                            </View>
                          )}
                        </View>
                        {(key === "fatherPhotoId" || key === "motherPhotoId") && (
                          <Text style={{ color: theme.text, fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                            Aadhar/ Voter/ PAN Card/ Passport/ Driving License
                          </Text>
                        )}
                        <Text style={{ color: theme.text, fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
                          Max 1MB • JPEG / JPG / PNG
                        </Text>
                        <View className="flex-row items-center gap-2 flex-wrap">
                          <Pressable
                            onPress={() => pickDocument(key)}
                            disabled={form.uploadingDoc === key}
                            className="flex-row items-center px-4 py-2 rounded-lg"
                            style={{ backgroundColor: localFile ? "#22c55e" : accent }}
                          >
                            {form.uploadingDoc === key ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Upload size={18} color="#fff" />
                            )}
                            <Text style={{ color: "#fff", fontSize: 13, marginLeft: 6 }}>
                              {localFile ? "Change" : "Select"}
                            </Text>
                          </Pressable>
                          {localFile && (
                            <>
                              <Pressable
                                onPress={() => form.handleDocumentUpload(key)}
                                disabled={form.uploadingDoc !== null}
                                className="px-4 py-2 rounded-lg"
                                style={{ backgroundColor: "#22c55e" }}
                              >
                                <Text className="text-white text-sm font-medium">Upload</Text>
                              </Pressable>
                            </>
                          )}
                        </View>
                        {(localFile || uploaded) && (
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 }}>
                            {localFile?.uri ? (
                              <Image
                                source={{ uri: localFile.uri }}
                                style={{ width: 40, height: 40, borderRadius: 6 }}
                                resizeMode="cover"
                              />
                            ) : uploaded ? (
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 6,
                                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ color: "#22c55e", fontSize: 12 }}>✓</Text>
                              </View>
                            ) : null}
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: theme.text, fontSize: 12 }} numberOfLines={1}>
                                {localFile?.name || (uploaded as { fileName?: string })?.fileName || "File"}
                              </Text>
                              {localFile?.fileSize != null && (
                                <Text style={{ color: theme.text, fontSize: 11, opacity: 0.7 }}>
                                  {formatFileSize(localFile.fileSize)}
                                </Text>
                              )}
                              {uploaded && (uploaded as { fileSize?: number }).fileSize && (
                                <Text style={{ color: theme.text, fontSize: 11, opacity: 0.7 }}>
                                  {formatFileSize((uploaded as { fileSize: number }).fileSize)}
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {getMissingDocuments().length > 0 && (
                <View
                  style={{
                    marginTop: 16,
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDark ? "rgba(234,179,8,0.2)" : "#fef9c3",
                  }}
                >
                  <Text style={{ color: "#ca8a04", fontSize: 13, fontWeight: "500" }}>
                    Missing required documents:{" "}
                    {getMissingDocuments()
                      .map((k) => DOCUMENT_LABELS[k])
                      .join(", ")}
                  </Text>
                </View>
              )}
              <Checkbox
                checked={form.documentsConfirmed}
                onCheckedChange={async (c) => {
                  if (c) {
                    const missing = getMissingDocuments();
                    if (missing.length > 0) {
                      Alert.alert(
                        "Missing Documents",
                        `Please upload all required documents before confirming. Missing: ${missing.map((k) => DOCUMENT_LABELS[k]).join(", ")}`,
                      );
                      return;
                    }
                  }
                  await form.handleDocumentsDeclaration(!!c);
                }}
                label="I confirm all required documents are uploaded."
              />
              {form.documentsConfirmed && (
                <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Documents confirmed</Text>
              )}
            </View>
          )}
        </View>

        {/* Review & Submit - show when canReviewConfirm passes */}
        {canReviewConfirm() && (
          <View
            className="mt-6 rounded-xl p-6"
            style={{ backgroundColor: tabBg, borderWidth: 1, borderColor: tabBorder }}
          >
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Review & Submit
            </Text>
            <Text style={{ color: theme.text, opacity: 0.8, fontSize: 14, marginBottom: 16 }}>
              Please review all information before final submission. You will not be able to make changes after
              submitting.
            </Text>
            <Checkbox
              checked={form.finalDeclaration}
              onCheckedChange={form.handleFinalDeclarationChange}
              label="I confirm all information is correct and ready to submit."
            />
            <Pressable
              onPress={() => form.handleFinalSubmit()}
              disabled={form.submitting || !form.finalDeclaration}
              className="py-3 rounded-xl items-center"
              style={{
                backgroundColor: form.submitting || !form.finalDeclaration ? "rgba(79,70,229,0.5)" : accent,
              }}
            >
              {form.submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Submit Adm. Reg</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
