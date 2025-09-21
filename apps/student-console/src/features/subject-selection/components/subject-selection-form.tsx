"use client";
import React, { useState, useEffect } from "react";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchStudentSubjectSelections, StudentSubjectSelectionDto, PaperDto } from "@/services/subject-selection";
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

  const [selections, setSelections] = useState<StudentSubjectSelectionDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // Load paper options from backend
  useEffect(() => {
    const run = async () => {
      if (!student?.id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const resp = await fetchStudentSubjectSelections(student.id);
        console.log("subject-selection-form data", resp);

        const groups = resp.studentSubjectsSelection ?? [];
        setSelections(groups);

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
          rgMap[norm(target)] = { semesters, cannotCombineWith: cannot, categoryCode: code };
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

    const shouldAskForAec = availableAecSubjects.length > 0;
    const shouldAskForCvac = availableCvacOptions.length > 0;

    // Required field validation - create individual error messages
    if (!minor1) newErrors.push("Minor I subject is required");
    if (admissionMinor2Subjects.length > 0 && !minor2) newErrors.push("Minor II subject is required");
    if (!idc1) newErrors.push("IDC 1 subject is required");
    if (!idc2) newErrors.push("IDC 2 subject is required");
    if (!idc3) newErrors.push("IDC 3 subject is required");
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

  const [showTips, setShowTips] = useState(true);
  const [showStudentInfoMobile, setShowStudentInfoMobile] = useState(false);

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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden ">
      {/* Student Information Section - Fixed */}
      {/* <div className="bg-blue-800 shadow-2xl rounded-2xl border-0 p-8 mb-6 flex-shrink-0">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
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
            <div className="text-blue-100 text-sm font-normal">Academic Year 2024-25</div>
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
            <p className="text-base font-bold text-white">Dipanwita Sarkar</p>
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
            <p className="text-base font-bold text-white">0101255656</p>
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
            <p className="text-base font-bold text-white">251000</p>
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
            <p className="text-base font-bold text-white">B.A. English (H)</p>
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
            <p className="text-base font-bold text-white">Day</p>
          </div>
        </div>
      </div> */}

      {/* Mobile toggle */}
      {/* <div className="lg:hidden mt-2 mb-2 ">
        <button
          type="button"
          onClick={() => setShowStudentInfoMobile((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm text-gray-700 bg-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {showStudentInfoMobile ? "Hide" : "Show"} Student Info
        </button>
      </div> */}

      {/* <div
        className={`bg-blue-600 mt-2 mb-4 text-white font-bold p-2 rounded-lg ${showStudentInfoMobile ? "block" : "hidden"} lg:block`}
      >
        <div className="flex items-center gap-2 justify-between py-2 mb-3 text-xl border-b">
          <div className="text-white">Student Information</div>
          
        </div>
        <div className="grid grid-cols-5 gap-8">
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Name</label>
            <p className="text-base font-bold text-white">{user?.name}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">UID</label>
            <p className="text-base font-bold text-white">{student?.uid}</p>
          </div>
          
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Roll Number</label>
            <p className="text-base font-bold text-white">{student?.currentPromotion?.rollNumber}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Program Course</label>
            <p className="text-base font-bold text-white">{student?.currentPromotion?.programCourse?.name}</p>
          </div>
          <div className="space-y-3 text-center">
            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wide block">Shift</label>
            <p className="text-base font-bold text-white">{student?.shift?.name}</p>
          </div>
        </div>
      </div> */}

      {/* Form Section - No Scrolling */}
      <div className="flex-1 overflow-hidden">
        <div className="shadow-lg rounded-xl bg-white mt-6 md:mt-0 p-6 border border-gray-100 h-full overflow-y-auto">
          {/* Mobile notes banner */}
          <div className="lg:hidden">
            {showTips && (
              <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="text-sm">
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
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            >
              <Info className="w-4 h-4" /> View Notes
            </button> */}
          </div>
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
                    {/* <button className="ml-auto text-xs underline" onClick={() => setShowTips(false)}>
                      Dismiss
                    </button> */}
                  </div>
                  {/* <div className="border border-blue-200 rounded-lg p-3 transition-all duration-300 hover:border-blue-400">
                    <h4 className="font-bold text-blue-800 mb-2 text-sm bg-blue-50 px-2 py-1 rounded inline-block">
                      Before You Begin
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Before selecting your subjects, please read the following notes carefully to ensure clarity on the
                      selection process. These notes are provided here for your reference and guidance.
                    </p>
                  </div> */}
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
              {/* Removed: Available Paper Options preview */}
              {/* Minor Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                  <>
                    <LoadingDropdown label="Minor I (Semester I & II)" />
                    <LoadingDropdown label="Minor II (Semester III & IV)" />
                  </>
                ) : (
                  <>
                    <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                      <label className="text-sm font-semibold text-gray-700">Minor I (Semester I & II)</label>
                      <Combobox
                        dataArr={convertToComboboxData(
                          getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]),
                          [minor2],
                        )}
                        value={minor1}
                        onChange={(value) => handleFieldChange(setMinor1, value, "minor1")}
                        placeholder="Select Minor I"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2 min-h-[84px]" onClick={() => handleFieldFocus("minor")}>
                      <label className="text-sm font-semibold text-gray-700">Minor II (Semester III & IV)</label>
                      <Combobox
                        dataArr={convertToComboboxData(
                          getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]),
                          [minor1],
                        )}
                        value={minor2}
                        onChange={(value) => handleFieldChange(setMinor2, value, "minor2")}
                        placeholder="Select Minor II"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {loading ? (
                <LoadingDropdown label="AEC (Semester III & IV)" />
              ) : availableAecSubjects.length > 0 ? (
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
                  </>
                )}
              </div>

              {/* CVAC Subjects */}

              {loading ? (
                <LoadingDropdown label="CVAC 4 (Semester II)" />
              ) : availableCvacOptions.length > 0 ? (
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
                          <td className="border p-2 font-medium text-gray-700">Minor I (Semester I & II)</td>
                          <td className="border p-2 text-gray-800">{minor1 || "-"}</td>
                        </tr>
                      )}

                      {/* Minor II - Always show if there are subjects available */}
                      {admissionMinor2Subjects.length > 0 && (
                        <tr className="hover:bg-gray-50">
                          <td className="border p-2 font-medium text-gray-700">Minor II (Semester III & IV)</td>
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

      {/* Removed modal preview - now handled inline in Step 2 */}
    </div>
  );
}
