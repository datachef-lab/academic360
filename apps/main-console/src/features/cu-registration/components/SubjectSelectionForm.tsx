"use client";
import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { fetchStudentSubjectSelections, PaperDto } from "@/services/subject-selection";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";

interface SubjectSelectionFormProps {
  uid: string;
}

export default function SubjectSelectionForm({ uid }: SubjectSelectionFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);

  const [student, setStudent] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state - matching the documented workflow
  const [minor1, setMinor1] = useState(""); // Minor I (Semester I & II)
  const [minor2, setMinor2] = useState(""); // Minor II (Semester III & IV)
  const [idc1, setIdc1] = useState(""); // IDC 1 (Semester I)
  const [idc2, setIdc2] = useState(""); // IDC 2 (Semester II)
  const [idc3, setIdc3] = useState(""); // IDC 3 (Semester III)
  const [aec3, setAec3] = useState(""); // AEC 3 (Semester III)
  const [cvac4, setCvac4] = useState(""); // CVAC 4 (Semester II)

  // Options populated from backend (semester-wise lists)
  const [admissionMinor1Subjects, setAdmissionMinor1Subjects] = useState<string[]>([]); // Sem I & II
  const [admissionMinor2Subjects, setAdmissionMinor2Subjects] = useState<string[]>([]); // Sem III & IV
  const [availableIdcSem1Subjects, setAvailableIdcSem1Subjects] = useState<string[]>([]);
  const [availableIdcSem2Subjects, setAvailableIdcSem2Subjects] = useState<string[]>([]);
  const [availableIdcSem3Subjects, setAvailableIdcSem3Subjects] = useState<string[]>([]);
  const [availableAecSubjects, setAvailableAecSubjects] = useState<string[]>([]);
  const [availableCvacOptions, setAvailableCvacOptions] = useState<string[]>([]);

  // Restricted grouping caches for quick checks
  // Map by subject name → rule and the category (subject type code) it belongs to
  const [restrictedBySubject, setRestrictedBySubject] = useState<
    Record<string, { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }>
  >({});
  // Track which categories actually have RG rules defined (e.g., MN, IDC, AEC)
  const [restrictedCategories, setRestrictedCategories] = useState<Record<string, boolean>>({});

  // Removed auto-assign for Minor II; user must select Minor II explicitly
  const [earlierMinorSelections, setEarlierMinorSelections] = useState<string[]>([]);
  const [minorMismatch, setMinorMismatch] = useState(false);

  // Load student data first, then subject selections
  useEffect(() => {
    const run = async () => {
      if (!uid) {
        console.log("No UID provided");
        return;
      }
      console.log("Loading student data for UID:", uid);
      setLoading(true);
      setLoadError(null);
      try {
        // First, fetch student data by UID
        const studentData = await fetchStudentByUid(uid);
        console.log("Student data loaded:", studentData);
        setStudent(studentData);

        // Then, fetch subject selections using student ID
        if (!studentData.id) {
          throw new Error("Student ID not found");
        }
        const resp = await fetchStudentSubjectSelections(studentData.id);
        console.log("subject-selection-form data", resp);

        const groups = resp.studentSubjectsSelection ?? [];

        // Derive groups
        const getLabel = (p: PaperDto) => p?.subject?.name || "";
        const romanMap: Record<string, string> = { "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI" };
        const extractSemesterRoman = (name?: string | null): string => {
          if (!name) return "";
          const upper = String(name).toUpperCase();
          const romanMatch = upper.match(/\b(I|II|III|IV|V|VI)\b/);
          if (romanMatch && romanMatch[1]) return romanMatch[1];
          const digitMatch = upper.match(/\b([1-6])\b/);
          if (digitMatch && digitMatch[1]) return romanMap[digitMatch[1]] || "";
          return "";
        };
        const getSemesterRoman = (p: PaperDto) => extractSemesterRoman(p?.class?.name);
        const isSem = (p: PaperDto, roman: string) => getSemesterRoman(p) === roman;
        const isMinor = (n: string, c?: string | null) =>
          (n ?? "").toUpperCase().includes("MINOR") || (c ?? "").toUpperCase() === "MN";
        const isIDC = (n: string, c?: string | null) =>
          (n ?? "").toUpperCase().includes("INTERDISCIPLINARY") ||
          (n ?? "").toUpperCase().includes("INTER DISCIPLINARY") ||
          (c ?? "").toUpperCase() === "IDC";
        const isAEC = (n: string, c?: string | null) =>
          (n ?? "").toUpperCase().includes("ABILITY ENHANCEMENT") || (c ?? "").toUpperCase() === "AEC";
        const isCVAC = (n: string, c?: string | null) =>
          (n ?? "").toUpperCase().includes("COMMON VALUE ADDED") || (c ?? "").toUpperCase() === "CVAC";

        const minorGroup = groups.find((g) => isMinor(g.subjectType?.name || "", g.subjectType?.code || ""));
        const idcGroup = groups.find((g) => isIDC(g.subjectType?.name || "", g.subjectType?.code || ""));
        const aecGroup = groups.find((g) => isAEC(g.subjectType?.name || "", g.subjectType?.code || ""));
        const cvacGroup = groups.find((g) => isCVAC(g.subjectType?.name || "", g.subjectType?.code || ""));

        const dedupe = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

        // Minor I: semesters I & II
        const minorSem1And2 = (minorGroup?.paperOptions || []).filter((p) => isSem(p, "I") || isSem(p, "II"));
        // Minor II: semesters III & IV
        const minorSem3And4 = (minorGroup?.paperOptions || []).filter((p) => isSem(p, "III") || isSem(p, "IV"));

        // IDC by semester
        const idcSem1Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "I"));
        const idcSem2Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "II"));
        const idcSem3Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "III"));

        // AEC 3: semester III
        const aec3Papers = (aecGroup?.paperOptions || []).filter((p) => isSem(p, "III"));

        const mn1 = dedupe(minorSem1And2.map(getLabel));
        const mn2 = dedupe(minorSem3And4.map(getLabel));
        setAdmissionMinor1Subjects(mn1);
        setAdmissionMinor2Subjects(mn2);

        // IDC per semester lists
        setAvailableIdcSem1Subjects(dedupe(idcSem1Papers.map(getLabel)));
        setAvailableIdcSem2Subjects(dedupe(idcSem2Papers.map(getLabel)));
        setAvailableIdcSem3Subjects(dedupe(idcSem3Papers.map(getLabel)));
        setAvailableAecSubjects(dedupe(aec3Papers.map(getLabel)));
        setAvailableCvacOptions(dedupe(cvacGroup?.paperOptions?.map(getLabel) || []));

        // Load restricted groupings and build quick lookup by target subject name
        const programCourseId = studentData.currentPromotion?.programCourse?.id;
        const rgs = await fetchRestrictedGroupings({
          page: 1,
          pageSize: 200,
          programCourseId: programCourseId || undefined,
        });
        const norm = (s: string) =>
          String(s || "")
            .trim()
            .toUpperCase();
        const rgMap: Record<string, { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }> = {};
        const rgById: Record<number, { semesters: string[]; cannotCombineIds: Set<number>; categoryCode: string }> = {};
        const catFlags: Record<string, boolean> = {};
        for (const rg of rgs) {
          const target = rg.subject?.name || "";
          if (!target) continue;
          // Normalize semester labels from RG to roman numerals (e.g., "I", "II")
          const semesters = (rg.forClasses || [])
            .map((c) => extractSemesterRoman(c.class?.shortName || c.class?.name))
            .filter(Boolean) as string[];
          const cannot = new Set(
            (rg.cannotCombineWithSubjects || [])
              .map((s) => norm(s.cannotCombineWithSubject?.name || ""))
              .filter(Boolean),
          );
          const code = norm(rg.subjectType?.code || rg.subjectType?.name || "");
          rgMap[norm(target)] = { semesters, cannotCombineWith: cannot, categoryCode: code };
          const targetId = (rg.subject as { id?: number })?.id;
          const cannotIds = new Set<number>(
            (rg.cannotCombineWithSubjects || [])
              .map((s) => (s.cannotCombineWithSubject as { id?: number })?.id)
              .filter((id): id is number => typeof id === "number"),
          );
          if (typeof targetId === "number")
            rgById[targetId] = { semesters, cannotCombineIds: cannotIds, categoryCode: code };
          if (code) catFlags[code] = true;
        }
        setRestrictedBySubject(rgMap);
        setRestrictedCategories(catFlags);

        // Semester labels are now handled dynamically in the component

        // Capture earlier Minor selections strictly by subject name
        const earlier = resp.selectedMinorSubjects ?? [];
        const subjectNameFromMinor = (paper: PaperDto | undefined): string => {
          if (!paper?.id) return "";
          if (paper.subject?.name) return paper.subject.name || "";
          const match = minorGroup?.paperOptions?.find((po) => po.id === paper.id);
          return match?.subject?.name || ""; // never fall back to paper name
        };
        const earlierMinor1 = subjectNameFromMinor(earlier[0]);
        const earlierMinor2 = subjectNameFromMinor(earlier[1]);
        setEarlierMinorSelections([earlierMinor1, earlierMinor2].filter(Boolean));
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.log("API call failed:", errorMessage);
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          setLoadError("Student not found with UID: " + uid);
        } else {
          setLoadError(errorMessage || "Failed to load student data");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  // Show non-blocking alert whenever current Minor pair differs from earlier saved pair
  useEffect(() => {
    if (earlierMinorSelections.length === 0) {
      setMinorMismatch(false);
      return;
    }

    // Only show mismatch if both current selections are made and they differ from saved
    const current = [minor1, minor2].filter(Boolean);
    if (current.length < 2) {
      setMinorMismatch(false);
      return;
    }

    const prev = [...earlierMinorSelections].sort();
    const currentSorted = [...current].sort();
    const isMismatch = JSON.stringify(prev) !== JSON.stringify(currentSorted);
    setMinorMismatch(isMismatch);
  }, [minor1, minor2, earlierMinorSelections]);

  // Highlight document section when field is focused
  const handleFieldFocus = (fieldType: string) => {
    // Scroll to and highlight the corresponding document section
    const sectionId = `${fieldType}-subjects`;
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" });
      section.classList.add("ring-4", "ring-blue-500", "border-blue-500");

      // Remove highlight after 3 seconds
      setTimeout(() => {
        section.classList.remove("ring-4", "ring-blue-500", "border-blue-500");
      }, 3000);
    }
  };

  // Dynamic validation function that updates errors in real-time
  const updateValidationErrors = (showErrors: boolean = false) => {
    const newErrors: string[] = [];

    // Only show validation errors if explicitly requested (e.g., when clicking Next)
    if (!showErrors) {
      setErrors([]);
      return true;
    }

    const shouldAskForAec = hasActualOptions(availableAecSubjects);
    const shouldAskForCvac = hasActualOptions(availableCvacOptions);

    // Required field validation - create individual error messages
    if (hasActualOptions(admissionMinor1Subjects) && !minor1) newErrors.push("Minor I subject is required");
    if (hasActualOptions(admissionMinor2Subjects) && !minor2) newErrors.push("Minor II subject is required");
    if (hasActualOptions(availableIdcSem1Subjects) && !idc1) newErrors.push("IDC 1 subject is required");
    if (hasActualOptions(availableIdcSem2Subjects) && !idc2) newErrors.push("IDC 2 subject is required");
    if (hasActualOptions(availableIdcSem3Subjects) && !idc3) newErrors.push("IDC 3 subject is required");
    if (shouldAskForAec && !aec3) newErrors.push("AEC 3 subject is required");
    if (shouldAskForCvac && !cvac4) newErrors.push("CVAC 4 subject is required");

    // Business rule validation
    if (minor1 && idc1 && minor1 === idc1) {
      newErrors.push("Minor I cannot be the same as IDC 1");
    }
    if (minor1 && idc2 && minor1 === idc2) {
      newErrors.push("Minor I cannot be the same as IDC 2");
    }
    if (minor1 && idc3 && minor1 === idc3) {
      newErrors.push("Minor I cannot be the same as IDC 3");
    }
    if (minor2 && idc1 && minor2 === idc1) {
      newErrors.push("Minor II cannot be the same as IDC 1");
    }
    if (minor2 && idc2 && minor2 === idc2) {
      newErrors.push("Minor II cannot be the same as IDC 2");
    }
    if (minor2 && idc3 && minor2 === idc3) {
      newErrors.push("Minor II cannot be the same as IDC 3");
    }

    // IDC uniqueness validation
    if (idc1 && idc2 && idc1 === idc2) {
      newErrors.push("IDC 1 and IDC 2 cannot be the same");
    }
    if (idc1 && idc3 && idc1 === idc3) {
      newErrors.push("IDC 1 and IDC 3 cannot be the same");
    }
    if (idc2 && idc3 && idc2 === idc3) {
      newErrors.push("IDC 2 and IDC 3 cannot be the same");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Validation function - only show errors when explicitly requested
  const validateForm = () => {
    return updateValidationErrors(true);
  };

  // Mark user interaction when they start selecting fields
  const handleFieldChange = (setter: (value: string) => void, value: string, fieldType: string) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    setter(value);

    // Clear only the specific error for this field when user selects it
    if (errors.length > 0 && value) {
      const fieldErrorMap: Record<string, string> = {
        minor1: "Minor I subject is required",
        minor2: "Minor II subject is required",
        idc1: "IDC 1 subject is required",
        idc2: "IDC 2 subject is required",
        idc3: "IDC 3 subject is required",
        aec3: "AEC 3 subject is required",
        cvac4: "CVAC 4 subject is required",
      };

      const errorToRemove = fieldErrorMap[fieldType];
      if (errorToRemove) {
        setErrors((prevErrors) => prevErrors.filter((error) => error !== errorToRemove));
      }
    }
  };

  const handleNext = () => {
    // Mark user interaction when they try to proceed
    setHasUserInteracted(true);

    // Show validation errors when user tries to proceed
    const isValid = validateForm();

    if (isValid) {
      // Do not block; mismatch is informational only
      setStep(2);
    }
    // If not valid, errors will be displayed by validateForm()
  };
  const handleBack = () => setStep(1);

  // Filter out Minor subjects from IDC options (per list)
  const getFilteredIdcOptions = (sourceList: string[], currentIdcValue: string) => {
    return sourceList.filter(
      (subject) =>
        subject !== minor1 &&
        subject !== minor2 &&
        (subject === currentIdcValue || (subject !== idc1 && subject !== idc2 && subject !== idc3)),
    );
  };

  const getFilteredByCategory = (
    sourceList: string[],
    currentValue: string,
    categoryCode: string,
    contextSemester?: string | string[],
  ) => {
    const norm = (s: string) =>
      String(s || "")
        .trim()
        .toUpperCase();
    const applyRules = Boolean(restrictedCategories[norm(categoryCode)]);
    return sourceList.filter((subject) => {
      if (!applyRules) {
        // No RG defined for this category; allow default dedupe logic by caller
        return true;
      }

      // Base ensure uniqueness against current selections of same category handled by caller
      // RG checks only when defined for this category
      // IMPORTANT: exclude the current field's own value so user can swap
      const selected = [minor1, minor2, idc1, idc2, idc3].filter(Boolean).filter((s) => s !== currentValue);
      const inContext = (rgSemesters: string[]) => {
        if (!contextSemester) return true;
        const set = Array.isArray(contextSemester)
          ? new Set(contextSemester.map((s) => norm(s)))
          : new Set([norm(contextSemester)]);
        return rgSemesters.length === 0 || rgSemesters.some((r) => set.has(norm(r)));
      };
      for (const sel of selected) {
        const rg = restrictedBySubject[norm(sel)];
        if (!rg) continue;
        if (rg.categoryCode !== norm(categoryCode)) continue; // rule applies only to its category
        if (!inContext(rg.semesters)) continue;
        if (rg.cannotCombineWith.has(norm(subject))) return false;
      }

      const candidateRg = restrictedBySubject[norm(subject)];
      if (candidateRg && candidateRg.categoryCode === norm(categoryCode)) {
        if (!inContext(candidateRg.semesters)) return true;
        for (const sel of selected) {
          if (candidateRg.cannotCombineWith.has(norm(sel))) return false;
        }
      }
      return true;
    });
  };

  // Loading skeleton component for dropdowns
  const LoadingDropdown = ({ label }: { label: string }) => (
    <div className="space-y-2 min-h-[84px]">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="w-full border border-gray-300 rounded-md h-10 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">Loading options...</span>
      </div>
    </div>
  );

  // Helper function to convert subject arrays to combobox format with a reset placeholder
  const convertToComboboxData = (subjects: string[], excludeValues: string[] = [], selectLabel: string = "Select") => {
    const options = subjects
      .filter((subject) => !excludeValues.includes(subject))
      .map((subject) => ({ value: subject, label: subject }));
    return [{ value: "", label: selectLabel }, ...options];
  };

  // Helper function to check if there are actual subject options (excluding placeholder)
  const hasActualOptions = (subjects: string[]) => {
    return subjects.filter((subject) => subject && subject.trim() !== "").length > 0;
  };

  // Dynamic semester labeling function
  const getSemesterLabel = (subjectType: "minor1" | "minor2", baseLabel: string) => {
    // Try multiple paths to get program course name
    const programCourseName =
      student?.currentPromotion?.programCourse?.name || student?.programCourse?.course?.name || "";

    // Check for BCOM programs - handle both "B.Com" and "BCOM" variations
    const normalizedName = programCourseName.toLowerCase().replace(/[.\s]/g, "");
    const isBcomProgram = normalizedName.includes("bcom");

    if (subjectType === "minor2" && isBcomProgram) {
      const newLabel = baseLabel.replace("Minor II (Semester III & IV)", "Minor III (Semester III)");
      return newLabel;
    }

    return baseLabel;
  };

  // Dynamic placeholder function
  const getPlaceholder = (subjectType: "minor1" | "minor2", basePlaceholder: string) => {
    const programCourseName =
      student?.currentPromotion?.programCourse?.name || student?.programCourse?.course?.name || "";

    const normalizedName = programCourseName.toLowerCase().replace(/[.\s]/g, "");
    const isBcomProgram = normalizedName.includes("bcom");

    if (subjectType === "minor2" && isBcomProgram) {
      return basePlaceholder.replace("Minor II", "Minor III");
    }

    return basePlaceholder;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Form Section - No Scrolling */}
      <div className="flex-1 overflow-hidden">
        <div className="shadow-lg rounded-xl bg-white p-6 border border-gray-100 h-full overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-8">
              {step === 1
                ? "Semester-wise Subject Selection for Calcutta University Registration"
                : "Preview Your Selections"}
            </h2>
            <p className="text-gray-600 text-sm">
              {step === 1 ? (
                <>
                  <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <div className="text-sm">
                      Before selecting your subjects, please read the following notes carefully to ensure clarity on the
                      selection process. These notes are provided here for your reference and guidance.
                    </div>
                  </div>
                </>
              ) : (
                "Review and confirm declarations before saving"
              )}
            </p>
            {loading && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading subject options...</span>
              </div>
            )}
            {loadError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Error loading subjects: {loadError}</span>
                </div>
              </div>
            )}
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4">
              {/* Minor Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                  <>
                    <LoadingDropdown label={getSemesterLabel("minor1", "Minor I (Semester I & II)")} />
                    <LoadingDropdown label={getSemesterLabel("minor2", "Minor II (Semester III & IV)")} />
                  </>
                ) : (
                  <>
                    {hasActualOptions(admissionMinor1Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                        <label className="text-sm font-semibold text-gray-700">
                          {getSemesterLabel("minor1", "Minor I (Semester I & II)")}
                        </label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]),
                            [minor2],
                          )}
                          value={minor1}
                          onChange={(value) => handleFieldChange(setMinor1, value, "minor1")}
                          placeholder={getPlaceholder("minor1", "Select Minor I")}
                          className="w-full"
                        />
                      </div>
                    )}

                    {hasActualOptions(admissionMinor2Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                        <label className="text-sm font-semibold text-gray-700">
                          {getSemesterLabel("minor2", "Minor II (Semester III & IV)")}
                        </label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]),
                            [minor1],
                          )}
                          value={minor2}
                          onChange={(value) => handleFieldChange(setMinor2, value, "minor2")}
                          placeholder={getPlaceholder("minor2", "Select Minor II")}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {loading ? (
                <LoadingDropdown label="AEC (Semester III & IV)" />
              ) : hasActualOptions(availableAecSubjects) ? (
                <div className="space-y-2" onClick={() => handleFieldFocus("aec")}>
                  <label className="text-sm font-semibold text-gray-700">AEC (Semester III & IV)</label>
                  <Combobox
                    dataArr={convertToComboboxData(availableAecSubjects)}
                    value={aec3}
                    onChange={(value) => handleFieldChange(setAec3, value, "aec3")}
                    placeholder="Select AEC 3"
                    className="w-full"
                  />
                </div>
              ) : null}

              {/* IDC Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {loading ? (
                  <>
                    <LoadingDropdown label="IDC 1 (Semester I)" />
                    <LoadingDropdown label="IDC 2 (Semester II)" />
                    <LoadingDropdown label="IDC 3 (Semester III)" />
                  </>
                ) : (
                  <>
                    {hasActualOptions(availableIdcSem1Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("idc")}>
                        <label className="text-sm font-semibold text-gray-700">IDC 1 (Semester I)</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            getFilteredByCategory(
                              getFilteredIdcOptions(availableIdcSem1Subjects, idc1),
                              idc1,
                              "IDC",
                              "I",
                            ),
                          )}
                          value={idc1}
                          onChange={(value) => handleFieldChange(setIdc1, value, "idc1")}
                          placeholder="Select IDC 1"
                          className="w-full"
                        />
                      </div>
                    )}

                    {hasActualOptions(availableIdcSem2Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("idc")}>
                        <label className="text-sm font-semibold text-gray-700">IDC 2 (Semester II)</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            getFilteredByCategory(
                              getFilteredIdcOptions(availableIdcSem2Subjects, idc2),
                              idc2,
                              "IDC",
                              "II",
                            ),
                          )}
                          value={idc2}
                          onChange={(value) => handleFieldChange(setIdc2, value, "idc2")}
                          placeholder="Select IDC 2"
                          className="w-full"
                        />
                      </div>
                    )}

                    {hasActualOptions(availableIdcSem3Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("idc")}>
                        <label className="text-sm font-semibold text-gray-700">IDC 3 (Semester III)</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            getFilteredByCategory(
                              getFilteredIdcOptions(availableIdcSem3Subjects, idc3),
                              idc3,
                              "IDC",
                              "III",
                            ),
                          )}
                          value={idc3}
                          onChange={(value) => handleFieldChange(setIdc3, value, "idc3")}
                          placeholder="Select IDC 3"
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* CVAC Subjects */}
              {loading ? (
                <LoadingDropdown label="CVAC 4 (Semester II)" />
              ) : hasActualOptions(availableCvacOptions) ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">CVAC 4 (Semester II)</label>
                  <Combobox
                    dataArr={convertToComboboxData(availableCvacOptions)}
                    value={cvac4}
                    onChange={(value) => handleFieldChange(setCvac4, value, "cvac4")}
                    placeholder="Select CVAC 4"
                    className="w-full"
                  />
                </div>
              ) : null}

              <div className="space-y-2">{/* Empty space for grid alignment */}</div>
            </div>
          )}

          {step === 2 && (
            <>
              {/* Errors (should be none here, but guard just in case) */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  <p className="font-medium mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {errors.length === 0 && (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left font-semibold text-gray-700">Subject Category</th>
                        <th className="border p-2 text-left font-semibold text-gray-700">Selection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Minor I - Always show if there are subjects available */}
                      {admissionMinor1Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">
                            {getSemesterLabel("minor1", "Minor I (Semester I & II)")}
                          </td>
                          <td className="border p-2 text-gray-800">{minor1 || "-"}</td>
                        </tr>
                      )}

                      {/* Minor II - Always show if there are subjects available */}
                      {admissionMinor2Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">
                            {getSemesterLabel("minor2", "Minor II (Semester III & IV)")}
                          </td>
                          <td className="border p-2 text-gray-800">{minor2 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 1 - Only show if there are subjects available */}
                      {availableIdcSem1Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">IDC 1 (Semester I)</td>
                          <td className="border p-2 text-gray-800">{idc1 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 2 - Only show if there are subjects available */}
                      {availableIdcSem2Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">IDC 2 (Semester II)</td>
                          <td className="border p-2 text-gray-800">{idc2 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 3 - Only show if there are subjects available */}
                      {availableIdcSem3Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">IDC 3 (Semester III)</td>
                          <td className="border p-2 text-gray-800">{idc3 || "-"}</td>
                        </tr>
                      )}

                      {/* AEC 3 - Only show if there are subjects available */}
                      {availableAecSubjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">AEC (Semester III & IV)</td>
                          <td className="border p-2 text-gray-800">{aec3 || "-"}</td>
                        </tr>
                      )}

                      {/* CVAC 4 - Only show if there are subjects available */}
                      {availableCvacOptions.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">CVAC 4 (Semester II)</td>
                          <td className="border p-2 text-gray-800">{cvac4 || "-"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Declarations */}
              {errors.length === 0 && (
                <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Declarations</h4>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={agree1}
                      onChange={(e) => setAgree1(e.target.checked)}
                    />
                    <span>I confirm that I have read the semester-wise subject selection guidelines given above.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={agree2}
                      onChange={(e) => setAgree2(e.target.checked)}
                    />
                    <span>
                      I understand that once submitted, I will not be allowed to change the selected subjects in the
                      future.
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={agree3}
                      onChange={(e) => setAgree3(e.target.checked)}
                    />
                    <span>
                      In the event of violation of subject selection rules, I will abide by the final decision taken by
                      the Vice-Principal/Course Coordinator/Calcutta University.
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* Step 1 inline errors (shown above Next) */}
          {step === 1 && errors.length > 0 && (
            <div id="form-error" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-blocking Minor mismatch notice */}
          {step === 1 && minorMismatch && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg">
              <div>
                Your current Minor I and II subject combination is different from the one you had selected at the time
                of admission.
              </div>
              <div className="mt-1 text-sm">
                Previously saved: <span className="font-semibold">{earlierMinorSelections[0] || "-"}</span> and{" "}
                <span className="font-semibold">{earlierMinorSelections[1] || "-"}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
            {step === 1 && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm text-sm flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Loading..." : "Next"}
              </button>
            )}
            {step === 2 && (
              <>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
                >
                  Back
                </button>
                <button
                  disabled={!agree1 || !agree2 || !agree3}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm text-sm"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
