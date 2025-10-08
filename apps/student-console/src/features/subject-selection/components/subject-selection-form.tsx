"use client";
import React, { useState, useEffect } from "react";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  fetchStudentSubjectSelections,
  StudentSubjectSelectionGroupDto,
  PaperDto,
  saveStudentSubjectSelections,
  SubjectSelectionMetaDto,
  StudentSubjectSelectionForSave,
} from "@/services/subject-selection";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";

export default function SubjectSelectionForm({ openNotes }: { openNotes?: () => void }) {
  const { user } = useAuth();
  const { student } = useStudent();
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);

  const [selections, setSelections] = useState<StudentSubjectSelectionGroupDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New state for meta data and saving
  const [subjectSelectionMetas, setSubjectSelectionMetas] = useState<SubjectSelectionMetaDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasExistingSelections, setHasExistingSelections] = useState(false);
  const [savedSelections, setSavedSelections] = useState<{
    minor1?: string;
    minor2?: string;
    idc1?: string;
    idc2?: string;
    idc3?: string;
    aec3?: string;
    cvac4?: string;
  }>({});
  const [currentSession, setCurrentSession] = useState<{ id: number } | null>(null);

  // Form state - matching the documented workflow
  const [minor1, setMinor1] = useState(""); // Minor I (Semester I & II)
  const [minor2, setMinor2] = useState(""); // Minor II (Semester III & IV)
  const [idc1, setIdc1] = useState(""); // IDC 1 (Semester I)
  const [idc2, setIdc2] = useState(""); // IDC 2 (Semester II)
  const [idc3, setIdc3] = useState(""); // IDC 3 (Semester III)
  // Dynamic per-category selections
  const [idcSem1, setIdcSem1] = useState<string>("");
  const [idcSem2, setIdcSem2] = useState<string>("");
  const [idcSem3, setIdcSem3] = useState<string>("");
  const [minorSem12, setMinorSem12] = useState<string>("");
  const [minorSem34, setMinorSem34] = useState<string>("");
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

  // Auto-assign subjects per category/semester (from API flag)
  const [autoMinor1, setAutoMinor1] = useState<string>("");
  const [autoMinor2, setAutoMinor2] = useState<string>("");
  const [autoIdc1, setAutoIdc1] = useState<string>("");
  const [autoIdc2, setAutoIdc2] = useState<string>("");
  const [autoIdc3, setAutoIdc3] = useState<string>("");

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

  // Load paper options and meta data from backend
  useEffect(() => {
    const run = async () => {
      if (!student?.id) return;
      setLoading(true);
      setLoadError(null);
      try {
        // Fetch data including meta data in single API call
        const resp = await fetchStudentSubjectSelections(student.id);
        console.log("subject-selection-form data", resp);

        // Set meta data from the response
        setSubjectSelectionMetas(resp.subjectSelectionMetas || []);

        // Set session information
        setCurrentSession(resp.session || null);

        const groups = resp.studentSubjectsSelection ?? [];
        setSelections(groups);

        // Check if student has actually submitted selections through the form
        const hasExisting = resp.hasFormSubmissions || false;
        setHasExistingSelections(hasExisting);

        // If student has existing form submissions, populate the saved selections for display
        if (hasExisting) {
          const savedSelectionsData: typeof savedSelections = {};

          // Extract saved selections from actualStudentSelections
          const actualSelections = resp.actualStudentSelections || [];

          // Transform actualStudentSelections array into the format expected by SavedSelectionsDisplay
          const transformedSelections = transformActualSelectionsToDisplayFormat(
            actualSelections,
            resp.subjectSelectionMetas || [],
          );
          setSavedSelections(transformedSelections);
        }

        // Derive groups
        const getLabel = (p: PaperDto) => p?.subject?.name || "";
        const romanMap: Record<string, string> = { "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI" };
        const extractSemesterRoman = (name?: string | null): string => {
          if (!name) return "";
          const upper = String(name).toUpperCase();
          const romanMatch = upper.match(/\b(I|II|III|IV|V|VI)\b/);
          if (romanMatch) return romanMatch[1];
          const digitMatch = upper.match(/\b([1-6])\b/);
          if (digitMatch) return romanMap[digitMatch[1]] || "";
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

        const minorGroup = groups.find((g) => isMinor(g.subjectType?.name || "", g.subjectType?.code!));
        const idcGroup = groups.find((g) => isIDC(g.subjectType?.name || "", g.subjectType?.code!));
        const aecGroup = groups.find((g) => isAEC(g.subjectType?.name || "", g.subjectType?.code!));
        const cvacGroup = groups.find((g) => isCVAC(g.subjectType?.name || "", g.subjectType?.code!));

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

        // Capture first auto-assign subject per category/semester (if any)
        const firstOrEmpty = (arr: string[]) => (arr.length > 0 ? arr[0] : "");
        const autoMinor1List = dedupe(
          (minorGroup?.paperOptions || [])
            .filter((p) => (p as any)?.autoAssign === true && (isSem(p, "I") || isSem(p, "II")))
            .map(getLabel),
        );
        const autoMinor2List = dedupe(
          (minorGroup?.paperOptions || [])
            .filter((p) => (p as any)?.autoAssign === true && (isSem(p, "III") || isSem(p, "IV")))
            .map(getLabel),
        );
        const autoIdc1List = dedupe(
          (idcGroup?.paperOptions || []).filter((p) => (p as any)?.autoAssign === true && isSem(p, "I")).map(getLabel),
        );
        const autoIdc2List = dedupe(
          (idcGroup?.paperOptions || []).filter((p) => (p as any)?.autoAssign === true && isSem(p, "II")).map(getLabel),
        );
        const autoIdc3List = dedupe(
          (idcGroup?.paperOptions || [])
            .filter((p) => (p as any)?.autoAssign === true && isSem(p, "III"))
            .map(getLabel),
        );
        setAutoMinor1(firstOrEmpty(autoMinor1List));
        setAutoMinor2(firstOrEmpty(autoMinor2List));
        setAutoIdc1(firstOrEmpty(autoIdc1List));
        setAutoIdc2(firstOrEmpty(autoIdc2List));
        setAutoIdc3(firstOrEmpty(autoIdc3List));

        // Debug: Log auto-assign values
        console.log("Auto-assign values:", {
          autoMinor1: firstOrEmpty(autoMinor1List),
          autoMinor2: firstOrEmpty(autoMinor2List),
          autoIdc1: firstOrEmpty(autoIdc1List),
          autoIdc2: firstOrEmpty(autoIdc2List),
          autoIdc3: firstOrEmpty(autoIdc3List),
        });

        // Load restricted groupings and build quick lookup by target subject name
        const programCourseId = student?.currentPromotion?.programCourse?.id as number | undefined;
        const rgs = await fetchRestrictedGroupings({ page: 1, pageSize: 200, programCourseId });
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
          const targetKey = norm(target);
          // Merge with any existing rule for target
          if (!rgMap[targetKey]) {
            rgMap[targetKey] = { semesters, cannotCombineWith: new Set<string>(), categoryCode: code };
          }
          for (const c of cannot) rgMap[targetKey].cannotCombineWith.add(c);

          // Ensure symmetric restriction: if A cannot combine with B for a category/semester context,
          // then B should not combine with A as well in the same category context.
          for (const c of cannot) {
            if (!c) continue;
            if (!rgMap[c]) {
              rgMap[c] = { semesters, cannotCombineWith: new Set<string>(), categoryCode: code };
            }
            rgMap[c].cannotCombineWith.add(targetKey);
          }
          const targetId = (rg.subject as any)?.id as number | undefined;
          const cannotIds = new Set<number>(
            (rg.cannotCombineWithSubjects || [])
              .map((s) => (s.cannotCombineWithSubject as any)?.id as number | undefined)
              .filter((id): id is number => typeof id === "number"),
          );
          if (typeof targetId === "number")
            rgById[targetId] = { semesters, cannotCombineIds: cannotIds, categoryCode: code };
          if (code) catFlags[code] = true;
        }
        setRestrictedBySubject(rgMap);
        setRestrictedCategories(catFlags);
        // Log restricted grouping DTOs for verification
        // eslint-disable-next-line no-console
        console.log(
          "[SubjectSelection] RG fetched:",
          rgs.map((rg) => ({
            id: rg.id,
            cat: rg.subjectType?.code || rg.subjectType?.name,
            subject: rg.subject?.name,
            subjectId: (rg.subject as any)?.id,
            semesters: (rg.forClasses || []).map((c) => c.class?.shortName || c.class?.name),
            cannot: (rg.cannotCombineWithSubjects || []).map((s) => ({
              name: s.cannotCombineWithSubject?.name,
              id: (s.cannotCombineWithSubject as any)?.id,
            })),
          })),
        );

        // Save semester labels for use in filtering at render time
        setIdcSem1("I");
        setIdcSem2("II");
        setIdcSem3("III");
        setMinorSem12("I,II");
        setMinorSem34("III,IV");

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

        // Don't populate form fields with existing selections - let user make fresh selections
        // The earlierMinorSelections are still tracked for comparison purposes

        // Populate other existing selections if available
        // Note: The existing selections are already loaded in the form fields above
        // Additional selections for IDC, AEC, CVAC would need to be loaded from a different API endpoint
        // For now, we'll focus on the Minor subjects which are the main concern
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load subject selections");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [student?.id]);

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

    // Auto-assigned subject must be present validation
    if (autoMinor1 && minor1 !== autoMinor1 && minor2 !== autoMinor1) {
      newErrors.push(`${autoMinor1} is mandatory and must be selected in one of the Minor subjects`);
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

    // Move auto-assigned subject (Mathematics) to the other Minor when replaced
    if (autoMinor1 && (fieldType === "minor1" || fieldType === "minor2")) {
      if (fieldType === "minor1" && minor1 === autoMinor1 && value !== autoMinor1) {
        if (minor2 !== autoMinor1) setMinor2(autoMinor1);
      }
      if (fieldType === "minor2" && minor2 === autoMinor1 && value !== autoMinor1) {
        if (minor1 !== autoMinor1) setMinor1(autoMinor1);
      }
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

    // Validate and proceed
    const isValid = validateForm();
    if (isValid) {
      setStep(2);
    }
  };
  const handleBack = () => setStep(1);

  // Helper function to get dynamic label from meta data
  const getDynamicLabel = (subjectTypeCode: string, semester?: string): string => {
    const extractSemesterRomanFromClass = (name?: string | null): string => {
      if (!name) return "";
      const upper = String(name).toUpperCase();
      const match = upper.match(/\b(I|II|III|IV|V|VI)\b/);
      return match ? match[1] : "";
    };
    const meta = subjectSelectionMetas.find((m) => {
      if (m.subjectType.code !== subjectTypeCode) return false;
      if (!semester) return true;
      return m.forClasses.some((c) => extractSemesterRomanFromClass(c.class?.name) === semester);
    });
    return meta?.label || getDefaultLabel(subjectTypeCode, semester);
  };

  // Helper function to get default label if meta data is not available
  const getDefaultLabel = (subjectTypeCode: string, semester?: string): string => {
    switch (subjectTypeCode) {
      case "MN":
        if (semester === "I" || semester === "II") return "Minor I (Semester I & II)";
        if (semester === "III" || semester === "IV") return "Minor II (Semester III & IV)";
        return "Minor Subject";
      case "IDC":
        if (semester === "I") return "IDC 1 (Semester I)";
        if (semester === "II") return "IDC 2 (Semester II)";
        if (semester === "III") return "IDC 3 (Semester III)";
        return "IDC Subject";
      case "AEC":
        return "AEC (Semester III & IV)";
      case "CVAC":
        return "CVAC 4 (Semester II)";
      default:
        return "Subject";
    }
  };

  // Create selections array for saving with fresh meta data (no cache)
  const createSelectionsForSaveWithFreshData = (
    freshMetas: SubjectSelectionMetaDto[],
    freshSession: { id: number } | null,
  ): StudentSubjectSelectionForSave[] => {
    const selectionsToSave: StudentSubjectSelectionForSave[] = [];

    console.log("🔍 Frontend Debug - createSelectionsForSaveWithFreshData called with:", {
      studentId: student?.id,
      hasSelections: !!selections,
      freshMetasCount: freshMetas.length,
      freshSessionId: freshSession?.id,
      freshMetas: freshMetas.map((m) => ({
        id: m.id,
        label: m.label,
        subjectTypeCode: m.subjectType.code,
      })),
    });

    if (!student?.id || !selections || freshMetas.length === 0 || !freshSession?.id) {
      console.log("🔍 Frontend Debug - Early return due to missing data");
      return selectionsToSave;
    }

    // Helper function to find subject ID by name
    const findSubjectId = (subjectName: string): number | null => {
      for (const group of selections) {
        for (const paper of group.paperOptions || []) {
          if (paper.subject?.name === subjectName) {
            return paper.subject.id;
          }
        }
      }
      return null;
    };

    // Helper function to find meta ID by subject type, semester, and stream using fresh data
    const findMetaId = (subjectTypeCode: string, semester?: string): number | null => {
      const studentStreamId = student?.currentPromotion?.programCourse?.stream?.id;

      console.log("🔍 Frontend Debug - Finding meta ID for:", {
        subjectTypeCode,
        semester,
        studentStreamId,
        availableMetas: freshMetas.map((m) => ({
          id: m.id,
          label: m.label,
          subjectTypeCode: m.subjectType.code,
          streams: m.streams.map((s) => s.stream?.id),
          classes: m.forClasses.map((c) => c.class.name),
        })),
      });

      const extractSemesterRomanFromClass = (name?: string | null): string => {
        if (!name) return "";
        const upper = String(name).toUpperCase();
        const match = upper.match(/\b(I|II|III|IV|V|VI)\b/);
        return match ? match[1] : "";
      };

      const meta = freshMetas.find((m) => {
        if (m.subjectType.code !== subjectTypeCode) return false;

        // Check if the meta applies to the student's stream
        if (studentStreamId && m.streams.length > 0) {
          const hasMatchingStream = m.streams.some((s) => s.stream?.id === studentStreamId);
          if (!hasMatchingStream) return false;
        }

        // For semester-specific matching, check if the meta applies to the semester
        if (semester && m.forClasses.length > 0) {
          return m.forClasses.some((c) => extractSemesterRomanFromClass(c.class?.name) === semester);
        }

        return true;
      });

      console.log(
        "🔍 Frontend Debug - Found meta:",
        meta
          ? {
              id: meta.id,
              label: meta.label,
              subjectTypeCode: meta.subjectType.code,
            }
          : null,
      );

      return meta?.id || null;
    };

    // Add Minor 1 selection
    if (minor1) {
      const subjectId = findSubjectId(minor1);
      const metaId = findMetaId("MN", "I"); // Minor for Semester I
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor1 },
        });
      }
    }

    // Add Minor 2 selection
    if (minor2) {
      const subjectId = findSubjectId(minor2);
      const metaId = findMetaId("MN", "III"); // Minor for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor2 },
        });
      }
    }

    // Add IDC selections
    if (idc1) {
      const subjectId = findSubjectId(idc1);
      const metaId = findMetaId("IDC", "I"); // IDC for Semester I
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc1 },
        });
      }
    }

    if (idc2) {
      const subjectId = findSubjectId(idc2);
      const metaId = findMetaId("IDC", "II"); // IDC for Semester II
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc2 },
        });
      }
    }

    if (idc3) {
      const subjectId = findSubjectId(idc3);
      const metaId = findMetaId("IDC", "III"); // IDC for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc3 },
        });
      }
    }

    // Add AEC selection
    if (aec3) {
      const subjectId = findSubjectId(aec3);
      const metaId = findMetaId("AEC", "III"); // AEC for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: aec3 },
        });
      }
    }

    // Add CVAC selection
    if (cvac4) {
      const subjectId = findSubjectId(cvac4);
      const metaId = findMetaId("CVAC", "II"); // CVAC for Semester II
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: freshSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: cvac4 },
        });
      }
    }

    console.log("🔍 Frontend Debug - Final selections to save:", selectionsToSave);
    return selectionsToSave;
  };

  // Original createSelectionsForSave function (kept for backward compatibility)
  const createSelectionsForSave = (): StudentSubjectSelectionForSave[] => {
    const selectionsToSave: StudentSubjectSelectionForSave[] = [];

    if (!student?.id || !selections || subjectSelectionMetas.length === 0 || !currentSession?.id) {
      return selectionsToSave;
    }

    // Helper function to find subject ID by name
    const findSubjectId = (subjectName: string): number | null => {
      for (const group of selections) {
        for (const paper of group.paperOptions || []) {
          if (paper.subject?.name === subjectName) {
            return paper.subject.id;
          }
        }
      }
      return null;
    };

    // Helper function to find meta ID by subject type, semester, and stream
    const findMetaId = (subjectTypeCode: string, semester?: string): number | null => {
      const studentStreamId = student?.currentPromotion?.programCourse?.stream?.id;

      const meta = subjectSelectionMetas.find((m) => {
        if (m.subjectType.code !== subjectTypeCode) return false;

        // Check if the meta applies to the student's stream
        if (studentStreamId && m.streams.length > 0) {
          const hasMatchingStream = m.streams.some((s) => s.stream?.id === studentStreamId);
          if (!hasMatchingStream) return false;
        }

        // For semester-specific matching, check if the meta applies to the semester
        if (semester && m.forClasses.length > 0) {
          return m.forClasses.some((c) => c.class.name.includes(semester));
        }

        return true;
      });
      return meta?.id || null;
    };

    // Add Minor 1 selection
    if (minor1) {
      const subjectId = findSubjectId(minor1);
      const metaId = findMetaId("MN", "I"); // Minor for Semester I
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor1 },
        });
      }
    }

    // Add Minor 2 selection
    if (minor2) {
      const subjectId = findSubjectId(minor2);
      const metaId = findMetaId("MN", "III"); // Minor for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor2 },
        });
      }
    }

    // Add IDC selections
    if (idc1) {
      const subjectId = findSubjectId(idc1);
      const metaId = findMetaId("IDC", "I"); // IDC for Semester I
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc1 },
        });
      }
    }

    if (idc2) {
      const subjectId = findSubjectId(idc2);
      const metaId = findMetaId("IDC", "II"); // IDC for Semester II
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc2 },
        });
      }
    }

    if (idc3) {
      const subjectId = findSubjectId(idc3);
      const metaId = findMetaId("IDC", "III"); // IDC for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc3 },
        });
      }
    }

    // Add AEC selection
    if (aec3) {
      const subjectId = findSubjectId(aec3);
      const metaId = findMetaId("AEC", "III"); // AEC for Semester III
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: aec3 },
        });
      }
    }

    // Add CVAC selection
    if (cvac4) {
      const subjectId = findSubjectId(cvac4);
      const metaId = findMetaId("CVAC", "II"); // CVAC for Semester II
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: cvac4 },
        });
      }
    }

    return selectionsToSave;
  };

  // Handle save
  const handleSave = async () => {
    if (!agree1 || !agree2 || !agree3) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Always fetch fresh meta data before saving to avoid cache issues
      console.log("🔍 Frontend Debug - Fetching fresh meta data before save...");
      const freshResp = await fetchStudentSubjectSelections(student?.id!);

      // Use fresh data directly without caching
      const freshMetas = freshResp.subjectSelectionMetas || [];
      const freshSession = freshResp.session || null;

      console.log(
        "🔍 Frontend Debug - Fresh meta data:",
        freshMetas.map((m) => ({
          id: m.id,
          label: m.label,
          subjectTypeCode: m.subjectType.code,
        })),
      );

      // Create selections using fresh meta data
      const selectionsToSave = createSelectionsForSaveWithFreshData(freshMetas, freshSession);
      console.log("Saving selections:", selectionsToSave);

      const result = await saveStudentSubjectSelections(selectionsToSave);

      if (result.success) {
        setSaveSuccess(true);
        // Update local state with fresh data
        setSubjectSelectionMetas(freshMetas);
        setCurrentSession(freshSession);

        // Refresh the data to get the updated hasFormSubmissions status
        console.log("🔍 Frontend Debug - Refreshing data after successful save...");
        const updatedResp = await fetchStudentSubjectSelections(student?.id!);

        // Update the hasExistingSelections state to trigger UI change
        setHasExistingSelections(updatedResp.hasFormSubmissions);

        // Transform actualStudentSelections array into the format expected by SavedSelectionsDisplay
        console.log("🔍 Frontend Debug - About to transform selections:", {
          actualStudentSelections: updatedResp.actualStudentSelections,
          subjectSelectionMetas: updatedResp.subjectSelectionMetas,
        });

        const transformedSelections = transformActualSelectionsToDisplayFormat(
          updatedResp.actualStudentSelections,
          updatedResp.subjectSelectionMetas,
        );

        console.log("🔍 Frontend Debug - Transformed selections:", transformedSelections);
        setSavedSelections(transformedSelections);

        // Reset to step 1 to show the saved selections display
        setStep(1);

        // Reset minor mismatch alert since selections have been updated
        setMinorMismatch(false);

        // Play success sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

          // Create a more distinctive "success" sound with two quick beeps
          const playBeep = (frequency: number, startTime: number, duration: number) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = "sine";

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          };

          // Play two quick ascending beeps
          playBeep(800, audioContext.currentTime, 0.15); // Higher pitch
          playBeep(1000, audioContext.currentTime + 0.2, 0.15); // Even higher pitch
        } catch (error) {
          console.log("Could not play success sound:", error);
        }

        console.log("Selections saved successfully:", result.data);
        console.log("🔍 Frontend Debug - Updated hasFormSubmissions:", updatedResp.hasFormSubmissions);
      } else {
        setSaveError("Validation failed: " + (result.errors?.map((e) => e.message).join(", ") || "Unknown error"));
      }
    } catch (error: any) {
      setSaveError(error.message || "Failed to save selections");
    } finally {
      setSaving(false);
    }
  };

  // Filter out Minor subjects from IDC options (per list)
  // NOTE: This enforces the business rule "IDC subjects cannot be same as your Minor subjects"
  // but does NOT apply restricted-grouping cross-category eliminations.
  const getFilteredIdcOptions = (sourceList: string[], currentIdcValue: string) => {
    return sourceList.filter((subject) => {
      // Enforce IDC uniqueness within IDC selections
      const uniqueWithinIdc = subject === currentIdcValue || (subject !== idc1 && subject !== idc2 && subject !== idc3);
      // Enforce IDC ≠ Minor rule only (not RG). Do not hide because of RG defined for Minor.
      const notSameAsMinor = subject !== minor1 && subject !== minor2;
      return uniqueWithinIdc && notSameAsMinor;
    });
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
      // Only consider selections from the SAME category as the dropdown being filtered
      const sameCategorySelected =
        norm(categoryCode) === "MN"
          ? [minor1, minor2]
          : norm(categoryCode) === "IDC"
            ? [idc1, idc2, idc3]
            : norm(categoryCode) === "AEC"
              ? [aec3]
              : norm(categoryCode) === "CVAC"
                ? [cvac4]
                : [];
      const selected = sameCategorySelected.filter(Boolean).filter((s) => s !== currentValue);

      // Enforce uniqueness within the same category (e.g., Minor I vs Minor II)
      // If the same subject is already selected in the peer field of the same category,
      // do not show it again in options for this field.
      if (selected.map(norm).includes(norm(subject))) return false;
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
          const selRg = restrictedBySubject[norm(sel)];
          // Only apply cannot-combine when the other selection has RG in the same category
          if (!selRg || selRg.categoryCode !== norm(categoryCode)) continue;
          if (candidateRg.cannotCombineWith.has(norm(sel))) return false;
        }
      }
      return true;
    });
  };

  // Auto-assign the other Minor when one is selected (if auto-assign subject exists)
  useEffect(() => {
    // When Minor I is selected, auto-assign Minor II if auto-assign subject exists
    if (minor1 && !minor2 && autoMinor1) {
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]);
      // Only auto-assign if the auto-assign subject is available in Minor II options and different from Minor I
      if (options.includes(autoMinor1) && autoMinor1 !== minor1) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, minor2, autoMinor1, admissionMinor2Subjects]);

  useEffect(() => {
    // When Minor II is selected, auto-assign Minor I if auto-assign subject exists
    if (minor2 && !minor1 && autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      // Only auto-assign if the auto-assign subject is available in Minor I options and different from Minor II
      if (options.includes(autoMinor1) && autoMinor1 !== minor2) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, minor1, autoMinor1, admissionMinor1Subjects]);

  // Handle when user changes a Minor that was auto-assigned - move auto-assign to the other dropdown
  useEffect(() => {
    // If Minor I no longer holds the auto-assigned subject, enforce it in Minor II
    if (minor1 && autoMinor1 && minor1 !== autoMinor1) {
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]);
      if (options.includes(autoMinor1)) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, autoMinor1, minor2, admissionMinor2Subjects]);

  useEffect(() => {
    // If Minor II no longer holds the auto-assigned subject, enforce it in Minor I
    if (minor2 && autoMinor1 && minor2 !== autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      if (options.includes(autoMinor1)) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, autoMinor1, minor1, admissionMinor1Subjects]);

  // Debug: Ensure AEC selection never filters out IDC options (cross-category independence)
  useEffect(() => {
    if (!aec3) return;
    const subject = aec3;
    const inSem1 = availableIdcSem1Subjects.includes(subject);
    const inSem2 = availableIdcSem2Subjects.includes(subject);
    const inSem3 = availableIdcSem3Subjects.includes(subject);
    const inMinor1 = admissionMinor1Subjects.includes(subject);
    const inMinor2 = admissionMinor2Subjects.includes(subject);
    // eslint-disable-next-line no-console
    console.log("[SubjectSelection] AEC selected:", subject, {
      presentInIDC1List: inSem1,
      presentInIDC2List: inSem2,
      presentInIDC3List: inSem3,
      presentInMinor1List: inMinor1,
      presentInMinor2List: inMinor2,
    });
  }, [
    aec3,
    availableIdcSem1Subjects,
    availableIdcSem2Subjects,
    availableIdcSem3Subjects,
    admissionMinor1Subjects,
    admissionMinor2Subjects,
  ]);

  const [showTips, setShowTips] = useState(true);
  const [showStudentInfoMobile, setShowStudentInfoMobile] = useState(false);

  // Loading skeleton component for dropdowns
  const LoadingDropdown = ({ label }: { label: string }) => (
    <div className="space-y-2 min-h-[84px]">
      <label className="text-base font-medium text-gray-700">{label}</label>
      <div className="w-full border border-gray-300 rounded-md h-10 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="ml-2 text-base text-gray-500">Loading options...</span>
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

  // Ensure AEC selection does not get filtered out from other categories if it exists in their base lists
  const preserveAecIfPresent = (baseList: string[], filteredList: string[]) => {
    if (!aec3) return filteredList;
    const existsInBase = baseList.includes(aec3);
    if (!existsInBase) return filteredList;
    if (filteredList.includes(aec3)) return filteredList;
    return [...filteredList, aec3];
  };

  // Prevent selecting the same subject across different categories (global uniqueness)
  const getGlobalExcludes = (currentValue: string) => {
    // Do not exclude AEC across categories; allow AEC subjects to appear elsewhere
    return [minor1, minor2, idc1, idc2, idc3, /* aec3, */ cvac4].filter(Boolean).filter((s) => s !== currentValue);
  };

  // Helper function to check if there are actual subject options (excluding placeholder)
  const hasActualOptions = (subjects: string[]) => {
    return subjects.filter((subject) => subject && subject.trim() !== "").length > 0;
  };

  // Transform actualStudentSelections array into the format expected by SavedSelectionsDisplay
  const transformActualSelectionsToDisplayFormat = (actualSelections: any[], metas: any[]) => {
    const result: any = {};

    console.log("🔍 Frontend Debug - transformActualSelectionsToDisplayFormat called with:", {
      actualSelectionsCount: actualSelections.length,
      actualSelections: actualSelections.map((s) => ({
        subjectName: s.subject?.name,
        metaId: s.subjectSelectionMeta?.id,
        metaLabel: s.subjectSelectionMeta?.label,
        fullSelection: s, // Add full selection object for debugging
      })),
      availableMetas: metas.map((m) => ({ id: m.id, label: m.label })),
    });

    for (const selection of actualSelections) {
      const metaId = selection.subjectSelectionMeta?.id;
      const subjectName = selection.subject?.name;

      console.log("🔍 Frontend Debug - Processing selection:", { metaId, subjectName });

      if (!metaId || !subjectName) continue;

      // Find the meta label by looking up the metaId in the metas array
      const meta = metas.find((m) => m.id === metaId);
      const metaLabel = meta?.label;

      console.log("🔍 Frontend Debug - Found meta:", { metaId, metaLabel });

      if (!metaLabel) continue;

      // Map meta labels to the expected format
      if (metaLabel.includes("Minor 1")) {
        result.minor1 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to minor1:", subjectName);
      } else if (metaLabel.includes("Minor 2")) {
        result.minor2 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to minor2:", subjectName);
      } else if (metaLabel.includes("Minor 3")) {
        result.minor2 = subjectName; // Minor 3 maps to minor2 slot
        console.log("🔍 Frontend Debug - Mapped Minor 3 to minor2:", subjectName);
      } else if (metaLabel.includes("IDC 1")) {
        result.idc1 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to idc1:", subjectName);
      } else if (metaLabel.includes("IDC 2")) {
        result.idc2 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to idc2:", subjectName);
      } else if (metaLabel.includes("IDC 3")) {
        result.idc3 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to idc3:", subjectName);
      } else if (metaLabel.includes("AEC")) {
        result.aec3 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to aec3:", subjectName);
      } else if (metaLabel.includes("CVAC")) {
        result.cvac4 = subjectName;
        console.log("🔍 Frontend Debug - Mapped to cvac4:", subjectName);
      }
    }

    console.log("🔍 Frontend Debug - Final transformed result:", result);
    return result;
  };

  // Component to display saved selections in read-only table format
  const SavedSelectionsDisplay = () => {
    console.log("🔍 Frontend Debug - SavedSelectionsDisplay rendering with:", savedSelections);

    return (
      <div className="space-y-6">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-base font-semibold text-green-800">Your Subject Selections</h3>
          </div>
          <p className="text-base text-green-700">
            Your subject selections have been successfully saved. Below are your confirmed selections:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border text-base rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-3 text-left font-semibold text-gray-800 text-base">Subject Category</th>
                <th className="border p-3 text-left font-semibold text-gray-800 text-base">Your Selection</th>
              </tr>
            </thead>
            <tbody>
              {/* Minor I */}
              {savedSelections.minor1 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("MN", "I")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.minor1}</td>
                </tr>
              )}

              {/* Minor II */}
              {savedSelections.minor2 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("MN", "III")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.minor2}</td>
                </tr>
              )}

              {/* IDC 1 */}
              {savedSelections.idc1 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("IDC", "I")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.idc1}</td>
                </tr>
              )}

              {/* IDC 2 */}
              {savedSelections.idc2 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("IDC", "II")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.idc2}</td>
                </tr>
              )}

              {/* IDC 3 */}
              {savedSelections.idc3 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("IDC", "III")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.idc3}</td>
                </tr>
              )}

              {/* AEC 3 */}
              {savedSelections.aec3 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("AEC")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.aec3}</td>
                </tr>
              )}

              {/* CVAC 4 */}
              {savedSelections.cvac4 && (
                <tr className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("CVAC")}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">{savedSelections.cvac4}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Need to make changes?</h4>
              <p className="text-base text-blue-700">
                If you need to modify your subject selections, please contact your academic advisor or administration
                staff. Changes can only be made by authorized personnel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="w-full h-full flex flex-col overflow-visible ">
      {/* Student Information Section - Fixed */}
      {/* <div className="bg-blue-800 shadow-2xl rounded-2xl border-0 p-8 mb-6 flex-shrink-0">
        <h3 className="text-2xl font-semibold text-white mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-7 h-7 text-w hite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-white">Student Information</div>
            <div className="text-blue-100 text-base font-normal">Academic Year 2024-25</div>
          </div>
        </h3>
        <div className="grid grid-cols-5 gap-8">
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Name</label>
            <p className="text-base font-semibold text-white">Dipanwita Sarkar</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">UID</label>
            <p className="text-base font-semibold text-white">0101255656</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Roll Number</label>
            <p className="text-base font-semibold text-white">251000</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Program Course</label>
            <p className="text-base font-semibold text-white">B.A. English (H)</p>
          </div>
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Shift</label>
            <p className="text-base font-semibold text-white">Day</p>
          </div>
        </div>
      </div> */}

      {/* Mobile toggle */}
      {/* <div className="lg:hidden mt-2 mb-2 ">
        <button
          type="button"
          onClick={() => setShowStudentInfoMobile((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-base text-gray-700 bg-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {showStudentInfoMobile ? "Hide" : "Show"} Student Info
        </button>
      </div> */}

      {/* <div
        className={`bg-blue-600 mt-2 mb-4 text-white font-semibold p-2 rounded-lg ${showStudentInfoMobile ? "block" : "hidden"} lg:block`}
      >
        <div className="flex items-center gap-2 justify-between py-2 mb-3 text-xl border-b">
          <div className="text-white">Student Information</div>
          
        </div>
        <div className="grid grid-cols-5 gap-8">
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Name</label>
            <p className="text-base font-semibold text-white">{user?.name}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">UID</label>
            <p className="text-base font-semibold text-white">{student?.uid}</p>
          </div>
          
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Roll Number</label>
            <p className="text-base font-semibold text-white">{student?.currentPromotion?.rollNumber}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Program Course</label>
            <p className="text-base font-semibold text-white">{student?.currentPromotion?.programCourse?.name}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Shift</label>
            <p className="text-base font-semibold text-white">{student?.shift?.name}</p>
          </div>
        </div>
      </div> */}

      {/* Form Section */}
      <div className="flex-1 overflow-visible">
        <div className="shadow-lg rounded-xl bg-white  md:mt-0 p-6 border border-gray-100 min-h-[calc(100%-1rem)]">
          {/* Mobile notes banner */}
          <div className="lg:hidden">
            {showTips && (
              <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="text-base">
                  Before selecting subjects, please review the guidelines. Tap the info button to view notes.
                </div>
                <button className="ml-auto text-xs underline" onClick={() => setShowTips(false)}>
                  Dismiss
                </button>
              </div>
            )}
            {/* <button
              type="button"
              onClick={() => openNotes?.()}
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-base text-gray-700 hover:bg-gray-50"
            >
              <Info className="w-4 h-4" /> View Notes
            </button> */}
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-8">
              {hasExistingSelections
                ? "Your Subject Selections - Already Saved"
                : step === 1
                  ? "Semester-wise Subject Selection for Calcutta University Registration"
                  : "Preview Your Selections"}
            </h2>

            {/* Combined Academic Information and Guidance Notes */}
            {student?.currentPromotion && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
                {/* Guidance Notes - Only in step 1 for new selections */}
                {step === 1 && !hasExistingSelections && (
                  <div className="flex items-start gap-3 border-blue-200">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base leading-relaxed">
                        Before selecting your subjects, please read the following notes carefully to ensure clarity on
                        the selection process. These notes are provided here for your reference and guidance.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-gray-600 text-base">
              {step === 1 && !hasExistingSelections ? (
                <>
                  {/* <div className="border border-blue-200 rounded-lg p-3 transition-all duration-300 hover:border-blue-400">
                    <h4 className="font-semibold text-blue-800 mb-2 text-base bg-blue-50 px-2 py-1 rounded inline-block">
                      Before You Begin
                    </h4>
                    <p className="text-blue-700 text-base leading-relaxed">
                      Before selecting your subjects, please read the following notes carefully to ensure clarity on the
                      selection process. These notes are provided here for your reference and guidance.
                    </p>
                  </div> */}
                </>
              ) : step === 1 && hasExistingSelections ? (
                "Your subject selections have been successfully saved and are displayed below. No further action is required."
              ) : step === 2 ? (
                "Review and confirm declarations before saving"
              ) : (
                ""
              )}
            </p>
            {loading && !hasExistingSelections && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-base">Loading subject options...</span>
              </div>
            )}
            {loadError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-base">
                    {hasExistingSelections
                      ? `Error loading your saved selections: ${loadError}`
                      : `Error loading subjects: ${loadError}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {step === 1 && !hasExistingSelections && (
            <div className="grid grid-cols-1 gap-3">
              {/* Removed: Available Paper Options preview */}
              {/* Minor Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                  <>
                    <LoadingDropdown label={getDynamicLabel("MN", "I")} />
                    <LoadingDropdown label={getDynamicLabel("MN", "III")} />
                  </>
                ) : (
                  <>
                    {hasActualOptions(admissionMinor1Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                        <label className="text-base font-medium text-gray-700">{getDynamicLabel("MN", "I")}</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            preserveAecIfPresent(
                              admissionMinor1Subjects,
                              getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]),
                            ),
                            getGlobalExcludes(minor1),
                          )}
                          value={minor1}
                          onChange={(value) => handleFieldChange(setMinor1, value, "minor1")}
                          placeholder="Select Minor I"
                          className="w-full"
                        />
                      </div>
                    )}

                    {hasActualOptions(admissionMinor2Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                        <label className="text-base font-medium text-gray-700">{getDynamicLabel("MN", "III")}</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            preserveAecIfPresent(
                              admissionMinor2Subjects,
                              getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]),
                            ),
                            getGlobalExcludes(minor2),
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
                <LoadingDropdown label={getDynamicLabel("AEC")} />
              ) : hasActualOptions(availableAecSubjects) ? (
                <div className="space-y-2" onClick={() => handleFieldFocus("aec")}>
                  <label className="text-base font-medium text-gray-700">{getDynamicLabel("AEC")}</label>
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
                    <LoadingDropdown label={getDynamicLabel("IDC", "I")} />
                    <LoadingDropdown label={getDynamicLabel("IDC", "II")} />
                    <LoadingDropdown label={getDynamicLabel("IDC", "III")} />
                  </>
                ) : (
                  <>
                    {hasActualOptions(availableIdcSem1Subjects) && (
                      <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("idc")}>
                        <label className="text-base font-medium text-gray-700">{getDynamicLabel("IDC", "I")}</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            preserveAecIfPresent(
                              availableIdcSem1Subjects,
                              getFilteredByCategory(
                                getFilteredIdcOptions(availableIdcSem1Subjects, idc1),
                                idc1,
                                "IDC",
                                "I",
                              ),
                            ),
                            getGlobalExcludes(idc1),
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
                        <label className="text-base font-medium text-gray-700">{getDynamicLabel("IDC", "II")}</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            preserveAecIfPresent(
                              availableIdcSem2Subjects,
                              getFilteredByCategory(
                                getFilteredIdcOptions(availableIdcSem2Subjects, idc2),
                                idc2,
                                "IDC",
                                "II",
                              ),
                            ),
                            getGlobalExcludes(idc2),
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
                        <label className="text-base font-medium text-gray-700">{getDynamicLabel("IDC", "III")}</label>
                        <Combobox
                          dataArr={convertToComboboxData(
                            preserveAecIfPresent(
                              availableIdcSem3Subjects,
                              getFilteredByCategory(
                                getFilteredIdcOptions(availableIdcSem3Subjects, idc3),
                                idc3,
                                "IDC",
                                "III",
                              ),
                            ),
                            getGlobalExcludes(idc3),
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
                <LoadingDropdown label={getDynamicLabel("CVAC")} />
              ) : hasActualOptions(availableCvacOptions) ? (
                <div className="space-y-2" onClick={() => handleFieldFocus("cvac")}>
                  <label className="text-base font-medium text-gray-700">{getDynamicLabel("CVAC")}</label>
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

          {step === 1 && hasExistingSelections && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading your saved selections...</span>
                  </div>
                </div>
              ) : (
                <SavedSelectionsDisplay />
              )}
            </>
          )}

          {step === 2 && !hasExistingSelections && (
            <>
              {/* Errors (should be none here, but guard just in case) */}
              {errors.length > 0 && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
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
                  <table className="w-full border text-base rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-3 text-left font-semibold text-gray-800 text-base">Subject Category</th>
                        <th className="border p-3 text-left font-semibold text-gray-800 text-base">Selection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Minor I - Always show if there are subjects available */}
                      {admissionMinor1Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {getDynamicLabel("MN", "I")}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{minor1 || "-"}</td>
                        </tr>
                      )}

                      {/* Minor II - Always show if there are subjects available */}
                      {admissionMinor2Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {getDynamicLabel("MN", "III")}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{minor2 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 1 - Only show if there are subjects available */}
                      {availableIdcSem1Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {getDynamicLabel("IDC", "I")}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{idc1 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 2 - Only show if there are subjects available */}
                      {availableIdcSem2Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {getDynamicLabel("IDC", "II")}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{idc2 || "-"}</td>
                        </tr>
                      )}

                      {/* IDC 3 - Only show if there are subjects available */}
                      {availableIdcSem3Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {getDynamicLabel("IDC", "III")}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{idc3 || "-"}</td>
                        </tr>
                      )}

                      {/* AEC 3 - Only show if there are subjects available */}
                      {availableAecSubjects.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("AEC")}</td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{aec3 || "-"}</td>
                        </tr>
                      )}

                      {/* CVAC 4 - Only show if there are subjects available */}
                      {availableCvacOptions.length > 0 && (
                        <tr className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">{getDynamicLabel("CVAC")}</td>
                          <td className="border p-3 text-gray-800 font-medium text-base">{cvac4 || "-"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Status Messages */}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base font-medium">Subject selections saved successfully!</span>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-base font-medium">Error saving selections: {saveError}</span>
                  </div>
                </div>
              )}

              {/* Declarations */}
              {errors.length === 0 && (
                <div className="space-y-3 text-base text-gray-700 bg-gray-50 p-3 rounded-lg">
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
              <ul className="list-disc list-inside space-y-1 text-base">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-blocking Minor mismatch notice */}
          {step === 1 && minorMismatch && (
            <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-lg shadow-sm">
              <div>
                Your current Minor I and II subject combination is different from the one you had selected at the time
                of admission.
              </div>
              <div className="mt-1 text-base">
                Previously saved: <span className="font-semibold">{earlierMinorSelections[0] || "-"}</span> and{" "}
                <span className="font-semibold">{earlierMinorSelections[1] || "-"}</span>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show when selections are not already saved */}
          {!hasExistingSelections && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              {step === 1 && (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed  font-medium shadow-sm text-base flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Loading..." : "Next"}
                </button>
              )}
              {step === 2 && (
                <>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50  font-medium text-gray-700 text-base"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!agree1 || !agree2 || !agree3 || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50  font-medium shadow-sm text-base flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Removed modal preview - now handled inline in Step 2 */}
    </div>
  );
}
