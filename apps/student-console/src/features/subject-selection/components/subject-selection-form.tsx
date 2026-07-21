"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fetchStudentSubjectSelections,
  StudentSubjectSelectionGroupDto,
  PaperDto,
  PerMetaOptionsDto,
  saveStudentSubjectSelections,
  SubjectSelectionMetaDto,
  StudentSubjectSelectionForSave,
} from "@/services/subject-selection";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";

/**
 * One dropdown, derived from one subject-selection meta. The server decides
 * which metas apply to this student (stream / program course / academic year)
 * and which subjects each offers, so the form no longer hardcodes
 * minor1/minor2/idc1/... slots.
 */
interface MetaView {
  metaId: number;
  label: string;
  /** Subject-type code, upper-cased: MN / IDC / AEC / CVAC. */
  code: string;
  sequence: number;
  /** Semester romans, used as the restricted-grouping context. */
  semesters: string[];
  /** Selectable subject names, in server order. */
  options: string[];
  subjectIdByName: Record<string, number>;
  /** Subjects that must end up selected somewhere in this category. */
  autoAssignSubjects: string[];
}

const romanMap: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
};

function extractSemesterRoman(name?: string | null): string {
  if (!name) return "";
  const upper = String(name).toUpperCase();
  const romanMatch = upper.match(/\b(I|II|III|IV|V|VI)\b/);
  if (romanMatch) return romanMatch[1];
  const digitMatch = upper.match(/\b([1-6])\b/);
  if (digitMatch) return romanMap[digitMatch[1]] || "";
  return "";
}

/** Builds the dropdown list from the server's per-meta options. */
function toMetaViews(perMetaOptions: PerMetaOptionsDto[]): MetaView[] {
  return perMetaOptions
    .map((m) => {
      const options: string[] = [];
      const subjectIdByName: Record<string, number> = {};
      const autoAssignSubjects: string[] = [];
      for (const o of m.options ?? []) {
        if (!o?.subjectName) continue;
        if (!(o.subjectName in subjectIdByName)) {
          subjectIdByName[o.subjectName] = o.subjectId;
          options.push(o.subjectName);
        }
        if (o.autoAssign && !autoAssignSubjects.includes(o.subjectName)) {
          autoAssignSubjects.push(o.subjectName);
        }
      }
      return {
        metaId: m.metaId,
        label: m.metaLabel,
        code: (m.subjectTypeCode ?? "").toUpperCase(),
        sequence: m.sequence ?? 0,
        semesters: Array.from(new Set((m.classNames ?? []).map(extractSemesterRoman))).filter(
          Boolean,
        ),
        options,
        subjectIdByName,
        autoAssignSubjects,
      };
    })
    .sort((a, b) => a.sequence - b.sequence || a.metaId - b.metaId);
}

/** MN -> "minor" etc, for the document-highlight scroll target. */
const focusTargetFor = (code: string) =>
  code === "MN" ? "minor" : code === "IDC" ? "idc" : code === "AEC" ? "aec" : "cvac";

export default function SubjectSelectionForm({
  openNotes,
  onVisibleCategoriesChange,
}: {
  openNotes?: () => void;
  onVisibleCategoriesChange?: (categories: {
    minor?: boolean;
    idc?: boolean;
    aec?: boolean;
    cvac?: boolean;
  }) => void;
}) {
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
  /**
   * Saved (read-only) selections, keyed by meta id. The label is stored with
   * the row so a meta the server no longer returns can still be displayed.
   */
  // A single meta can hold multiple saved subjects (e.g. "Minor 2 (Sem III &
  // IV)" carries one Sem III subject AND one Sem IV subject). Storing a list
  // preserves both; earlier code kept a single `subject` and silently dropped
  // all but the last one during hydrate.
  const [savedSelections, setSavedSelections] = useState<
    Record<number, { label: string; subjects: string[] }>
  >({});
  const [currentSession, setCurrentSession] = useState<{ id: number } | null>(null);

  // Meta-driven form state: one dropdown per meta, selections keyed by meta id.
  const [metaViews, setMetaViews] = useState<MetaView[]>([]);
  const [selectionsByMeta, setSelectionsByMeta] = useState<Record<number, string>>({});

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

  const setSelection = (metaId: number, value: string) =>
    setSelectionsByMeta((prev) => ({ ...prev, [metaId]: value }));

  /** Metas that actually have something to offer — these are the dropdowns. */
  const visibleMetas = useMemo(() => metaViews.filter((v) => v.options.length > 0), [metaViews]);

  /** Consecutive metas of the same subject type render together on one row. */
  const metaRows = useMemo(() => {
    const rows: MetaView[][] = [];
    for (const v of visibleMetas) {
      const last = rows[rows.length - 1];
      if (last && last[0].code === v.code) last.push(v);
      else rows.push([v]);
    }
    return rows;
  }, [visibleMetas]);

  // Load paper options and meta data from backend
  useEffect(() => {
    const run = async () => {
      if (!student?.id) return;
      setLoading(true);
      setLoadError(null);
      try {
        // Fetch data including meta data in single API call
        const resp = await fetchStudentSubjectSelections(student.id);

        // Set meta data from the response
        setSubjectSelectionMetas(resp.subjectSelectionMetas || []);

        // Set session information
        setCurrentSession(resp.session || null);

        const groups = resp.studentSubjectsSelection ?? [];
        setSelections(groups);

        // Check if student has actually submitted selections through the form
        const hasExisting = resp.hasFormSubmissions || false;
        console.log("🔍 Debug - hasFormSubmissions:", hasExisting);
        console.log("🔍 Debug - actualStudentSelections:", resp.actualStudentSelections);
        setHasExistingSelections(hasExisting);

        // If student has existing form submissions, populate the saved selections for display
        if (hasExisting) {
          console.log("🔍 Debug - Processing existing selections");
          const savedSelectionsData: typeof savedSelections = {};

          // Extract saved selections from actualStudentSelections
          const actualSelections = resp.actualStudentSelections || [];
          console.log("🔍 Debug - actualSelections:", actualSelections);

          // Transform actualStudentSelections array into the format expected by SavedSelectionsDisplay
          const transformedSelections = transformActualSelectionsToDisplayFormat(actualSelections);
          console.log("🔍 Debug - transformedSelections:", transformedSelections);
          setSavedSelections(transformedSelections);
        }

        // The dropdowns and their options come straight from the server now:
        // one entry per applicable meta, already scoped to this student's
        // stream / program course and the meta's own semesters, and already
        // filtered by the 12th-board eligibility rules.
        setMetaViews(toMetaViews(resp.perMetaOptions ?? []));

        const minorGroup = groups.find(
          (g) =>
            (g.subjectType?.name ?? "").toUpperCase().includes("MINOR") ||
            (g.subjectType?.code ?? "").toUpperCase() === "MN",
        );

        // Load restricted groupings and build quick lookup by target subject name
        const programCourseId = student?.currentPromotion?.programCourse?.id as number | undefined;
        const rgs = await fetchRestrictedGroupings({
          page: 1,
          pageSize: 200,
          programCourseId,
          studentId: student?.id,
        });
        const norm = (s: string) =>
          String(s || "")
            .trim()
            .toUpperCase();
        const rgMap: Record<
          string,
          { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }
        > = {};
        const rgById: Record<
          number,
          { semesters: string[]; cannotCombineIds: Set<number>; categoryCode: string }
        > = {};
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
            rgMap[targetKey] = {
              semesters,
              cannotCombineWith: new Set<string>(),
              categoryCode: code,
            };
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

  // Track visible categories and notify parent component
  useEffect(() => {
    if (!onVisibleCategoriesChange) return;
    const hasCode = (code: string) => visibleMetas.some((v) => v.code === code);
    onVisibleCategoriesChange({
      minor: hasCode("MN"),
      idc: hasCode("IDC"),
      aec: hasCode("AEC"),
      cvac: hasCode("CVAC"),
    });
  }, [visibleMetas, onVisibleCategoriesChange]);

  // Show non-blocking alert whenever current Minor pair differs from earlier saved pair
  useEffect(() => {
    if (earlierMinorSelections.length === 0) {
      setMinorMismatch(false);
      return;
    }

    // Only show mismatch if both current selections are made and they differ from saved
    const current = metaViews
      .filter((v) => v.code === "MN")
      .map((v) => selectionsByMeta[v.metaId])
      .filter(Boolean)
      .slice(0, 2);
    if (current.length < 2) {
      setMinorMismatch(false);
      return;
    }

    const prev = [...earlierMinorSelections].sort();
    const currentSorted = [...current].sort();
    const isMismatch = JSON.stringify(prev) !== JSON.stringify(currentSorted);
    setMinorMismatch(isMismatch);
  }, [metaViews, selectionsByMeta, earlierMinorSelections]);

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

    // Every dropdown on screen must be answered.
    for (const v of visibleMetas) {
      if (!selectionsByMeta[v.metaId]) newErrors.push(`${v.label} is required`);
    }

    // The same subject cannot be picked in two categories (AEC exempt, as it
    // is deliberately allowed to repeat elsewhere).
    const nonAec = visibleMetas.filter((v) => v.code !== "AEC");
    for (let i = 0; i < nonAec.length; i++) {
      for (let j = i + 1; j < nonAec.length; j++) {
        const a = selectionsByMeta[nonAec[i].metaId];
        const b = selectionsByMeta[nonAec[j].metaId];
        if (a && b && a === b) {
          newErrors.push(`${nonAec[i].label} and ${nonAec[j].label} cannot be the same subject`);
        }
      }
    }

    // Auto-assigned subjects must end up selected somewhere in their category.
    const codes = Array.from(new Set(metaViews.map((v) => v.code)));
    for (const code of codes) {
      const views = visibleMetas.filter((v) => v.code === code);
      const autos = [...new Set(views.flatMap((v) => v.autoAssignSubjects))];
      for (const auto of autos) {
        if (views.some((v) => selectionsByMeta[v.metaId] === auto)) continue;
        newErrors.push(`${auto} is mandatory and must be selected`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Validation function - only show errors when explicitly requested
  const validateForm = () => {
    return updateValidationErrors(true);
  };

  // Mark user interaction when they start selecting fields
  const handleFieldChange = (metaId: number, value: string) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    setSelection(metaId, value);

    // Clear only this field's "required" error once it is answered.
    if (errors.length > 0 && value) {
      const view = metaViews.find((v) => v.metaId === metaId);
      if (view) {
        const errorToRemove = `${view.label} is required`;
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
  // Create selections array for saving with fresh meta data (no cache)
  /**
   * Build the save payload. Each dropdown already carries its own meta id and
   * the subject id behind each option, so nothing is guessed from labels or
   * subject names any more. (The old code looked the meta up by subject-type +
   * semester, which made Minor 2 and Minor 3 resolve to the SAME meta, and
   * silently dropped a selection whenever a lookup missed.)
   */
  const buildSelectionsForSave = (
    session: { id: number } | null,
  ): StudentSubjectSelectionForSave[] => {
    const selectionsToSave: StudentSubjectSelectionForSave[] = [];
    if (!student?.id || !session?.id) return selectionsToSave;

    for (const v of visibleMetas) {
      const subjectName = selectionsByMeta[v.metaId];
      if (!subjectName) continue;
      const subjectId = v.subjectIdByName[subjectName];
      if (!subjectId) continue;
      selectionsToSave.push({
        studentId: student.id,
        session: { id: session.id },
        subjectSelectionMeta: { id: v.metaId },
        subject: { id: subjectId, name: subjectName },
      });
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
      // Fetch a fresh session before saving to avoid a stale cached one.
      const freshResp = await fetchStudentSubjectSelections(student?.id!);
      const freshSession = freshResp.session || null;
      const sessionForSave = freshSession || currentSession;

      const selectionsToSave = buildSelectionsForSave(sessionForSave);

      const result = await saveStudentSubjectSelections(selectionsToSave);

      if (result.success) {
        setSaveSuccess(true);
        setSubjectSelectionMetas(freshResp.subjectSelectionMetas || []);
        setCurrentSession(freshSession);

        // Refresh the data to get the updated hasFormSubmissions status
        const updatedResp = await fetchStudentSubjectSelections(student?.id!);
        setHasExistingSelections(updatedResp.hasFormSubmissions);
        setSavedSelections(
          transformActualSelectionsToDisplayFormat(updatedResp.actualStudentSelections),
        );

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
        console.log(
          "🔍 Frontend Debug - Updated hasFormSubmissions:",
          updatedResp.hasFormSubmissions,
        );
      } else {
        setSaveError(
          "Validation failed: " +
            (result.errors?.map((e) => e.message).join(", ") || "Unknown error"),
        );
      }
    } catch (error: any) {
      setSaveError(error.message || "Failed to save selections");
    } finally {
      setSaving(false);
    }
  };

  /** Selections held by every other meta of the same subject type. */
  const selectedInCategory = useCallback(
    (code: string, exceptMetaId: number) =>
      metaViews
        .filter((v) => v.code === code && v.metaId !== exceptMetaId)
        .map((v) => selectionsByMeta[v.metaId])
        .filter(Boolean),
    [metaViews, selectionsByMeta],
  );

  /** Subjects picked in AEC metas — exempt from cross-category exclusion. */
  const aecSelections = useMemo(
    () =>
      metaViews
        .filter((v) => v.code === "AEC")
        .map((v) => selectionsByMeta[v.metaId])
        .filter(Boolean),
    [metaViews, selectionsByMeta],
  );

  /**
   * A subject picked anywhere else cannot be picked again — except AEC, which
   * is deliberately allowed to reappear in other categories.
   */
  const getGlobalExcludes = useCallback(
    (exceptMetaId: number) =>
      metaViews
        .filter((v) => v.metaId !== exceptMetaId && v.code !== "AEC")
        .map((v) => selectionsByMeta[v.metaId])
        .filter(Boolean),
    [metaViews, selectionsByMeta],
  );

  /** Keeps an AEC pick visible in another category's list if it belongs there. */
  const preserveAecIfPresent = useCallback(
    (baseList: string[], filteredList: string[]) => {
      let out = filteredList;
      for (const aec of aecSelections) {
        if (!baseList.includes(aec) || out.includes(aec)) continue;
        out = [...out, aec];
      }
      return out;
    },
    [aecSelections],
  );

  const getFilteredByCategory = useCallback(
    (
      sourceList: string[],
      currentValue: string,
      categoryCode: string,
      semesters: string[],
      metaId: number,
    ) => {
      const norm = (s: string) =>
        String(s || "")
          .trim()
          .toUpperCase();
      const applyRules = Boolean(restrictedCategories[norm(categoryCode)]);
      // Normalize the currentValue filter so casing/whitespace differences
      // between the hydrated meta value and a peer meta value don't leak the
      // current pick into `selected` (that removed it from its own dropdown
      // and made the Combobox fall back to the placeholder).
      const normCurrent = norm(currentValue);
      const selected = selectedInCategory(categoryCode, metaId).filter(
        (s) => norm(s) !== normCurrent,
      );

      return sourceList.filter((subject) => {
        // Uniqueness within the same category: hide an already-picked peer.
        // The currentValue itself is always allowed to appear so the widget
        // can display it, even if a peer slot holds the same subject (which
        // is the intended pattern for Minor continuation across semesters:
        // Minor 1 & Minor 3 share the same subject, Minor 2 & Minor 4 share
        // the same subject).
        if (norm(subject) === normCurrent) return true;
        if (selected.map(norm).includes(norm(subject))) return false;
        if (!applyRules) return true;

        const inContext = (rgSemesters: string[]) => {
          if (!semesters.length) return true;
          const set = new Set(semesters.map(norm));
          return rgSemesters.length === 0 || rgSemesters.some((r) => set.has(norm(r)));
        };

        for (const sel of selected) {
          const rg = restrictedBySubject[norm(sel)];
          if (!rg) continue;
          if (rg.categoryCode !== norm(categoryCode)) continue;
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
    [restrictedCategories, restrictedBySubject, selectedInCategory],
  );

  /**
   * An auto-assigned subject must end up selected somewhere in its category.
   * If nothing in the category holds it, drop it into the first meta that
   * offers it and is still empty.
   */
  useEffect(() => {
    if (!metaViews.length) return;
    const byCode = new Map<string, MetaView[]>();
    for (const v of metaViews) {
      byCode.set(v.code, [...(byCode.get(v.code) ?? []), v]);
    }
    const additions: Record<number, string> = {};
    for (const [, views] of byCode) {
      const autos = [...new Set(views.flatMap((v) => v.autoAssignSubjects))];
      if (!autos.length) continue;

      // Match the pre-refactor behaviour, which differed by category size:
      // a single-slot category (AEC) was filled on load, while a multi-slot
      // category (Minor) only auto-filled once the student had picked
      // something in it — so we do not pre-empt their first choice.
      const hasSelection = views.some((v) => selectionsByMeta[v.metaId]);
      if (views.length > 1 && !hasSelection) continue;

      for (const auto of autos) {
        if (views.some((v) => selectionsByMeta[v.metaId] === auto)) continue;
        // Only place it where the restricted-grouping rules actually allow it.
        const target = views.find(
          (v) =>
            !selectionsByMeta[v.metaId] &&
            !additions[v.metaId] &&
            getFilteredByCategory(v.options, "", v.code, v.semesters, v.metaId).includes(auto),
        );
        if (target) additions[target.metaId] = auto;
      }
    }
    if (Object.keys(additions).length) {
      setSelectionsByMeta((prev) => ({ ...prev, ...additions }));
    }
  }, [metaViews, selectionsByMeta]);

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
  const convertToComboboxData = (
    subjects: string[],
    excludeValues: string[] = [],
    selectLabel: string = "Select",
  ) => {
    const options = subjects
      .filter((subject) => !excludeValues.includes(subject))
      .map((subject) => ({ value: subject, label: subject }));
    return [{ value: "", label: selectLabel }, ...options];
  };

  /** The option list for one dropdown, with every filtering rule applied. */
  const optionsForMeta = useCallback(
    (v: MetaView) => {
      const current = selectionsByMeta[v.metaId] ?? "";

      // AEC and CVAC are both shown unfiltered, exactly as before: neither had
      // a category filter, and the CVAC list itself carried no excludes either
      // (other categories still exclude the CVAC pick via getGlobalExcludes).
      if (v.code === "AEC" || v.code === "CVAC") return convertToComboboxData(v.options);

      const filtered = getFilteredByCategory(v.options, current, v.code, v.semesters, v.metaId);
      return convertToComboboxData(
        preserveAecIfPresent(v.options, filtered),
        getGlobalExcludes(v.metaId),
      );
    },
    [selectionsByMeta, getFilteredByCategory, getGlobalExcludes, preserveAecIfPresent],
  );

  /**
   * Saved selections for the read-only view, keyed by meta id. (This used to
   * substring-match the meta label — "Minor 1", "IDC 2", ... — so any meta
   * named differently was silently dropped from the saved display.)
   */
  const transformActualSelectionsToDisplayFormat = (
    actualSelections: any[],
  ): Record<number, { label: string; subjects: string[] }> => {
    const result: Record<number, { label: string; subjects: string[] }> = {};
    for (const selection of actualSelections ?? []) {
      if (!selection || typeof selection !== "object") continue;
      const metaId = selection.metaId ?? selection.subjectSelectionMeta?.id;
      const subjectName = selection.subjectName ?? selection.subject?.name;
      if (!metaId || !subjectName) continue;
      // Keep the label that came with the saved row. A student who submitted in
      // an earlier academic year (or whose stream changed) may have metas that
      // no longer come back in perMetaOptions — without this the read-only
      // table would render empty for them.
      const label = selection.metaLabel ?? selection.subjectSelectionMeta?.label ?? "Subject";
      const bucket = result[metaId] ?? { label, subjects: [] };
      // De-duplicate in case the server returns the same (meta, subject) twice.
      if (!bucket.subjects.includes(subjectName)) bucket.subjects.push(subjectName);
      // Prefer the meta's own label from the server; fall back to first-seen.
      bucket.label = label || bucket.label;
      result[metaId] = bucket;
    }
    return result;
  };

  /**
   * Saved rows to display: metas still offered first (so ordering follows the
   * configured sequence), then any saved meta the server no longer returns.
   */
  const savedRows = useMemo(() => {
    const rows: { metaId: number; label: string; subjects: string[] }[] = [];
    const seen = new Set<number>();
    for (const v of metaViews) {
      const saved = savedSelections[v.metaId];
      if (!saved || saved.subjects.length === 0) continue;
      rows.push({ metaId: v.metaId, label: v.label, subjects: saved.subjects });
      seen.add(v.metaId);
    }
    for (const [id, saved] of Object.entries(savedSelections)) {
      const metaId = Number(id);
      if (seen.has(metaId)) continue;
      if (!saved.subjects.length) continue;
      rows.push({ metaId, label: saved.label, subjects: saved.subjects });
    }
    return rows;
  }, [metaViews, savedSelections]);

  // Component to display saved selections in read-only table format
  const SavedSelectionsDisplay = () => {
    return (
      <div className="space-y-6">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            Your subject selections have been successfully saved. Below are your confirmed
            selections:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border text-base rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-3 text-left font-semibold text-gray-800 text-base">
                  Subject Category
                </th>
                <th className="border p-3 text-left font-semibold text-gray-800 text-base">
                  Your Selection
                </th>
              </tr>
            </thead>
            <tbody>
              {savedRows.map((row) => (
                <tr key={row.metaId} className="hover:bg-gray-50 ">
                  <td className="border p-3 font-medium text-gray-700 text-base">{row.label}</td>
                  <td className="border p-3 text-gray-800 font-medium text-base">
                    {row.subjects.length === 1 ? (
                      row.subjects[0]
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {row.subjects.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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
            {/* {showTips && (
              <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="text-base">
                  Before selecting subjects, please review the guidelines. Tap the info button to view notes.
                </div>
                <button className="ml-auto text-xs underline" onClick={() => setShowTips(false)}>
                  Dismiss
                </button>
              </div>
            )} */}
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
            {student?.currentPromotion && step === 1 && !hasExistingSelections && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
                {/* Guidance Notes - Only in step 1 for new selections */}
                <div className="flex items-start gap-3 border-blue-200">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-base leading-relaxed">
                      Before selecting your subjects, please read the following notes carefully to
                      ensure clarity on the selection process. These notes are provided here for
                      your reference and guidance.
                    </div>
                  </div>
                </div>
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
                ""
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
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <LoadingDropdown label="Loading" />
                  <LoadingDropdown label="Loading" />
                  <LoadingDropdown label="Loading" />
                </div>
              ) : visibleMetas.length === 0 ? (
                <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-base">
                  No subject selections are available for you at the moment.
                </div>
              ) : (
                metaRows.map((row, rowIndex) => (
                  <div
                    key={`${row[0].code}-${rowIndex}`}
                    className={`grid grid-cols-1 gap-6 ${
                      row.length >= 3
                        ? "lg:grid-cols-3"
                        : row.length === 2
                          ? "lg:grid-cols-2"
                          : "lg:grid-cols-1"
                    }`}
                  >
                    {row.map((v) => (
                      <div
                        key={v.metaId}
                        className="space-y-2 min-h-[84px]"
                        onClick={() => handleFieldFocus(focusTargetFor(v.code))}
                      >
                        <label className="text-base font-medium text-gray-700">{v.label}</label>
                        <Combobox
                          dataArr={optionsForMeta(v)}
                          value={selectionsByMeta[v.metaId] ?? ""}
                          onChange={(value) => handleFieldChange(v.metaId, value)}
                          placeholder={`Select ${v.label}`}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                ))
              )}
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

              {/* Declarations */}
              {errors.length === 0 && (
                <div className="space-y-3 text-base text-gray-700 bg-gray-50 p-3 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Declarations</h4>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={agree1}
                      onChange={(e) => setAgree1(e.target.checked)}
                    />
                    <span>
                      I confirm that I have read the semester-wise subject selection guidelines.
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={agree2}
                      onChange={(e) => setAgree2(e.target.checked)}
                    />
                    <span>
                      I understand that once submitted, I will not be allowed to change the selected
                      subjects in the future.
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
                      In the event of violation of subject selection rules, I will abide by the
                      final decision taken by the Vice-Principal/Course Coordinator in accordance
                      with Calcutta University norms.
                    </span>
                  </label>
                </div>
              )}

              {/* Preview */}
              {errors.length === 0 && (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border text-base rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-3 text-left font-semibold text-gray-800 text-base">
                          Subject Category
                        </th>
                        <th className="border p-3 text-left font-semibold text-gray-800 text-base">
                          Selection
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMetas.map((v) => (
                        <tr key={v.metaId} className="hover:bg-gray-50 ">
                          <td className="border p-3 font-medium text-gray-700 text-base">
                            {v.label}
                          </td>
                          <td className="border p-3 text-gray-800 font-medium text-base">
                            {selectionsByMeta[v.metaId] || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Status Messages */}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-base font-medium">
                      Subject selections saved successfully!
                    </span>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-base font-medium">
                      Error saving selections: {saveError}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 1 inline errors (shown above Next) */}
          {step === 1 && errors.length > 0 && (
            <div
              id="form-error"
              className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg"
            >
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
                Your current Minor I and II subject combination is different from the one you had
                selected at the time of admission.
              </div>
              <div className="mt-1 text-base">
                Previously saved:{" "}
                <span className="font-semibold">{earlierMinorSelections[0] || "-"}</span> and{" "}
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
