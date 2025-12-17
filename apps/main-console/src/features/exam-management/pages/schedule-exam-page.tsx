/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileSpreadsheet,
  Users,
  Calendar,
  ClipboardList,
  Download,
  Play,
  AlertTriangle,
  DoorOpen,
  BookOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getAllExamTypes, type ExamTypeT } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAffiliations, getRegulationTypes, getProgramCourseDtos } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getSubjectTypes, getExamComponents } from "@/services/course-design.api";
import { getPapersPaginated } from "@/services/course-design.api";
import { getAllSubjects } from "@/services/subject.api";
import { getAllRooms } from "@/services/room.service";
import { getAllFloors, type FloorT } from "@/services/floor.service";
import { countStudentsForExam, getStudentsForExam, type StudentWithSeat } from "@/services/exam-schedule.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import type { Class } from "@/types/academics/class";
import type {
  SubjectType,
  PaperDto,
  Affiliation,
  RegulationType,
  ExamDto,
  ExamSubjectT,
  ExamRoomDto,
  RoomDto,
  ProgramCourseDto,
  ExamProgramCourseDto,
} from "@repo/db";
import type { Shift } from "@/types/academics/shift";
import type { Subject } from "@repo/db";
import type { ExamComponent } from "@/types/course-design";
import type { ExamComponent as ExamComponentDb } from "@repo/db";
import { doAssignExam } from "../services";
import { AccordionSection } from "../components/AccordionSection";
import { RoomsModal } from "../components/RoomsModal";
import { MultiSelect as MultiSelectAdvance, type MultiSelectAdvanceOption } from "@/components/ui/MultiSelectAdvance";

interface SelectedRoom extends RoomDto {
  capacity: number;
  maxStudentsPerBenchOverride?: number;
}

interface Schedule {
  date: string;
  startTime: string;
  endTime: string;
}

export default function ScheduleExamPage() {
  // Academic Year hook - get current academic year from Redux slice
  const { currentAcademicYear, availableAcademicYears, loadAcademicYears } = useAcademicYear();

  // API Data States
  const [examTypes, setExamTypes] = useState<ExamTypeT[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseDto[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [papers, setPapers] = useState<PaperDto[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [floors, setFloors] = useState<FloorT[]>([]);
  const [examComponents, setExamComponents] = useState<ExamComponent[]>([]);
  const [loading, setLoading] = useState({
    examTypes: true,
    classes: true,
    programCourses: true,
    shifts: true,
    subjectTypes: true,
    papers: false,
    subjects: false,
    rooms: false,
    floors: false,
    examComponents: false,
    affiliations: false,
    regulationTypes: false,
  });

  // Step 1: Exam Information
  const [examType, setExamType] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [selectedProgramCourses, setSelectedProgramCourses] = useState<number[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [selectedSubjectCategories, setSelectedSubjectCategories] = useState<number[]>([]);
  //   const [selectedSubjectId] = useState<number | null>(null);
  const [selectedExamComponent, setSelectedExamComponent] = useState<number | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<number | null>(null);
  const [selectedRegulationTypeId, setSelectedRegulationTypeId] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsWithSeats, setStudentsWithSeats] = useState<StudentWithSeat[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Step 2: Room Selection
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | null>(null);
  const [assignBy, setAssignBy] = useState<"CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER">("UID");
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [studentsPerBench, setStudentsPerBench] = useState(2);

  // Step 3: Exam Schedule (keyed by subjectId)
  const [subjectSchedules, setSubjectSchedules] = useState<Record<string, Schedule>>({});
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Accordion states
  const [openExamInfo, setOpenExamInfo] = useState(true);
  const [openRoomSelection, setOpenRoomSelection] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openAssignments, setOpenAssignments] = useState(false);

  // Rooms modal states
  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [tempSelectedRooms, setTempSelectedRooms] = useState<number[]>([]);
  const [tempOverrides, setTempOverrides] = useState<Record<number, number>>({});

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading((prev) => ({ ...prev, examTypes: true }));
        const examTypesRes = await getAllExamTypes();
        if (examTypesRes.httpStatus === "SUCCESS" && examTypesRes.payload) {
          setExamTypes(examTypesRes.payload);
        }
      } catch (error) {
        console.error("Error fetching exam types:", error);
        toast.error("Failed to load exam types");
      } finally {
        setLoading((prev) => ({ ...prev, examTypes: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, classes: true }));
        const classesData = await getAllClasses();
        setClasses(Array.isArray(classesData) ? classesData : []);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setLoading((prev) => ({ ...prev, classes: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, programCourses: true }));
        const programCoursesData = await getProgramCourseDtos();
        setProgramCourses(Array.isArray(programCoursesData) ? programCoursesData : []);
      } catch (error) {
        console.error("Error fetching program courses:", error);
        toast.error("Failed to load program courses");
      } finally {
        setLoading((prev) => ({ ...prev, programCourses: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, shifts: true }));
        const shiftsData = await getAllShifts();
        setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      } catch (error) {
        console.error("Error fetching shifts:", error);
        toast.error("Failed to load shifts");
      } finally {
        setLoading((prev) => ({ ...prev, shifts: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, subjectTypes: true }));
        const subjectTypesData = await getSubjectTypes();
        setSubjectTypes(Array.isArray(subjectTypesData) ? subjectTypesData : []);
      } catch (error) {
        console.error("Error fetching subject types:", error);
        toast.error("Failed to load subject types");
      } finally {
        setLoading((prev) => ({ ...prev, subjectTypes: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, subjects: true }));
        const subjectsData = await getAllSubjects();
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setLoading((prev) => ({ ...prev, subjects: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, affiliations: true }));
        const affiliationsData = await getAffiliations();
        setAffiliations(Array.isArray(affiliationsData) ? affiliationsData : []);
      } catch (error) {
        console.error("Error fetching affiliations:", error);
        toast.error("Failed to load affiliations");
      } finally {
        setLoading((prev) => ({ ...prev, affiliations: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, regulationTypes: true }));
        const regulationTypesData = await getRegulationTypes();
        setRegulationTypes(Array.isArray(regulationTypesData) ? regulationTypesData : []);
      } catch (error) {
        console.error("Error fetching regulation types:", error);
        toast.error("Failed to load regulation types");
      } finally {
        setLoading((prev) => ({ ...prev, regulationTypes: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, rooms: true }));
        const roomsRes = await getAllRooms();
        if (roomsRes.httpStatus === "SUCCESS" && roomsRes.payload) {
          setRooms(roomsRes.payload);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to load rooms");
      } finally {
        setLoading((prev) => ({ ...prev, rooms: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, floors: true }));
        const floorsRes = await getAllFloors();
        if (floorsRes.httpStatus === "SUCCESS" && floorsRes.payload) {
          setFloors(floorsRes.payload);
        }
      } catch (error) {
        console.error("Error fetching floors:", error);
        toast.error("Failed to load floors");
      } finally {
        setLoading((prev) => ({ ...prev, floors: false }));
      }

      try {
        setLoading((prev) => ({ ...prev, examComponents: true }));
        const examComponentsData = await getExamComponents();
        const mappedComponents: ExamComponent[] = Array.isArray(examComponentsData)
          ? examComponentsData.map((comp: ExamComponentDb) => {
              // Handle both isActive (from @repo/db) and disabled (from @/types/course-design)
              const isDisabled =
                (comp as { isActive?: boolean | null }).isActive === false ||
                (comp as { disabled?: boolean }).disabled === true;
              return {
                id: comp.id,
                name: comp.name,
                shortName: comp.shortName ?? null,
                code: comp.code ?? null,
                sequence: comp.sequence ?? null,
                disabled: isDisabled,
                createdAt: comp.createdAt,
                updatedAt: comp.updatedAt,
              };
            })
          : [];
        setExamComponents(mappedComponents);
      } catch (error) {
        console.error("Error fetching exam components:", error);
        toast.error("Failed to load exam components");
      } finally {
        setLoading((prev) => ({ ...prev, examComponents: false }));
      }

      try {
        await loadAcademicYears();
      } catch (error) {
        console.error("Error fetching academic years:", error);
        toast.error("Failed to load academic years");
      }
    };

    void fetchInitialData();
  }, [loadAcademicYears]);

  // Fetch papers when filters change
  const fetchPapers = useCallback(async () => {
    if (selectedProgramCourses.length === 0 || !semester) {
      setPapers([]);
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, papers: true }));
      const classObj = classes.find((c) => c.id?.toString() === semester);
      const classId = classObj?.id;

      const allPapers: PaperDto[] = [];
      const seenPaperIds = new Set<number>();

      const subjectTypesToUse = selectedSubjectCategories.length > 0 ? selectedSubjectCategories : [];

      if (subjectTypesToUse.length === 0) {
        for (const programCourseId of selectedProgramCourses) {
          try {
            const papersData = await getPapersPaginated(1, 1000, {
              academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
              affiliationId: selectedAffiliationId ?? null,
              regulationTypeId: selectedRegulationTypeId ?? null,
              programCourseId: programCourseId,
              classId: classId ?? null,
              subjectTypeId: null,
            });

            if (papersData?.content) {
              for (const paper of papersData.content) {
                if (paper.id && !seenPaperIds.has(paper.id)) {
                  seenPaperIds.add(paper.id);
                  allPapers.push(paper);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching papers for program course ${programCourseId}:`, error);
          }
        }
      } else {
        for (const programCourseId of selectedProgramCourses) {
          for (const subjectTypeId of subjectTypesToUse) {
            try {
              const papersData = await getPapersPaginated(1, 1000, {
                academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
                affiliationId: selectedAffiliationId ?? null,
                regulationTypeId: selectedRegulationTypeId ?? null,
                programCourseId: programCourseId,
                classId: classId ?? null,
                subjectTypeId: subjectTypeId,
              });

              if (papersData?.content) {
                for (const paper of papersData.content) {
                  if (paper.id && !seenPaperIds.has(paper.id)) {
                    seenPaperIds.add(paper.id);
                    allPapers.push(paper);
                  }
                }
              }
            } catch (error) {
              console.error(
                `Error fetching papers for program course ${programCourseId} and subject type ${subjectTypeId}:`,
                error,
              );
            }
          }
        }
      }

      setPapers(allPapers);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load papers");
      setPapers([]);
    } finally {
      setLoading((prev) => ({ ...prev, papers: false }));
    }
  }, [
    selectedProgramCourses,
    semester,
    selectedSubjectCategories,
    classes,
    selectedAcademicYearId,
    selectedAffiliationId,
    selectedRegulationTypeId,
    currentAcademicYear?.id,
  ]);

  useEffect(() => {
    void fetchPapers();
  }, [fetchPapers]);

  const getAvailablePapers = useCallback((): PaperDto[] => {
    let filtered = papers.filter((paper) => paper.isActive !== false);

    if (selectedExamComponent !== null) {
      filtered = filtered.filter((paper) => {
        return (
          paper.components &&
          Array.isArray(paper.components) &&
          paper.components.some((component) => component.examComponent?.id === selectedExamComponent)
        );
      });
    }

    return filtered;
  }, [papers, selectedExamComponent]);

  const getDistinctSubjects = (): Array<{
    subjectId: number | null;
    subjectName: string;
    subjectCode: string | null;
  }> => {
    const availablePapers = getAvailablePapers();
    const subjectMap = new Map<number | null, { name: string; code: string | null }>();

    availablePapers.forEach((paper) => {
      if (paper.subjectId) {
        const subject = subjects.find((s) => s.id === paper.subjectId);
        const subjectName = subject?.name || `Subject ID: ${paper.subjectId}`;
        const subjectCode = subject?.code || null;
        if (!subjectMap.has(paper.subjectId)) {
          subjectMap.set(paper.subjectId, { name: subjectName, code: subjectCode });
        }
      } else {
        if (!subjectMap.has(null)) {
          subjectMap.set(null, { name: "Unknown Subject", code: null });
        }
      }
    });

    return Array.from(subjectMap.entries()).map(([subjectId, subjectData]) => ({
      subjectId,
      subjectName: subjectData.name,
      subjectCode: subjectData.code,
    }));
  };

  //   const getPapersForSelectedSubject = useCallback((): PaperDto[] => {
  //     if (!selectedSubjectId) return [];
  //     return getAvailablePapers().filter((paper) => paper.subjectId === selectedSubjectId);
  //   }, [selectedSubjectId, getAvailablePapers]);

  const getPaperIdsForSelectedSubjects = useCallback((): number[] => {
    if (selectedSubjectIds.length === 0) return [];

    const paperIds = new Set<number>();
    selectedSubjectIds.forEach((subjectId) => {
      const subjectPapers = getAvailablePapers().filter((paper) => paper.subjectId === subjectId && paper.id);
      subjectPapers.forEach((paper) => {
        if (paper.id) paperIds.add(paper.id);
      });
    });

    return Array.from(paperIds);
  }, [selectedSubjectIds, getAvailablePapers]);

  // Fetch student count from API based on selected subject
  //   useEffect(() => {
  //     const fetchStudentCount = async () => {
  //       if (!currentAcademicYear?.id) {
  //         console.log("[SCHEDULE-EXAM] Waiting for academic year to be loaded...");
  //         setTotalStudents(0);
  //         return;
  //       }

  //       if (selectedProgramCourses.length === 0 || !semester || !selectedSubjectId) {
  //         setTotalStudents(0);
  //         return;
  //       }

  //       const papersForSubject = getPapersForSelectedSubject();
  //       const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

  //       if (paperIds.length === 0) {
  //         setTotalStudents(0);
  //         return;
  //       }

  //       try {
  //         const classObj = classes.find((c) => c.id?.toString() === semester);
  //         if (!classObj?.id) {
  //           setTotalStudents(0);
  //           return;
  //         }

  //         const response = await countStudentsForExam({
  //           classId: classObj.id,
  //           programCourseIds: selectedProgramCourses,
  //           paperIds,
  //           academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
  //           shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
  //         });

  //         if (response.httpStatus === "SUCCESS" && response.payload) {
  //           setTotalStudents(response.payload.count);
  //         } else {
  //           setTotalStudents(0);
  //         }
  //       } catch (error) {
  //         console.error("[SCHEDULE-EXAM] Error fetching student count:", error);
  //         setTotalStudents(0);
  //       }
  //     };

  //     void fetchStudentCount();
  //   }, [
  //     selectedProgramCourses,
  //     selectedShifts,
  //     semester,
  //     selectedSubjectId,
  //     classes,
  //     currentAcademicYear,
  //     getPapersForSelectedSubject,
  //     selectedAcademicYearId,
  //   ]);

  useEffect(() => {
    const fetchStudentCount = async () => {
      if (!currentAcademicYear?.id) {
        setTotalStudents(0);
        return;
      }

      if (selectedProgramCourses.length === 0 || !semester || selectedSubjectIds.length === 0) {
        setTotalStudents(0);
        return;
      }

      const paperIds = getPaperIdsForSelectedSubjects();

      if (paperIds.length === 0) {
        setTotalStudents(0);
        return;
      }

      try {
        const classObj = classes.find((c) => c.id?.toString() === semester);
        if (!classObj?.id) {
          setTotalStudents(0);
          return;
        }

        const response = await countStudentsForExam({
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
        });

        if (response.httpStatus === "SUCCESS" && response.payload) {
          setTotalStudents(response.payload.count);
        } else {
          setTotalStudents(0);
        }
      } catch (error) {
        console.error("[SCHEDULE-EXAM] Error fetching student count:", error);
        setTotalStudents(0);
      }
    };

    void fetchStudentCount();
  }, [
    selectedProgramCourses,
    selectedShifts,
    semester,
    selectedSubjectIds, // ← now uses multiple subjects
    classes,
    currentAcademicYear,
    getPaperIdsForSelectedSubjects, // ← new dependency
    selectedAcademicYearId,
  ]);

  useEffect(() => {
    const capacity = selectedRooms.reduce((total, room) => {
      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
      const numberOfBenches = room.numberOfBenches || 0;
      return total + numberOfBenches * maxStudentsPerBench;
    }, 0);
    setTotalCapacity(capacity);
  }, [selectedRooms]);

  // Fetch students with seat assignments when rooms are selected
  //   useEffect(() => {
  //     const fetchStudentsWithSeats = async () => {
  //       if (
  //         selectedRooms.length === 0 ||
  //         selectedProgramCourses.length === 0 ||
  //         !semester ||
  //         !selectedSubjectIds ||
  //         !currentAcademicYear?.id
  //       ) {
  //         setStudentsWithSeats([]);
  //         return;
  //       }

  //       const papersForSubject = getPapersForSelectedSubjects();
  //       const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

  //       if (paperIds.length === 0) {
  //         setStudentsWithSeats([]);
  //         return;
  //       }

  //       try {
  //         setLoadingStudents(true);
  //         const classObj = classes.find((c) => c.id?.toString() === semester);
  //         if (!classObj?.id) {
  //           setStudentsWithSeats([]);
  //           return;
  //         }

  //         const roomAssignments = selectedRooms
  //           .filter((room) => room.id !== undefined && room.id !== null)
  //           .map((room) => {
  //             const floor = floors.find((f) => f.id === room.floor.id);
  //             const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
  //             return {
  //               roomId: room.id!,
  //               floorId: room.floor.id,
  //               floorName: floor?.name || null,
  //               roomName: room.name || `Room ${room.id}`,
  //               maxStudentsPerBench,
  //               numberOfBenches: room.numberOfBenches || 0,
  //             };
  //           });

  //         const response = await getStudentsForExam({
  //           classId: classObj.id,
  //           programCourseIds: selectedProgramCourses,
  //           paperIds,
  //           academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
  //           shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
  //           assignBy: assignBy === "UID" ? "UID" : "CU_ROLL_NUMBER",
  //           roomAssignments,
  //         });

  //         if (response.httpStatus === "SUCCESS" && response.payload) {
  //           setStudentsWithSeats(response.payload.students);
  //         } else {
  //           setStudentsWithSeats([]);
  //         }
  //       } catch (error) {
  //         console.error("[SCHEDULE-EXAM] Error fetching students with seats:", error);
  //         setStudentsWithSeats([]);
  //       } finally {
  //         setLoadingStudents(false);
  //       }
  //     };

  //     void fetchStudentsWithSeats();
  //   }, [
  //     selectedRooms,
  //     selectedProgramCourses,
  //     selectedShifts,
  //     semester,
  //     selectedSubjectId,
  //     classes,
  //     currentAcademicYear,
  //     assignBy,
  //     floors,
  //     getPapersForSelectedSubject,
  //     selectedAcademicYearId,
  //   ]);

  useEffect(() => {
    const fetchStudentsWithSeats = async () => {
      if (
        selectedRooms.length === 0 ||
        selectedProgramCourses.length === 0 ||
        !semester ||
        selectedSubjectIds.length === 0 || // ← changed from !selectedSubjectId
        !currentAcademicYear?.id
      ) {
        setStudentsWithSeats([]);
        return;
      }

      const paperIds = getPaperIdsForSelectedSubjects();

      if (paperIds.length === 0) {
        setStudentsWithSeats([]);
        return;
      }

      try {
        setLoadingStudents(true);
        const classObj = classes.find((c) => c.id?.toString() === semester);
        if (!classObj?.id) {
          setStudentsWithSeats([]);
          return;
        }

        const roomAssignments = selectedRooms
          .filter((room) => room.id !== undefined && room.id !== null)
          .map((room) => {
            const floor = floors.find((f) => f.id === room.floor.id);
            const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
            return {
              roomId: room.id!,
              floorId: room.floor.id,
              floorName: floor?.name || null,
              roomName: room.name || `Room ${room.id}`,
              maxStudentsPerBench,
              numberOfBenches: room.numberOfBenches || 0,
            };
          });

        const response = await getStudentsForExam({
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
          assignBy: assignBy === "UID" ? "UID" : "CU_ROLL_NUMBER",
          roomAssignments,
        });

        if (response.httpStatus === "SUCCESS" && response.payload) {
          setStudentsWithSeats(response.payload.students);
        } else {
          setStudentsWithSeats([]);
        }
      } catch (error) {
        console.error("[SCHEDULE-EXAM] Error fetching students with seats:", error);
        setStudentsWithSeats([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    void fetchStudentsWithSeats();
  }, [
    selectedRooms,
    selectedProgramCourses,
    selectedShifts,
    semester,
    selectedSubjectIds, // ← changed
    classes,
    currentAcademicYear,
    assignBy,
    floors,
    getPaperIdsForSelectedSubjects, // ← changed
    selectedAcademicYearId,
  ]);

  const handleScheduleChange = (subjectId: number | string | null, field: keyof Schedule, value: string) => {
    if (subjectId === null) return;
    const id = typeof subjectId === "number" ? subjectId.toString() : subjectId;
    setSubjectSchedules((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      } as Schedule,
    }));
  };

  // Keep selected academic year in sync with current academic year by default
  useEffect(() => {
    if (currentAcademicYear?.id && selectedAcademicYearId === null) {
      setSelectedAcademicYearId(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYearId]);

  const handleAssignExam = async () => {
    const examSubjects: ExamSubjectT[] = [];
    console.log("[SCHEDULE-EXAM] Selected subject IDs:", selectedSubjectIds);
    console.log("[SCHEDULE-EXAM] Subject schedules:", subjectSchedules);
    // for (const subjectId in selectedSubjectIds) {
    //     console.log("[SCHEDULE-EXAM] Subject ID:", selectedSubjectIds[subjectId]);

    //   examSubjects.push({
    //     subjectId: Number(selectedSubjectIds[subjectId]),
    //     startTime: new Date(subjectSchedules[selectedSubjectIds[subjectId]!]?.startTime || ""),
    //     endTime: new Date(subjectSchedules[selectedSubjectIds[subjectId]!]?.endTime || ""),
    //     examId: 0,
    //     id: 0,
    //     createdAt: null,
    //     updatedAt: null,
    //   });
    //   console.log("[SCHEDULE-EXAM] Exam subject:", examSubjects);
    //   console.log("[SCHEDULE-EXAM] Subject ID:", subjectId);
    //   console.log("[SCHEDULE-EXAM] Subject start time:", subjectSchedules[subjectId]?.startTime);
    //   console.log("[SCHEDULE-EXAM] Subject end time:", subjectSchedules[subjectId]?.endTime);
    // }

    for (const subjectId of selectedSubjectIds) {
      const schedule = subjectSchedules[subjectId];

      if (!schedule?.date || !schedule?.startTime || !schedule?.endTime) {
        console.warn(`[SCHEDULE-EXAM] Incomplete schedule for subject ${subjectId}`, schedule);
        continue;
      }

      const startDateTime = `${schedule.date}T${schedule.startTime}:00+05:30`;
      const endDateTime = `${schedule.date}T${schedule.endTime}:00+05:30`;

      examSubjects.push({
        subjectId: subjectId,
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        examId: 0,
        id: 0,
        createdAt: null,
        updatedAt: null,
      });

      console.log("[SCHEDULE-EXAM] Exam subject pushed:", {
        subjectId,
        startDateTime,
        endDateTime,
      });
    }

    if (examSubjects.length === 0) {
      toast.error("Please set schedule for at least one subject");
      return;
    }

    // Validate required data before proceeding
    if (selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    if (!selectedAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }

    if (!semester) {
      toast.error("Please select a semester");
      return;
    }

    if (!examType) {
      toast.error("Please select an exam type");
      return;
    }

    const academicYear = availableAcademicYears.find((ay) => ay.id === selectedAcademicYearId);
    if (!academicYear) {
      toast.error("Selected academic year not found");
      return;
    }

    const classObj = classes.find((c) => c.id?.toString() === semester);
    if (!classObj) {
      toast.error("Selected semester/class not found");
      return;
    }

    const examTypeObj = examTypes.find((et) => et.id?.toString() === examType);
    if (!examTypeObj) {
      toast.error("Selected exam type not found");
      return;
    }

    const locations: ExamRoomDto[] = selectedRooms
      .filter((room) => room.id !== undefined && room.id !== null)
      .map((room) => {
        const foundRoom = rooms.find((r) => r.id === room.id);
        if (!foundRoom) {
          throw new Error(`Room with id ${room.id} not found`);
        }
        return {
          roomId: room.id!,
          studentsPerBench: room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2,
          capacity: room.capacity,
          room: foundRoom,
          examId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          id: 0,
        };
      });

    const tmpExamAssignment: ExamDto = {
      orderType: assignBy,
      academicYear: availableAcademicYears.find((ay) => ay.id === selectedAcademicYearId)!,
      class: classes.find((c) => c.id?.toString() === semester)!,
      examType: examTypes.find((et) => et.id?.toString() === examType)!,
      examProgramCourses: programCourses
        .filter((pc) => selectedProgramCourses.includes(pc.id!))
        .map(
          (pc): ExamProgramCourseDto => ({
            examId: 0,
            programCourse: pc,
            createdAt: new Date(),
            updatedAt: new Date(),
            id: 0,
          }),
        ),
      examShifts: shifts
        .filter((s) => selectedShifts.includes(s.id!))
        .map((sh) => ({
          examId: 0,
          shift: sh,
        })),
      // subject: subjects.find(s => s.id === selectedSubjectId)!,
      // examComponent: examComponents.find(ec => ec.id === selectedExamComponent!) || null,
      examSubjectTypes: subjectTypes
        .filter((st) => selectedSubjectCategories.includes(st.id!))
        .map((st) => ({
          examId: 0,
          subjectType: st,
        })),
      gender: gender,
      examSubjects: examSubjects.map((es) => ({
        ...es,
        subject: subjects.find((ele) => ele.id === es.subjectId)!,
      })),
      locations,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: 0,
      legacyExamAssginmentId: null,
    };

    try {
      const response = await doAssignExam(tmpExamAssignment);
      console.log("In exam assignment post api, response:", response);
      toast.success(`Successfully assigned exam to the students`);
      setOpenAssignments(true);
    } catch (error) {
      console.log("In exam assignment post api, error:", error);
      toast.error(`Something went wrong while assigning exam!`);
    }
  };

  // Rooms modal handlers
  const openRoomsModalHandler = () => {
    setTempSelectedRooms(selectedRooms.map((r) => r.id).filter((id): id is number => id !== undefined && id !== null));
    const clone: Record<number, number> = {};
    selectedRooms.forEach((r) => {
      if (r.id !== undefined && r.id !== null && r.maxStudentsPerBenchOverride) {
        clone[r.id] = r.maxStudentsPerBenchOverride;
      }
    });
    setTempOverrides(clone);
    setRoomsModalOpen(true);
  };

  const toggleTempRoom = (roomId: number) => {
    setTempSelectedRooms((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]));
  };

  const setTempOverride = (roomId: number, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setTempOverrides((prev) => ({ ...prev, [roomId]: numValue }));
  };

  const applyRoomSelection = () => {
    const newSelectedRooms: SelectedRoom[] = [];
    tempSelectedRooms.forEach((roomId) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        const override = tempOverrides[roomId];
        const maxStudentsPerBench =
          override && override > 0 ? override : room.maxStudentsPerBench || studentsPerBench || 2;
        const capacity = (room.numberOfBenches || 0) * maxStudentsPerBench;
        newSelectedRooms.push({
          ...room,
          capacity,
          maxStudentsPerBenchOverride: override && override > 0 ? override : undefined,
        });
      }
    });
    setSelectedRooms(newSelectedRooms);
    setRoomsModalOpen(false);
  };

  // Prepare room data for modal
  const { roomIdMap, availableRoomsForModal, masterBenches } = useMemo(() => {
    const idMap: Record<string, number> = {};
    const available = rooms
      .filter((r) => r.isActive !== false)
      .map((r) => {
        if (r.id) {
          const floor = floors.find((f) => f.id === r.floor.id);
          const roomKey = `${floor?.name || "N/A"} - ${r.name || `Room ${r.id}`}`;
          idMap[roomKey] = r.id;
          return roomKey;
        }
        return "";
      })
      .filter((s) => s !== "");

    const benches: Record<string, number> = {};
    rooms.forEach((room) => {
      if (room.id) {
        const floor = floors.find((f) => f.id === room.floor.id);
        const roomKey = `${floor?.name || "N/A"} - ${room.name || `Room ${room.id}`}`;
        benches[roomKey] = room.numberOfBenches || 0;
      }
    });

    return { roomIdMap: idMap, availableRoomsForModal: available, masterBenches: benches };
  }, [rooms, floors]);

  const getScheduledPapers = () => {
    return selectedSubjectIds.filter((id) => {
      const schedule = subjectSchedules[id.toString()];
      return schedule && schedule.date && schedule.startTime && schedule.endTime;
    });
  };

  const exportCSV = () => {
    if (studentsWithSeats.length === 0) {
      toast.error("No assignments to export");
      return;
    }

    const scheduledSubjectIds = getScheduledPapers();
    const header = ["Sl. No.", "UID", "Student Name", "CU Roll No.", "CU Reg. No.", "Course"];

    scheduledSubjectIds.forEach((subjectId) => {
      const subject = subjects.find((s) => s.id === subjectId);
      const subjectName = subject?.code || subject?.name || `Subject ${subjectId}`;
      header.push(`Subject: ${subjectName}`);
      const schedule = subjectSchedules[subjectId.toString()];
      if (schedule) {
        header.push(`Date: ${schedule.date}`);
        header.push(`Time: ${schedule.startTime} - ${schedule.endTime}`);
      }
    });

    header.push("Room", "Seat");

    const rows = studentsWithSeats.map((student, idx) => {
      const base = [
        idx + 1,
        student.uid,
        student.name,
        "N/A", // cuRollNo not available in StudentWithSeat type
        student.cuRegistrationApplicationNumber || "N/A",
        "N/A", // programCourseName not available in StudentWithSeat type
      ];

      const subjectData = scheduledSubjectIds.flatMap((subjectId) => {
        const schedule = subjectSchedules[subjectId.toString()];
        if (schedule) {
          return [schedule.date || "—", `${schedule.startTime || "—"} - ${schedule.endTime || "—"}`];
        }
        return ["—", "—"];
      });

      return [...base, ...subjectData, student.roomName || "N/A", student.seatNumber || "N/A"];
    });

    const csv = [header, ...rows]
      .map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exam-assignments.csv";
    link.click();
  };

  // Options for advanced multiselects (value = id as string)
  const programCourseOptions: MultiSelectAdvanceOption[] = programCourses
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      label: c.name || `Course ${c.id}`,
      value: String(c.id),
    }));

  const shiftOptions: MultiSelectAdvanceOption[] = shifts.map((s) => ({
    label: s.name || `Shift ${s.id}`,
    value: String(s.id),
  }));

  const subjectCategoryOptions: MultiSelectAdvanceOption[] = subjectTypes
    .filter((c) => c.isActive !== false)
    .map((c) => {
      const label = (c.code && c.code.trim() ? c.code : c.name) || `Category ${c.id}`;
      return {
        label,
        value: String(c.id),
      };
    });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Exam Assignment</h1>
              <p className="text-xs text-gray-600">Manage exam seating efficiently</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAssignExam} className="gap-2 bg-purple-500 text-white hover:bg-purple-600">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Assign</span>
            </Button>
            {/* <Button
              onClick={exportCSV}
              className="gap-2 bg-green-500 text-white hover:bg-green-600"
              disabled={studentsWithSeats.length === 0}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button> */}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Exam Information */}
        <AccordionSection
          title="Exam Information"
          subtitle="Affiliation, Regulation, Exam Type, Course, Semester, Shift"
          isOpen={openExamInfo}
          onToggle={() => setOpenExamInfo((s) => !s)}
          icon={BookOpen}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Academic Year</Label>
              <Select
                value={selectedAcademicYearId ? selectedAcademicYearId.toString() : ""}
                onValueChange={(val) => setSelectedAcademicYearId(val ? Number(val) : null)}
              >
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  {availableAcademicYears.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id?.toString() || ""}>
                      {ay.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Affiliation</Label>
              <Select
                value={selectedAffiliationId ? selectedAffiliationId.toString() : ""}
                onValueChange={(val) => setSelectedAffiliationId(val ? Number(val) : null)}
                disabled={loading.affiliations}
              >
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder={loading.affiliations ? "Loading..." : "Select Affiliation"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  {affiliations.map((aff) => (
                    <SelectItem key={aff.id} value={aff.id?.toString() || ""}>
                      {aff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Regulation</Label>
              <Select
                value={selectedRegulationTypeId ? selectedRegulationTypeId.toString() : ""}
                onValueChange={(val) => setSelectedRegulationTypeId(val ? Number(val) : null)}
                disabled={loading.regulationTypes}
              >
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder={loading.regulationTypes ? "Loading..." : "Select Regulation"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  {regulationTypes.map((reg) => (
                    <SelectItem key={reg.id} value={reg.id?.toString() || ""}>
                      {reg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Exam Type</Label>
              <Select value={examType} onValueChange={setExamType} disabled={loading.examTypes}>
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder={loading.examTypes ? "Loading..." : "Select Exam Type"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  {examTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id?.toString() || ""}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Semester</Label>
              <Select value={semester} onValueChange={setSemester} disabled={loading.classes}>
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder={loading.classes ? "Loading..." : "Select Semester"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id?.toString() || ""}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Program Course</Label>
              <MultiSelectAdvance
                options={programCourseOptions}
                maxCount={2}
                responsive={false}
                defaultValue={selectedProgramCourses.map((id) => String(id))}
                onValueChange={(values) => {
                  const ids = values.map((v) => Number(v)).filter((id) => !Number.isNaN(id));
                  setSelectedProgramCourses(ids);
                }}
                placeholder="Select Courses"
                className="w-full bg-white border-purple-200"
                autoSize={false}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Shift</Label>
              <MultiSelectAdvance
                options={shiftOptions}
                maxCount={2}
                responsive={false}
                defaultValue={selectedShifts.map((id) => String(id))}
                onValueChange={(values) => {
                  const ids = values.map((v) => Number(v)).filter((id) => !Number.isNaN(id));
                  setSelectedShifts(ids);
                }}
                placeholder="Select Shifts"
                className="w-full bg-white border-purple-200"
                autoSize={false}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Subject Category</Label>
              <MultiSelectAdvance
                options={subjectCategoryOptions}
                maxCount={2}
                responsive={false}
                defaultValue={selectedSubjectCategories.map((id) => String(id))}
                onValueChange={(values) => {
                  const ids = values.map((v) => Number(v)).filter((id) => !Number.isNaN(id));
                  setSelectedSubjectCategories(ids);
                }}
                placeholder="Select Categories"
                className="w-full bg-white border-purple-200"
                autoSize={false}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Subject Component</Label>
              <Select
                value={selectedExamComponent?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedExamComponent(value === "all" ? null : Number(value));
                }}
                disabled={loading.examComponents}
              >
                <SelectTrigger className="w-full bg-white border-purple-200">
                  <SelectValue placeholder={loading.examComponents ? "Loading..." : "Select Component"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                  <SelectItem value="all">All</SelectItem>
                  {examComponents
                    .filter((comp) => !comp.disabled)
                    .map((comp) => (
                      <SelectItem key={comp.id} value={comp.id?.toString() || "all"}>
                        {comp.shortName && comp.shortName.trim() ? comp.shortName : comp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-1.5">Total Students</Label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-lg">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-gray-900">{totalStudents || "—"}</span>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Room Selection */}
        <AccordionSection
          title="Room Selection"
          subtitle="Choose rooms, benches and capacity settings"
          isOpen={openRoomSelection}
          onToggle={() => setOpenRoomSelection((s) => !s)}
          icon={DoorOpen}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1.5">Select Rooms</Label>
                <Button
                  variant="outline"
                  onClick={openRoomsModalHandler}
                  className="w-full justify-start bg-white border-purple-200 text-left font-normal hover:bg-purple-100"
                >
                  {selectedRooms.length ? `${selectedRooms.length} room(s) selected` : "Click to select rooms..."}
                </Button>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1.5">Students per Bench</Label>
                <Input
                  type="number"
                  value={studentsPerBench}
                  onChange={(e) => setStudentsPerBench(Number(e.target.value) || 2)}
                  className="bg-white border-purple-200"
                  min={1}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1.5">Total Capacity</Label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-lg">
                  <span className="font-semibold text-purple-500">{totalCapacity || "—"}</span>
                </div>
                {totalCapacity > 0 && totalStudents > 0 && totalCapacity < totalStudents && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Capacity is less than total students</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1.5">Assign By</Label>
                <Select value={assignBy} onValueChange={(value) => setAssignBy(value as typeof assignBy)}>
                  <SelectTrigger className="w-full bg-white border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-purple-200 shadow-lg z-50 max-h-60 overflow-auto">
                    <SelectItem value="UID">UID</SelectItem>
                    <SelectItem value="CU_REGISTRATION_NUMBER">CU Registration Number</SelectItem>
                    <SelectItem value="CU_ROLL_NUMBER">CU Roll Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1.5">Gender</Label>
                <Select
                  value={gender || "ALL"}
                  onValueChange={(value) => setGender(value === "ALL" ? null : (value as typeof gender))}
                >
                  <SelectTrigger className="w-full bg-white border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-purple-200 shadow-lg z-50">
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="MALE">Male Only</SelectItem>
                    <SelectItem value="FEMALE">Female Only</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Exam Schedule */}
        <AccordionSection
          title="Exam Schedule"
          subtitle="Set date and time for each subject"
          isOpen={openSchedule}
          onToggle={() => setOpenSchedule((s) => !s)}
          icon={Calendar}
        >
          {getDistinctSubjects().length > 0 ? (
            <div className="space-y-3">
              {getDistinctSubjects()
                .filter((s) => s.subjectId !== null && selectedSubjectIds.includes(s.subjectId!))
                .map((subject) => {
                  if (subject.subjectId === null) return null;
                  const schedule = subjectSchedules[subject.subjectId.toString()] || {
                    date: "",
                    startTime: "",
                    endTime: "",
                  };

                  return (
                    <div key={subject.subjectId} className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900">{subject.subjectCode || subject.subjectName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="block text-xs text-gray-600 mb-1">Date</Label>
                          <Input
                            type="date"
                            value={schedule.date}
                            onChange={(e) => handleScheduleChange(subject.subjectId!, "date", e.target.value)}
                            className="bg-white border-purple-200"
                          />
                        </div>
                        <div>
                          <Label className="block text-xs text-gray-600 mb-1">Start Time</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => handleScheduleChange(subject.subjectId!, "startTime", e.target.value)}
                            className="bg-white border-purple-200"
                          />
                        </div>
                        <div>
                          <Label className="block text-xs text-gray-600 mb-1">End Time</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => handleScheduleChange(subject.subjectId!, "endTime", e.target.value)}
                            className="bg-white border-purple-200"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No subjects available. Select filters to load subjects.</p>
            </div>
          )}

          {/* Subject Selection */}
          {getDistinctSubjects().length > 0 && (
            <div className="mt-4">
              <Label className="block text-sm font-medium text-gray-900 mb-2">Select Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {getDistinctSubjects()
                  .filter((s) => s.subjectId !== null)
                  .map((subject) => {
                    const isSelected = selectedSubjectIds.includes(subject.subjectId!);
                    return (
                      <Badge
                        key={subject.subjectId}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedSubjectIds((prev) =>
                            isSelected ? prev.filter((id) => id !== subject.subjectId!) : [...prev, subject.subjectId!],
                          );
                        }}
                      >
                        {subject.subjectCode || subject.subjectName}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          )}
        </AccordionSection>

        {/* Assignments */}
        <AccordionSection
          title="Assignments"
          subtitle="Generated student to room/seat assignments"
          isOpen={openAssignments}
          onToggle={() => setOpenAssignments((s) => !s)}
          icon={ClipboardList}
        >
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : studentsWithSeats.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto -mx-5 px-5 max-h-[40vh]">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="border-b border-purple-200">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Sl.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">UID</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Roll No.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Reg. No.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Room</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase">Seat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithSeats.map((student, idx) => (
                    <TableRow
                      key={student.studentId || idx}
                      className="border-b border-purple-200/50 hover:bg-purple-50 transition-colors"
                    >
                      <TableCell className="text-gray-600">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{student.uid}</TableCell>
                      <TableCell className="text-gray-900">{student.name}</TableCell>
                      <TableCell className="text-gray-600">N/A</TableCell>
                      <TableCell className="text-gray-600">
                        {student.cuRegistrationApplicationNumber || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="space-y-1">
                          <div>{student.email || "N/A"}</div>
                          <div className="text-xs text-gray-600">WA: {student.whatsappPhone || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.roomName ? "default" : "secondary"}>
                          {student.floorName && student.roomName
                            ? `${student.floorName}, ${student.roomName}`
                            : student.floorName || student.roomName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{student.seatNumber || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No assignments generated yet. Click "Assign" to generate.</p>
            </div>
          )}
        </AccordionSection>
      </main>

      <RoomsModal
        isOpen={roomsModalOpen}
        onClose={() => setRoomsModalOpen(false)}
        availableRooms={availableRoomsForModal}
        tempSelectedRooms={tempSelectedRooms
          .map((id) => {
            const room = rooms.find((r) => r.id === id);
            if (room) {
              const floor = floors.find((f) => f.id === room.floor.id);
              return `${floor?.name || "N/A"} - ${room.name || `Room ${room.id}`}`;
            }
            return "";
          })
          .filter((s) => s !== "")}
        tempOverrides={Object.fromEntries(
          tempSelectedRooms
            .map((id) => {
              const room = rooms.find((r) => r.id === id);
              if (room && tempOverrides[id]) {
                const floor = floors.find((f) => f.id === room.floor.id);
                const roomKey = `${floor?.name || "N/A"} - ${room.name || `Room ${room.id}`}`;
                return [roomKey, tempOverrides[id].toString()];
              }
              return null;
            })
            .filter((entry): entry is [string, string] => entry !== null),
        )}
        studentsPerBench={studentsPerBench}
        masterBenches={masterBenches}
        onToggleRoom={(roomKey) => {
          const roomId = roomIdMap[roomKey];
          if (roomId) {
            toggleTempRoom(roomId);
          }
        }}
        onSetOverride={(roomKey, value) => {
          const roomId = roomIdMap[roomKey];
          if (roomId) {
            setTempOverride(roomId, value);
          }
        }}
        onApply={applyRoomSelection}
      />
    </div>
  );
}
