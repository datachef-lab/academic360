import type { StudentDto } from "@repo/db/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useSubjectSelectionForm } from "@/hooks/use-subject-selection-form";
import { useAuth } from "@/providers/auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

export default function SubjectSelectionScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;

  const form = useSubjectSelectionForm(student);

  const {
    step,
    setStep,
    errors,
    agree1,
    setAgree1,
    agree2,
    setAgree2,
    agree3,
    setAgree3,
    loading,
    loadError,
    saving,
    saveError,
    saveSuccess,
    hasExistingSelections,
    savedSelections,
    minor1,
    setMinor1,
    minor2,
    setMinor2,
    minor3,
    setMinor3,
    idc1,
    setIdc1,
    idc2,
    setIdc2,
    idc3,
    setIdc3,
    aec3,
    setAec3,
    cvac4,
    setCvac4,
    admissionMinor1Subjects,
    admissionMinor2Subjects,
    admissionMinor3Subjects,
    availableIdcSem1Subjects,
    availableIdcSem2Subjects,
    availableIdcSem3Subjects,
    availableAecSubjects,
    availableCvacOptions,
    minorMismatch,
    earlierMinorSelections,
    hasActualOptions,
    getFilteredIdcOptions,
    getFilteredByCategory,
    preserveAecIfPresent,
    getGlobalExcludes,
    validateForm,
    handleSave,
    getDynamicLabel,
    convertToSelectOptions,
  } = form;

  const isDark = colorScheme === "dark";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const tableBorder = isDark ? "rgba(255,255,255,0.25)" : theme.border;

  const handleFieldChange = (setter: (v: string) => void, value: string, _fieldType: string) => {
    setter(value);
  };

  if (loading && !hasExistingSelections) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading subject options...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.text }} className="text-xl font-semibold mb-4">
        {hasExistingSelections
          ? "Your Subject Selections - Already Saved"
          : step === 1
            ? "Semester-wise Subject Selection"
            : "Preview Your Selections"}
      </Text>

      {loadError && (
        <View
          className="p-3 rounded-lg mb-4 flex-row items-center gap-2"
          style={{
            backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <Text style={{ color: "#ef4444", flex: 1 }}>{loadError}</Text>
        </View>
      )}

      {step === 1 && !hasExistingSelections && (
        <View
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
            borderWidth: 1,
            borderColor: isDark ? "rgba(59,130,246,0.3)" : "#bfdbfe",
          }}
        >
          <View className="flex-row items-start gap-2">
            <AlertCircle size={18} color={accent} style={{ marginTop: 2 }} />
            <Text style={{ color: theme.text, fontSize: 14, flex: 1 }}>
              Before selecting your subjects, please read the guidelines carefully.
            </Text>
          </View>
        </View>
      )}

      {step === 1 && !hasExistingSelections && (
        <View className="gap-4">
          {/* Minor Subjects */}
          {hasActualOptions(admissionMinor1Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("MN", "I")}
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    admissionMinor1Subjects,
                    getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]),
                  ),
                  getGlobalExcludes(minor1),
                )}
                value={minor1}
                onChange={(v) => handleFieldChange(setMinor1, v, "minor1")}
                placeholder="Select Minor I"
              />
            </View>
          )}

          {hasActualOptions(admissionMinor1Subjects) && hasActualOptions(admissionMinor2Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("MN", "III")}
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    admissionMinor2Subjects,
                    getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]),
                  ),
                  getGlobalExcludes(minor2),
                )}
                value={minor2}
                onChange={(v) => handleFieldChange(setMinor2, v, "minor2")}
                placeholder="Select Minor II"
              />
            </View>
          )}

          {!hasActualOptions(admissionMinor1Subjects) && hasActualOptions(admissionMinor3Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                Minor (Semester III to VI)
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    admissionMinor3Subjects,
                    getFilteredByCategory(admissionMinor3Subjects, minor3, "MN", ["III"]),
                  ),
                  getGlobalExcludes(minor3),
                )}
                value={minor3}
                onChange={(v) => handleFieldChange(setMinor3, v, "minor3")}
                placeholder="Select Minor"
              />
            </View>
          )}

          {/* AEC */}
          {hasActualOptions(availableAecSubjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("AEC")}
              </Text>
              <Select
                options={convertToSelectOptions(availableAecSubjects)}
                value={aec3}
                onChange={(v) => handleFieldChange(setAec3, v, "aec3")}
                placeholder="Select AEC 3"
              />
            </View>
          )}

          {/* IDC */}
          {hasActualOptions(availableIdcSem1Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("IDC", "I")}
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    availableIdcSem1Subjects,
                    getFilteredByCategory(getFilteredIdcOptions(availableIdcSem1Subjects, idc1), idc1, "IDC", "I"),
                  ),
                  getGlobalExcludes(idc1),
                )}
                value={idc1}
                onChange={(v) => handleFieldChange(setIdc1, v, "idc1")}
                placeholder="Select IDC 1"
              />
            </View>
          )}

          {hasActualOptions(availableIdcSem2Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("IDC", "II")}
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    availableIdcSem2Subjects,
                    getFilteredByCategory(getFilteredIdcOptions(availableIdcSem2Subjects, idc2), idc2, "IDC", "II"),
                  ),
                  getGlobalExcludes(idc2),
                )}
                value={idc2}
                onChange={(v) => handleFieldChange(setIdc2, v, "idc2")}
                placeholder="Select IDC 2"
              />
            </View>
          )}

          {hasActualOptions(availableIdcSem3Subjects) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("IDC", "III")}
              </Text>
              <Select
                options={convertToSelectOptions(
                  preserveAecIfPresent(
                    availableIdcSem3Subjects,
                    getFilteredByCategory(getFilteredIdcOptions(availableIdcSem3Subjects, idc3), idc3, "IDC", "III"),
                  ),
                  getGlobalExcludes(idc3),
                )}
                value={idc3}
                onChange={(v) => handleFieldChange(setIdc3, v, "idc3")}
                placeholder="Select IDC 3"
              />
            </View>
          )}

          {/* CVAC */}
          {hasActualOptions(availableCvacOptions) && (
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                {getDynamicLabel("CVAC")}
              </Text>
              <Select
                options={convertToSelectOptions(availableCvacOptions)}
                value={cvac4}
                onChange={(v) => handleFieldChange(setCvac4, v, "cvac4")}
                placeholder="Select CVAC 4"
              />
            </View>
          )}
        </View>
      )}

      {step === 1 && hasExistingSelections && (
        <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: tableBorder }}>
          <View
            className="p-3"
            style={{
              backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4",
              borderBottomWidth: 1,
              borderBottomColor: tableBorder,
            }}
          >
            <Text style={{ color: isDark ? "#4ade80" : "#166534", fontWeight: "600" }}>Your Subject Selections</Text>
            <Text style={{ color: theme.text, opacity: 0.8, fontSize: 13, marginTop: 2 }}>
              Your selections have been saved successfully.
            </Text>
          </View>
          <View className="p-0">
            {savedSelections.minor1 && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("MN", "I")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.minor1}</Text>
                </View>
              </View>
            )}
            {savedSelections.minor2 && hasActualOptions(admissionMinor1Subjects) && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("MN", "III")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.minor2}</Text>
                </View>
              </View>
            )}
            {savedSelections.minor3 && !hasActualOptions(admissionMinor1Subjects) && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>Minor (Semester III to VI)</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.minor3}</Text>
                </View>
              </View>
            )}
            {savedSelections.idc1 && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "I")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.idc1}</Text>
                </View>
              </View>
            )}
            {savedSelections.idc2 && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "II")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.idc2}</Text>
                </View>
              </View>
            )}
            {savedSelections.idc3 && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "III")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.idc3}</Text>
                </View>
              </View>
            )}
            {savedSelections.aec3 && (
              <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: theme.border }}>
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 12,
                    borderRightWidth: 1,
                    borderRightColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("AEC")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.aec3}</Text>
                </View>
              </View>
            )}
            {savedSelections.cvac4 && (
              <View className="flex-row items-start py-2 px-3" style={{ borderColor: tableBorder }}>
                <View
                  style={{ flex: 1, minWidth: 0, paddingRight: 12, borderRightWidth: 1, borderRightColor: tableBorder }}
                >
                  <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("CVAC")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>{savedSelections.cvac4}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {step === 2 && !hasExistingSelections && (
        <>
          {errors.length > 0 && (
            <View
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#fef2f2",
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <Text style={{ color: "#ef4444", fontWeight: "600", marginBottom: 4 }}>Please fix the following:</Text>
              {errors.map((e, i) => (
                <Text key={i} style={{ color: "#ef4444", fontSize: 14 }}>
                  • {e}
                </Text>
              ))}
            </View>
          )}

          {errors.length === 0 && (
            <>
              <View
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#f8fafc",
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600", marginBottom: 8 }}>Declarations</Text>
                <Checkbox
                  checked={agree1}
                  onCheckedChange={setAgree1}
                  label="I confirm that I have read the semester-wise subject selection guidelines."
                />
                <Checkbox
                  checked={agree2}
                  onCheckedChange={setAgree2}
                  label="I understand that once submitted, I will not be allowed to change the selected subjects in the future."
                />
                <Checkbox
                  checked={agree3}
                  onCheckedChange={setAgree3}
                  label="In the event of violation of subject selection rules, I will abide by the final decision taken by the Vice-Principal/Course Coordinator in accordance with Calcutta University norms."
                />
              </View>

              <View className="mb-4 rounded-lg overflow-hidden" style={{ borderWidth: 1, borderColor: tableBorder }}>
                <View
                  className="flex-row items-start py-2 px-3 border-b"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", borderColor: tableBorder }}
                >
                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                      paddingRight: 12,
                      borderRightWidth: 1,
                      borderRightColor: tableBorder,
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "600" }}>Subject Category</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: "600" }}>Selection</Text>
                  </View>
                </View>
                {admissionMinor1Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: theme.border }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("MN", "I")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{minor1 || "-"}</Text>
                    </View>
                  </View>
                )}
                {hasActualOptions(admissionMinor1Subjects) && admissionMinor2Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("MN", "III")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{minor2 || "-"}</Text>
                    </View>
                  </View>
                )}
                {!hasActualOptions(admissionMinor1Subjects) && admissionMinor3Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>Minor (Semester III to VI)</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{minor3 || "-"}</Text>
                    </View>
                  </View>
                )}
                {availableIdcSem1Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "I")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{idc1 || "-"}</Text>
                    </View>
                  </View>
                )}
                {availableIdcSem2Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "II")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{idc2 || "-"}</Text>
                    </View>
                  </View>
                )}
                {availableIdcSem3Subjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("IDC", "III")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{idc3 || "-"}</Text>
                    </View>
                  </View>
                )}
                {availableAecSubjects.length > 0 && (
                  <View className="flex-row items-start py-2 px-3 border-b" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("AEC")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{aec3 || "-"}</Text>
                    </View>
                  </View>
                )}
                {availableCvacOptions.length > 0 && (
                  <View className="flex-row items-start py-2 px-3" style={{ borderColor: tableBorder }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 12,
                        borderRightWidth: 1,
                        borderRightColor: tableBorder,
                      }}
                    >
                      <Text style={{ color: theme.text, opacity: 0.8 }}>{getDynamicLabel("CVAC")}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: "500" }}>{cvac4 || "-"}</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {saveSuccess && (
            <View
              className="mb-4 p-3 rounded-lg flex-row items-center gap-2"
              style={{
                backgroundColor: isDark ? "rgba(34,197,94,0.2)" : "#f0fdf4",
                borderWidth: 1,
                borderColor: "#86efac",
              }}
            >
              <Text style={{ color: "#22c55e", fontWeight: "600" }}>Subject selections saved successfully!</Text>
            </View>
          )}

          {saveError && (
            <View
              className="mb-4 p-3 rounded-lg flex-row items-center gap-2"
              style={{
                backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#fef2f2",
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <AlertCircle size={18} color="#ef4444" />
              <Text style={{ color: "#ef4444", flex: 1 }}>{saveError}</Text>
            </View>
          )}
        </>
      )}

      {step === 1 && minorMismatch && (
        <View
          className="mt-4 p-3 rounded-lg"
          style={{
            backgroundColor: isDark ? "rgba(245,158,11,0.2)" : "#fffbeb",
            borderWidth: 2,
            borderColor: "#fbbf24",
          }}
        >
          <Text style={{ color: theme.text }}>
            Your current Minor I and II subject combination is different from the one you had selected at the time of
            admission.
          </Text>
          <Text style={{ color: theme.text, marginTop: 4, fontSize: 13 }}>
            Previously saved: {earlierMinorSelections?.[0] || "-"} and {earlierMinorSelections?.[1] || "-"}
          </Text>
        </View>
      )}

      {step === 1 && errors.length > 0 && (
        <View
          className="mt-4 p-3 rounded-lg"
          style={{
            backgroundColor: isDark ? "rgba(239,68,68,0.2)" : "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
          }}
        >
          {errors.map((e, i) => (
            <Text key={i} style={{ color: "#ef4444", fontSize: 14 }}>
              • {e}
            </Text>
          ))}
        </View>
      )}

      {!hasExistingSelections && (
        <View className="flex-row gap-3 mt-6 pt-4" style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
          {step === 1 && (
            <Pressable
              onPress={() => {
                const isValid = validateForm();
                if (isValid) setStep(2);
              }}
              disabled={loading}
              className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: accent }}
            >
              {loading && <Loader2 size={18} color="#fff" />}
              <Text className="text-white font-semibold">{loading ? "Loading..." : "Next"}</Text>
            </Pressable>
          )}
          {step === 2 && (
            <>
              <Pressable
                onPress={() => setStep(1)}
                className="py-3 px-6 rounded-xl items-center"
                style={{ borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ color: theme.text }} className="font-medium">
                  Back
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!agree1 || !agree2 || !agree3 || saving}
                className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                style={{
                  backgroundColor:
                    agree1 && agree2 && agree3 && !saving
                      ? accent
                      : isDark
                        ? "rgba(99,102,241,0.4)"
                        : "rgba(79,70,229,0.4)",
                }}
              >
                {saving && <Loader2 size={18} color="#fff" />}
                <Text className="text-white font-semibold">{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
