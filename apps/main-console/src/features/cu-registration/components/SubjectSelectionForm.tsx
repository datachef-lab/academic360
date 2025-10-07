"use client";
import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
  fetchStudentSubjectSelections,
  PaperDto,
  SubjectSelectionMetaDto,
  StudentSubjectSelectionGroupDto,
  AdminStudentSubjectSelectionForSave,
  saveStudentSubjectSelectionsAdmin,
} from "@/services/student-subject-selection";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";

interface SubjectSelectionFormProps {
  uid: string;
  onStatusChange?: (status: { hasExistingSelections: boolean }) => void;
}

export default function SubjectSelectionForm({ uid, onStatusChange }: SubjectSelectionFormProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const [student, setStudent] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New state for meta data and saving
  const [subjectSelectionMetas, setSubjectSelectionMetas] = useState<SubjectSelectionMetaDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasExistingSelections, setHasExistingSelections] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ id: number } | null>(null);
  const [reason, setReason] = useState(""); // Reason for admin changes
  const [groups, setGroups] = useState<StudentSubjectSelectionGroupDto[]>([]); // Store groups for subject ID lookup

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

  // Auto-assign subjects per category/semester (from API flag)
  const [autoMinor1, setAutoMinor1] = useState<string>("");

  // Helper: safely check autoAssign flag without using 'any'
  const isAutoAssigned = (p: unknown): boolean => {
    const obj = p as { autoAssign?: boolean } | null | undefined;
    return Boolean(obj && obj.autoAssign === true);
  };

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

        // Set meta data from the response
        setSubjectSelectionMetas(resp.subjectSelectionMetas || []);

        // Set session information
        setCurrentSession(resp.session || null);

        const groups = resp.studentSubjectsSelection ?? [];
        setGroups(groups);

        // Check if student has actually submitted selections through the form
        const hasExisting = resp.hasFormSubmissions || false;
        setHasExistingSelections(hasExisting);
        if (onStatusChange) {
          try {
            onStatusChange({ hasExistingSelections: hasExisting });
          } catch {
            // noop: best-effort notify parent
          }
        }

        // Auto-populate existing selections if they exist
        if (hasExisting && resp.actualStudentSelections && resp.actualStudentSelections.length > 0) {
          type ActualSelection = {
            subjectSelectionMeta?: { id?: number; label?: string | null } | null;
            subject?: { id?: number; name?: string | null } | null;
          };

          const isActualSelection = (x: unknown): x is ActualSelection => {
            if (typeof x !== "object" || x === null) return false;
            const s = x as Record<string, unknown>;
            const meta = s["subjectSelectionMeta"];
            const subj = s["subject"];
            const okMeta = meta === undefined || meta === null || typeof meta === "object";
            const okSubj = subj === undefined || subj === null || typeof subj === "object";
            return okMeta && okSubj;
          };

          const existingSelections = (resp.actualStudentSelections as unknown[]).filter(isActualSelection);
          console.log("Auto-populating existing selections:", existingSelections);

          // Transform and populate form fields with existing selections
          for (const selection of existingSelections) {
            const metaId = selection.subjectSelectionMeta?.id ?? undefined;
            const subjectName = selection.subject?.name ?? undefined;

            if (!metaId || !subjectName) continue;

            // Find the meta label by looking up the metaId in the metas array
            const meta = resp.subjectSelectionMetas?.find((m) => m.id === metaId);
            const metaLabel = meta?.label;

            if (!metaLabel) continue;

            // Map meta labels to form fields
            if (metaLabel.includes("Minor 1")) {
              setMinor1(subjectName);
            } else if (metaLabel.includes("Minor 2") || metaLabel.includes("Minor 3")) {
              setMinor2(subjectName);
            } else if (metaLabel.includes("IDC 1")) {
              setIdc1(subjectName);
            } else if (metaLabel.includes("IDC 2")) {
              setIdc2(subjectName);
            } else if (metaLabel.includes("IDC 3")) {
              setIdc3(subjectName);
            } else if (metaLabel.includes("AEC")) {
              setAec3(subjectName);
            } else if (metaLabel.includes("CVAC")) {
              setCvac4(subjectName);
            }
          }
        }

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

        // Capture first auto-assign subject for Minors (if any)
        const firstOrEmpty = (arr: string[]) => (arr.length > 0 ? arr[0] : "");
        const autoMinor1List = dedupe(
          (minorGroup?.paperOptions || [])
            .filter((p) => isAutoAssigned(p) && (isSem(p, "I") || isSem(p, "II")))
            .map(getLabel),
        );
        // No separate auto-assign for Minor II; enforce single mandatory subject presence
        setAutoMinor1(firstOrEmpty(autoMinor1List) || "");

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
          const targetKey = norm(target);
          // Merge multiple RGs per target/category and enforce symmetry
          if (!rgMap[targetKey]) {
            rgMap[targetKey] = { semesters, cannotCombineWith: new Set<string>(), categoryCode: code };
          }
          for (const c of cannot) rgMap[targetKey].cannotCombineWith.add(c);

          for (const c of cannot) {
            if (!c) continue;
            if (!rgMap[c]) {
              rgMap[c] = { semesters, cannotCombineWith: new Set<string>(), categoryCode: code };
            }
            rgMap[c].cannotCombineWith.add(targetKey);
          }

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

  // Mark user interaction when they start selecting fields
  const handleFieldChange = (setter: (value: string) => void, value: string, fieldType: string) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    // Move auto-assigned subject (e.g., Mathematics) to the other Minor when it is replaced
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

  // Helper function to get dynamic label from meta data
  const getDynamicLabel = (subjectTypeCode: string, semester?: string): string => {
    const extractSemesterRoman = (name?: string | null): string => {
      if (!name) return "";
      const upper = String(name).toUpperCase();
      const match = upper.match(/\b(I|II|III|IV|V|VI)\b/);
      return match ? match[1] : "";
    };
    const meta = subjectSelectionMetas.find((m) => {
      if (m.subjectType.code !== subjectTypeCode) return false;
      if (!semester) return true;
      return m.forClasses.some((c) => extractSemesterRoman(c.class?.name) === semester);
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

  // Create selections array for saving with fresh meta data
  const createSelectionsForSave = (): AdminStudentSubjectSelectionForSave[] => {
    const selectionsToSave: AdminStudentSubjectSelectionForSave[] = [];

    if (!student?.id || !subjectSelectionMetas.length || !currentSession?.id) {
      return selectionsToSave;
    }

    // Helper function to find subject ID by name
    const findSubjectId = (subjectName: string): number | null => {
      for (const group of groups) {
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

      const extractSemesterRoman = (name?: string | null): string => {
        if (!name) return "";
        const upper = String(name).toUpperCase();
        const match = upper.match(/\b(I|II|III|IV|V|VI)\b/);
        return match ? match[1] : "";
      };

      const meta = subjectSelectionMetas.find((m) => {
        if (m.subjectType.code !== subjectTypeCode) return false;

        // Check if the meta applies to the student's stream
        if (studentStreamId && m.streams.length > 0) {
          const hasMatchingStream = m.streams.some((s) => s.stream?.id === studentStreamId);
          if (!hasMatchingStream) return false;
        }

        // For semester-specific matching, check if the meta applies to the semester
        if (semester && m.forClasses.length > 0) {
          return m.forClasses.some((c) => extractSemesterRoman(c.class?.name) === semester);
        }

        return true;
      });
      return meta?.id || null;
    };

    // Add Minor 1 selection
    if (minor1) {
      const subjectId = findSubjectId(minor1);
      const metaId = findMetaId("MN", "I");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor1 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    // Add Minor 2 selection
    if (minor2) {
      const subjectId = findSubjectId(minor2);
      const metaId = findMetaId("MN", "III");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: minor2 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    // Add IDC selections
    if (idc1) {
      const subjectId = findSubjectId(idc1);
      const metaId = findMetaId("IDC", "I");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc1 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    if (idc2) {
      const subjectId = findSubjectId(idc2);
      const metaId = findMetaId("IDC", "II");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc2 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    if (idc3) {
      const subjectId = findSubjectId(idc3);
      const metaId = findMetaId("IDC", "III");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: idc3 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    // Add AEC selection
    if (aec3) {
      const subjectId = findSubjectId(aec3);
      const metaId = findMetaId("AEC", "III");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: aec3 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    // Add CVAC selection
    if (cvac4) {
      const subjectId = findSubjectId(cvac4);
      const metaId = findMetaId("CVAC", "II");
      if (subjectId && metaId) {
        selectionsToSave.push({
          studentId: student.id,
          session: { id: currentSession.id },
          subjectSelectionMeta: { id: metaId },
          subject: { id: subjectId, name: cvac4 },
          createdBy: 1, // TODO: Get actual admin user ID
          reason: reason || "Admin update",
        });
      }
    }

    return selectionsToSave;
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const selectionsToSave = createSelectionsForSave();
      console.log("Saving selections:", selectionsToSave);

      const result = await saveStudentSubjectSelectionsAdmin(selectionsToSave);

      if (result.success) {
        setSaveSuccess(true);
        console.log("Selections saved successfully:", result.data);

        // Play success sound
        try {
          const audioContext = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

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
      } else {
        setSaveError("Validation failed: " + (result.errors?.map((e) => e.message).join(", ") || "Unknown error"));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save selections";
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Filter out Minor subjects from IDC options (per list)
  const getFilteredIdcOptions = (sourceList: string[], currentIdcValue: string) => {
    return sourceList.filter((subject) => {
      const uniqueWithinIdc = subject === currentIdcValue || (subject !== idc1 && subject !== idc2 && subject !== idc3);
      const notSameAsMinor = subject !== minor1 && subject !== minor2;
      return uniqueWithinIdc && notSameAsMinor;
    });
  };

  const getFilteredByCategory = useCallback(
    (sourceList: string[], currentValue: string, categoryCode: string, contextSemester?: string | string[]) => {
      const norm = (s: string) =>
        String(s || "")
          .trim()
          .toUpperCase();
      const applyRules = Boolean(restrictedCategories[norm(categoryCode)]);
      return sourceList.filter((subject) => {
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

        // Enforce uniqueness within same category: hide already-picked peer subject
        if (selected.map(norm).includes(norm(subject))) return false;

        if (!applyRules) {
          // No RG defined for this category; allow default dedupe logic by caller
          return true;
        }
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
            if (!selRg || selRg.categoryCode !== norm(categoryCode)) continue;
            if (candidateRg.cannotCombineWith.has(norm(sel))) return false;
          }
        }
        return true;
      });
    },
    [restrictedCategories, restrictedBySubject, minor1, minor2, idc1, idc2, idc3, aec3, cvac4],
  );

  // Auto-assign the other Minor with the mandatory auto-assigned subject when one is selected
  useEffect(() => {
    if (minor1 && !minor2 && autoMinor1) {
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]);
      if (options.includes(autoMinor1) && autoMinor1 !== minor1) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, minor2, autoMinor1, admissionMinor2Subjects, getFilteredByCategory]);

  useEffect(() => {
    if (minor2 && !minor1 && autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      if (options.includes(autoMinor1) && autoMinor1 !== minor2) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, minor1, autoMinor1, admissionMinor1Subjects, getFilteredByCategory]);

  // Enforce that auto-assigned subject is always present by moving it to the other Minor when replaced
  useEffect(() => {
    if (autoMinor1 && minor1 && minor1 !== autoMinor1) {
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", ["III", "IV"]);
      if (options.includes(autoMinor1)) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, autoMinor1, minor2, admissionMinor2Subjects, getFilteredByCategory]);

  useEffect(() => {
    if (autoMinor1 && minor2 && minor2 !== autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      if (options.includes(autoMinor1)) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, autoMinor1, minor1, admissionMinor1Subjects, getFilteredByCategory]);

  // Auto-fade success message after 2 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

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

  // Ensure AEC selection does not get filtered out from other categories if it exists in their base lists
  const preserveAecIfPresent = (baseList: string[], filteredList: string[]) => {
    if (!aec3) return filteredList;
    const existsInBase = baseList.includes(aec3);
    if (!existsInBase) return filteredList;
    if (filteredList.includes(aec3)) return filteredList;
    return [...filteredList, aec3];
  };

  // Build a global exclusion list so the same subject cannot be selected in any other category
  const getGlobalExcludes = (currentValue: string) => {
    // Do not exclude AEC across categories; allow AEC subjects to appear elsewhere
    return [minor1, minor2, idc1, idc2, idc3, /* aec3, */ cvac4].filter(Boolean).filter((s) => s !== currentValue);
  };

  // Helper function to check if there are actual subject options (excluding placeholder)
  const hasActualOptions = (subjects: string[]) => {
    return subjects.filter((subject) => subject && subject.trim() !== "").length > 0;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Form Section - No Scrolling */}
      <div className="flex-1 overflow-hidden">
        <div className="shadow-lg rounded-xl bg-white p-6 border border-gray-100 h-full overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-8">
              {hasExistingSelections
                ? "Update Student Subject Selections (Admin)"
                : "Create Student Subject Selections (Admin)"}
            </h2>

            <p className="text-gray-600 text-sm">
              {hasExistingSelections
                ? "Existing selections are pre-populated below. Make your changes and save to update."
                : "Select subjects for this student. All validation rules apply as in the student console."}
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

          <div className="grid grid-cols-1 gap-4">
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
                        placeholder="Select Minor II"
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
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-700">{getDynamicLabel("CVAC")}</label>
                <Combobox
                  dataArr={convertToComboboxData(availableCvacOptions, getGlobalExcludes(cvac4))}
                  value={cvac4}
                  onChange={(value) => handleFieldChange(setCvac4, value, "cvac4")}
                  placeholder="Select CVAC 4"
                  className="w-full"
                />
              </div>
            ) : null}

            <div className="space-y-2">{/* Empty space for grid alignment */}</div>
          </div>

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

          {/* Reason for Change (Admin only) */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Reason for Change/Update (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this change (e.g., Student request, Academic requirement, etc.)"
              className="w-full p-3 border border-gray-300 rounded-md text-base"
              rows={3}
            />
          </div>

          {/* Inline errors */}
          {errors.length > 0 && (
            <div id="form-error" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <ul className="list-disc list-inside space-y-1 text-base">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-blocking Minor mismatch notice */}
          {minorMismatch && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg">
              <div>
                The current Minor I and II subject combination is different from the one selected at the time of
                admission.
              </div>
              <div className="mt-1 text-base">
                Previously saved: <span className="font-semibold">{earlierMinorSelections[0] || "-"}</span> and{" "}
                <span className="font-semibold">{earlierMinorSelections[1] || "-"}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm text-base flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : hasExistingSelections ? "Update Selections" : "Save Selections"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
