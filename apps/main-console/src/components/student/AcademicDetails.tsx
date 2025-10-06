import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdmissionAcademicInfoDto, StudentAcademicSubjectsDto } from "@repo/db/dtos/admissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { boardService } from "@/services/board.service";
import { getAllLanguageMediums } from "@/services/language-medium.service";
import { getAllSpecializations } from "@/services/specialization.service";
import { getProgramCourses } from "@/services/course-design.api";
import { boardSubjectService } from "@/services/board-subject.service";
import { Button } from "@/components/ui/button";
import { updateAcademicInfo } from "@/services/admission-academic-info.service";
import type { BoardResultStatusType } from "@/types/enums";
import { institutionService } from "@/services/institution.service";
import { countryService } from "@/services/country.service";
import { stateService } from "@/services/state.service";
import { cityService } from "@/services/city.service";
import axiosInstance from "@/utils/api";
import { toast } from "@/hooks/useToast";

type AcademicDetailsProps = {
  studentAcademicDetails?: AdmissionAcademicInfoDto | null;
  studentId?: number;
  userId?: number;
};

type NamedRef = { id?: number; name?: string | null };
type LastSchoolAddressLoose = {
  addressLine?: string | null;
  landmark?: string | null;
  localityType?: "RURAL" | "URBAN" | null;
  country?: NamedRef | null;
  state?: NamedRef | null;
  city?: NamedRef | null;
  district?: NamedRef | null;
  pincode?: string | null;
  phone?: string | null;
};
type FormWithAddress = AdmissionAcademicInfoDto & {
  lastSchoolAddress?: LastSchoolAddressLoose | null;
  previousInstitute?: NamedRef | null;
};

function updateAddress(
  prev: FormWithAddress,
  updater: (addr: LastSchoolAddressLoose) => LastSchoolAddressLoose,
): AdmissionAcademicInfoDto {
  const current = (prev.lastSchoolAddress ?? {}) as LastSchoolAddressLoose;
  const nextAddr = updater(current);
  return { ...(prev as AdmissionAcademicInfoDto), lastSchoolAddress: nextAddr } as AdmissionAcademicInfoDto;
}

function Field({
  label,
  value,
  editable = false,
  onChange,
}: {
  label: string;
  value?: string | number | boolean | null;
  editable?: boolean;
  onChange?: (val: string | number | boolean) => void;
}) {
  const renderControl = () => {
    if (!editable) {
      return (
        <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-800 flex items-center">
          {value ?? "-"}
        </div>
      );
    }
    const v = value as unknown;
    if (typeof v === "boolean") {
      return (
        <Select value={v ? "yes" : "no"} onValueChange={(val) => onChange?.(val === "yes")}>
          <SelectTrigger className="h-10 text-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (typeof v === "number") {
      return (
        <Input
          value={Number.isFinite(v as number) ? String(v) : ""}
          type="number"
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="h-10"
        />
      );
    }
    return (
      <Input
        value={typeof v === "string" ? (v as string) : v == null ? "" : String(v)}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10"
      />
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-gray-600">{label}</Label>
      {renderControl()}
    </div>
  );
}

export default function AcademicDetails({ studentAcademicDetails, studentId, userId }: AcademicDetailsProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdmissionAcademicInfoDto | null>(studentAcademicDetails ?? null);
  const subjects: StudentAcademicSubjectsDto[] = useMemo(() => {
    const list = (form?.subjects ?? []) as StudentAcademicSubjectsDto[];
    return [...list].sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
  }, [form?.subjects]);
  const [boards, setBoards] = useState<Array<{ id: number; name: string }>>([]);
  const [languageMediums, setLanguageMediums] = useState<Array<{ id: number; name: string }>>([]);
  const [specializations, setSpecializations] = useState<Array<{ id: number; name: string }>>([]);
  const [programCourses, setProgramCourses] = useState<Array<{ id: number; name: string }>>([]);
  const [boardSubjects, setBoardSubjects] = useState<
    Array<{
      id: number;
      name: string;
      passingMarksTheory: number;
      passingMarksPractical: number;
      fullMarksTheory: number;
      fullMarksPractical: number;
    }>
  >([]);
  const boardResultOptions: BoardResultStatusType[] = ["PASS", "FAIL", "COMPARTMENTAL"];
  const [institutions, setInstitutions] = useState<Array<{ id: number; name: string }>>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const gradeOptions = ["A+", "A", "B+", "B", "C", "D", "E"];
  const resultOptions = ["PASS", "FAIL", "ABSENT"];

  const formatKey = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/Id$/i, "ID")
      .trim();

  // kept for future display-only use

  useEffect(() => {
    (async () => {
      try {
        const r = await boardService.getAllBoards(1, 100);
        setBoards((r?.data ?? []).map((b) => ({ id: b.id, name: b.name })));
      } catch {
        setBoards([]);
      }
      try {
        const langs = await getAllLanguageMediums();
        setLanguageMediums(
          (langs ?? []).map((l: { id?: number; name?: string }) => ({
            id: Number(l?.id ?? 0),
            name: String(l?.name ?? ""),
          })),
        );
      } catch {
        setLanguageMediums([]);
      }
      try {
        const specs = await getAllSpecializations();
        setSpecializations(
          (specs ?? []).map((s: { id?: number; name?: string }) => ({
            id: Number(s?.id ?? 0),
            name: String(s?.name ?? ""),
          })),
        );
      } catch {
        setSpecializations([]);
      }
      try {
        const pcs = await getProgramCourses();
        setProgramCourses(
          (pcs ?? []).map((p: { id?: number; name?: string | null }) => ({
            id: Number(p?.id ?? 0),
            name: String(p?.name ?? ""),
          })),
        );
      } catch {
        setProgramCourses([]);
      }
      try {
        const list = await institutionService.getAllInstitutions();
        setInstitutions((list ?? []).map((i) => ({ id: Number(i.id), name: String(i.name) })));
      } catch {
        setInstitutions([]);
      }
      try {
        const list = await countryService.getAllCountries();
        setCountries(
          (list ?? []).map((c: { id?: number; name?: string }) => ({
            id: Number(c.id ?? 0),
            name: String(c.name ?? ""),
          })),
        );
      } catch {
        setCountries([]);
      }
    })();
  }, []);

  // Keep local state in sync if prop changes (e.g., after save/load)
  useEffect(() => {
    setForm(studentAcademicDetails ?? null);
  }, [studentAcademicDetails]);

  useEffect(() => {
    (async () => {
      try {
        if (form?.board?.id) {
          const list = await boardSubjectService.getByBoardId(form.board.id);
          setBoardSubjects(
            (list ?? []).map((bs) => ({
              id: bs.id,
              name: bs.boardSubjectName?.name ?? "",
              passingMarksTheory: Number(bs.passingMarksTheory ?? 0),
              passingMarksPractical: Number(bs.passingMarksPractical ?? 0),
              fullMarksTheory: Number(bs.fullMarksTheory ?? 0),
              fullMarksPractical: Number(bs.fullMarksPractical ?? 0),
            })),
          );
        } else {
          setBoardSubjects([]);
        }
      } catch {
        setBoardSubjects([]);
      }
    })();
  }, [form?.board?.id]);

  // Load dependent address dropdowns
  const address = (form as FormWithAddress | null)?.lastSchoolAddress ?? null;
  const countryId = address?.country?.id;
  const stateId = address?.state?.id;
  const cityId = address?.city?.id;

  useEffect(() => {
    (async () => {
      try {
        if (countryId) {
          const list = await stateService.getStatesByCountry(countryId);
          setStates(
            (list ?? []).map((s: { id?: number; name?: string }) => ({
              id: Number(s.id ?? 0),
              name: String(s.name ?? ""),
            })),
          );
        } else {
          setStates([]);
        }
      } catch {
        setStates([]);
      }
    })();
  }, [countryId]);

  useEffect(() => {
    (async () => {
      try {
        if (stateId) {
          const list = await cityService.getCitiesByState(stateId);
          setCities(
            (list ?? []).map((c: { id?: number; name?: string }) => ({
              id: Number(c.id ?? 0),
              name: String(c.name ?? ""),
            })),
          );
        } else {
          setCities([]);
        }
      } catch {
        setCities([]);
      }
    })();
  }, [stateId]);

  useEffect(() => {
    (async () => {
      try {
        if (stateId || cityId) {
          const params = stateId ? { stateId } : { cityId };
          const res = await axiosInstance.get("/api/districts", { params });
          const list: Array<{ id: number; name: string }> = res?.data?.payload ?? [];
          setDistricts((list ?? []).map((d) => ({ id: Number(d.id), name: String(d.name) })));
        } else {
          setDistricts([]);
        }
      } catch {
        setDistricts([]);
      }
    })();
  }, [stateId, cityId]);

  // Handlers
  const handleSelectChange = (key: string, id: number, displayName: string = "") => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev } as AdmissionAcademicInfoDto &
        Partial<{
          board: { id?: number; name?: string | null };
          languageMedium: { id?: number; name?: string | null };
          specialization: { id?: number; name?: string | null };
          previouslyRegisteredProgramCourse: { id?: number; name?: string | null };
        }>;
      if (key === "board") next.board = { ...(next.board ?? {}), id, name: displayName };
      else if (key === "languageMedium") next.languageMedium = { id, name: displayName };
      else if (key === "specialization") next.specialization = { id, name: displayName };
      else if (key === "previouslyRegisteredProgramCourse")
        next.previouslyRegisteredProgramCourse = { id, name: displayName };
      return next as AdmissionAcademicInfoDto;
    });
  };

  const handleInputChange = (key: string, value: string | number | boolean) => {
    setForm((prev) => (prev ? ({ ...(prev as object), [key]: value } as unknown as AdmissionAcademicInfoDto) : prev));
  };

  const handleSubjectChangeById = (subjectId: number | undefined, field: string, value: string | number | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextSubjects = [...(prev.subjects ?? [])];
      const idx = nextSubjects.findIndex(
        (s) => Number((s as unknown as { id?: number })?.id ?? 0) === Number(subjectId),
      );
      const targetIndex = idx >= 0 ? idx : 0;
      const current = { ...(nextSubjects[targetIndex] ?? {}) } as Record<string, unknown>;
      if (field === "boardSubjectId") {
        const currBs =
          (current as unknown as { boardSubject?: { id?: number; name?: string | null } }).boardSubject ?? {};
        (current as unknown as { boardSubject: { id?: number; name?: string | null } }).boardSubject = {
          ...currBs,
          id: Number(value),
        };
        (current as unknown as { boardSubjectId?: number }).boardSubjectId = Number(value) as number;
      } else if (field === "gradeName") {
        (current as unknown as { grade: { name?: string } }).grade = { name: String(value) };
      } else {
        (current as unknown as Record<string, unknown>)[field] = value as unknown;
      }

      // Auto-calc total marks when theory or practical marks change
      if (field === "theoryMarks" || field === "practicalMarks") {
        const theory = Number((current as unknown as { theoryMarks?: number }).theoryMarks ?? 0);
        const practical = Number((current as unknown as { practicalMarks?: number }).practicalMarks ?? 0);
        (current as unknown as { totalMarks?: number }).totalMarks = theory + practical;
      }

      // Auto-calc result (PASS/FAIL) based on board subject passing marks and total marks
      const bsId = Number(
        (current as unknown as { boardSubjectId?: number }).boardSubjectId ??
          (current as unknown as { boardSubject?: { id?: number } }).boardSubject?.id ??
          0,
      );
      const bs = boardSubjects.find((b) => Number(b.id) === bsId);
      const theory = Number((current as unknown as { theoryMarks?: number }).theoryMarks ?? 0);
      const practical = Number((current as unknown as { practicalMarks?: number }).practicalMarks ?? 0);
      const total = Number((current as unknown as { totalMarks?: number }).totalMarks ?? 0);

      // If the subject has practical passing marks, student must meet both components;
      // else fall back to total >= (theory pass + practical pass)
      const hasTheoryRule = Number.isFinite(Number(bs?.passingMarksTheory ?? NaN));
      const hasPracRule = Number.isFinite(Number(bs?.passingMarksPractical ?? NaN));
      const requiredTotal = Number(bs?.passingMarksTheory ?? 0) + Number(bs?.passingMarksPractical ?? 0);

      if (hasTheoryRule || hasPracRule) {
        const pass =
          hasTheoryRule && hasPracRule
            ? theory >= Number(bs?.passingMarksTheory ?? 0) && practical >= Number(bs?.passingMarksPractical ?? 0)
            : total >= requiredTotal;
        (current as unknown as { resultStatus?: string }).resultStatus = pass ? "PASS" : "FAIL";
      }
      nextSubjects[targetIndex] = current as unknown as StudentAcademicSubjectsDto;
      return { ...prev, subjects: nextSubjects } as AdmissionAcademicInfoDto;
    });
  };

  const info = form;

  const primitiveEntries: Array<{ key: string; label: string; value: unknown }> = [];
  if (info) {
    const hidden = new Set([
      "id",
      "legacyAcademicInfoId",
      "applicationFormId",
      "boardId",
      "lastSchoolId",
      "specializationId",
      "languageMediumId",
      "previouslyRegisteredProgramCourseId",
      "otherPreviouslyRegisteredProgramCourseId",
      "previousInstituteId",
      "createdAt",
      "updatedAt",
      // Explicitly handled below
      "boardResultStatus",
      "percentageOfMarks",
      "totalPoints",
      "aggregate",
      "subjectsStudied",
      "totalScore",
      "isRegisteredForUGInCU",
      "schoolName",
      "previousInstituteName",
    ]);
    for (const [k, v] of Object.entries(info)) {
      if (typeof v !== "object" || v instanceof Date || v === null) {
        if (
          hidden.has(k) ||
          /(_id|Id)$/.test(k) ||
          ["applicationForm", "board", "lastSchoolAddress", "subjects"].includes(k)
        )
          continue;
        primitiveEntries.push({ key: k, label: formatKey(k), value: v });
      }
    }
  }

  return (
    <Card className="max-w-5xl mx-auto my-6 shadow border bg-white py-3">
      <CardHeader className="relative pb-0">
        <div className="absolute left-6 top-0 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
        <CardTitle className="pl-6 pt-3 text-xl font-semibold text-gray-800">Academic Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 [&_label]:text-xs [&_label]:text-gray-600">
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!(form as AdmissionAcademicInfoDto | null)?.id}
            onClick={async () => {
              if (!form || !(form as AdmissionAcademicInfoDto).id) return;
              const original = (studentAcademicDetails ?? {}) as Partial<AdmissionAcademicInfoDto>;
              const f = form as unknown as FormWithAddress;

              const payload: Partial<AdmissionAcademicInfoDto> = {
                id: (form as AdmissionAcademicInfoDto).id,
                applicationFormId: null, // Student reference academic info has null applicationFormId
                studentId: studentId || userId, // Set studentId for student reference
                boardId: (f.board?.id ??
                  (original as unknown as { boardId?: number; boardUniversityId?: number }).boardId ??
                  (original as unknown as { boardUniversityId?: number }).boardUniversityId) as number,
                boardResultStatus: (
                  ((f as unknown as { boardResultStatus?: string }).boardResultStatus ??
                    original.boardResultStatus ??
                    "FAIL") as string
                ).toUpperCase() as AdmissionAcademicInfoDto["boardResultStatus"],
                languageMediumId: f.languageMedium?.id ?? original.languageMediumId!,
                yearOfPassing: ((f as unknown as { yearOfPassing?: number }).yearOfPassing ??
                  original.yearOfPassing) as number,
                isRegisteredForUGInCU: ((f as unknown as { isRegisteredForUGInCU?: boolean }).isRegisteredForUGInCU ??
                  original.isRegisteredForUGInCU) as boolean,
                cuRegistrationNumber:
                  (f as unknown as { cuRegistrationNumber?: string }).cuRegistrationNumber ??
                  original.cuRegistrationNumber ??
                  null,
                previouslyRegisteredProgramCourseId: (f.previouslyRegisteredProgramCourse?.id ??
                  (
                    original as unknown as {
                      previouslyRegisteredProgramCourseId?: number;
                      previouslyRegisteredCourseId?: number;
                    }
                  ).previouslyRegisteredProgramCourseId ??
                  (original as unknown as { previouslyRegisteredCourseId?: number }).previouslyRegisteredCourseId) as
                  | number
                  | null,
                previousInstituteId: (f.previousInstitute?.id ??
                  (original as unknown as { previousInstituteId?: number; previousCollegeId?: number })
                    .previousInstituteId ??
                  (original as unknown as { previousCollegeId?: number }).previousCollegeId) as number | null,
                otherPreviouslyRegisteredProgramCourse: ((
                  f as unknown as {
                    otherPreviouslyRegisteredProgramCourse?: string;
                    otherPreviouslyRegisteredCourse?: string;
                  }
                ).otherPreviouslyRegisteredProgramCourse ??
                  (
                    original as unknown as {
                      otherPreviouslyRegisteredProgramCourse?: string;
                      otherPreviouslyRegisteredCourse?: string;
                    }
                  ).otherPreviouslyRegisteredProgramCourse ??
                  (original as unknown as { otherPreviouslyRegisteredCourse?: string })
                    .otherPreviouslyRegisteredCourse ??
                  null) as string | null,
                otherPreviousInstitute: ((f as unknown as { otherPreviousInstitute?: string; otherCollege?: string })
                  .otherPreviousInstitute ??
                  (original as unknown as { otherPreviousInstitute?: string; otherCollege?: string })
                    .otherPreviousInstitute ??
                  (original as unknown as { otherCollege?: string }).otherCollege ??
                  null) as string | null,
                rollNumber: (f as unknown as { rollNumber?: string }).rollNumber ?? original.rollNumber ?? null,
                registrationNumber:
                  (f as unknown as { registrationNumber?: string }).registrationNumber ??
                  (original as unknown as { registrationNumber?: string }).registrationNumber ??
                  null,
                schoolNumber: (f as unknown as { schoolNumber?: string }).schoolNumber ?? original.schoolNumber ?? null,
                centerNumber: (f as unknown as { centerNumber?: string }).centerNumber ?? original.centerNumber ?? null,
                admitCardId: (f as unknown as { admitCardId?: string }).admitCardId ?? original.admitCardId ?? null,
                lastSchoolName:
                  (f as unknown as { lastSchoolName?: string }).lastSchoolName ??
                  (original as unknown as { lastSchoolName?: string }).lastSchoolName ??
                  null,
                // New optional academics fields
                otherBoard: ((f as unknown as { otherBoard?: string }).otherBoard ??
                  (original as unknown as { otherBoard?: string }).otherBoard ??
                  null) as string | null,
                division: ((f as unknown as { division?: string }).division ??
                  (original as unknown as { division?: string }).division ??
                  null) as string | null,
                rank: ((f as unknown as { rank?: number }).rank ??
                  (original as unknown as { rank?: number }).rank ??
                  null) as number | null,
                subjectStudied: ((f as unknown as { subjectStudied?: string }).subjectStudied ??
                  (original as unknown as { subjectStudied?: string }).subjectStudied ??
                  null) as string | null,
                indexNumber1: ((f as unknown as { indexNumber1?: string }).indexNumber1 ??
                  (original as unknown as { indexNumber1?: string }).indexNumber1 ??
                  null) as string | null,
                indexNumber2: ((f as unknown as { indexNumber2?: string }).indexNumber2 ??
                  (original as unknown as { indexNumber2?: string }).indexNumber2 ??
                  null) as string | null,
                specializationId:
                  (f as unknown as { specializationId?: number }).specializationId ??
                  (original as unknown as { specializationId?: number }).specializationId ??
                  null,
                // Add missing fields
                percentageOfMarks: ((f as unknown as { percentageOfMarks?: number }).percentageOfMarks ??
                  original.percentageOfMarks) as number | null,
                lastSchoolAddress: f.lastSchoolAddress ?? original.lastSchoolAddress ?? null,
                studiedUpToClass: ((f as unknown as { studiedUpToClass?: number }).studiedUpToClass ??
                  (original as unknown as { studiedUpToClass?: number }).studiedUpToClass ??
                  null) as number | null,
                bestOfFour: ((f as unknown as { bestOfFour?: number }).bestOfFour ??
                  (original as unknown as { bestOfFour?: number }).bestOfFour ??
                  null) as number | null,
                oldBestOfFour: ((f as unknown as { oldBestOfFour?: number }).oldBestOfFour ??
                  (original as unknown as { oldBestOfFour?: number }).oldBestOfFour ??
                  null) as number | null,
              };

              if (Array.isArray((form as AdmissionAcademicInfoDto).subjects)) {
                payload.subjects = (form as AdmissionAcademicInfoDto).subjects!.map((s) => {
                  const subject = s as unknown as StudentAcademicSubjectsDto & { boardSubjectId?: number };
                  const bsId = subject.boardSubjectId ?? (subject.boardSubject?.id as number | undefined);
                  const normalized: StudentAcademicSubjectsDto = {
                    ...(subject as unknown as StudentAcademicSubjectsDto),
                  };
                  (normalized as unknown as { boardSubjectId?: number }).boardSubjectId = bsId;
                  return normalized;
                });
              }

              try {
                const res = await updateAcademicInfo(Number(payload.id), payload as AdmissionAcademicInfoDto);
                // Update local form state with server response (prevents manual refresh)
                const updated = (res as unknown as { payload?: AdmissionAcademicInfoDto })?.payload;
                if (updated) setForm(updated);
                // Revalidate relevant caches so StudentPage and other tabs reflect latest
                queryClient.invalidateQueries({ queryKey: ["user-profile", userId || studentId] });
                queryClient.invalidateQueries({ queryKey: ["student", String(studentId || userId || "")] });
                toast({
                  title: "Academic details updated",
                  description: "Academic info and subjects saved successfully.",
                });
              } catch {
                toast({ title: "Update failed", description: "Could not save academic details." });
              }
            }}
          >
            Save
          </Button>
        </div>
        {/* Move auto-generated fields to the bottom, after explicit controls */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Board</Label>
            <Select
              value={info?.board?.id ? String(info.board.id) : ""}
              onValueChange={(val) => {
                const selected = boards.find((b) => String(b.id) === val);
                handleSelectChange("board", Number(val), selected?.name);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder={(info?.board as { name?: string } | null)?.name || "Select board"} />
              </SelectTrigger>
              <SelectContent>
                {boards.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Board Result Status</Label>
            <Select
              value={info?.boardResultStatus ?? ""}
              onValueChange={(val) => handleInputChange("boardResultStatus", val)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {boardResultOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Other Board</Label>
            <Input
              value={(info as unknown as { otherBoard?: string } | null)?.otherBoard ?? ""}
              onChange={(e) => handleInputChange("otherBoard", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Percentage Of Marks</Label>
            <Input
              value={info?.percentageOfMarks ?? ""}
              type="number"
              onChange={(e) => handleInputChange("percentageOfMarks", Number(e.target.value))}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Registration Number</Label>
            <Input
              value={(info as unknown as { registrationNumber?: string } | null)?.registrationNumber ?? ""}
              onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Division</Label>
            <Input
              value={(info as unknown as { division?: string } | null)?.division ?? ""}
              onChange={(e) => handleInputChange("division", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Rank</Label>
            <Input
              value={(info as unknown as { rank?: number } | null)?.rank ?? ""}
              type="number"
              onChange={(e) => handleInputChange("rank", Number(e.target.value))}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Studied Up To Class</Label>
            <Input
              value={(info as unknown as { studiedUpToClass?: number } | null)?.studiedUpToClass ?? ""}
              type="number"
              onChange={(e) => handleInputChange("studiedUpToClass", Number(e.target.value))}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Best Of Four</Label>
            <Input
              value={(info as unknown as { bestOfFour?: number } | null)?.bestOfFour ?? ""}
              type="number"
              onChange={(e) => handleInputChange("bestOfFour", Number(e.target.value))}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Old Best Of Four</Label>
            <Input
              value={(info as unknown as { oldBestOfFour?: number } | null)?.oldBestOfFour ?? ""}
              type="number"
              onChange={(e) => handleInputChange("oldBestOfFour", Number(e.target.value))}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Is Registered For UG in CU</Label>
            <Select
              value={
                ((info as unknown as { isRegisteredForUGInCU?: boolean } | null)?.isRegisteredForUGInCU ?? false)
                  ? "yes"
                  : "no"
              }
              onValueChange={(val) => handleInputChange("isRegisteredForUGInCU", val === "yes")}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Last School Name</Label>
            <Input
              value={(info as unknown as { lastSchoolName?: string } | null)?.lastSchoolName ?? ""}
              onChange={(e) => handleInputChange("lastSchoolName", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Specialization</Label>
            <Select
              value={String(info?.specialization?.id ?? "")}
              onValueChange={(val) => {
                const selected = specializations.find((s) => String(s.id) === val);
                handleSelectChange("specialization", Number(val), selected?.name);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue
                  placeholder={
                    (info as unknown as { specializationName?: string })?.specializationName ?? "Select specialization"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Subject Studied</Label>
            <Input
              value={(info as unknown as { subjectStudied?: string } | null)?.subjectStudied ?? ""}
              onChange={(e) => handleInputChange("subjectStudied", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Index Number 1</Label>
            <Input
              value={(info as unknown as { indexNumber1?: string } | null)?.indexNumber1 ?? ""}
              onChange={(e) => handleInputChange("indexNumber1", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Index Number 2</Label>
            <Input
              value={(info as unknown as { indexNumber2?: string } | null)?.indexNumber2 ?? ""}
              onChange={(e) => handleInputChange("indexNumber2", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Language Medium</Label>
            <Select
              value={String(info?.languageMedium?.id ?? "")}
              onValueChange={(val) => {
                const selected = languageMediums.find((l) => String(l.id) === val);
                handleSelectChange("languageMedium", Number(val), selected?.name);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue
                  placeholder={
                    (info as unknown as { languageMediumName?: string })?.languageMediumName ?? "Select language medium"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {languageMediums.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Roll Number</Label>
            <Input
              value={(info as unknown as { rollNumber?: string } | null)?.rollNumber ?? ""}
              onChange={(e) => handleInputChange("rollNumber", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">School Number</Label>
            <Input
              value={(info as unknown as { schoolNumber?: string } | null)?.schoolNumber ?? ""}
              onChange={(e) => handleInputChange("schoolNumber", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Previously Registered Program Course</Label>
            <Select
              value={String(
                info?.previouslyRegisteredProgramCourse?.id ??
                  (info as unknown as { previouslyRegisteredProgramCourseId?: number } | null)
                    ?.previouslyRegisteredProgramCourseId ??
                  "",
              )}
              onValueChange={(val) => {
                const selected = programCourses.find((p) => String(p.id) === val);
                handleSelectChange("previouslyRegisteredProgramCourse", Number(val), selected?.name);
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue
                  placeholder={
                    (info as unknown as { previouslyRegisteredProgramCourseName?: string })
                      ?.previouslyRegisteredProgramCourseName ?? "Select program course"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {programCourses.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Previous Institute</Label>
            <Select
              value={String((info as FormWithAddress | null)?.previousInstitute?.id ?? "")}
              onValueChange={(val) =>
                handleSelectChange(
                  "previousInstitute",
                  Number(val),
                  institutions.find((i) => String(i.id) === val)?.name,
                )
              }
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue
                  placeholder={
                    (info as unknown as { previousInstituteName?: string } | null)?.previousInstituteName ??
                    "Select institute"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-1.5 rounded bg-gradient-to-b from-violet-500 to-purple-400" />
            <div className="text-sm font-semibold text-gray-800">Last School Address</div>
            <div className="flex-1 border-b border-gray-200 ml-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Address Line</Label>
              <Input
                value={(info as FormWithAddress | null)?.lastSchoolAddress?.addressLine ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({ ...a, addressLine: e.target.value }))
                      : prev,
                  )
                }
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Landmark</Label>
              <Input
                value={(info as FormWithAddress | null)?.lastSchoolAddress?.landmark ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? updateAddress(prev as FormWithAddress, (a) => ({ ...a, landmark: e.target.value })) : prev,
                  )
                }
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Locality Type</Label>
              <Select
                value={(info as FormWithAddress | null)?.lastSchoolAddress?.localityType ?? ""}
                onValueChange={(val) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({
                          ...a,
                          localityType: val as "RURAL" | "URBAN",
                        }))
                      : prev,
                  )
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select locality type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RURAL">RURAL</SelectItem>
                  <SelectItem value="URBAN">URBAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Country</Label>
              <Select
                value={String((info as FormWithAddress | null)?.lastSchoolAddress?.country?.id ?? "")}
                onValueChange={(val) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({
                          ...a,
                          country: { id: Number(val), name: countries.find((c) => String(c.id) === val)?.name || "" },
                        }))
                      : prev,
                  )
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue
                    placeholder={(info as FormWithAddress | null)?.lastSchoolAddress?.country?.name ?? "Select country"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">State</Label>
              <Select
                value={String((info as FormWithAddress | null)?.lastSchoolAddress?.state?.id ?? "")}
                onValueChange={(val) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({
                          ...a,
                          state: { id: Number(val), name: states.find((s) => String(s.id) === val)?.name || "" },
                        }))
                      : prev,
                  )
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue
                    placeholder={(info as FormWithAddress | null)?.lastSchoolAddress?.state?.name ?? "Select state"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">City</Label>
              <Select
                value={String((info as FormWithAddress | null)?.lastSchoolAddress?.city?.id ?? "")}
                onValueChange={(val) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({
                          ...a,
                          city: { id: Number(val), name: cities.find((c) => String(c.id) === val)?.name || "" },
                        }))
                      : prev,
                  )
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue
                    placeholder={(info as FormWithAddress | null)?.lastSchoolAddress?.city?.name ?? "Select city"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">District</Label>
              <Select
                value={String(
                  ((info as FormWithAddress | null)?.lastSchoolAddress?.district as NamedRef | null)?.id ?? "",
                )}
                onValueChange={(val) =>
                  setForm((prev) =>
                    prev
                      ? updateAddress(prev as FormWithAddress, (a) => ({
                          ...a,
                          district: { id: Number(val), name: districts.find((d) => String(d.id) === val)?.name || "" },
                        }))
                      : prev,
                  )
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue
                    placeholder={
                      ((info as FormWithAddress | null)?.lastSchoolAddress?.district as NamedRef | null)?.name ??
                      "Select district"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Pincode</Label>
              <Input
                value={(info as FormWithAddress | null)?.lastSchoolAddress?.pincode ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? updateAddress(prev as FormWithAddress, (a) => ({ ...a, pincode: e.target.value })) : prev,
                  )
                }
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">Phone</Label>
              <Input
                value={(info as FormWithAddress | null)?.lastSchoolAddress?.phone ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? updateAddress(prev as FormWithAddress, (a) => ({ ...a, phone: e.target.value })) : prev,
                  )
                }
                className="h-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-1.5 rounded bg-gradient-to-b from-violet-500 to-purple-400" />
            <div className="text-sm font-semibold text-gray-800">Subjects</div>
            <div className="flex-1 border-b border-gray-200 ml-2" />
          </div>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-3 py-2">#</th>
                  <th className="text-left font-medium px-3 py-2">Subject</th>
                  <th className="text-left font-medium px-3 py-2">Theory</th>
                  <th className="text-left font-medium px-3 py-2">Practical</th>
                  <th className="text-left font-medium px-3 py-2">Full</th>
                  <th className="text-left font-medium px-3 py-2">Total</th>
                  <th className="text-left font-medium px-3 py-2">Grade</th>
                  <th className="text-left font-medium px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                      No subjects available
                    </td>
                  </tr>
                ) : (
                  subjects.map((s, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2 text-gray-700">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-800">
                        <Select
                          value={s.boardSubject?.id ? String(s.boardSubject.id) : ""}
                          onValueChange={(val) =>
                            handleSubjectChangeById(
                              (s as unknown as { id?: number })?.id,
                              "boardSubjectId",
                              Number(val),
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder={s.boardSubject?.boardSubjectName?.name ?? "Select subject"} />
                          </SelectTrigger>
                          <SelectContent>
                            {boardSubjects.map((bs) => (
                              <SelectItem key={bs.id} value={String(bs.id)}>
                                {bs.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <Input
                          value={(s as unknown as { theoryMarks?: number } | null)?.theoryMarks ?? ""}
                          type="number"
                          min={0}
                          max={100}
                          className="h-8"
                          onChange={(e) =>
                            handleSubjectChangeById(
                              (s as unknown as { id?: number })?.id,
                              "theoryMarks",
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <Input
                          value={(s as unknown as { practicalMarks?: number } | null)?.practicalMarks ?? ""}
                          type="number"
                          min={0}
                          max={100}
                          className="h-8"
                          onChange={(e) =>
                            handleSubjectChangeById(
                              (s as unknown as { id?: number })?.id,
                              "practicalMarks",
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {(() => {
                          const bsId = Number(
                            (s as unknown as { boardSubjectId?: number }).boardSubjectId ??
                              (s as unknown as { boardSubject?: { id?: number } }).boardSubject?.id ??
                              0,
                          );
                          const bs = boardSubjects.find((b) => Number(b.id) === bsId);
                          const fullMarks = Number(bs?.fullMarksTheory ?? 0) + Number(bs?.fullMarksPractical ?? 0);
                          return Number.isFinite(fullMarks) && fullMarks > 0 ? fullMarks : "-";
                        })()}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <Input
                          value={(s as unknown as { totalMarks?: number } | null)?.totalMarks ?? ""}
                          type="number"
                          min={0}
                          max={100}
                          className="h-8"
                          onChange={(e) =>
                            handleSubjectChangeById(
                              (s as unknown as { id?: number })?.id,
                              "totalMarks",
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <Select
                          value={(s as unknown as { grade?: { name?: string } } | null)?.grade?.name ?? ""}
                          onValueChange={(val) =>
                            handleSubjectChangeById((s as unknown as { id?: number })?.id, "gradeName", val)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <Select
                          value={(s as unknown as { resultStatus?: string } | null)?.resultStatus ?? ""}
                          onValueChange={(val) =>
                            handleSubjectChangeById((s as unknown as { id?: number })?.id, "resultStatus", val)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Result" />
                          </SelectTrigger>
                          <SelectContent>
                            {resultOptions.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {primitiveEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {primitiveEntries.map((p) => (
              <Field
                key={p.key}
                label={p.label}
                value={p.value as unknown as string | number | boolean | null}
                editable
                onChange={(val) => handleInputChange(p.key, val)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
