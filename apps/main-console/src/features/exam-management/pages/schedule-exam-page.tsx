import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  Upload,
  X,
  ChevronDown,
  DoorOpen,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllExamTypes } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAffiliations, getRegulationTypes, getProgramCourseDtos } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getSubjectTypes, getExamComponents } from "@/services/course-design.api";
import { getPapersPaginated } from "@/services/course-design.api";
import { getAllSubjects } from "@/services/subject.api";
import { getAllRooms } from "@/services/room.service";
import { getAllFloors } from "@/services/floor.service";
import {
  checkDuplicateExam,
  countStudentsForExam,
  getEligibleRooms,
  getStudentsForExam,
} from "@/services/exam-schedule.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import type { PaperDto, ExamDto, ExamSubjectT, ExamRoomDto, RoomDto, ExamProgramCourseDto } from "@repo/db/index";
import { ExamComponent } from "@/types/course-design";
import { doAssignExam } from "../services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

  const queryClient = useQueryClient();

  // React Query hooks for initial data fetching
  const { data: examTypes = [], isLoading: loadingExamTypes } = useQuery({
    queryKey: ["examTypes"],
    queryFn: async () => {
      const res = await getAllExamTypes();
      if (res.httpStatus === "SUCCESS" && res.payload) {
        return res.payload.filter((et) => et.isActive !== false);
      }
      return [];
    },
    onError: (error) => {
      console.error("Error fetching exam types:", error);
      toast.error("Failed to load exam types");
    },
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const data = await getAllClasses();
      return Array.isArray(data) ? data.filter((c) => !c.disabled) : [];
    },
    onError: (error) => {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    },
  });

  const { data: programCourses = [], isLoading: loadingProgramCourses } = useQuery({
    queryKey: ["programCourses"],
    queryFn: async () => {
      const data = await getProgramCourseDtos();
      return Array.isArray(data) ? data.filter((pc) => pc.isActive !== false) : [];
    },
    onError: (error) => {
      console.error("Error fetching program courses:", error);
      toast.error("Failed to load program courses");
    },
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const data = await getAllShifts();
      return Array.isArray(data) ? data.filter((s) => !s.disabled) : [];
    },
    onError: (error) => {
      console.error("Error fetching shifts:", error);
      toast.error("Failed to load shifts");
    },
  });

  const { data: subjectTypes = [], isLoading: loadingSubjectTypes } = useQuery({
    queryKey: ["subjectTypes"],
    queryFn: async () => {
      const data = await getSubjectTypes();
      return Array.isArray(data) ? data.filter((st) => st.isActive !== false) : [];
    },
    onError: (error) => {
      console.error("Error fetching subject types:", error);
      toast.error("Failed to load subject types");
    },
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const data = await getAllSubjects();
      return Array.isArray(data) ? data.filter((s) => !s.disabled) : [];
    },
    onError: (error) => {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    },
  });

  const { data: affiliations = [], isLoading: loadingAffiliations } = useQuery({
    queryKey: ["affiliations"],
    queryFn: async () => {
      const data = await getAffiliations();
      return Array.isArray(data) ? data.filter((a) => a.isActive !== false) : [];
    },
    onError: (error) => {
      console.error("Error fetching affiliations:", error);
      toast.error("Failed to load affiliations");
    },
  });

  const { data: regulationTypes = [], isLoading: loadingRegulationTypes } = useQuery({
    queryKey: ["regulationTypes"],
    queryFn: async () => {
      const data = await getRegulationTypes();
      return Array.isArray(data) ? data.filter((r) => r.isActive !== false) : [];
    },
    onError: (error) => {
      console.error("Error fetching regulation types:", error);
      toast.error("Failed to load regulation types");
    },
  });

  // Fetch eligible rooms based on exam schedule

  const { data: floors = [], isLoading: loadingFloors } = useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      const res = await getAllFloors();
      if (res.httpStatus === "SUCCESS" && res.payload) {
        return res.payload.filter((f) => f.isActive !== false);
      }
      return [];
    },
    onError: (error) => {
      console.error("Error fetching floors:", error);
      toast.error("Failed to load floors");
    },
  });

  const { data: examComponents = [], isLoading: loadingExamComponents } = useQuery({
    queryKey: ["examComponents"],
    queryFn: async () => {
      const data = await getExamComponents();
      // Map API response to match ExamComponent type (API returns isActive, type expects disabled)
      // Filter to only include active components
      const mappedComponents: ExamComponent[] = Array.isArray(data)
        ? data
            .filter((comp) => (comp as { isActive?: boolean | null }).isActive !== false)
            .map((comp) => ({
              id: comp.id,
              name: comp.name,
              shortName: comp.shortName ?? null,
              code: comp.code ?? null,
              sequence: comp.sequence ?? null,
              disabled: false, // All filtered items are active, so disabled is false
              createdAt: comp.createdAt,
              updatedAt: comp.updatedAt,
            }))
        : [];
      return mappedComponents;
    },
    onError: (error) => {
      console.error("Error fetching exam components:", error);
      toast.error("Failed to load exam components");
    },
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
  //   const [examAssignment, setExamAssignment] = useState<ExamDto | null>(null);

  // Step 2: Room Selection
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "ALL" | null>("ALL");
  const [assignBy, setAssignBy] = useState<"CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER">("UID");
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);

  // Step 3: Exam Schedule (keyed by subjectId)
  const [subjectSchedules, setSubjectSchedules] = useState<Record<string, Schedule>>({});
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Fetch all rooms for statistics
  const { data: allRooms = [], isLoading: loadingAllRooms } = useQuery({
    queryKey: ["allRooms"],
    queryFn: async () => {
      const res = await getAllRooms();
      if (res.httpStatus === "SUCCESS" && res.payload) {
        return res.payload.filter((room) => room.isActive !== false);
      }
      return [];
    },
    onError: (error) => {
      console.error("Error fetching all rooms:", error);
    },
  });

  // Fetch eligible rooms based on exam schedule
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["eligibleRooms", selectedSubjectIds, subjectSchedules],
    queryFn: async () => {
      // If no subjects selected, return all active rooms
      if (selectedSubjectIds.length === 0) {
        const res = await getAllRooms();
        if (res.httpStatus === "SUCCESS" && res.payload) {
          return res.payload
            .filter((room) => room.isActive !== false)
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
        return [];
      }

      // Build exam subjects array from selected subjects and schedules
      const examSubjects = selectedSubjectIds
        .map((subjectId) => {
          const schedule = subjectSchedules[subjectId.toString()];
          if (!schedule?.date || !schedule?.startTime || !schedule?.endTime) {
            return null;
          }
          const startDateTime = `${schedule.date}T${schedule.startTime}:00+05:30`;
          const endDateTime = `${schedule.date}T${schedule.endTime}:00+05:30`;
          return {
            subjectId,
            startTime: new Date(startDateTime),
            endTime: new Date(endDateTime),
          };
        })
        .filter((subject): subject is { subjectId: number; startTime: Date; endTime: Date } => subject !== null);

      // If no valid schedules, return all active rooms
      if (examSubjects.length === 0) {
        const res = await getAllRooms();
        if (res.httpStatus === "SUCCESS" && res.payload) {
          return res.payload
            .filter((room) => room.isActive !== false)
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
        return [];
      }

      // Fetch eligible rooms
      const res = await getEligibleRooms({ examSubjects });
      if (res.httpStatus === "SUCCESS" && res.payload) {
        return res.payload.rooms.sort((a, b) => (a.name || "").localeCompare(b.name || "")) as RoomDto[];
      }
      return [];
    },
    enabled: true, // Always enabled, will handle empty case
    onError: (error) => {
      console.error("Error fetching eligible rooms:", error);
      toast.error("Failed to load eligible rooms");
    },
  });

  // Excel file upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [foilNumberMap, setFoilNumberMap] = useState<Record<string, string>>({});

  // Assignments (kept for potential future use)

  // Load academic years on mount
  useEffect(() => {
    void loadAcademicYears();
  }, [loadAcademicYears]);

  // Handle Excel file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)");
        event.target.value = "";
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        toast.error("File size must be less than 100MB");
        event.target.value = "";
        return;
      }
      setExcelFile(file);

      // Parse Excel file to extract foil numbers
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName!];
            const jsonData = XLSX.utils.sheet_to_json(sheet!) as Array<{
              foil_number?: string | number;
              uid?: string;
            }>;

            // Create a map of UID to foil_number
            const foilMap: Record<string, string> = {};
            jsonData.forEach((row) => {
              if (row.uid && row.foil_number !== undefined) {
                const uid = String(row.uid).trim();
                const foilNumber = String(row.foil_number).trim();
                if (uid && foilNumber) {
                  foilMap[uid] = foilNumber;
                }
              }
            });
            setFoilNumberMap(foilMap);
            console.log("[EXCEL] Parsed foil numbers:", Object.keys(foilMap).length);
          } catch (error) {
            console.error("Error parsing Excel file:", error);
            setFoilNumberMap({});
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        setFoilNumberMap({});
      }

      toast.success(`Uploaded: ${file.name}`);
    }
  };

  const removeExcelFile = () => {
    setExcelFile(null);
    setFoilNumberMap({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Excel file removed");
  };

  // Fetch papers when filters change
  const isPapersQueryEnabled = selectedProgramCourses.length > 0 && !!semester;
  const {
    data: papers = [],
    isLoading: loadingPapers,
    isFetching: fetchingPapers,
  } = useQuery({
    queryKey: [
      "papers",
      selectedProgramCourses,
      semester,
      selectedSubjectCategories,
      selectedAcademicYearId,
      selectedAffiliationId,
      selectedRegulationTypeId,
      currentAcademicYear?.id,
    ],
    queryFn: async () => {
      if (selectedProgramCourses.length === 0 || !semester) {
        return [];
      }
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
                if (paper.id && !seenPaperIds.has(paper.id) && paper.isActive !== false) {
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
      return allPapers;
    },
    enabled: isPapersQueryEnabled,
    onError: (error) => {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load papers");
    },
  });

  // Loading state object for backward compatibility
  const loading = {
    examTypes: loadingExamTypes,
    classes: loadingClasses,
    programCourses: loadingProgramCourses,
    shifts: loadingShifts,
    subjectTypes: loadingSubjectTypes,
    papers: isPapersQueryEnabled && (loadingPapers || fetchingPapers),
    subjects: loadingSubjects,
    rooms: loadingRooms,
    floors: loadingFloors,
    examComponents: loadingExamComponents,
    affiliations: loadingAffiliations,
    regulationTypes: loadingRegulationTypes,
  };

  // Fetch papers when filters change
  //   const fetchPapers = useCallback(async () => {
  //     if (selectedProgramCourses.length === 0 || !semester) {
  //       setPapers([]);
  //       return;
  //     }

  //     try {
  //       setLoading((prev) => ({ ...prev, papers: true }));
  //       const classObj = classes.find((c) => c.id?.toString() === semester);
  //       const classId = classObj?.id;

  //       // Since API only accepts single values, we need to make multiple calls
  //       // for each combination of program course and subject type
  //       const allPapers: PaperDto[] = [];
  //       const seenPaperIds = new Set<number>();

  //       // If no subject categories selected, fetch for all program courses
  //       const subjectTypesToUse = selectedSubjectCategories.length > 0 ? selectedSubjectCategories : [];

  //       // If no subject types selected, fetch papers for all program courses with class filter
  //       if (subjectTypesToUse.length === 0) {
  //         for (const programCourseId of selectedProgramCourses) {
  //           try {
  //             const papersData = await getPapersPaginated(1, 1000, {
  //               academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
  //               affiliationId: selectedAffiliationId ?? null,
  //               regulationTypeId: selectedRegulationTypeId ?? null,
  //               programCourseId: programCourseId,
  //               classId: classId ?? null,
  //               subjectTypeId: null,
  //             });

  //             if (papersData?.content) {
  //               for (const paper of papersData.content) {
  //                 if (paper.id && !seenPaperIds.has(paper.id)) {
  //                   seenPaperIds.add(paper.id);
  //                   allPapers.push(paper);
  //                 }
  //               }
  //             }
  //           } catch (error) {
  //             console.error(`Error fetching papers for program course ${programCourseId}:`, error);
  //           }
  //         }
  //       } else {
  //         // Fetch papers for each combination of program course and subject type
  //         for (const programCourseId of selectedProgramCourses) {
  //           for (const subjectTypeId of subjectTypesToUse) {
  //             try {
  //               const papersData = await getPapersPaginated(1, 1000, {
  //                 academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
  //                 affiliationId: selectedAffiliationId ?? null,
  //                 regulationTypeId: selectedRegulationTypeId ?? null,
  //                 programCourseId: programCourseId,
  //                 classId: classId ?? null,
  //                 subjectTypeId: subjectTypeId,
  //               });

  //               if (papersData?.content) {
  //                 for (const paper of papersData.content) {
  //                   if (paper.id && !seenPaperIds.has(paper.id)) {
  //                     seenPaperIds.add(paper.id);
  //                     allPapers.push(paper);
  //                   }
  //                 }
  //               }
  //             } catch (error) {
  //               console.error(
  //                 `Error fetching papers for program course ${programCourseId} and subject type ${subjectTypeId}:`,
  //                 error,
  //               );
  //             }
  //           }
  //         }
  //       }

  //       setPapers(allPapers);
  //     } catch (error) {
  //       console.error("Error fetching papers:", error);
  //       toast.error("Failed to load papers");
  //       setPapers([]);
  //     } finally {
  //       setLoading((prev) => ({ ...prev, papers: false }));
  //     }
  //   }, [
  //     selectedProgramCourses,
  //     semester,
  //     selectedSubjectCategories,
  //     classes,
  //     selectedAcademicYearId,
  //     selectedAffiliationId,
  //     selectedRegulationTypeId,
  //     currentAcademicYear?.id,
  //   ]);

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

  //   const createFormData = useCallback((params: any) => {
  //     const formData = new FormData();
  //     Object.entries(params).forEach(([key, value]) => {
  //       if (value !== undefined && value !== null) {
  //         if (Array.isArray(value)) {
  //           value.forEach((item) => formData.append(`${key}[]`, item.toString()));
  //         } else {
  //           formData.append(key, value.toString());
  //         }
  //       }
  //     });
  //     if (excelFile) {
  //       formData.append("file", excelFile);
  //     }
  //     return formData;
  //   }, [excelFile]);

  // Fetch student count from API based on selected subject
  const { data: totalStudents = 0 } = useQuery({
    queryKey: [
      "studentCount",
      selectedProgramCourses,
      selectedShifts,
      semester,
      selectedSubjectId,
      selectedAcademicYearId,
      currentAcademicYear?.id,
      gender,
      excelFile?.name,
    ],
    queryFn: async () => {
      // Check if currentAcademicYear is available
      if (!currentAcademicYear?.id) {
        console.log("[SCHEDULE-EXAM] Waiting for academic year to be loaded...");
        return 0;
      }

      if (selectedProgramCourses.length === 0 || !semester || !selectedSubjectId) {
        return 0;
      }

      const papersForSubject = getPapersForSelectedSubject();
      const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

      if (paperIds.length === 0) {
        return 0;
      }

      const classObj = classes.find((c) => c.id?.toString() === semester);
      if (!classObj?.id) {
        return 0;
      }

      console.log("[SCHEDULE-EXAM] Fetching student count with params:", {
        classId: classObj.id,
        programCourseIds: selectedProgramCourses,
        paperIds,
        academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
        shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
      });

      const response = await countStudentsForExam(
        {
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
          gender: gender === "ALL" ? null : gender,
        },
        excelFile,
      );

      console.log("[SCHEDULE-EXAM] Student count response:", response);

      if (response.httpStatus === "SUCCESS" && response.payload) {
        return response.payload.count;
      } else {
        console.warn("[SCHEDULE-EXAM] Unexpected response:", response);
        return 0;
      }
    },
    enabled:
      !!currentAcademicYear?.id &&
      selectedProgramCourses.length > 0 &&
      !!semester &&
      !!selectedSubjectId &&
      getPapersForSelectedSubject().length > 0,
    onError: (error) => {
      console.error("[SCHEDULE-EXAM] Error fetching student count:", error);
    },
  });

  useEffect(() => {
    const capacity = selectedRooms.reduce((total, room) => {
      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
      const numberOfBenches = room.numberOfBenches || 0;
      return total + numberOfBenches * maxStudentsPerBench;
    }, 0);
    setTotalCapacity(capacity);
  }, [selectedRooms]);

  // Fetch students with seat assignments when rooms are selected
  const { data: studentsWithSeats = [], isLoading: loadingStudents } = useQuery({
    queryKey: [
      "studentsWithSeats",
      selectedRooms,
      selectedProgramCourses,
      selectedShifts,
      semester,
      selectedSubjectId,
      selectedAcademicYearId,
      currentAcademicYear?.id,
      assignBy,
      gender,
      excelFile?.name,
    ],
    queryFn: async () => {
      if (
        selectedRooms.length === 0 ||
        selectedProgramCourses.length === 0 ||
        !semester ||
        !selectedSubjectId ||
        !currentAcademicYear?.id
      ) {
        return [];
      }

      const papersForSubject = getPapersForSelectedSubject();
      const paperIds = papersForSubject.map((p) => p.id).filter((id): id is number => id !== undefined);

      if (paperIds.length === 0) {
        return [];
      }

      const classObj = classes.find((c) => c.id?.toString() === semester);
      if (!classObj?.id) {
        return [];
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

      const response = await getStudentsForExam(
        {
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds,
          academicYearIds: [selectedAcademicYearId ?? currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
          assignBy: assignBy === "UID" ? "UID" : "CU_ROLL_NUMBER",
          roomAssignments,
          gender: gender == "ALL" ? null : gender,
        },
        excelFile,
      );

      if (response.httpStatus === "SUCCESS" && response.payload) {
        return response.payload.students;
      } else {
        return [];
      }
    },
    enabled:
      selectedRooms.length > 0 &&
      selectedProgramCourses.length > 0 &&
      !!semester &&
      !!selectedSubjectId &&
      !!currentAcademicYear?.id &&
      getPapersForSelectedSubject().length > 0,
    onError: (error) => {
      console.error("[SCHEDULE-EXAM] Error fetching students with seats:", error);
    },
  });

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
    const currentSchedule = subjectSchedules[id] || { date: "", startTime: "", endTime: "" };

    // Validate end time is not less than start time
    if (field === "endTime" && currentSchedule.startTime && value) {
      const startTime = currentSchedule.startTime;
      const endTime = value;

      // Compare time strings (HH:MM format)
      if (endTime < startTime) {
        toast.error("End time cannot be less than start time");
        return;
      }
    }

    // If start time is changed and end time exists, validate end time is not less than new start time
    if (field === "startTime" && currentSchedule.endTime && value) {
      const startTime = value;
      const endTime = currentSchedule.endTime;

      if (endTime < startTime) {
        toast.error("End time cannot be less than start time. Please update end time.");
        // Optionally clear end time or keep it and let user fix
      }
    }

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
  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);

  // Keep selected academic year in sync with current academic year by default
  useEffect(() => {
    if (currentAcademicYear?.id && selectedAcademicYearId === null) {
      setSelectedAcademicYearId(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYearId]);

  // Reset selected subjects when program courses, subject categories, or semester change
  useEffect(() => {
    setSelectedSubjectIds([]);
    setSubjectSchedules({});
    setSelectedSubjectId(null);
  }, [selectedProgramCourses, selectedSubjectCategories, semester]);

  // Auto-select first subject/paper when subjects become available
  useEffect(() => {
    if (papers.length === 0 || loadingPapers || fetchingPapers) return;

    const distinctSubjects = getDistinctSubjects();
    if (distinctSubjects.length > 0 && selectedSubjectId === null) {
      const firstSubject = distinctSubjects[0];
      if (firstSubject && firstSubject.subjectId !== null) {
        setSelectedSubjectId(firstSubject.subjectId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers, selectedExamComponent, selectedSubjectId, loadingPapers, fetchingPapers]);

  // Real-time duplicate exam check state
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    isDuplicate: boolean;
    duplicateExamId?: number;
    message?: string;
  } | null>(null);

  // Real-time duplicate exam check - check as soon as we have enough info (don't require rooms)
  const canCheckDuplicate =
    selectedAcademicYearId &&
    examType &&
    semester &&
    selectedProgramCourses.length > 0 &&
    selectedShifts.length > 0 &&
    selectedSubjectCategories.length > 0 &&
    selectedSubjectIds.length > 0 &&
    Object.keys(subjectSchedules).length > 0 &&
    // Check that all selected subjects have complete schedules
    selectedSubjectIds.every((id) => {
      const schedule = subjectSchedules[id.toString()];
      return schedule?.date && schedule?.startTime && schedule?.endTime;
    });

  // Check for duplicate exam in real-time
  useEffect(() => {
    let isCancelled = false;

    const checkDuplicate = async () => {
      console.log("[DUPLICATE-CHECK] canCheckDuplicate:", canCheckDuplicate);
      if (!canCheckDuplicate) {
        setDuplicateCheckResult(null);
        return;
      }

      console.log("[DUPLICATE-CHECK] Starting duplicate check...");
      try {
        const examSubjects: ExamSubjectT[] = [];
        for (const subjectId of selectedSubjectIds) {
          const schedule = subjectSchedules[subjectId];
          if (!schedule?.date || !schedule?.startTime || !schedule?.endTime) {
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
        }

        if (examSubjects.length === 0) {
          if (!isCancelled) setDuplicateCheckResult({ isDuplicate: false });
          return;
        }

        // For duplicate check, we can use empty locations array if rooms aren't selected yet
        // The backend validation will still check rooms when creating, but for duplicate detection
        // we want to check even without rooms selected
        const locations: ExamRoomDto[] =
          selectedRooms.length > 0
            ? selectedRooms.map((room) => ({
                roomId: room.id!,
                studentsPerBench: room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2,
                capacity: room.capacity,
                room: rooms.find((r) => r.id === room.id)!,
                examId: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                id: 0,
              }))
            : [];

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
          examSubjectTypes: subjectTypes
            .filter((st) => selectedSubjectCategories.includes(st.id!))
            .map((st) => ({
              examId: 0,
              subjectType: st,
            })),
          gender: gender === "ALL" ? null : gender,
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

        const result = await checkDuplicateExam(tmpExamAssignment);
        console.log("[DUPLICATE-CHECK] API Response:", result);
        if (!isCancelled) {
          const payload = result.payload || { isDuplicate: false };
          console.log("[DUPLICATE-CHECK] Setting result:", payload);
          setDuplicateCheckResult(payload);
        }
      } catch (error) {
        console.error("Error checking duplicate exam:", error);
        if (!isCancelled) {
          setDuplicateCheckResult({ isDuplicate: false });
        }
      }
    };

    // Debounce the check to avoid too many API calls (reduced to 200ms for faster feedback)
    const timeoutId = setTimeout(() => {
      void checkDuplicate();
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    canCheckDuplicate,
    selectedAcademicYearId,
    examType,
    semester,
    selectedProgramCourses,
    selectedShifts,
    selectedSubjectCategories,
    selectedSubjectIds,
    selectedRooms,
    subjectSchedules,
    assignBy,
    gender,
    availableAcademicYears,
    classes,
    examTypes,
    programCourses,
    shifts,
    subjectTypes,
    subjects,
    rooms,
  ]);

  const assignExamMutation = useMutation({
    mutationFn: async () => {
      const examSubjects: ExamSubjectT[] = [];
      console.log("[SCHEDULE-EXAM] Selected subject IDs:", selectedSubjectIds);
      console.log("[SCHEDULE-EXAM] Subject schedules:", subjectSchedules);

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
        examSubjectTypes: subjectTypes
          .filter((st) => selectedSubjectCategories.includes(st.id!))
          .map((st) => ({
            examId: 0,
            subjectType: st,
          })),
        gender: gender === "ALL" ? null : gender,
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

      // Check for duplicate exam before creating
      console.log("Checking for duplicate exam...");
      const duplicateCheck = await checkDuplicateExam(tmpExamAssignment);
      if (duplicateCheck.payload?.isDuplicate) {
        throw new Error(
          duplicateCheck.payload.message ||
            `An exam with the same configuration already exists (Exam ID: ${duplicateCheck.payload.duplicateExamId}).`,
        );
      }

      console.log("Before calling doAssignExam with:", tmpExamAssignment);
      const response = await doAssignExam(
        {
          ...tmpExamAssignment,
          gender: (tmpExamAssignment.gender as string) === "ALL" ? null : tmpExamAssignment.gender,
        },
        excelFile,
      );
      console.log("In exam assignment post api, response:", response);
      return response;
    },
    onSuccess: () => {
      toast.success(`Successfully assigned exam to the students`);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["studentsWithSeats"] });
      queryClient.invalidateQueries({ queryKey: ["studentCount"] });
    },
    onError: (error) => {
      console.log("In exam assignment post api, error:", error);
      toast.error(`Something went wrong while assigning exam!`);
    },
  });

  const handleAssignExam = () => {
    assignExamMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full p-7 py-4">
      <div className=" w-full flex flex-col gap-4">
        <div className="w-full  px-4 mx-auto">
          {/* Top filter strip (A.Y, Aff, Reg, Exam type, Semester, Shifts, Program Course, Subject Category) */}
          <div className="mb-4 mt-3 space-y-6">
            <Card className="border border-slate-500 shadow-none ">
              <CardHeader className="border-b border-slate-500 pb-2 mb-7">
                <CardTitle>
                  <h3 className="scroll-m-20 text-slate-600 italic text-2xl font-semibold tracking-tight">
                    Step 1: Select the filters to schedule the exam.
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pb-14">
                {/* First Row: Main Filters - Full Width */}
                <div className="flex flex-wrap gap-3 pb-4 sm:gap-4 items-start w-full">
                  {/* Academic Year */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Academic Year</Label>
                    <Select
                      value={selectedAcademicYearId ? selectedAcademicYearId.toString() : ""}
                      onValueChange={(val) => setSelectedAcademicYearId(val ? Number(val) : null)}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Affiliation</Label>
                    <Select
                      value={selectedAffiliationId ? selectedAffiliationId.toString() : ""}
                      onValueChange={(val) => setSelectedAffiliationId(val ? Number(val) : null)}
                      disabled={loading.affiliations}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Regulation</Label>
                    <Select
                      value={selectedRegulationTypeId ? selectedRegulationTypeId.toString() : ""}
                      onValueChange={(val) => setSelectedRegulationTypeId(val ? Number(val) : null)}
                      disabled={loading.regulationTypes}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Exam Type</Label>
                    <Select value={examType} onValueChange={setExamType} disabled={loading.examTypes}>
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Semester</Label>
                    <Select value={semester} onValueChange={setSemester} disabled={loading.classes}>
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                </div>
                {/* Second Row: Table Format Filters - Full Width */}
                <div className="w-full border border-gray-400 rounded-lg overflow-hidden">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="w-[33.33%] p-2 relative text-center whitespace-nowrap border-r border-gray-400">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="absolute inset-0 w-full h-full cursor-pointer"
                                aria-label="Select Shifts"
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
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
                                    <span className=" text-center">{shift.name}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <div className="font-medium pointer-events-none flex items-center justify-center gap-1">
                            Shift(s)
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[33.33%] p-2 relative text-center whitespace-nowrap border-r border-gray-400">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="absolute inset-0 w-full h-full cursor-pointer"
                                aria-label="Select Program Courses"
                                disabled={loading.programCourses}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                {programCourses.map((course) => (
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
                                    <span className=" text-left">{course.name}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <div className="font-medium pointer-events-none flex items-center justify-center gap-1">
                            Program Course(s)
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[33.33%] p-2 relative text-center whitespace-nowrap">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="absolute inset-0 w-full h-full cursor-pointer"
                                aria-label="Select Subject Categories"
                                disabled={loading.subjectTypes}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="text-left p-2" align="start">
                              <div className="max-h-56 overflow-y-auto space-y-1">
                                {subjectTypes.map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 "
                                    onClick={() => category.id && handleSubjectCategoryToggle(category.id)}
                                  >
                                    <Checkbox
                                      checked={
                                        category.id !== undefined && selectedSubjectCategories.includes(category.id)
                                      }
                                      onCheckedChange={() => category.id && handleSubjectCategoryToggle(category.id)}
                                      className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <span className=" text-left">
                                      {category.code && category.code.trim() ? category.code : category.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <div className="font-medium pointer-events-none flex items-center justify-center gap-1">
                            Subject Category
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-t border-gray-400 ">
                        <TableCell className="text-center p-2 border-r border-gray-400">
                          {selectedShifts.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedShifts.map((shiftId) => {
                                const shift = shifts.find((s) => s.id === shiftId);
                                return shift ? (
                                  <Badge
                                    key={shiftId}
                                    variant="outline"
                                    className=" border-orange-300 text-orange-700 bg-orange-50 flex items-center gap-1"
                                  >
                                    {shift.name}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (shift.id) handleShiftToggle(shift.id);
                                      }}
                                      className="hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2 border-r border-gray-400">
                          {selectedProgramCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedProgramCourses.map((courseId) => {
                                const course = programCourses.find((c) => c.id === courseId);
                                return course ? (
                                  <Badge
                                    key={courseId}
                                    variant="outline"
                                    className=" border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                                  >
                                    {course.name}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (course.id) handleProgramCourseToggle(course.id);
                                      }}
                                      className="hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          {selectedSubjectCategories.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedSubjectCategories.map((categoryId) => {
                                const category = subjectTypes.find((c) => c.id === categoryId);
                                return category ? (
                                  <Badge
                                    key={categoryId}
                                    variant="outline"
                                    className=" border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-1"
                                  >
                                    {category.code && category.code.trim() ? category.code : category.name}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (category.id) handleSubjectCategoryToggle(category.id);
                                      }}
                                      className="hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-500 shadow-none">
              <CardHeader className="border-b border-slate-500 pb-2 mb-7">
                <CardTitle>
                  <h3 className="scroll-m-20 text-slate-600 italic text-2xl font-semibold tracking-tight">
                    Step 2: Select the subjects to schedule the exam.
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pb-14">
                {/* Third Row: Other Filters - Full Width */}
                <div className="flex flex-wrap gap-3 sm:gap-4 items-start w-full ">
                  {/* Subjects */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Subjects</Label>
                    {getDistinctSubjects().length === 0 && !loading.papers ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        <span className=" text-gray-500 whitespace-nowrap">Select filters to load subjects</span>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-8 w-full justify-between border-purple-300 "
                            disabled={getDistinctSubjects().length === 0}
                          >
                            <span className="">Subjects</span>
                            {selectedSubjectIds.length > 0 && (
                              <span className=" text-gray-500 ml-1">({selectedSubjectIds.length})</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {getDistinctSubjects().map((subject) => {
                              if (subject.subjectId == null) return null;
                              const isChecked = selectedSubjectIds.includes(subject.subjectId);
                              return (
                                <button
                                  key={subject.subjectId}
                                  type="button"
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
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
                                  <span className="text-sm text-left flex-1">
                                    {subject.subjectCode ? (
                                      <span className="text-gray-700 font-medium">{subject.subjectCode}</span>
                                    ) : (
                                      <span className="text-gray-500">{subject.subjectName}</span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Component */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <Label className=" font-medium text-gray-700">Component</Label>
                    <Select
                      value={selectedExamComponent?.toString() || "all"}
                      onValueChange={(value) => {
                        setSelectedExamComponent(value === "all" ? null : Number(value));
                      }}
                      disabled={loading.examComponents}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ">
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
                <div className="w-full flex-shrink-0">
                  <div className="rounded-lg overflow-hidden">
                    <div className="flex flex-col gap-4">
                      {/* Subject schedule list */}
                      <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex-1 overflow-auto scrollbar-hide">
                          {isPapersQueryEnabled && (loadingPapers || fetchingPapers) ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading papers...
                            </div>
                          ) : (
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-100">
                                    <TableHead className="w-[50px] text-center  font-medium">Sr. No.</TableHead>
                                    <TableHead className=" font-medium">Subject</TableHead>
                                    <TableHead className=" font-medium">Date</TableHead>
                                    <TableHead className=" font-medium">Start Time</TableHead>
                                    <TableHead className=" font-medium">End Time</TableHead>
                                    <TableHead className="w-[100px] text-center  font-medium">Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedSubjectIds.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground ">
                                        {getDistinctSubjects().length === 0
                                          ? "No subjects available"
                                          : "Select subjects from the dropdown above"}
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    selectedSubjectIds.map((id, index) => {
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
                                        <TableRow
                                          key={id}
                                          className={`cursor-pointer ${selectedSubjectId === id ? "bg-muted" : ""}`}
                                          onClick={() => setSelectedSubjectId(id)}
                                        >
                                          <TableCell className="text-center ">{index + 1}</TableCell>
                                          <TableCell className="font-medium ">{code ? code : name}</TableCell>
                                          <TableCell>
                                            <Input
                                              type="date"
                                              value={schedule.date || ""}
                                              onChange={(e) => handleScheduleChange(id, "date", e.target.value)}
                                              className="h-8 w-full "
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="time"
                                              value={schedule.startTime || ""}
                                              onChange={(e) => handleScheduleChange(id, "startTime", e.target.value)}
                                              className="h-8 w-full "
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="time"
                                              value={schedule.endTime || ""}
                                              onChange={(e) => handleScheduleChange(id, "endTime", e.target.value)}
                                              className="h-8 w-full "
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSubjectIds((prev) =>
                                                  prev.filter((subjectId) => subjectId !== id),
                                                );
                                              }}
                                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-500 shadow-none">
              <CardHeader className="border-b border-slate-500 pb-2 mb-7">
                <CardTitle>
                  <h3 className="scroll-m-20 text-slate-600 italic text-2xl font-semibold tracking-tight">
                    Step 3: Select the rooms and students to schedule the exam.
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-16">
                {/* Capacity Summary */}
                <div
                  className={`p-4 rounded-lg border shadow-sm ${
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

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 sm:gap-6 items-end">
                  <div className="flex-1 sm:flex-initial min-w-[180px]">
                    <Label htmlFor="gender-select" className="text-sm font-medium text-gray-700 mb-2 block">
                      Gender
                    </Label>
                    <Select value={gender || ""} onValueChange={(value) => setGender(value as typeof gender)}>
                      <SelectTrigger
                        id="gender-select"
                        className="h-9 w-full sm:w-48 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
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
                  <div className="flex-1 sm:flex-initial min-w-[180px]">
                    <Label htmlFor="order-by-select" className="text-sm font-medium text-gray-700 mb-2 block">
                      Order By
                    </Label>
                    <Select value={assignBy} onValueChange={(value) => setAssignBy(value as typeof assignBy)}>
                      <SelectTrigger
                        id="order-by-select"
                        className="h-9 w-full sm:w-52 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UID">UID</SelectItem>
                        <SelectItem value="CU_REGISTRATION_NUMBER">CU Registration Number</SelectItem>
                        <SelectItem value="CU_ROLL_NUMBER">CU Roll Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Excel File Upload */}
                {examType && examTypes.find((e) => e.id.toString() === examType)?.foilNumberRequired === true && (
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Upload Excel</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-full sm:w-auto sm:min-w-[200px] justify-between border-purple-300"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {excelFile
                            ? `File: ${excelFile.name.slice(0, 20)}${excelFile.name.length > 20 ? "..." : ""}`
                            : "Upload Excel"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-3">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Excel File (foil_number, uid)
                          </Button>
                          {excelFile && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
                              <span className="text-sm text-green-700">{excelFile.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeExcelFile}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <p className="text-gray-500">Upload XLSX with columns: foil_number, uid</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => setRoomsModalOpen(true)}
                    variant="outline"
                    disabled={
                      selectedSubjectIds.length === 0 ||
                      !selectedSubjectIds.every((id) => {
                        const schedule = subjectSchedules[id.toString()];
                        return schedule?.date && schedule?.startTime && schedule?.endTime;
                      })
                    }
                    className="flex-1 sm:flex-initial border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      selectedSubjectIds.length === 0 ||
                      !selectedSubjectIds.every((id) => {
                        const schedule = subjectSchedules[id.toString()];
                        return schedule?.date && schedule?.startTime && schedule?.endTime;
                      })
                        ? "Please add date, start time, and end time for all selected subjects"
                        : "View and select rooms"
                    }
                  >
                    <DoorOpen className="w-4 h-4 mr-2" />
                    View Rooms ({selectedRooms.length})
                  </Button>
                  <Button
                    onClick={() => setStudentsModalOpen(true)}
                    variant="outline"
                    className="flex-1 sm:flex-initial border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50"
                    disabled={studentsWithSeats.length === 0}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Students ({studentsWithSeats.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Duplicate Exam Warning */}
          {duplicateCheckResult?.isDuplicate && (
            <div className="mt-6 p-5 bg-red-50 border-2 border-red-400 rounded-lg flex items-start gap-4 shadow-lg">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <p className="font-bold text-red-900 text-base mb-2">⚠️ Duplicate Exam Detected</p>
                <p className="text-sm text-red-800 font-medium mb-3">
                  {duplicateCheckResult.message ||
                    `An exam with the same configuration already exists${duplicateCheckResult.duplicateExamId ? ` (Exam ID: ${duplicateCheckResult.duplicateExamId})` : ""}. Please modify your selections to create a unique exam.`}
                </p>
                {duplicateCheckResult.duplicateExamId && (
                  <Link
                    to={`/dashboard/exam-management/exams/${duplicateCheckResult.duplicateExamId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900 underline transition-colors"
                  >
                    <span>View Duplicate Exam</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === "development" && canCheckDuplicate && (
            <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
              <p>Duplicate Check Status: ✅ Ready</p>
              {duplicateCheckResult && (
                <p>Result: {duplicateCheckResult.isDuplicate ? "🔴 Duplicate Found" : "✅ No Duplicate"}</p>
              )}
            </div>
          )}

          {/* Total students + Assign button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 p-4 bg-gray-100/60 rounded-lg border shadow-sm flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold whitespace-nowrap">Total Students</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-purple-600 ml-2 flex-shrink-0">{totalStudents}</span>
            </div>
            <Button
              onClick={handleAssignExam}
              disabled={assignExamMutation.status === "loading" || duplicateCheckResult?.isDuplicate}
              className="w-full sm:w-auto sm:min-w-[140px] h-12 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {assignExamMutation.status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Assigning...
                </>
              ) : (
                "Assign Exam"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Rooms Modal */}
      <Dialog open={roomsModalOpen} onOpenChange={setRoomsModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Select Rooms</DialogTitle>
                <DialogDescription>Choose rooms and optionally override capacity</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4">
            {/* Rooms Statistics */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1">Total Rooms</div>
                <div className="text-lg font-bold text-blue-900">{allRooms.length}</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">Eligible Rooms</div>
                <div className="text-lg font-bold text-green-900">{rooms.length}</div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-xs text-purple-600 font-medium mb-1">Selected Rooms</div>
                <div className="text-lg font-bold text-purple-900">{selectedRooms.length}</div>
              </div>
            </div>

            {loadingRooms || loadingAllRooms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-gray-500">Loading rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DoorOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No eligible rooms available</p>
                <p className="text-sm mt-1">All rooms may be occupied during the selected exam schedule</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-[60vh] relative">
                  <table className="w-full caption-bottom text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="border-b bg-gray-100">
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-center align-middle font-medium text-sm border-r border-border w-20">
                          <Checkbox
                            checked={
                              rooms.filter((room) => room.isActive !== false).length > 0 &&
                              rooms
                                .filter((room) => room.isActive !== false)
                                .every((room) => selectedRooms.some((r) => r.id === room.id))
                            }
                            onCheckedChange={(checked) => {
                              const activeRooms = rooms.filter((room) => room.isActive !== false);
                              if (checked) {
                                activeRooms.forEach((room) => {
                                  if (!selectedRooms.some((r) => r.id === room.id)) {
                                    handleRoomSelection(room, true);
                                  }
                                });
                              } else {
                                activeRooms.forEach((room) => {
                                  if (selectedRooms.some((r) => r.id === room.id)) {
                                    handleRoomSelection(room, false);
                                  }
                                });
                              }
                            }}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-center align-middle font-medium text-sm border-r border-border w-20">
                          Sr. No.
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Floor
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Room
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Benches
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Capacity
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Max Students per Bench
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm">
                          Override
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {rooms
                        .filter((room) => room.isActive !== false)
                        .map((room, index) => {
                          const isSelected = selectedRooms.some((r) => r.id === room.id);
                          const selectedRoom = selectedRooms.find((r) => r.id === room.id);
                          const currentMaxStudentsPerBench =
                            selectedRoom?.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                          const calculatedCapacity = (room.numberOfBenches || 0) * currentMaxStudentsPerBench;
                          const floorName = room.floor.id! ? floors.find((f) => f.id === room.floor.id)?.name : "N/A";

                          return (
                            <tr
                              key={room.id}
                              className={`border-b transition-colors hover:bg-gray-50 ${isSelected ? "bg-purple-50" : ""}`}
                            >
                              <td className="p-4 align-middle border-r border-border text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleRoomSelection(room, !!checked)}
                                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                              </td>
                              <td className="p-4 align-middle border-r border-border text-center text-sm">
                                {index + 1}
                              </td>
                              <td className="p-4 align-middle border-r border-border text-sm">{floorName}</td>
                              <td className="p-4 align-middle border-r border-border text-sm font-medium">
                                {room.name}
                              </td>
                              <td className="p-4 align-middle border-r border-border text-sm">
                                {room.numberOfBenches || 0}
                              </td>
                              <td className="p-4 align-middle border-r border-border text-sm">{calculatedCapacity}</td>
                              <td className="p-4 align-middle border-r border-border text-sm">
                                {currentMaxStudentsPerBench}
                              </td>
                              <td className="p-4 align-middle text-sm">
                                {isSelected ? (
                                  <div className="space-y-1">
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
                                      className="h-8 w-20 text-sm"
                                    />
                                    <div className="text-sm text-gray-400">Max: {room.maxStudentsPerBench || 2}</div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-5 border-t">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{selectedRooms.length}</span> room(s) selected
              </p>
              <Button onClick={() => setRoomsModalOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Modal */}
      <Dialog open={studentsModalOpen} onOpenChange={setStudentsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Students Assigned</DialogTitle>
                <DialogDescription>View students with their assigned seats and locations</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4">
            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-500">Loading students...</span>
              </div>
            ) : studentsWithSeats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="font-semibold text-gray-600">No Students Assigned</p>
                <p className="text-gray-400 mt-1 text-sm">Select rooms and generate assignments to see students here</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-[60vh] relative">
                  <table className="w-full caption-bottom text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="border-b bg-gray-100">
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-center align-middle font-medium text-sm border-r border-border">
                          Sr. No.
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Name
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          {assignBy === "UID" ? "UID" : "CU Reg. No."}
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-center align-middle font-medium text-sm border-r border-border">
                          Foil Number
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Email
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          WhatsApp
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Subject
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Paper
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Floor
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm border-r border-border">
                          Room
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm">
                          Seat Number
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {studentsWithSeats.map((student, idx) => (
                        <tr
                          key={student.studentId}
                          className={`border-b transition-colors hover:bg-gray-100 ${idx % 2 === 0 ? "bg-gray-50" : ""}`}
                        >
                          <td className="p-4 align-middle border-r border-border text-center text-sm">{idx + 1}</td>
                          <td className="p-4 align-middle border-r border-border text-sm font-medium">
                            {student.name}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm font-mono">
                            {assignBy === "UID" ? student.uid : student.cuRegistrationApplicationNumber || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm text-center font-mono">
                            {foilNumberMap[student.uid] || "0"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">{student.email || "N/A"}</td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.whatsappPhone || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {selectedSubjectId
                              ? (() => {
                                  const subject = subjects.find((s) => s.id === selectedSubjectId);
                                  const shortName = (subject as { shortName?: string | null })?.shortName ?? null;
                                  if (shortName && shortName.trim()) return shortName;
                                  if (subject?.code && subject.code.trim()) return subject.code;
                                  return subject?.name || "N/A";
                                })()
                              : "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {selectedSubjectId
                              ? (() => {
                                  const subject = subjects.find((s) => s.id === selectedSubjectId);
                                  const shortName = (subject as { shortName?: string | null })?.shortName ?? null;
                                  if (shortName && shortName.trim()) return shortName;
                                  if (subject?.code && subject.code.trim()) return subject.code;
                                  return subject?.name || "N/A";
                                })()
                              : "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.floorName || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.roomName || "N/A"}
                          </td>
                          <td className="p-4 align-middle text-sm font-mono">{student.seatNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-5 border-t">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{studentsWithSeats.length}</span> student(s) assigned
              </p>
              <div className="flex items-center gap-3">
                {studentsWithSeats.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const exportData = studentsWithSeats.map((student, idx) => {
                        const subject = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;
                        const subjectName = subject
                          ? (subject as { shortName?: string | null })?.shortName?.trim() ||
                            subject.code?.trim() ||
                            subject.name ||
                            "N/A"
                          : "N/A";

                        return {
                          "Sr. No.": idx + 1,
                          Name: student.name || "N/A",
                          UID: assignBy === "UID" ? student.uid || "N/A" : "N/A",
                          "CU Reg. No.": assignBy !== "UID" ? student.cuRegistrationApplicationNumber || "N/A" : "N/A",
                          "Foil Number": foilNumberMap[student.uid] || "0",
                          Email: student.email || "N/A",
                          WhatsApp: student.whatsappPhone || "N/A",
                          Subject: subjectName,
                          Paper: subjectName,
                          Floor: student.floorName || "N/A",
                          Room: student.roomName || "N/A",
                          "Seat Number": student.seatNumber || "N/A",
                        };
                      });

                      const workbook = XLSX.utils.book_new();
                      const worksheet = XLSX.utils.json_to_sheet(exportData);

                      // Set column widths
                      const maxWidths: { [key: string]: number } = {};
                      exportData.forEach((row) => {
                        Object.keys(row).forEach((key) => {
                          const value = String(row[key as keyof typeof row] || "");
                          maxWidths[key] = Math.max(maxWidths[key] || 0, value.length, key.length);
                        });
                      });

                      worksheet["!cols"] = Object.keys(exportData[0] || {}).map((key) => ({
                        wch: Math.max(15, (maxWidths[key] || 10) + 2),
                      }));

                      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
                      XLSX.writeFile(workbook, `Students_Assignment_${new Date().toISOString().split("T")[0]}.xlsx`);
                      toast.success("Students list exported successfully");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                )}
                <Button onClick={() => setStudentsModalOpen(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
