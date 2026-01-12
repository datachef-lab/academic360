import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Trash2, Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllExamTypes } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAffiliations, getRegulationTypes, getProgramCourseDtos } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getSubjectTypes, getExamComponents } from "@/services/course-design.api";
import { getPapersPaginated } from "@/services/course-design.api";
import { getAllSubjects } from "@/services/subject.api";
import { checkDuplicateExam } from "@/services/exam-schedule.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import type { PaperDto, ExamDto, ExamSubjectT, ExamRoomDto, ExamProgramCourseDto } from "@repo/db/index";
import { ExamComponent } from "@/types/course-design";
import { doAssignExam } from "../services";
import { Card, CardContent } from "@/components/ui/card";

// Room and student interfaces moved to allot-exam-page

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

  // Floors query moved to allot-exam-page

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

  // Step 2: Room Selection - REMOVED (moved to allot-exam-page)
  // const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "ALL" | null>("ALL");
  // const [assignBy, setAssignBy] = useState<"CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER">("UID");
  // const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  // const [totalCapacity, setTotalCapacity] = useState(0);

  // Step 3: Exam Schedule - now tracks subject+paper combinations
  interface SubjectPaperSchedule {
    subjectId: number;
    paperId: number;
    schedule: Schedule;
  }
  const [selectedSubjectPapers, setSelectedSubjectPapers] = useState<SubjectPaperSchedule[]>([]);
  // Keep selectedSubjectIds for backward compatibility with subject selection UI
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  // Keep subjectSchedules as derived state for backward compatibility (will be removed later)
  const subjectSchedules: Record<string, Schedule> = {};
  selectedSubjectPapers.forEach((sp) => {
    const key = `${sp.subjectId}`;
    if (!subjectSchedules[key] || sp.schedule.date) {
      subjectSchedules[key] = sp.schedule;
    }
  });

  // Room and student selection moved to allot-exam-page
  // Excel file upload moved to allot-exam-page

  // Assignments (kept for potential future use)

  // Load academic years on mount
  useEffect(() => {
    void loadAcademicYears();
  }, [loadAcademicYears]);

  // Excel file upload moved to allot-exam-page

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

  // getPapersForSelectedSubject moved to allot-exam-page

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

  // Student count and seat assignment queries moved to allot-exam-page

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

  // Helper to get papers for a subject
  const getPapersForSubject = useCallback(
    (subjectId: number): PaperDto[] => {
      return papers.filter((paper) => paper.subjectId === subjectId && paper.isActive !== false);
    },
    [papers],
  );

  // Normalize paper code for comparison (trim and lowercase)
  const normalizePaperCode = (code: string | null | undefined): string => {
    return (code || "").trim().toLowerCase();
  };

  // Handle subject selection - when subject is selected, auto-select ALL its papers
  const handleSubjectToggle = (subjectId: number) => {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(subjectId)) {
        // Remove subject and all its papers
        setSelectedSubjectPapers((prevPapers) => prevPapers.filter((sp) => sp.subjectId !== subjectId));
        return prev.filter((id) => id !== subjectId);
      } else {
        // Add subject - auto-select ALL papers for this subject
        const subjectPapers = getPapersForSubject(subjectId);
        const newPapers: SubjectPaperSchedule[] = subjectPapers
          .filter((paper) => paper.id)
          .map((paper) => ({
            subjectId,
            paperId: paper.id!,
            schedule: { date: "", startTime: "", endTime: "" },
          }));

        setSelectedSubjectPapers((prev) => [...prev, ...newPapers]);
        return [...prev, subjectId];
      }
    });
  };

  // Room selection handlers moved to allot-exam-page

  // Group papers by subjectId and normalized paper code
  const getGroupedSubjectPapers = useCallback(() => {
    const grouped = new Map<
      string,
      {
        subjectId: number;
        normalizedCode: string;
        papers: Array<{ paperId: number; paper: PaperDto; schedule: Schedule }>;
        representativeSchedule: Schedule; // Use the first paper's schedule as representative
      }
    >();

    selectedSubjectPapers.forEach((sp) => {
      const paper = papers.find((p) => p.id === sp.paperId);
      if (!paper) return;

      const normalizedCode = normalizePaperCode(paper.code);
      const groupKey = `${sp.subjectId}|${normalizedCode}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          subjectId: sp.subjectId,
          normalizedCode,
          papers: [],
          representativeSchedule: sp.schedule,
        });
      }

      const group = grouped.get(groupKey)!;
      group.papers.push({
        paperId: sp.paperId,
        paper,
        schedule: sp.schedule,
      });
      // Update representative schedule if this one has more complete data
      if (sp.schedule.date && !group.representativeSchedule.date) {
        group.representativeSchedule = sp.schedule;
      }
    });

    return Array.from(grouped.values());
  }, [selectedSubjectPapers, papers]);

  // Handle schedule change for a group of papers (same subject + normalized code)
  const handleScheduleChange = (subjectId: number, normalizedCode: string, field: keyof Schedule, value: string) => {
    // Find all papers in this group
    const groupPapers = selectedSubjectPapers.filter((sp) => {
      const paper = papers.find((p) => p.id === sp.paperId);
      if (!paper) return false;
      return sp.subjectId === subjectId && normalizePaperCode(paper.code) === normalizedCode;
    });

    if (groupPapers.length === 0) return;

    // Get current schedule from first paper in group
    const currentSchedule = groupPapers[0]?.schedule || { date: "", startTime: "", endTime: "" };

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

    // Update all papers in the group
    setSelectedSubjectPapers((prev) =>
      prev.map((sp) => {
        const paper = papers.find((p) => p.id === sp.paperId);
        if (!paper) return sp;

        const spNormalizedCode = normalizePaperCode(paper.code);
        if (sp.subjectId === subjectId && spNormalizedCode === normalizedCode) {
          return {
            ...sp,
            schedule: {
              ...sp.schedule,
              [field]: value,
            },
          };
        }
        return sp;
      }),
    );
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

  // Room and student modals moved to allot-exam-page

  // Keep selected academic year in sync with current academic year by default
  useEffect(() => {
    if (currentAcademicYear?.id && selectedAcademicYearId === null) {
      setSelectedAcademicYearId(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYearId]);

  // Reset selected subjects when program courses, subject categories, or semester change
  useEffect(() => {
    setSelectedSubjectIds([]);
    setSelectedSubjectPapers([]);
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
        for (const subjectPaper of selectedSubjectPapers) {
          const schedule = subjectPaper.schedule;
          if (!schedule?.date || !schedule?.startTime || !schedule?.endTime) {
            continue;
          }

          const startDateTime = `${schedule.date}T${schedule.startTime}:00+05:30`;
          const endDateTime = `${schedule.date}T${schedule.endTime}:00+05:30`;

          examSubjects.push({
            subjectId: subjectPaper.subjectId,
            paperId: subjectPaper.paperId, // Include paperId
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

        // For duplicate check, use empty locations array (rooms not selected in schedule step)
        const locations: ExamRoomDto[] = [];

        const tmpExamAssignment: ExamDto = {
          orderType: "UID", // Default, will be set during allotment
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
          gender: null, // Will be set during allotment
          examSubjects: examSubjects.map((es) => ({
            ...es,
            subject: subjects.find((ele) => ele.id === es.subjectId)!,
          })),
          locations, // Empty array - no rooms assigned yet
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
    subjectSchedules,
    availableAcademicYears,
    classes,
    examTypes,
    programCourses,
    shifts,
    subjectTypes,
    subjects,
  ]);

  const assignExamMutation = useMutation({
    mutationFn: async () => {
      const examSubjects: ExamSubjectT[] = [];
      console.log("[SCHEDULE-EXAM] Selected subject papers:", selectedSubjectPapers);

      for (const subjectPaper of selectedSubjectPapers) {
        const schedule = subjectPaper.schedule;

        if (!schedule?.date || !schedule?.startTime || !schedule?.endTime) {
          console.warn(
            `[SCHEDULE-EXAM] Incomplete schedule for subject ${subjectPaper.subjectId} paper ${subjectPaper.paperId}`,
            schedule,
          );
          continue;
        }

        const startDateTime = `${schedule.date}T${schedule.startTime}:00+05:30`;
        const endDateTime = `${schedule.date}T${schedule.endTime}:00+05:30`;

        examSubjects.push({
          subjectId: subjectPaper.subjectId,
          paperId: subjectPaper.paperId, // Now includes paperId
          startTime: new Date(startDateTime),
          endTime: new Date(endDateTime),
          examId: 0,
          id: 0,
          createdAt: null,
          updatedAt: null,
        });

        console.log("[SCHEDULE-EXAM] Exam subject pushed:", {
          subjectId: subjectPaper.subjectId,
          paperId: subjectPaper.paperId,
          startDateTime,
          endDateTime,
        });
      }

      // No rooms/students in schedule step - empty locations array
      const locations: ExamRoomDto[] = [];

      const tmpExamAssignment: ExamDto = {
        orderType: "UID", // Default, will be set during allotment
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
        gender: null, // Will be set during allotment
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
      // No Excel file needed for scheduling - only for allotment
      const response = await doAssignExam(tmpExamAssignment, null);
      console.log("In exam assignment post api, response:", response);
      return response;
    },
    onSuccess: (response) => {
      toast.success(`Exam scheduled successfully! You can now allot rooms and students.`);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      // Reset form after successful creation
      resetForm();
      // Optionally redirect to allot exam page with exam ID
      if (response.payload?.id) {
        // Could navigate to allot page here if needed
        console.log("Exam scheduled with ID:", response.payload.id);
      }
    },
    onError: (error) => {
      console.log("In exam scheduling post api, error:", error);
      toast.error(`Something went wrong while scheduling exam!`);
    },
  });

  // Reset form function
  const resetForm = () => {
    setExamType("");
    setSemester("");
    setSelectedProgramCourses([]);
    setSelectedShifts([]);
    setSelectedSubjectCategories([]);
    setSelectedSubjectId(null);
    setSelectedExamComponent(null);
    setSelectedAcademicYearId(null);
    setSelectedAffiliationId(null);
    setSelectedRegulationTypeId(null);
    setSelectedSubjectPapers([]);
    setSelectedSubjectIds([]);
    setDuplicateCheckResult(null);
  };

  const handleScheduleExam = () => {
    assignExamMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full p-7 py-4">
      <div className=" w-full flex flex-col gap-4">
        <div className="w-full  px-4 mx-auto">
          {/* Page Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Schedule Exam</h1>
            <p className="text-gray-600 mt-1">Create and schedule exams for your academic year</p>
          </div>
          {/* Top filter strip (A.Y, Aff, Reg, Exam type, Semester, Shifts, Program Course, Subject Category) */}
          <div className="mb-4 mt-3 space-y-6">
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-5 pb-14 pt-4">
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
                                    className=" border-green-300 text-green-700 bg-green-50 flex items-center gap-1"
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

            <Card className="border-0 shadow-none">
              <CardContent className="space-y-5 pb-14 pt-4">
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
                        <PopoverContent className="w-80 p-2" align="start">
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {getDistinctSubjects().map((subject) => {
                              if (subject.subjectId == null) return null;
                              const isChecked = selectedSubjectIds.includes(subject.subjectId);

                              return (
                                <button
                                  key={subject.subjectId}
                                  type="button"
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
                                  onClick={() => {
                                    if (subject.subjectId) {
                                      handleSubjectToggle(subject.subjectId);
                                    }
                                  }}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => {
                                      if (subject.subjectId) {
                                        handleSubjectToggle(subject.subjectId);
                                      }
                                    }}
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
                            <div className="border border-gray-400 rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b border-gray-400">
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[5%]">
                                      <div className="font-medium">Sr. No.</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[15%]">
                                      <div className="font-medium">Program Course</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[25%]">
                                      <div className="font-medium">Subject & Paper</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[10%]">
                                      <div className="font-medium">Code</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[10%]">
                                      <div className="font-medium">Subject Category</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[12%]">
                                      <div className="font-medium">Date</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center bg-gray-100 w-[13%]">
                                      <div className="font-medium">Time</div>
                                    </TableHead>
                                    <TableHead className="p-2 text-center bg-gray-100 w-[10%]">
                                      <div className="font-medium">Action</div>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedSubjectPapers.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {getDistinctSubjects().length === 0
                                          ? "No subjects available"
                                          : "Select subjects from the dropdown above and choose papers"}
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    getGroupedSubjectPapers().map((group, index) => {
                                      // Use first paper as representative for display
                                      const representativePaper = group.papers[0]?.paper;
                                      const subject = subjects.find((s) => s.id === group.subjectId);
                                      if (!representativePaper || !subject) return null;

                                      const programCourse = programCourses.find(
                                        (pc) => pc.id === representativePaper.programCourseId,
                                      );
                                      const subjectType = subjectTypes.find(
                                        (st) => st.id === representativePaper.subjectTypeId,
                                      );

                                      // Use representative schedule (from first paper or most complete one)
                                      const schedule = group.representativeSchedule;
                                      const dateValue = schedule.date || "";
                                      const startTimeValue = schedule.startTime || "";
                                      const endTimeValue = schedule.endTime || "";

                                      // Show count if multiple papers in group
                                      const paperCount = group.papers.length;
                                      const showCount = paperCount > 1;

                                      return (
                                        <TableRow
                                          key={`${group.subjectId}-${group.normalizedCode}-${index}`}
                                          className="border-b border-gray-400"
                                        >
                                          <TableCell className="p-2 text-center border-r border-gray-400">
                                            {index + 1}
                                          </TableCell>
                                          <TableCell className="p-2 text-center border-r border-gray-400">
                                            {programCourse ? (
                                              <Badge
                                                variant="outline"
                                                className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                                              >
                                                {programCourse.name}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="p-2 text-center border-r border-gray-400">
                                            <div className="flex flex-col gap-1.5 items-center">
                                              <span className="text-sm font-medium">
                                                {representativePaper.name || "-"}
                                                {representativePaper.isOptional === false && (
                                                  <span className="text-red-500 ml-1">*</span>
                                                )}
                                                {showCount && (
                                                  <span className="text-gray-500 text-xs ml-1">({paperCount})</span>
                                                )}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 w-fit"
                                              >
                                                {subject.code || subject.name}
                                              </Badge>
                                            </div>
                                          </TableCell>
                                          <TableCell className="p-2 text-center border-r border-gray-400 text-sm font-mono">
                                            {representativePaper.code || "-"}
                                            {showCount && (
                                              <span className="text-gray-500 text-xs ml-1">({paperCount})</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="p-2 text-center border-r border-gray-400">
                                            {subjectType ? (
                                              <Badge
                                                variant="outline"
                                                className="text-xs border-green-300 text-green-700 bg-green-50"
                                              >
                                                {subjectType.code || subjectType.name}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="p-2 text-center border-r border-gray-400">
                                            <Input
                                              type="date"
                                              value={dateValue}
                                              onChange={(e) =>
                                                handleScheduleChange(
                                                  group.subjectId,
                                                  group.normalizedCode,
                                                  "date",
                                                  e.target.value,
                                                )
                                              }
                                              className="h-8 w-full text-sm"
                                            />
                                          </TableCell>
                                          <TableCell className="p-2 text-center">
                                            <div className="flex flex-col gap-1">
                                              <Input
                                                type="time"
                                                value={startTimeValue}
                                                onChange={(e) =>
                                                  handleScheduleChange(
                                                    group.subjectId,
                                                    group.normalizedCode,
                                                    "startTime",
                                                    e.target.value,
                                                  )
                                                }
                                                className="h-8 w-full text-sm"
                                                placeholder="Start"
                                              />
                                              <Input
                                                type="time"
                                                value={endTimeValue}
                                                onChange={(e) =>
                                                  handleScheduleChange(
                                                    group.subjectId,
                                                    group.normalizedCode,
                                                    "endTime",
                                                    e.target.value,
                                                  )
                                                }
                                                className="h-8 w-full text-sm"
                                                placeholder="End"
                                              />
                                            </div>
                                          </TableCell>
                                          <TableCell className="p-2 text-center">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                // Remove all papers in this group
                                                setSelectedSubjectPapers((prev) =>
                                                  prev.filter((sp) => {
                                                    const paper = papers.find((p) => p.id === sp.paperId);
                                                    if (!paper) return true;
                                                    const spNormalizedCode = normalizePaperCode(paper.code);
                                                    return !(
                                                      sp.subjectId === group.subjectId &&
                                                      spNormalizedCode === group.normalizedCode
                                                    );
                                                  }),
                                                );
                                                // Check if this was the last group for this subject
                                                const remainingPapersForSubject = selectedSubjectPapers.filter((sp) => {
                                                  const paper = papers.find((p) => p.id === sp.paperId);
                                                  if (!paper) return false;
                                                  const spNormalizedCode = normalizePaperCode(paper.code);
                                                  return (
                                                    sp.subjectId === group.subjectId &&
                                                    spNormalizedCode !== group.normalizedCode
                                                  );
                                                });
                                                if (remainingPapersForSubject.length === 0) {
                                                  setSelectedSubjectIds((prev) =>
                                                    prev.filter((id) => id !== group.subjectId),
                                                  );
                                                }
                                              }}
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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

          {/* Schedule Exam button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleScheduleExam}
              disabled={
                assignExamMutation.status === "loading" ||
                duplicateCheckResult?.isDuplicate ||
                selectedSubjectPapers.length === 0 ||
                !selectedSubjectPapers.every((sp) => {
                  const schedule = sp.schedule;
                  return schedule?.date && schedule?.startTime && schedule?.endTime;
                })
              }
              className="w-full sm:w-auto sm:min-w-[180px] h-12 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {assignExamMutation.status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Scheduling...
                </>
              ) : (
                "Schedule Exam"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
