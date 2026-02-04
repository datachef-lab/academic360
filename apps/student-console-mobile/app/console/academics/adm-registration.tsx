import type { StudentDto } from "@repo/db/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useCuRegistrationForm } from "@/hooks/use-cu-registration-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchStudentSubjectSelections } from "@/services/subject-selection";
import { BookOpen, FileText, GraduationCap, Home, Upload, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
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
  const student = user?.payload as StudentDto | undefined;

  const [activeTab, setActiveTab] = useState<TabId>("introductory");
  const [isCheckingSubjectSelection, setIsCheckingSubjectSelection] = useState(true);
  const [isSubjectSelectionCompleted, setIsSubjectSelectionCompleted] = useState(false);

  const form = useCuRegistrationForm(student);

  const isBBAProgram = React.useMemo(() => {
    const programName = student?.programCourse?.name || student?.currentPromotion?.programCourse?.name || "";
    return programName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .startsWith("BBA");
  }, [student?.programCourse?.name, student?.currentPromotion?.programCourse?.name]);

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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 10,
          gap: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
        style={{ marginBottom: 8 }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 6,
                backgroundColor: isActive ? accent : tabBg,
                borderWidth: 1,
                borderColor: isActive ? accent : tabBorder,
              }}
            >
              <Icon size={14} color={isActive ? "#fff" : theme.text} />
              <Text style={{ color: isActive ? "#fff" : theme.text, fontSize: 11, fontWeight: "500", marginLeft: 4 }}>
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
                  onCheckedChange={(c) => form.handleInstructionsConfirm(!!c)}
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
                style={{ marginBottom: 16 }}
              />
              {form.isFieldEditable && (
                <Pressable
                  onPress={() => form.handleSubmitPersonal()}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: accent }}
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
                label="PIN Code"
                value={form.mailingAddress.pinCode}
                onChangeText={(v) => form.setMailingAddress({ ...form.mailingAddress, pinCode: v })}
                keyboardType="number-pad"
                maxLength={6}
                editable={form.isFieldEditable}
                style={{ marginBottom: 16 }}
              />
              {form.isFieldEditable && (
                <Pressable
                  onPress={() => form.handleSubmitAddress()}
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
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Subjects Overview
              </Text>
              {form.subjectsLoading ? (
                <ActivityIndicator size="small" color={accent} style={{ marginVertical: 24 }} />
              ) : (
                <>
                  {Object.entries(form.subjectsData).map(([category, sems]) => (
                    <View key={category} style={{ marginBottom: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{category}</Text>
                      {Object.entries(sems as Record<string, string[]>).map(([sem, subjects]) =>
                        subjects.length > 0 ? (
                          <Text key={sem} style={{ color: theme.text, opacity: 0.9, fontSize: 13, marginTop: 4 }}>
                            {sem}: {subjects.join(", ")}
                          </Text>
                        ) : null,
                      )}
                    </View>
                  ))}
                  <Checkbox
                    checked={form.subjectsDeclared}
                    onCheckedChange={(c: boolean) => c && form.handleSubmitSubjects()}
                    label="I confirm the subjects listed above."
                  />
                  {form.subjectsDeclared && (
                    <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Subjects confirmed</Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                Document Uploads
              </Text>
              <Text style={{ color: theme.text, opacity: 0.8, fontSize: 13, marginBottom: 16 }}>
                Upload JPEG/PNG files, max 1MB each.
              </Text>
              {(Object.keys(DOCUMENT_LABELS) as DocumentKey[]).map((key) => (
                <View key={key} style={{ marginBottom: 16 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                    {DOCUMENT_LABELS[key]}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => pickDocument(key)}
                      disabled={!form.isFormEditable || form.uploadingDoc === key}
                      className="flex-row items-center px-4 py-2 rounded-lg"
                      style={{ backgroundColor: form.documents[key] ? "#22c55e" : accent }}
                    >
                      {form.uploadingDoc === key ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Upload size={18} color="#fff" />
                      )}
                      <Text style={{ color: "#fff", fontSize: 13, marginLeft: 6 }}>
                        {form.documents[key] ? "Change" : "Select"}
                      </Text>
                    </Pressable>
                    {form.documents[key] && (
                      <>
                        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, flex: 1 }}>
                          {form.documents[key]?.name || "Selected"}
                        </Text>
                        <Pressable
                          onPress={() => form.handleDocumentUpload(key)}
                          disabled={form.uploadingDoc !== null}
                          className="px-3 py-2 rounded-lg"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          <Text className="text-white text-sm font-medium">Upload</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              ))}
              <Checkbox
                checked={form.documentsConfirmed}
                onCheckedChange={(c) => form.handleDocumentsDeclaration(!!c)}
                label="I confirm all required documents are uploaded."
              />
              {form.documentsConfirmed && (
                <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Documents confirmed</Text>
              )}
            </View>
          )}
        </View>

        {/* Review & Submit - show when all declared */}
        {form.instructionsConfirmed &&
          form.personalDeclared &&
          form.addressDeclared &&
          form.subjectsDeclared &&
          form.documentsConfirmed && (
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
                style={{ backgroundColor: form.submitting ? "rgba(79,70,229,0.5)" : accent }}
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
