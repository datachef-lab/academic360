"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
  fetchStudentSubjectSelections,
  SubjectSelectionMetaDto,
  StudentSubjectSelectionGroupDto,
  PerMetaOptionsDto,
  AdminStudentSubjectSelectionForSave,
  saveStudentSubjectSelectionsAdmin,
} from "@/services/student-subject-selection";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";
import { fetchStudentByUid } from "@/services/student";
import type { StudentDto } from "@repo/db/dtos/user";

interface SubjectSelectionFormProps {
  uid: string;
  onStatusChange?: (status: { hasExistingSelections: boolean }) => void;
}

/**
 * One dropdown, derived from one subject-selection meta. The server decides
 * which metas apply to this student (stream / program course / academic year)
 * and which subjects each one offers, so the form no longer hardcodes
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
  if (romanMatch?.[1]) return romanMatch[1];
  const digitMatch = upper.match(/\b([1-6])\b/);
  const digit = digitMatch?.[1];
  return digit ? (romanMap[digit] ?? "") : "";
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
        semesters: [...new Set((m.classNames ?? []).map(extractSemesterRoman))].filter(Boolean),
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

export default function SubjectSelectionForm({ uid, onStatusChange }: SubjectSelectionFormProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const [student, setStudent] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subjectSelectionMetas, setSubjectSelectionMetas] = useState<SubjectSelectionMetaDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasExistingSelections, setHasExistingSelections] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ id: number } | null>(null);
  const [reason, setReason] = useState(""); // Reason for admin changes
  const [, setGroups] = useState<StudentSubjectSelectionGroupDto[]>([]);

  // Meta-driven form state: one dropdown per meta, selections keyed by meta id.
  const [metaViews, setMetaViews] = useState<MetaView[]>([]);
  const [selections, setSelections] = useState<Record<number, string>>({});

  // Restricted grouping caches for quick checks
  const [restrictedBySubject, setRestrictedBySubject] = useState<
    Record<string, { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }>
  >({});
  const [restrictedCategories, setRestrictedCategories] = useState<Record<string, boolean>>({});

  const [earlierMinorSelections, setEarlierMinorSelections] = useState<string[]>([]);
  const [minorMismatch, setMinorMismatch] = useState(false);

  const setSelection = (metaId: number, value: string) =>
    setSelections((prev) => ({ ...prev, [metaId]: value }));

  /** Metas that actually have something to offer — these are the dropdowns. */
  const visibleMetas = useMemo(() => metaViews.filter((v) => v.options.length > 0), [metaViews]);

  /** Consecutive metas of the same subject type render together on one row. */
  const metaRows = useMemo(() => {
    const rows: MetaView[][] = [];
    for (const v of visibleMetas) {
      const last = rows[rows.length - 1];
      if (last && last[0]?.code === v.code) last.push(v);
      else rows.push([v]);
    }
    return rows;
  }, [visibleMetas]);

  // Load student data first, then subject selections
  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      setLoading(true);
      setLoadError(null);
      try {
        const studentData = await fetchStudentByUid(uid);
        setStudent(studentData);

        if (!studentData.id) {
          throw new Error("Student ID not found");
        }
        const resp = await fetchStudentSubjectSelections(studentData.id);

        setSubjectSelectionMetas(resp.subjectSelectionMetas || []);
        setCurrentSession(resp.session || null);
        setGroups(resp.studentSubjectsSelection ?? []);

        // The dropdowns and their options come straight from the server now.
        const views = toMetaViews(resp.perMetaOptions ?? []);
        setMetaViews(views);

        const hasExisting = resp.hasFormSubmissions || false;
        setHasExistingSelections(hasExisting);
        if (onStatusChange) {
          try {
            onStatusChange({ hasExistingSelections: hasExisting });
          } catch {
            // noop: best-effort notify parent
          }
        }

        // Rehydrate saved selections by meta id. (This used to substring-match
        // the meta label, which silently dropped anything not named
        // "Minor 1"/"IDC 2"/... — any new meta was invisible on reload.)
        if (hasExisting && resp.actualStudentSelections?.length) {
          const restored: Record<number, string> = {};
          for (const selection of resp.actualStudentSelections) {
            if (typeof selection !== "object" || selection === null) continue;
            const sel = selection as Record<string, unknown>;
            const metaId =
              (sel.metaId as number | undefined) ??
              ((sel.subjectSelectionMeta as Record<string, unknown>)?.id as number | undefined);
            const subjectName =
              (sel.subjectName as string | undefined) ??
              ((sel.subject as Record<string, unknown>)?.name as string | undefined);
            if (!metaId || !subjectName) continue;
            restored[metaId] = subjectName;
          }
          setSelections(restored);
        }

        // Earlier (admission-time) minor subjects, for the mismatch notice.
        // These papers do not always carry an embedded subject, so fall back to
        // resolving the name through the minor paper options by paper id —
        // without it the mismatch banner silently stops appearing.
        const minorGroup = (resp.studentSubjectsSelection ?? []).find(
          (g) =>
            (g.subjectType?.name ?? "").toUpperCase().includes("MINOR") ||
            (g.subjectType?.code ?? "").toUpperCase() === "MN",
        );
        const subjectNameFromMinor = (paper: (typeof resp.selectedMinorSubjects)[number]) => {
          if (!paper?.id) return "";
          if (paper.subject?.name) return paper.subject.name || "";
          const match = minorGroup?.paperOptions?.find((po) => po.id === paper.id);
          return match?.subject?.name || "";
        };
        const earlier = (resp.selectedMinorSubjects ?? [])
          .slice(0, 2)
          .map(subjectNameFromMinor)
          .filter(Boolean);
        setEarlierMinorSelections(earlier);

        // Restricted groupings ("cannot combine with"). Index build kept
        // identical to the pre-refactor version: multiple rules per subject are
        // MERGED (6 subjects in the data are targeted by more than one rule),
        // and symmetry CREATES the reverse entry when the reverse subject has
        // no rule of its own — without that, "A cannot combine with B" only
        // blocked in one direction.
        const programCourseId = studentData.currentPromotion?.programCourse?.id;
        const rgs = await fetchRestrictedGroupings({
          page: 1,
          pageSize: 200,
          programCourseId: programCourseId || undefined,
          studentId: studentData.id,
        });
        const rgMap: Record<
          string,
          { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }
        > = {};
        const catFlags: Record<string, boolean> = {};
        const norm = (s: string) =>
          String(s || "")
            .trim()
            .toUpperCase();

        for (const rg of rgs ?? []) {
          const target = rg?.subject?.name || "";
          if (!target) continue;
          const semesters = (rg?.forClasses ?? [])
            .map((c) => extractSemesterRoman(c?.class?.shortName || c?.class?.name))
            .filter((s): s is string => Boolean(s));
          const cannot = new Set<string>(
            (rg?.cannotCombineWithSubjects ?? [])
              .map((s) => norm(s?.cannotCombineWithSubject?.name || ""))
              .filter((s): s is string => Boolean(s)),
          );
          const code = norm(rg?.subjectType?.code || rg?.subjectType?.name || "");
          const targetKey = norm(target);

          if (!rgMap[targetKey]) {
            rgMap[targetKey] = {
              semesters,
              cannotCombineWith: new Set<string>(),
              categoryCode: code,
            };
          }
          for (const c of cannot) rgMap[targetKey].cannotCombineWith.add(c);

          for (const c of cannot) {
            if (!c) continue;
            if (!rgMap[c]) {
              rgMap[c] = { semesters, cannotCombineWith: new Set<string>(), categoryCode: code };
            }
            rgMap[c].cannotCombineWith.add(targetKey);
          }

          if (code) catFlags[code] = true;
        }
        setRestrictedBySubject(rgMap);
        setRestrictedCategories(catFlags);
      } catch (e: unknown) {
        setLoadError(e instanceof Error ? e.message : "Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  /** Selections held by every other meta of the same subject type. */
  const selectedInCategory = useCallback(
    (code: string, exceptMetaId: number) =>
      metaViews
        .filter((v) => v.code === code && v.metaId !== exceptMetaId)
        .map((v) => selections[v.metaId])
        .filter((s): s is string => Boolean(s)),
    [metaViews, selections],
  );

  /** Subjects picked in AEC metas — exempt from cross-category exclusion. */
  const aecSelections = useMemo(
    () =>
      metaViews
        .filter((v) => v.code === "AEC")
        .map((v) => selections[v.metaId])
        .filter((s): s is string => Boolean(s)),
    [metaViews, selections],
  );

  /**
   * A subject picked anywhere else cannot be picked again — except AEC, which
   * is deliberately allowed to reappear in other categories.
   */
  const getGlobalExcludes = useCallback(
    (exceptMetaId: number) =>
      metaViews
        .filter((v) => v.metaId !== exceptMetaId && v.code !== "AEC")
        .map((v) => selections[v.metaId])
        .filter((s): s is string => Boolean(s)),
    [metaViews, selections],
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
      const selected = selectedInCategory(categoryCode, metaId).filter((s) => s !== currentValue);

      return sourceList.filter((subject) => {
        // Uniqueness within the same category: hide an already-picked peer.
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
      const current = selections[v.metaId] ?? "";

      // AEC is unfiltered: it may repeat elsewhere and has no peer rules applied.
      if (v.code === "AEC") return convertToComboboxData(v.options);
      // CVAC takes global uniqueness but no category rules.
      if (v.code === "CVAC") return convertToComboboxData(v.options, getGlobalExcludes(v.metaId));

      const filtered = getFilteredByCategory(v.options, current, v.code, v.semesters, v.metaId);
      return convertToComboboxData(
        preserveAecIfPresent(v.options, filtered),
        getGlobalExcludes(v.metaId),
      );
    },
    [selections, getFilteredByCategory, getGlobalExcludes, preserveAecIfPresent],
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
      const hasSelection = views.some((v) => selections[v.metaId]);
      if (views.length > 1 && !hasSelection) continue;

      for (const auto of autos) {
        if (views.some((v) => selections[v.metaId] === auto)) continue;
        // Only place it where the restricted-grouping rules actually allow it.
        const target = views.find(
          (v) =>
            !selections[v.metaId] &&
            !additions[v.metaId] &&
            getFilteredByCategory(v.options, "", v.code, v.semesters, v.metaId).includes(auto),
        );
        if (target) additions[target.metaId] = auto;
      }
    }
    if (Object.keys(additions).length) {
      setSelections((prev) => ({ ...prev, ...additions }));
    }
  }, [metaViews, selections]);

  // Minor mismatch notice: compare the first two Minor picks against admission.
  useEffect(() => {
    if (earlierMinorSelections.length === 0) {
      setMinorMismatch(false);
      return;
    }
    const current = metaViews
      .filter((v) => v.code === "MN")
      .map((v) => selections[v.metaId])
      .filter((s): s is string => Boolean(s))
      .slice(0, 2);
    if (current.length < 2) {
      setMinorMismatch(false);
      return;
    }
    const prev = [...earlierMinorSelections].sort();
    const currentSorted = [...current].sort();
    setMinorMismatch(JSON.stringify(prev) !== JSON.stringify(currentSorted));
  }, [metaViews, selections, earlierMinorSelections]);

  const handleFieldFocus = (fieldType: string) => {
    const section = document.getElementById(`${fieldType}-subjects`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" });
      section.classList.add("ring-4", "ring-blue-500", "border-blue-500");
      setTimeout(() => {
        section.classList.remove("ring-4", "ring-blue-500", "border-blue-500");
      }, 3000);
    }
  };

  const updateValidationErrors = (showErrors: boolean = false) => {
    const newErrors: string[] = [];
    if (!showErrors) {
      setErrors([]);
      return true;
    }

    // Every dropdown on screen must be answered.
    for (const v of visibleMetas) {
      if (!selections[v.metaId]) newErrors.push(`${v.label} is required`);
    }

    // The same subject cannot be picked in two categories (AEC exempt).
    const nonAec = visibleMetas.filter((v) => v.code !== "AEC");
    for (let i = 0; i < nonAec.length; i++) {
      for (let j = i + 1; j < nonAec.length; j++) {
        const left = nonAec[i];
        const right = nonAec[j];
        if (!left || !right) continue;
        const a = selections[left.metaId];
        const b = selections[right.metaId];
        if (a && b && a === b) {
          newErrors.push(`${left.label} and ${right.label} cannot be the same subject`);
        }
      }
    }

    // Auto-assigned subjects must be selected somewhere in their category.
    const codes = [...new Set(metaViews.map((v) => v.code))];
    for (const code of codes) {
      const views = visibleMetas.filter((v) => v.code === code);
      const autos = [...new Set(views.flatMap((v) => v.autoAssignSubjects))];
      for (const auto of autos) {
        if (views.some((v) => selections[v.metaId] === auto)) continue;
        newErrors.push(`${auto} is mandatory and must be selected`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateForm = () => updateValidationErrors(true);

  const handleFieldChange = (metaId: number, value: string) => {
    if (!hasUserInteracted) setHasUserInteracted(true);
    setSelection(metaId, value);

    // Clear this field's "required" error as soon as it is answered.
    if (errors.length > 0 && value) {
      const view = metaViews.find((v) => v.metaId === metaId);
      if (view) {
        const errorToRemove = `${view.label} is required`;
        setErrors((prev) => prev.filter((e) => e !== errorToRemove));
      }
    }
  };

  /**
   * Build the save payload. Each dropdown already knows its own meta id and the
   * subject id behind each option, so nothing has to be guessed from labels or
   * subject names any more.
   */
  const createSelectionsForSave = (): AdminStudentSubjectSelectionForSave[] => {
    const selectionsToSave: AdminStudentSubjectSelectionForSave[] = [];
    if (!student?.id || !currentSession?.id) return selectionsToSave;

    for (const v of visibleMetas) {
      const subjectName = selections[v.metaId];
      if (!subjectName) continue;
      const subjectId = v.subjectIdByName[subjectName];
      if (!subjectId) continue;
      selectionsToSave.push({
        studentId: student.id,
        session: { id: currentSession.id },
        subjectSelectionMeta: { id: v.metaId },
        subject: { id: subjectId, name: subjectName },
        createdBy: 1, // TODO: Get actual admin user ID
        reason: reason || "Admin update",
      });
    }
    return selectionsToSave;
  };

  const handleSave = async () => {
    setHasUserInteracted(true);
    if (!validateForm()) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const selectionsToSave = createSelectionsForSave();
      const result = await saveStudentSubjectSelectionsAdmin(selectionsToSave);

      if (result.success) {
        setSaveSuccess(true);
        try {
          const audioContext = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )();
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
          playBeep(800, audioContext.currentTime, 0.15);
          playBeep(1000, audioContext.currentTime + 0.2, 0.15);
        } catch {
          // Sound is a nicety; ignore failures.
        }
      } else {
        setSaveError(
          "Validation failed: " +
            (result.errors?.map((e) => e.message).join(", ") || "Unknown error"),
        );
      }
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Failed to save selections");
    } finally {
      setSaving(false);
    }
  };

  // Auto-fade success message after 2 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const LoadingDropdown = ({ label }: { label: string }) => (
    <div className="space-y-2 min-h-[84px]">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="w-full border border-gray-300 rounded-md h-10 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">Loading options...</span>
      </div>
    </div>
  );

  // Keep the type referenced so the meta list stays part of the contract.
  void subjectSelectionMetas;

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
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <LoadingDropdown label="Loading" />
                <LoadingDropdown label="Loading" />
                <LoadingDropdown label="Loading" />
              </div>
            ) : visibleMetas.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm">
                No subject selections are configured for this student.
              </div>
            ) : (
              metaRows.map((row, rowIndex) => (
                <div
                  key={`${row[0]?.code ?? "row"}-${rowIndex}`}
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
                        value={selections[v.metaId] ?? ""}
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
                <span className="text-base font-medium">Error saving selections: {saveError}</span>
              </div>
            </div>
          )}

          {/* Reason for Change (Admin only) */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">
              Reason for Change/Update (Optional)
            </label>
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
          {minorMismatch && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg">
              <div>
                The current Minor I and II subject combination is different from the one selected at
                the time of admission.
              </div>
              <div className="mt-1 text-base">
                Previously saved:{" "}
                <span className="font-semibold">{earlierMinorSelections[0] || "-"}</span> and{" "}
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
              {saving
                ? "Saving..."
                : hasExistingSelections
                  ? "Update Selections"
                  : "Save Selections"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
