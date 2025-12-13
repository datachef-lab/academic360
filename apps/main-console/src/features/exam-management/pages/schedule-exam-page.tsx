import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, AlertCircle, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAllExamTypes, type ExamTypeT } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getProgramCourses, getAffiliations, getRegulationTypes } from "@/services/course-design.api";
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
  ProgramCourse,
  SubjectType,
  PaperDto,
  Affiliation,
  RegulationType,
  ExamDto,
  ExamSubjectT,
  ExamRoomDto,
  RoomDto,
} from "@repo/db";
import type { Shift } from "@/types/academics/shift";
import type { Subject } from "@repo/db";
import type { ExamComponent } from "@/types/course-design";
import { doAssignExam } from "../services";

interface SelectedRoom extends RoomDto {
  capacity: number;
  maxStudentsPerBenchOverride?: number;
}

// interface Student {
//   uid: string;
//   name: string;
//   cuRollNo: string;
//   cuRegNo: string;
//   programCourse: string;
//   semester: string;
//   shift: string;
//   gender: "Male" | "Female";
// }

interface Schedule {
  date: string;
  startTime: string;
  endTime: string;
}

// interface Assignment {
//   uid: string;
//   name: string;
//   cuRollNo: string;
//   cuRegNo: string;
//   programCourse: string;
//   papers: { paperId: string; name: string; date: string; time: string }[];
//   room: string;
//   seatNo: string;
// }

export default function ScheduleExamPage() {
  // Academic Year hook - get current academic year from Redux slice
  const { currentAcademicYear, availableAcademicYears, loadAcademicYears } = useAcademicYear();

  // API Data States
  const [examTypes, setExamTypes] = useState<ExamTypeT[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
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
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedExamComponent, setSelectedExamComponent] = useState<number | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<number | null>(null);
  const [selectedRegulationTypeId, setSelectedRegulationTypeId] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsWithSeats, setStudentsWithSeats] = useState<StudentWithSeat[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  //   const [examAssignment, setExamAssignment] = useState<ExamDto | null>(null);

  // Step 2: Room Selection
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | null>(null);
  const [assignBy, setAssignBy] = useState<"CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER">("UID");
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);

  // Step 3: Exam Schedule (keyed by subjectId)
  const [subjectSchedules, setSubjectSchedules] = useState<Record<string, Schedule>>({});
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Assignments (kept for potential future use)

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
        const programCoursesData = await getProgramCourses();
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
        // Map API response to match ExamComponent type (API returns isActive, type expects disabled)
        const mappedComponents: ExamComponent[] = Array.isArray(examComponentsData)
          ? examComponentsData.map((comp) => ({
              id: comp.id,
              name: comp.name,
              shortName: comp.shortName ?? null,
              code: comp.code ?? null,
              sequence: comp.sequence ?? null,
              disabled: (comp as { isActive?: boolean | null }).isActive === false,
              createdAt: comp.createdAt,
              updatedAt: comp.updatedAt,
            }))
          : [];
        setExamComponents(mappedComponents);
      } catch (error) {
        console.error("Error fetching exam components:", error);
        toast.error("Failed to load exam components");
      } finally {
        setLoading((prev) => ({ ...prev, examComponents: false }));
      }

      // Load academic years using the hook (to get current academic year)
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

      // Since API only accepts single values, we need to make multiple calls
      // for each combination of program course and subject type
      const allPapers: PaperDto[] = [];
      const seenPaperIds = new Set<number>();

      // If no subject categories selected, fetch for all program courses
      const subjectTypesToUse = selectedSubjectCategories.length > 0 ? selectedSubjectCategories : [];

      // If no subject types selected, fetch papers for all program courses with class filter
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
        // Fetch papers for each combination of program course and subject type
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

  //   const generateMockStudents = useCallback((): Student[] => {
  //     const students: Student[] = [];
  //     let counter = 1;

  //     selectedProgramCourses.forEach((courseId) => {
  //       const course = programCourses.find((c) => c.id === courseId);
  //       const courseName = course?.name || `Course ${courseId}`;
  //       const shiftsToUse =
  //         selectedShifts.length > 0
  //           ? selectedShifts
  //           : shifts.map((s) => s.id).filter((id): id is number => id !== undefined);
  //       shiftsToUse.forEach((shiftId) => {
  //         const shift = shifts.find((s) => s.id === shiftId);
  //         const shiftName = shift?.name || `Shift ${shiftId}`;
  //         const studentsPerGroup = 15;
  //         for (let i = 0; i < studentsPerGroup; i++) {
  //           students.push({
  //             uid: `UID${String(counter).padStart(6, "0")}`,
  //             name: `Student ${counter}`,
  //             cuRollNo: `CUR${String(counter).padStart(6, "0")}`,
  //             cuRegNo: `REG${String(counter).padStart(6, "0")}`,
  //             programCourse: courseName,
  //             semester: semester,
  //             shift: shiftName,
  //             gender: i % 2 === 0 ? "Male" : "Female",
  //           });
  //           counter++;
  //         }
  //       });
  //     });

  //     return students;
  //   }, [selectedProgramCourses, selectedShifts, semester, programCourses, shifts]);

  //   const getFilteredStudents = useCallback((): Student[] => {
  //     const allStudents = generateMockStudents();
  //     if (gender === null) return allStudents;
  //     // Map enum values to student gender format
  //     const genderMap: Record<string, "Male" | "Female"> = {
  //       MALE: "Male",
  //       FEMALE: "Female",
  //     };
  //     const filterGender = genderMap[gender] || gender;
  //     return allStudents.filter((s) => s.gender === filterGender);
  //   }, [gender, generateMockStudents]);

  const getAvailablePapers = useCallback((): PaperDto[] => {
    let filtered = papers.filter((paper) => paper.isActive !== false);

    // Filter by selected exam component if one is selected
    if (selectedExamComponent !== null) {
      filtered = filtered.filter((paper) => {
        // Check if paper has components array and if any component has the selected exam component
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

  const getPapersForSelectedSubject = useCallback((): PaperDto[] => {
    if (!selectedSubjectId) return [];
    return getAvailablePapers().filter((paper) => paper.subjectId === selectedSubjectId);
  }, [selectedSubjectId, getAvailablePapers]);

  // Fetch student count from API based on selected subject
  useEffect(() => {
    const fetchStudentCount = async () => {
      // Check if currentAcademicYear is available
      if (!currentAcademicYear?.id) {
        console.log("[SCHEDULE-EXAM] Waiting for academic year to be loaded...");
        setTotalStudents(0);
        return;
      }

      if (selectedProgramCourses.length === 0 || !semester || !selectedSubjectId) {
        setTotalStudents(0);
        return;
      }

      const papersForSubject = getPapersForSelectedSubject();
      const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

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

        console.log("[SCHEDULE-EXAM] Fetching student count with params:", {
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
        });

        const response = await countStudentsForExam({
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
        });

        console.log("[SCHEDULE-EXAM] Student count response:", response);

        if (response.httpStatus === "SUCCESS" && response.payload) {
          setTotalStudents(response.payload.count);
        } else {
          console.warn("[SCHEDULE-EXAM] Unexpected response:", response);
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
    selectedSubjectId,
    classes,
    currentAcademicYear,
    getPapersForSelectedSubject,
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
  useEffect(() => {
    const fetchStudentsWithSeats = async () => {
      if (
        selectedRooms.length === 0 ||
        selectedProgramCourses.length === 0 ||
        !semester ||
        !selectedSubjectId ||
        !currentAcademicYear?.id
      ) {
        setStudentsWithSeats([]);
        return;
      }

      const papersForSubject = getPapersForSelectedSubject();
      const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

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

        // Prepare room assignments
        const roomAssignments = selectedRooms.map((room) => {
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
    selectedSubjectId,
    classes,
    currentAcademicYear,
    assignBy,
    floors,
    getPapersForSelectedSubject,
    selectedAcademicYearId,
  ]);

  const handleProgramCourseToggle = (courseId: number) => {
    setSelectedProgramCourses((prev) =>
      prev.includes(courseId) ? prev.filter((c) => c !== courseId) : [...prev, courseId],
    );
  };

  const handleShiftToggle = (shiftId: number) => {
    setSelectedShifts((prev) => (prev.includes(shiftId) ? prev.filter((s) => s !== shiftId) : [...prev, shiftId]));
  };

  const handleSubjectCategoryToggle = (categoryId: number) => {
    setSelectedSubjectCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId],
    );
  };

  const handleRoomSelection = (room: RoomDto, selected: boolean) => {
    if (selected) {
      const maxStudentsPerBench = room.maxStudentsPerBench || 2;
      const capacity = (room.numberOfBenches || 0) * maxStudentsPerBench;
      setSelectedRooms((prev) => [...prev, { ...room, capacity }]);
    } else {
      setSelectedRooms((prev) => prev.filter((r) => r.id !== room.id));
    }
  };

  const handleMaxStudentsPerBenchOverride = (roomId: number, override: number | null) => {
    setSelectedRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const maxStudentsPerBench = override || r.maxStudentsPerBench || 2;
          const numberOfBenches = r.numberOfBenches || 0;
          const capacity = numberOfBenches * maxStudentsPerBench;
          return {
            ...r,
            maxStudentsPerBenchOverride: override || undefined,
            capacity,
          };
        }
        return r;
      }),
    );
  };

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

  //   const formatTime = (time24?: string) => {
  //     if (!time24) return "";
  //     const [hours, minutes] = time24.split(":");
  //     const hour = parseInt(hours!);
  //     const ampm = hour >= 12 ? "PM" : "AM";
  //     const hour12 = hour % 12 || 12;
  //     return `${hour12}:${minutes} ${ampm}`;
  //   };

  //   const generateSeatNumber = (benchNumber: number, positionOnBench: number, maxStudentsPerBench: number): string => {
  //     const letters = maxStudentsPerBench === 2 ? ["A", "C"] : ["A", "B", "C"];
  //     return `${benchNumber}${letters[positionOnBench - 1]}`;
  //   };

  //   const handleGenerate = () => {
  //     const students = getFilteredStudents();

  //     students.sort((a, b) => {
  //       if (assignBy === "UID") return a.uid.localeCompare(b.uid);
  //       return a.cuRegNo.localeCompare(b.cuRegNo);
  //     });

  //     const newAssignments: Assignment[] = [];
  //     let currentRoomIndex = 0;
  //     let currentBench = 1;
  //     let currentPosition = 1;

  //     students.forEach((student) => {
  //       if (currentRoomIndex >= selectedRooms.length) return;

  //       const currentRoom = selectedRooms[currentRoomIndex]!;
  //       const maxStudentsPerBench = currentRoom.maxStudentsPerBenchOverride || currentRoom.maxStudentsPerBench || 2;
  //       const roomCapacity = (currentRoom.numberOfBenches || 0) * maxStudentsPerBench;

  //       const subjectSchedule = selectedSubjectId ? subjectSchedules[selectedSubjectId.toString()] : null;
  //       const studentPapers = getPapersForSelectedSubject().map((paper) => ({
  //         paperId: paper.id?.toString() || "",
  //         name: paper.name || "Unnamed Paper",
  //         date: subjectSchedule?.date || "TBD",
  //         time: subjectSchedule?.startTime
  //           ? `${formatTime(subjectSchedule.startTime)} - ${formatTime(subjectSchedule.endTime)}`
  //           : "TBD",
  //       }));

  //       const seatNo = generateSeatNumber(currentBench, currentPosition, maxStudentsPerBench);

  //       newAssignments.push({
  //         uid: student.uid,
  //         name: student.name,
  //         cuRollNo: student.cuRollNo,
  //         cuRegNo: student.cuRegNo,
  //         programCourse: student.programCourse,
  //         papers: studentPapers,
  //         room: currentRoom.name || `Room ${currentRoom.id}`,
  //         seatNo,
  //       });

  //       currentPosition++;
  //       if (currentPosition > maxStudentsPerBench) {
  //         currentPosition = 1;
  //         currentBench++;
  //       }

  //       const studentsInRoom = newAssignments.filter(
  //         (a) => a.room === (currentRoom.name || `Room ${currentRoom.id}`),
  //       ).length;
  //       if (studentsInRoom >= roomCapacity) {
  //         currentRoomIndex++;
  //         currentBench = 1;
  //         currentPosition = 1;
  //       }
  //     });

  //     toast.success(`Successfully assigned ${newAssignments.length} students`);
  //   };

  const capacityStatus = totalCapacity >= totalStudents;
  const [centerTab, setCenterTab] = useState<"rooms" | "students">("rooms");

  // Keep selected academic year in sync with current academic year by default
  useEffect(() => {
    if (currentAcademicYear?.id && selectedAcademicYearId === null) {
      setSelectedAcademicYearId(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYearId]);

  const handleAssignExam = async () => {
    const examSubjects: ExamSubjectT[] = [];
    for (const subjectId in subjectSchedules) {
      examSubjects.push({
        subjectId: Number(subjectId),
        startTime: new Date(),
        endTime: new Date(),
        examId: 0,
        id: 0,
        createdAt: null,
        updatedAt: null,
      });
    }

    const locations: ExamRoomDto[] = selectedRooms.map((room) => ({
      roomId: room.id!,
      studentsPerBench: room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2,
      capacity: room.capacity,
      room: rooms.find((r) => r.id === room.id)!,
      examId: 0, // will be set backend
      createdAt: new Date(),
      updatedAt: new Date(),
      id: 0,
    }));

    const tmpExamAssignment: ExamDto = {
      orderType: assignBy,
      academicYear: availableAcademicYears.find((ay) => ay.id === selectedAcademicYearId)!,
      class: classes.find((c) => c.id?.toString() === semester)!,
      examType: examTypes.find((et) => et.id?.toString() === examType)!,
      programCourses: programCourses.filter((pc) => selectedProgramCourses.includes(pc.id!)),
      shifts: shifts.filter((s) => selectedShifts.includes(s.id!)),
      // subject: subjects.find(s => s.id === selectedSubjectId)!,
      // examComponent: examComponents.find(ec => ec.id === selectedExamComponent!) || null,
      subjectTypes: subjectTypes.filter((st) => selectedSubjectCategories.includes(st.id!)),
      gender: gender,
      subjects: examSubjects,
      locations,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: 0,
      legacyExamAssginmentId: null,
    };

    try {
      console.log("Before calling doAssignExam with:", tmpExamAssignment);
      const response = await doAssignExam(tmpExamAssignment);
      console.log("In exam assignment post api, response:", response);

      toast.success(`Successfully assigned exam to the students`);
    } catch (error) {
      console.log("In exam assignment post api, error:", error);
      toast.error(`Something went wrong while assigning exam!`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full flex">
        {/* Header */}
        {/* <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Scheduler</h1>
              <p className=" text-gray-500 mt-1">Configure exams, rooms, and student seating in one view</p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Calendar className="w-5 h-5 mr-2" /> Generate Assignments
          </Button>
        </div> */}

        <div className="flex-1">
          {/* Top filter strip (A.Y, Aff, Reg, Exam type, Semester, Shifts, Program Course, Subject Category) */}
          <Card className="mb-4 shadow-sm border">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Academic Year */}
                <div className="flex items-center">
                  <Select
                    value={selectedAcademicYearId ? selectedAcademicYearId.toString() : ""}
                    onValueChange={(val) => setSelectedAcademicYearId(val ? Number(val) : null)}
                  >
                    <SelectTrigger className="h-9 w-44  focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder="A.Y" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAcademicYears.map((ay) => (
                        <SelectItem key={ay.id} value={ay.id?.toString() || ""}>
                          {ay.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Affiliation */}
                <div className="flex items-center">
                  <Select
                    value={selectedAffiliationId ? selectedAffiliationId.toString() : ""}
                    onValueChange={(val) => setSelectedAffiliationId(val ? Number(val) : null)}
                    disabled={loading.affiliations}
                  >
                    <SelectTrigger className="h-9 w-44  focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder={loading.affiliations ? "Loading..." : "Aff."} />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliations.map((aff) => (
                        <SelectItem key={aff.id} value={aff.id?.toString() || ""}>
                          {aff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Regulation Type */}
                <div className="flex items-center">
                  <Select
                    value={selectedRegulationTypeId ? selectedRegulationTypeId.toString() : ""}
                    onValueChange={(val) => setSelectedRegulationTypeId(val ? Number(val) : null)}
                    disabled={loading.regulationTypes}
                  >
                    <SelectTrigger className="h-9 w-44  focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder={loading.regulationTypes ? "Loading..." : "Reg."} />
                    </SelectTrigger>
                    <SelectContent>
                      {regulationTypes.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id?.toString() || ""}>
                          {reg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type */}
                <div className="flex items-center">
                  <Select value={examType} onValueChange={setExamType} disabled={loading.examTypes}>
                    <SelectTrigger className="h-9 w-44  focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder={loading.examTypes ? "Loading..." : "Exam Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id?.toString() || ""}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester */}
                <div className="flex items-center">
                  <Select value={semester} onValueChange={setSemester} disabled={loading.classes}>
                    <SelectTrigger className="h-9 w-40  focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder={loading.classes ? "Loading..." : "Semester"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id?.toString() || ""}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shifts */}
                <div className="flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 min-w-[170px] justify-between  border-purple-300">
                        Shift(s)
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {shifts.map((shift) => (
                          <button
                            key={shift.id}
                            type="button"
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 "
                            onClick={() => shift.id && handleShiftToggle(shift.id)}
                          >
                            <Checkbox
                              checked={shift.id !== undefined && selectedShifts.includes(shift.id)}
                              onCheckedChange={() => shift.id && handleShiftToggle(shift.id)}
                              className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <span className="text-center">{shift.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Program Courses */}
                <div className="flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 min-w-[210px] justify-between  border-purple-300"
                        disabled={loading.programCourses}
                      >
                        {loading.programCourses ? "Loading..." : "Program Course(s)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {programCourses
                          .filter((course) => course.isActive !== false)
                          .map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 "
                              onClick={() => course.id && handleProgramCourseToggle(course.id)}
                            >
                              <Checkbox
                                checked={course.id !== undefined && selectedProgramCourses.includes(course.id)}
                                onCheckedChange={() => course.id && handleProgramCourseToggle(course.id)}
                                className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                              />
                              <span className="text-left">{course.name}</span>
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Subject Category */}
                <div className="flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 min-w-[190px] justify-between  border-purple-300"
                        disabled={loading.subjectTypes}
                      >
                        {loading.subjectTypes ? "Loading..." : "Subject Category"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="text-left p-2" align="start">
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {subjectTypes
                          .filter((category) => category.isActive !== false)
                          .map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 "
                              onClick={() => category.id && handleSubjectCategoryToggle(category.id)}
                            >
                              <Checkbox
                                checked={category.id !== undefined && selectedSubjectCategories.includes(category.id)}
                                onCheckedChange={() => category.id && handleSubjectCategoryToggle(category.id)}
                                className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                              />
                              <span className="text-left">
                                {category.code && category.code.trim() ? category.code : category.name}
                              </span>
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main layout: left sidebar, center content (rooms/students), right sidebar */}
          <div className="flex gap-4 w-full">
            {/* Left sidebar: Subjects + schedule + total + assign */}
            <div className="w-[26%] flex-shrink-0">
              <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-2">
                <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
                  {/* Subject list */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        {/* Multi-select subjects dropdown */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-8 min-w-[140px] justify-between border-purple-300"
                              disabled={getDistinctSubjects().length === 0}
                            >
                              Subjects
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="start">
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {getDistinctSubjects().map((subject) => {
                                if (subject.subjectId == null) return null;
                                const isChecked = selectedSubjectIds.includes(subject.subjectId);
                                return (
                                  <button
                                    key={subject.subjectId}
                                    type="button"
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
                                    onClick={() =>
                                      setSelectedSubjectIds((prev) =>
                                        isChecked
                                          ? prev.filter((id) => id !== subject.subjectId)
                                          : [...prev, subject.subjectId as number],
                                      )
                                    }
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        setSelectedSubjectIds((prev) =>
                                          isChecked
                                            ? prev.filter((id) => id !== subject.subjectId)
                                            : [...prev, subject.subjectId as number],
                                        )
                                      }
                                      className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <span className="text-sm text-center">
                                      {subject.subjectCode && (
                                        <span className="text-gray-500"> {subject.subjectCode}</span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Exam component filter */}
                        <Select
                          value={selectedExamComponent?.toString() || "all"}
                          onValueChange={(value) => {
                            setSelectedExamComponent(value === "all" ? null : Number(value));
                          }}
                          disabled={loading.examComponents}
                        >
                          <SelectTrigger className="h-8 w-32 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <SelectValue placeholder={loading.examComponents ? "Loading..." : "Component"} />
                          </SelectTrigger>
                          <SelectContent>
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
                    </div>
                    <div className="flex-1 min-h-0 border rounded-lg bg-gray-50 p-2 space-y-2 scrollbar-hide">
                      {loading.papers ? (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading papers...
                        </div>
                      ) : getDistinctSubjects().length === 0 ? (
                        <p className="text-gray-500 text-center py-6">Select filters to load subjects</p>
                      ) : selectedSubjectIds.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          Select subjects from the dropdown above
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedSubjectIds.map((id) => {
                            const subjectMeta = getDistinctSubjects().find((s) => s.subjectId === id);
                            const subject = subjects.find((s) => s.id === id);
                            const name = subjectMeta?.subjectName || subject?.name || `Subject ID: ${id}`;
                            const code = subjectMeta?.subjectCode || subject?.code;
                            const schedule = subjectSchedules[id.toString()] ?? {
                              date: "",
                              startTime: "",
                              endTime: "",
                            };

                            return (
                              <div
                                key={id}
                                className={`border rounded-lg bg-white p-3 cursor-pointer ${
                                  selectedSubjectId === id
                                    ? "border-purple-500 bg-purple-50"
                                    : "hover:border-purple-400/60"
                                }`}
                                onClick={() => setSelectedSubjectId(id)}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div>
                                    <div className="font-semibold">
                                      <span className="text-gray-500 font-normal"> {code ? code : name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="col-span-2">
                                    <Label className=" font-semibold mb-1 block">Exam Date</Label>
                                    <Input
                                      type="date"
                                      value={schedule.date || ""}
                                      onChange={(e) => handleScheduleChange(id, "date", e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className=" font-semibold mb-1 block">Start Time</Label>
                                    <Input
                                      type="time"
                                      value={schedule.startTime || ""}
                                      onChange={(e) => handleScheduleChange(id, "startTime", e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className=" font-semibold mb-1 block">End Time</Label>
                                    <Input
                                      type="time"
                                      value={schedule.endTime || ""}
                                      onChange={(e) => handleScheduleChange(id, "endTime", e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total students + Assign button */}
                  <div className="mt-auto space-y-3">
                    <div className="p-3 bg-gray-100/60 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className=" font-semibold">Students</span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">{totalStudents}</span>
                    </div>
                    <Button
                      //   onClick={handleGenerate}
                      onClick={handleAssignExam}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                    >
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center: Tabs (Rooms / Students) with table */}
            <div className="flex-1 min-w-0">
              <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-2">
                <CardHeader className="border-b bg-gray-100/60 py-2 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCenterTab("rooms")}
                        className={`px-4 py-1.5 rounded-md border ${
                          centerTab === "rooms"
                            ? "bg-white border-purple-500 text-purple-700 font-semibold"
                            : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Rooms
                      </button>
                      <button
                        type="button"
                        onClick={() => setCenterTab("students")}
                        className={`px-4 py-1.5 rounded-md border ${
                          centerTab === "students"
                            ? "bg-white border-purple-500 text-purple-700 font-semibold"
                            : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Students
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-1">
                        <Select value={gender || ""} onValueChange={(value) => setGender(value as typeof gender)}>
                          <SelectTrigger className="h-8 w-40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Students</SelectItem>
                            <SelectItem value="MALE">Male Only</SelectItem>
                            <SelectItem value="FEMALE">Female Only</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Select value={assignBy} onValueChange={(value) => setAssignBy(value as typeof assignBy)}>
                          <SelectTrigger className="h-8 w-44 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UID">UID</SelectItem>
                            <SelectItem value="CU_REGISTRATION_NUMBER">CU Registration Number</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                  {centerTab === "rooms" ? (
                    <div className="p-4 flex flex-col gap-4 h-full">
                      {/* Rooms selection table */}
                      <div className="flex-1 min-h-0 border rounded-lg bg-white overflow-hidden">
                        {loading.rooms ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2 text-gray-500">Loading rooms...</span>
                          </div>
                        ) : (
                          <div className="h-full overflow-y-auto">
                            <table className="w-full border-collapse table-fixed">
                              <thead className="sticky top-0 z-10 bg-gray-100">
                                <tr>
                                  <th className="w-20 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Select
                                  </th>
                                  <th className="w-20 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Sr. No.
                                  </th>
                                  <th className="w-32 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Floor
                                  </th>
                                  <th className="w-32 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Room
                                  </th>
                                  <th className="w-24 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Benches
                                  </th>
                                  <th className="w-24 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Capacity
                                  </th>
                                  <th className="w-40 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Max Students per Bench
                                  </th>
                                  <th className="w-40 px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-100">
                                    Override
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {rooms
                                  .filter((room) => room.isActive !== false)
                                  .map((room, index) => {
                                    const isSelected = selectedRooms.some((r) => r.id === room.id);
                                    const selectedRoom = selectedRooms.find((r) => r.id === room.id);
                                    const currentMaxStudentsPerBench =
                                      selectedRoom?.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                                    const calculatedCapacity = (room.numberOfBenches || 0) * currentMaxStudentsPerBench;
                                    const floorName = room.floor.id!
                                      ? floors.find((f) => f.id === room.floor.id)?.name
                                      : "N/A";

                                    return (
                                      <tr
                                        key={room.id}
                                        className={`border-b hover:bg-gray-50 transition-colors ${
                                          isSelected ? "bg-purple-50" : ""
                                        }`}
                                      >
                                        <td className="px-4 py-3 border border-gray-300">
                                          <div className="flex justify-center">
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={(checked) => handleRoomSelection(room, !!checked)}
                                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 text-white focus:ring-2 focus:ring-purple-500"
                                            />
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 border border-gray-300">
                                          {index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 border border-gray-300">{floorName}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 border border-gray-300">
                                          {room.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 border border-gray-300">
                                          {room.numberOfBenches || 0}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 border border-gray-300">
                                          {calculatedCapacity}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 border border-gray-300">
                                          {currentMaxStudentsPerBench}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-300 min-h-[80px]">
                                          <div className="space-y-1 min-h-[60px]">
                                            {isSelected ? (
                                              <>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  max={room.maxStudentsPerBench || 2}
                                                  placeholder={room.maxStudentsPerBench?.toString() || "2"}
                                                  value={selectedRoom?.maxStudentsPerBenchOverride || ""}
                                                  onChange={(e) => {
                                                    const inputValue = e.target.value.trim();
                                                    if (!inputValue) {
                                                      handleMaxStudentsPerBenchOverride(room.id!, null);
                                                      return;
                                                    }

                                                    const isPositiveInteger = /^\d+$/.test(inputValue);
                                                    if (!isPositiveInteger) {
                                                      return;
                                                    }

                                                    const val = parseInt(inputValue, 10);
                                                    const maxAllowed = room.maxStudentsPerBench || 2;

                                                    if (val > 0 && val <= maxAllowed) {
                                                      handleMaxStudentsPerBenchOverride(room.id!, val);
                                                    }
                                                  }}
                                                  className="h-8 w-full max-w-[80px]"
                                                />
                                                <div className="text-gray-400">
                                                  Max: {room.maxStudentsPerBench || 2}
                                                </div>
                                              </>
                                            ) : (
                                              <div className="h-8 flex items-center">
                                                <span className="text-gray-400">-</span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Selected rooms list + capacity summary */}
                      <div className="flex-1 min-h-0 flex flex-col gap-3">
                        <div className="flex-1 min-h-0 border rounded-lg bg-gray-50 p-3 overflow-y-auto scrollbar-hide">
                          {selectedRooms.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No rooms selected</p>
                          ) : (
                            selectedRooms.map((room) => {
                              const maxStudentsPerBench =
                                room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                              const capacity = (room.numberOfBenches || 0) * maxStudentsPerBench;
                              return (
                                <div
                                  key={room.id}
                                  className="p-3 mb-2 bg-white rounded-lg border flex items-center justify-between hover:border-purple-400/60 transition-colors"
                                >
                                  <div>
                                    <div className="font-semibold">Room {room.name}</div>
                                    <div className="text-gray-500">
                                      {room.numberOfBenches || 0} benches • Capacity: {capacity}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRoomSelection(room, false)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${
                            capacityStatus ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {capacityStatus ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-bold">
                              {capacityStatus ? "Capacity Sufficient" : "Insufficient Capacity"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between p-1.5 bg-white/60 rounded">
                              <span>Total Capacity</span>
                              <span className="font-bold">{totalCapacity} seats</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-white/60 rounded">
                              <span>Total Students</span>
                              <span className="font-bold">{totalStudents}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-white/60 rounded">
                              <span>Available</span>
                              <span className={`font-bold ${capacityStatus ? "text-green-700" : "text-red-600"}`}>
                                {totalCapacity - totalStudents} seats
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col h-full">
                      {/* Students table */}
                      <div className="flex-1 min-h-0 p-4">
                        {loadingStudents ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                            <span className="ml-2  text-gray-500">Loading students...</span>
                          </div>
                        ) : studentsWithSeats.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="font-semibold text-gray-600">No Students Assigned</p>
                            <p className=" text-gray-400 mt-1">
                              Select rooms and generate assignments to see students here
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <div className="relative max-h-[calc(100vh-260px)] overflow-y-auto border border-gray-300 rounded-lg">
                              <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-gray-100">
                                  <tr className="border-b-2 border-gray-300">
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Sr. No.
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Name
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      {assignBy === "UID" ? "UID" : "CU Reg. No."}
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Contact
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Subject
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Paper
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                                      Location
                                    </th>
                                    <th className="px-4 py-3 text-left  font-semibold text-gray-700 uppercase tracking-wider bg-gray-100">
                                      Seat Number
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {studentsWithSeats.map((student, idx) => (
                                    <tr
                                      key={student.studentId}
                                      className={`border-b hover:bg-gray-100/60 transition-colors ${
                                        idx % 2 === 0 ? "bg-gray-50" : ""
                                      }`}
                                    >
                                      <td className="px-4 py-3  font-medium text-gray-900 border-r border-gray-300">
                                        {idx + 1}
                                      </td>
                                      <td className="px-4 py-3  font-medium text-gray-900 border-r border-gray-300">
                                        {student.name}
                                      </td>
                                      <td className="px-4 py-3  font-mono text-gray-700 border-r border-gray-300">
                                        {assignBy === "UID"
                                          ? student.uid
                                          : student.cuRegistrationApplicationNumber || "N/A"}
                                      </td>
                                      <td className="px-4 py-3  text-gray-700 border-r border-gray-300">
                                        <div className="space-y-1">
                                          <div>{student.email || "N/A"}</div>
                                          <div className=" text-gray-500">WA: {student.whatsappPhone || "N/A"}</div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3  text-gray-700 border-r border-gray-300">
                                        {selectedSubjectId
                                          ? (() => {
                                              const subject = subjects.find((s) => s.id === selectedSubjectId);
                                              const shortName =
                                                (subject as { shortName?: string | null })?.shortName ?? null;
                                              if (shortName && shortName.trim()) return shortName;
                                              if (subject?.code && subject.code.trim()) return subject.code;
                                              return subject?.name || "N/A";
                                            })()
                                          : "N/A"}
                                      </td>
                                      <td className="px-4 py-3  text-gray-700 border-r border-gray-300">
                                        {selectedSubjectId
                                          ? (() => {
                                              const subject = subjects.find((s) => s.id === selectedSubjectId);
                                              const shortName =
                                                (subject as { shortName?: string | null })?.shortName ?? null;
                                              if (shortName && shortName.trim()) return shortName;
                                              if (subject?.code && subject.code.trim()) return subject.code;
                                              return subject?.name || "N/A";
                                            })()
                                          : "N/A"}
                                      </td>
                                      <td className="px-4 py-3  text-gray-700 border-r border-gray-300">
                                        {student.floorName && student.roomName
                                          ? `${student.floorName}, ${student.roomName}`
                                          : student.floorName || student.roomName || "N/A"}
                                      </td>
                                      <td className="px-4 py-3  font-mono text-gray-700">{student.seatNumber}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right sidebar: Selected filters summary (Program Courses, Subject Categories, Shift) */}
        <div className="w-[16%] flex-shrink-0 space-y-4">
          <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-2">
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
              {/* Program Courses */}
              <div className="border rounded-lg p-3 flex-1 flex flex-col">
                <div className="font-semibold mb-2 border-b pb-1">Program Courses</div>
                <div className="flex-1 overflow-y-auto">
                  {selectedProgramCourses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No program course selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedProgramCourses.map((id) => {
                        const course = programCourses.find((c) => c.id === id);
                        const label = course?.name || `Course ${id}`;
                        return (
                          <Badge
                            key={id}
                            className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 flex items-center gap-1 pr-1"
                          >
                            <span>{label}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedProgramCourses((prev) => prev.filter((pcId) => pcId !== id))}
                              className="ml-1 text-purple-500 hover:text-purple-700"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Categories */}
              <div className="border rounded-lg p-3 flex-1 flex flex-col">
                <div className="font-semibold mb-2 border-b pb-1">Subject Categories</div>
                <div className="flex-1 overflow-y-auto">
                  {selectedSubjectCategories.length === 0 ? (
                    <p className="text-gray-500 text-sm">No subject category selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjectCategories.map((id) => {
                        const category = subjectTypes.find((c) => c.id === id);
                        const label = category?.code && category.code.trim() ? category.code : category?.name;
                        return (
                          <Badge
                            key={id}
                            className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 flex items-center gap-1 pr-1"
                          >
                            <span>{label}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSubjectCategories((prev) => prev.filter((catId) => catId !== id))
                              }
                              className="ml-1 text-blue-500 hover:text-blue-700"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Shifts */}
              <div className="border rounded-lg p-3 flex-1 flex flex-col">
                <div className="font-semibold mb-2 border-b pb-1">Shift(s)</div>
                <div className="flex-1 overflow-y-auto">
                  {selectedShifts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No shift selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedShifts.map((id) => {
                        const shift = shifts.find((s) => s.id === id);
                        const label = shift?.name || `Shift ${id}`;
                        return (
                          <Badge
                            key={id}
                            className="text-xs bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 flex items-center gap-1 pr-1"
                          >
                            <span>{label}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedShifts((prev) => prev.filter((shiftId) => shiftId !== id))}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
