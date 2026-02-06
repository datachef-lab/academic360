import type { StudentDto } from "@repo/db/dtos/user";
import { useCallback, useEffect, useState } from "react";
import { fetchRestrictedGroupings } from "@/services/restricted-grouping";
import type { SubjectSelectionMetaDto } from "@repo/db/dtos/subject-selection";
import {
  fetchStudentSubjectSelections,
  saveStudentSubjectSelections,
  type PaperDto,
  type StudentSubjectSelectionForSave,
  type StudentSubjectSelectionGroupDto,
} from "@/services/subject-selection";

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

function hasActualOptions(subjects: string[]): boolean {
  return subjects.filter((s) => s && s.trim() !== "").length > 0;
}

export interface SavedSelections {
  minor1?: string;
  minor2?: string;
  minor3?: string;
  idc1?: string;
  idc2?: string;
  idc3?: string;
  aec3?: string;
  cvac4?: string;
}

function transformActualSelectionsToDisplayFormat(actualSelections: any[], metas: any[]): SavedSelections {
  const result: SavedSelections = {};
  for (const selection of actualSelections) {
    const subjectName = selection.subjectName;
    const metaLabel = selection.metaLabel;
    if (!subjectName || !metaLabel) continue;

    if (metaLabel.includes("Minor 1")) result.minor1 = subjectName;
    else if (metaLabel.includes("Minor 2")) result.minor2 = subjectName;
    else if (metaLabel.includes("Minor 3")) result.minor3 = subjectName;
    else if (metaLabel.includes("IDC 1")) result.idc1 = subjectName;
    else if (metaLabel.includes("IDC 2")) result.idc2 = subjectName;
    else if (metaLabel.includes("IDC 3")) result.idc3 = subjectName;
    else if (metaLabel.includes("AEC")) result.aec3 = subjectName;
    else if (metaLabel.includes("CVAC")) result.cvac4 = subjectName;
  }
  return result;
}

export function useSubjectSelectionForm(student: StudentDto | null | undefined) {
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);

  const [selections, setSelections] = useState<StudentSubjectSelectionGroupDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subjectSelectionMetas, setSubjectSelectionMetas] = useState<SubjectSelectionMetaDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasExistingSelections, setHasExistingSelections] = useState(false);
  const [savedSelections, setSavedSelections] = useState<SavedSelections>({});
  const [currentSession, setCurrentSession] = useState<{ id: number } | null>(null);

  const [minor1, setMinor1] = useState("");
  const [minor2, setMinor2] = useState("");
  const [minor3, setMinor3] = useState("");
  const [idc1, setIdc1] = useState("");
  const [idc2, setIdc2] = useState("");
  const [idc3, setIdc3] = useState("");
  const [aec3, setAec3] = useState("");
  const [cvac4, setCvac4] = useState("");

  const [admissionMinor1Subjects, setAdmissionMinor1Subjects] = useState<string[]>([]);
  const [admissionMinor2Subjects, setAdmissionMinor2Subjects] = useState<string[]>([]);
  const [admissionMinor3Subjects, setAdmissionMinor3Subjects] = useState<string[]>([]);
  const [availableIdcSem1Subjects, setAvailableIdcSem1Subjects] = useState<string[]>([]);
  const [availableIdcSem2Subjects, setAvailableIdcSem2Subjects] = useState<string[]>([]);
  const [availableIdcSem3Subjects, setAvailableIdcSem3Subjects] = useState<string[]>([]);
  const [availableAecSubjects, setAvailableAecSubjects] = useState<string[]>([]);
  const [availableCvacOptions, setAvailableCvacOptions] = useState<string[]>([]);

  const [autoMinor1, setAutoMinor1] = useState("");
  const [autoMinor2, setAutoMinor2] = useState("");
  const [autoMinor3, setAutoMinor3] = useState("");
  const [autoIdc1, setAutoIdc1] = useState("");
  const [autoIdc2, setAutoIdc2] = useState("");
  const [autoIdc3, setAutoIdc3] = useState("");
  const [autoAec, setAutoAec] = useState("");

  const [restrictedBySubject, setRestrictedBySubject] = useState<
    Record<string, { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }>
  >({});
  const [restrictedCategories, setRestrictedCategories] = useState<Record<string, boolean>>({});
  const [earlierMinorSelections, setEarlierMinorSelections] = useState<string[]>([]);
  const [minorMismatch, setMinorMismatch] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<{
    minor?: boolean;
    idc?: boolean;
    aec?: boolean;
    cvac?: boolean;
  }>({});

  const getLabel = (p: PaperDto) => p?.subject?.name || "";
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

  useEffect(() => {
    const run = async () => {
      if (!student?.id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const resp = await fetchStudentSubjectSelections(student.id);
        setSubjectSelectionMetas(resp.subjectSelectionMetas || []);
        setCurrentSession(resp.session || null);

        const groups = resp.studentSubjectsSelection ?? [];
        setSelections(groups);
        setHasExistingSelections(resp.hasFormSubmissions || false);

        if (resp.hasFormSubmissions) {
          const transformed = transformActualSelectionsToDisplayFormat(
            resp.actualStudentSelections || [],
            resp.subjectSelectionMetas || [],
          );
          setSavedSelections(transformed);
        }

        const minorGroup = groups.find((g) => isMinor(g.subjectType?.name || "", g.subjectType?.code!));
        const idcGroup = groups.find((g) => isIDC(g.subjectType?.name || "", g.subjectType?.code!));
        const aecGroup = groups.find((g) => isAEC(g.subjectType?.name || "", g.subjectType?.code!));
        const cvacGroup = groups.find((g) => isCVAC(g.subjectType?.name || "", g.subjectType?.code!));

        const dedupe = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

        const minorSem1And2 = (minorGroup?.paperOptions || []).filter((p) => isSem(p, "I") || isSem(p, "II"));
        const minorSem3And4 = (minorGroup?.paperOptions || []).filter((p) => isSem(p, "III") || isSem(p, "IV"));
        const minorSem3Only = (minorGroup?.paperOptions || []).filter((p) => isSem(p, "III"));

        const idcSem1Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "I"));
        const idcSem2Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "II"));
        const idcSem3Papers = (idcGroup?.paperOptions || []).filter((p) => isSem(p, "III"));
        const aec3Papers = (aecGroup?.paperOptions || []).filter((p) => isSem(p, "III") || isSem(p, "IV"));
        const cvac4Papers = (cvacGroup?.paperOptions || []).filter((p) => isSem(p, "II"));

        setAdmissionMinor1Subjects(dedupe(minorSem1And2.map(getLabel)));
        setAdmissionMinor2Subjects(dedupe(minorSem3And4.map(getLabel)));
        setAdmissionMinor3Subjects(dedupe(minorSem3Only.map(getLabel)));
        setAvailableIdcSem1Subjects(dedupe(idcSem1Papers.map(getLabel)));
        setAvailableIdcSem2Subjects(dedupe(idcSem2Papers.map(getLabel)));
        setAvailableIdcSem3Subjects(dedupe(idcSem3Papers.map(getLabel)));
        setAvailableAecSubjects(dedupe(aec3Papers.map(getLabel)));
        setAvailableCvacOptions(dedupe(cvac4Papers.map(getLabel)));

        const firstOrEmpty = (arr: string[]) => (arr.length > 0 ? arr[0] : "");
        setAutoMinor1(
          firstOrEmpty(
            dedupe(
              (minorGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && (isSem(p, "I") || isSem(p, "II")))
                .map(getLabel),
            ),
          ),
        );
        setAutoMinor2(
          firstOrEmpty(
            dedupe(
              (minorGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && (isSem(p, "III") || isSem(p, "IV")))
                .map(getLabel),
            ),
          ),
        );
        setAutoMinor3(
          firstOrEmpty(
            dedupe(
              (minorGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && isSem(p, "III"))
                .map(getLabel),
            ),
          ),
        );
        setAutoIdc1(
          firstOrEmpty(
            dedupe(
              (idcGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && isSem(p, "I"))
                .map(getLabel),
            ),
          ),
        );
        setAutoIdc2(
          firstOrEmpty(
            dedupe(
              (idcGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && isSem(p, "II"))
                .map(getLabel),
            ),
          ),
        );
        setAutoIdc3(
          firstOrEmpty(
            dedupe(
              (idcGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && isSem(p, "III"))
                .map(getLabel),
            ),
          ),
        );
        setAutoAec(
          firstOrEmpty(
            dedupe(
              (aecGroup?.paperOptions || [])
                .filter((p) => (p as any)?.autoAssign === true && (isSem(p, "III") || isSem(p, "IV")))
                .map(getLabel),
            ),
          ),
        );

        const programCourseId = student?.currentPromotion?.programCourse?.id as number | undefined;
        const rgs = await fetchRestrictedGroupings({ page: 1, pageSize: 200, programCourseId });
        const norm = (s: string) =>
          String(s || "")
            .trim()
            .toUpperCase();
        const rgMap: Record<string, { semesters: string[]; cannotCombineWith: Set<string>; categoryCode: string }> = {};
        const catFlags: Record<string, boolean> = {};

        for (const rg of rgs) {
          const target = rg.subject?.name || "";
          if (!target) continue;
          const semesters = (rg.forClasses || [])
            .map((c) => extractSemesterRoman((c as any).class?.shortName || (c as any).class?.name))
            .filter(Boolean) as string[];
          const cannot = new Set(
            (rg.cannotCombineWithSubjects || [])
              .map((s: any) => norm(s.cannotCombineWithSubject?.name || ""))
              .filter(Boolean),
          );
          const code = norm((rg.subjectType as any)?.code || (rg.subjectType as any)?.name || "");
          const targetKey = norm(target);
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
          if (code) catFlags[code] = true;
        }
        setRestrictedBySubject(rgMap);
        setRestrictedCategories(catFlags);

        const earlier = resp.selectedMinorSubjects ?? [];
        const subjectNameFromMinor = (paper: PaperDto | undefined): string => {
          if (!paper?.id) return "";
          if (paper.subject?.name) return paper.subject.name || "";
          const match = minorGroup?.paperOptions?.find((po) => po.id === paper.id);
          return match?.subject?.name || "";
        };
        const earlierMinor1 = subjectNameFromMinor(earlier[0]);
        const earlierMinor2 = subjectNameFromMinor(earlier[1]);
        setEarlierMinorSelections([earlierMinor1, earlierMinor2].filter(Boolean));
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load subject selections");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [student?.id]);

  useEffect(() => {
    if (earlierMinorSelections.length === 0) {
      setMinorMismatch(false);
      return;
    }
    const current = [minor1, minor2].filter(Boolean);
    if (current.length < 2) {
      setMinorMismatch(false);
      return;
    }
    const prev = [...earlierMinorSelections].sort();
    const currentSorted = [...current].sort();
    setMinorMismatch(JSON.stringify(prev) !== JSON.stringify(currentSorted));
  }, [minor1, minor2, earlierMinorSelections]);

  useEffect(() => {
    setVisibleCategories({
      minor:
        hasActualOptions(admissionMinor1Subjects) ||
        hasActualOptions(admissionMinor2Subjects) ||
        hasActualOptions(admissionMinor3Subjects),
      idc:
        hasActualOptions(availableIdcSem1Subjects) ||
        hasActualOptions(availableIdcSem2Subjects) ||
        hasActualOptions(availableIdcSem3Subjects),
      aec: hasActualOptions(availableAecSubjects),
      cvac: hasActualOptions(availableCvacOptions),
    });
  }, [
    admissionMinor1Subjects,
    admissionMinor2Subjects,
    admissionMinor3Subjects,
    availableIdcSem1Subjects,
    availableIdcSem2Subjects,
    availableIdcSem3Subjects,
    availableAecSubjects,
    availableCvacOptions,
  ]);

  const getFilteredIdcOptions = useCallback(
    (sourceList: string[], currentIdcValue: string) => {
      return sourceList.filter((subject) => {
        const uniqueWithinIdc =
          subject === currentIdcValue || (subject !== idc1 && subject !== idc2 && subject !== idc3);
        const notSameAsMinor = subject !== minor1 && subject !== minor2;
        return uniqueWithinIdc && notSameAsMinor;
      });
    },
    [idc1, idc2, idc3, minor1, minor2],
  );

  const getFilteredByCategory = useCallback(
    (sourceList: string[], currentValue: string, categoryCode: string, contextSemester?: string | string[]) => {
      const norm = (s: string) =>
        String(s || "")
          .trim()
          .toUpperCase();
      const applyRules = Boolean(restrictedCategories[norm(categoryCode)]);
      return sourceList.filter((subject) => {
        if (!applyRules) return true;

        const sameCategorySelected =
          norm(categoryCode) === "MN"
            ? [minor1, minor2, minor3]
            : norm(categoryCode) === "IDC"
              ? [idc1, idc2, idc3]
              : norm(categoryCode) === "AEC"
                ? [aec3]
                : norm(categoryCode) === "CVAC"
                  ? [cvac4]
                  : [];
        const selected = sameCategorySelected.filter(Boolean).filter((s) => s !== currentValue);
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
    [restrictedCategories, restrictedBySubject, minor1, minor2, minor3, idc1, idc2, idc3, aec3, cvac4],
  );

  const preserveAecIfPresent = useCallback(
    (baseList: string[], filteredList: string[]) => {
      if (!aec3) return filteredList;
      if (!baseList.includes(aec3)) return filteredList;
      if (filteredList.includes(aec3)) return filteredList;
      return [...filteredList, aec3];
    },
    [aec3],
  );

  const getGlobalExcludes = useCallback(
    (currentValue: string) => {
      return [minor1, minor2, minor3, idc1, idc2, idc3, cvac4].filter(Boolean).filter((s) => s !== currentValue);
    },
    [minor1, minor2, minor3, idc1, idc2, idc3, cvac4],
  );

  const validateForm = useCallback(() => {
    const newErrors: string[] = [];
    const shouldAskForAec = hasActualOptions(availableAecSubjects);
    const shouldAskForCvac = hasActualOptions(availableCvacOptions);

    if (hasActualOptions(admissionMinor1Subjects) && !minor1) newErrors.push("Minor I subject is required");
    if (hasActualOptions(admissionMinor1Subjects) && hasActualOptions(admissionMinor2Subjects) && !minor2)
      newErrors.push("Minor II subject is required");
    if (!hasActualOptions(admissionMinor1Subjects) && hasActualOptions(admissionMinor3Subjects) && !minor3)
      newErrors.push("Minor subject is required");
    if (hasActualOptions(availableIdcSem1Subjects) && !idc1) newErrors.push("IDC 1 subject is required");
    if (hasActualOptions(availableIdcSem2Subjects) && !idc2) newErrors.push("IDC 2 subject is required");
    if (hasActualOptions(availableIdcSem3Subjects) && !idc3) newErrors.push("IDC 3 subject is required");
    if (shouldAskForAec && !aec3) newErrors.push("AEC 3 subject is required");
    if (shouldAskForCvac && !cvac4) newErrors.push("CVAC 4 subject is required");

    if (minor1 && idc1 && minor1 === idc1) newErrors.push("Minor I cannot be the same as IDC 1");
    if (minor1 && idc2 && minor1 === idc2) newErrors.push("Minor I cannot be the same as IDC 2");
    if (minor1 && idc3 && minor1 === idc3) newErrors.push("Minor I cannot be the same as IDC 3");
    if (minor2 && idc1 && minor2 === idc1) newErrors.push("Minor II cannot be the same as IDC 1");
    if (minor2 && idc2 && minor2 === idc2) newErrors.push("Minor II cannot be the same as IDC 2");
    if (minor2 && idc3 && minor2 === idc3) newErrors.push("Minor II cannot be the same as IDC 3");
    if (minor3 && idc1 && minor3 === idc1) newErrors.push("Minor cannot be the same as IDC 1");
    if (minor3 && idc2 && minor3 === idc2) newErrors.push("Minor cannot be the same as IDC 2");
    if (minor3 && idc3 && minor3 === idc3) newErrors.push("Minor cannot be the same as IDC 3");

    if (idc1 && idc2 && idc1 === idc2) newErrors.push("IDC 1 and IDC 2 cannot be the same");
    if (idc1 && idc3 && idc1 === idc3) newErrors.push("IDC 1 and IDC 3 cannot be the same");
    if (idc2 && idc3 && idc2 === idc3) newErrors.push("IDC 2 and IDC 3 cannot be the same");

    if (autoMinor1 && minor1 !== autoMinor1 && minor2 !== autoMinor1 && minor3 !== autoMinor1) {
      newErrors.push(`${autoMinor1} is mandatory and must be selected in one of the Minor subjects`);
    }
    if (
      autoMinor3 &&
      !hasActualOptions(admissionMinor1Subjects) &&
      hasActualOptions(admissionMinor3Subjects) &&
      minor3 !== autoMinor3
    ) {
      newErrors.push(`${autoMinor3} is mandatory and must be selected in Minor`);
    }
    if (autoAec && aec3 !== autoAec) {
      newErrors.push(`${autoAec} is mandatory and must be selected in AEC`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [
    admissionMinor1Subjects,
    admissionMinor2Subjects,
    admissionMinor3Subjects,
    availableIdcSem1Subjects,
    availableIdcSem2Subjects,
    availableIdcSem3Subjects,
    availableAecSubjects,
    availableCvacOptions,
    minor1,
    minor2,
    minor3,
    idc1,
    idc2,
    idc3,
    aec3,
    cvac4,
    autoMinor1,
    autoMinor3,
    autoAec,
  ]);

  const createSelectionsForSave = useCallback(
    (freshMetas: SubjectSelectionMetaDto[], freshSession: { id: number } | null): StudentSubjectSelectionForSave[] => {
      const selectionsToSave: StudentSubjectSelectionForSave[] = [];
      if (!student?.id || !selections || freshMetas.length === 0 || !freshSession?.id) return selectionsToSave;

      const findSubjectId = (subjectName: string): number | null => {
        for (const group of selections) {
          for (const paper of group.paperOptions || []) {
            if (paper.subject?.name === subjectName) return paper.subject!.id;
          }
        }
        return null;
      };

      const findMetaId = (subjectTypeCode: string, semester?: string): number | null => {
        const studentStreamId = student?.currentPromotion?.programCourse?.stream?.id;
        const meta = freshMetas.find((m) => {
          if (m.subjectType.code !== subjectTypeCode) return false;
          if (studentStreamId && m.streams.length > 0) {
            const hasMatchingStream = m.streams.some((s: any) => s.stream?.id === studentStreamId);
            if (!hasMatchingStream) return false;
          }
          if (semester && m.forClasses.length > 0) {
            return m.forClasses.some((c: any) => extractSemesterRoman(c.class?.name) === semester);
          }
          return true;
        });
        return meta?.id || null;
      };

      if (minor1) {
        const subjectId = findSubjectId(minor1);
        const metaId = findMetaId("MN", "I");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: minor1 },
          });
        }
      }
      if (minor2) {
        const subjectId = findSubjectId(minor2);
        const metaId = findMetaId("MN", "III");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: minor2 },
          });
        }
      }
      if (minor3) {
        const subjectId = findSubjectId(minor3);
        const metaId = findMetaId("MN", "III");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: minor3 },
          });
        }
      }
      if (idc1) {
        const subjectId = findSubjectId(idc1);
        const metaId = findMetaId("IDC", "I");
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
        const metaId = findMetaId("IDC", "II");
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
        const metaId = findMetaId("IDC", "III");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: idc3 },
          });
        }
      }
      if (aec3) {
        const subjectId = findSubjectId(aec3);
        const metaId = findMetaId("AEC", "III");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: aec3 },
          });
        }
      }
      if (cvac4) {
        const subjectId = findSubjectId(cvac4);
        const metaId = findMetaId("CVAC", "II");
        if (subjectId && metaId) {
          selectionsToSave.push({
            studentId: student.id,
            session: { id: freshSession.id },
            subjectSelectionMeta: { id: metaId },
            subject: { id: subjectId, name: cvac4 },
          });
        }
      }
      return selectionsToSave;
    },
    [student, selections, minor1, minor2, minor3, idc1, idc2, idc3, aec3, cvac4],
  );

  const handleSave = useCallback(async () => {
    if (!agree1 || !agree2 || !agree3 || !student?.id) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const freshResp = await fetchStudentSubjectSelections(student.id);
      const freshMetas = freshResp.subjectSelectionMetas || [];
      const freshSession = freshResp.session || null;
      const metasForSave = freshMetas.length > 0 ? freshMetas : subjectSelectionMetas;
      const sessionForSave = freshSession || currentSession;

      const selectionsToSave = createSelectionsForSave(metasForSave, sessionForSave);
      const result = await saveStudentSubjectSelections(selectionsToSave);

      if (result.success) {
        setSaveSuccess(true);
        setSubjectSelectionMetas(freshMetas);
        setCurrentSession(freshSession);
        const updatedResp = await fetchStudentSubjectSelections(student.id);
        setHasExistingSelections(updatedResp.hasFormSubmissions);
        setSavedSelections(
          transformActualSelectionsToDisplayFormat(
            updatedResp.actualStudentSelections || [],
            updatedResp.subjectSelectionMetas || [],
          ),
        );
        setStep(1);
        setMinorMismatch(false);
      } else {
        setSaveError("Validation failed: " + (result.errors?.map((e) => e.message).join(", ") || "Unknown error"));
      }
    } catch (error: any) {
      setSaveError(error.message || "Failed to save selections");
    } finally {
      setSaving(false);
    }
  }, [agree1, agree2, agree3, student?.id, subjectSelectionMetas, currentSession, createSelectionsForSave]);

  useEffect(() => {
    if (minor1 && !minor2 && autoMinor1) {
      const programCourseName =
        student?.currentPromotion?.programCourse?.name || (student as any)?.programCourse?.course?.name || "";
      const isBcomProgram = programCourseName.toLowerCase().replace(/[.\s]/g, "").includes("bcom");
      const semesterContext = isBcomProgram ? ["III"] : ["III", "IV"];
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", semesterContext);
      if (options.includes(autoMinor1) && autoMinor1 !== minor1) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, minor2, autoMinor1, admissionMinor2Subjects, student, getFilteredByCategory]);

  useEffect(() => {
    if (!aec3 && autoAec) {
      const options = getFilteredByCategory(availableAecSubjects, aec3, "AEC", ["III", "IV"]);
      if (options.includes(autoAec)) {
        setAec3(autoAec);
      }
    }
  }, [aec3, autoAec, availableAecSubjects, getFilteredByCategory]);

  useEffect(() => {
    if (minor2 && !minor1 && autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      if (options.includes(autoMinor1) && autoMinor1 !== minor2) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, minor1, autoMinor1, admissionMinor1Subjects, getFilteredByCategory]);

  useEffect(() => {
    if (minor1 && autoMinor1 && minor1 !== autoMinor1) {
      const programCourseName =
        (student as any)?.currentPromotion?.programCourse?.name || (student as any)?.programCourse?.course?.name || "";
      const isBcomProgram = programCourseName.toLowerCase().replace(/[.\s]/g, "").includes("bcom");
      const semesterContext = isBcomProgram ? ["III"] : ["III", "IV"];
      const options = getFilteredByCategory(admissionMinor2Subjects, minor2, "MN", semesterContext);
      if (options.includes(autoMinor1)) {
        setMinor2(autoMinor1);
      }
    }
  }, [minor1, autoMinor1, minor2, admissionMinor2Subjects, student, getFilteredByCategory]);

  useEffect(() => {
    if (minor2 && autoMinor1 && minor2 !== autoMinor1) {
      const options = getFilteredByCategory(admissionMinor1Subjects, minor1, "MN", ["I", "II"]);
      if (options.includes(autoMinor1)) {
        setMinor1(autoMinor1);
      }
    }
  }, [minor2, autoMinor1, minor1, admissionMinor1Subjects, getFilteredByCategory]);

  const getDynamicLabel = useCallback(
    (subjectTypeCode: string, semester?: string): string => {
      const programCourseName =
        (student as any)?.currentPromotion?.programCourse?.name || (student as any)?.programCourse?.course?.name || "";
      const isBcomProgram = programCourseName.toLowerCase().replace(/[.\s]/g, "").includes("bcom");

      const meta = subjectSelectionMetas.find((m) => {
        if (m.subjectType.code !== subjectTypeCode) return false;
        if (!semester) return true;
        return m.forClasses.some((c: any) => extractSemesterRoman(c.class?.name) === semester);
      });
      if (meta?.label) {
        if (subjectTypeCode === "MN" && semester === "III" && isBcomProgram) {
          return "Minor III (Semester III)";
        }
        return meta.label;
      }
      switch (subjectTypeCode) {
        case "MN":
          if (semester === "I" || semester === "II") return "Minor I (Semester I & II)";
          if (semester === "III" || semester === "IV")
            return isBcomProgram ? "Minor III (Semester III)" : "Minor II (Semester III & IV)";
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
    },
    [subjectSelectionMetas, student],
  );

  const convertToSelectOptions = useCallback(
    (
      subjects: string[],
      excludeValues: string[] = [],
      selectLabel: string = "Select",
    ): { value: string; label: string }[] => {
      const options = subjects.filter((s) => !excludeValues.includes(s)).map((s) => ({ value: s, label: s }));
      return [{ value: "", label: selectLabel }, ...options];
    },
    [],
  );

  const handleFieldChange = useCallback(
    (setter: (v: string) => void, value: string, fieldType: string) => {
      setter(value);
      if (errors.length > 0 && value) {
        const fieldErrorMap: Record<string, string> = {
          minor1: "Minor I subject is required",
          minor2: "Minor II subject is required",
          minor3: "Minor subject is required",
          idc1: "IDC 1 subject is required",
          idc2: "IDC 2 subject is required",
          idc3: "IDC 3 subject is required",
          aec3: "AEC 3 subject is required",
          cvac4: "CVAC 4 subject is required",
        };
        const errorToRemove = fieldErrorMap[fieldType];
        if (errorToRemove) {
          setErrors((prev) => prev.filter((e) => e !== errorToRemove));
        }
      }
    },
    [errors.length],
  );

  return {
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
    visibleCategories,
    handleFieldChange,
  };
}
