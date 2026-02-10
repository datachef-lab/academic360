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
import { AlertCircle, Trash2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllExamTypes } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAffiliations, getRegulationTypes, getProgramCourseDtos } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getSubjectTypes, getExamComponents } from "@/services/course-design.api";
import { getPapersPaginated } from "@/services/course-design.api";
import { getAllSubjects } from "@/services/subject.api";
import { checkDuplicateExam, countStudentsBreakdownForExam } from "@/services/exam-schedule.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import type { PaperDto, ExamDto, ExamSubjectT, ExamRoomDto, ExamProgramCourseDto } from "@repo/db/index";
import { ExamComponent } from "@/types/course-design";
import { doAssignExam } from "../services";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";

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

interface StudentCountBreakdown {
  programCourseId: number;
  programCourseName: string;
  shiftId: number;
  shiftName: string;
  count: number;
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
  const { user } = useAuth();

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

  const { data: classesData, isLoading: loadingClasses } = useQuery({
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

  // Ensure classes is always an array to prevent .map() errors
  const classes = Array.isArray(classesData) ? classesData : [];

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

  // New flow state variables
  const [currentSubjectIds, setCurrentSubjectIds] = useState<number[]>([]); // Multi-select subjects
  const [currentProgramCourseIds, setCurrentProgramCourseIds] = useState<number[]>([]); // Multi-select program courses
  const [currentPaperIds, setCurrentPaperIds] = useState<number[]>([]); // Multi-select papers
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState<string>("");
  const [currentDuration, setCurrentDuration] = useState<string>(""); // Duration in minutes

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

      // Build all API call promises
      const apiCalls: Promise<{ content?: PaperDto[] }>[] = [];

      // If no subject types selected, fetch papers for all program courses with class filter
      if (subjectTypesToUse.length === 0) {
        // Create API calls for each program course
        for (const programCourseId of selectedProgramCourses) {
          apiCalls.push(
            getPapersPaginated(1, 1000, {
              academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
              affiliationId: selectedAffiliationId ?? null,
              regulationTypeId: selectedRegulationTypeId ?? null,
              programCourseId: programCourseId,
              classId: classId ?? null,
              subjectTypeId: null,
            }).catch((error) => {
              console.error(`Error fetching papers for program course ${programCourseId}:`, error);
              return { content: [] };
            }),
          );
        }
      } else {
        // Fetch papers for each combination of program course and subject type
        for (const programCourseId of selectedProgramCourses) {
          for (const subjectTypeId of subjectTypesToUse) {
            apiCalls.push(
              getPapersPaginated(1, 1000, {
                academicYearId: selectedAcademicYearId ?? currentAcademicYear?.id ?? null,
                affiliationId: selectedAffiliationId ?? null,
                regulationTypeId: selectedRegulationTypeId ?? null,
                programCourseId: programCourseId,
                classId: classId ?? null,
                subjectTypeId: subjectTypeId,
              }).catch((error) => {
                console.error(
                  `Error fetching papers for program course ${programCourseId} and subject type ${subjectTypeId}:`,
                  error,
                );
                return { content: [] };
              }),
            );
          }
        }
      }

      // Execute all API calls in parallel for maximum speed
      // Increased from batched to fully parallel since server can handle it
      const results = await Promise.all(apiCalls);

      // Combine results and deduplicate
      for (const result of results) {
        if (result?.content) {
          for (const paper of result.content) {
            if (paper.id && !seenPaperIds.has(paper.id) && paper.isActive !== false) {
              seenPaperIds.add(paper.id);
              allPapers.push(paper);
            }
          }
        }
      }

      return allPapers;
    },
    enabled: isPapersQueryEnabled,
    staleTime: 60000, // Cache results for 60 seconds to prevent unnecessary refetches
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
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

  // Filter program courses based on affiliation and regulation
  const getFilteredProgramCourses = useCallback(() => {
    let filtered = programCourses.filter((pc) => pc.isActive !== false);

    // Filter by affiliation if selected
    if (selectedAffiliationId) {
      filtered = filtered.filter((pc) => pc.affiliation?.id === selectedAffiliationId);
    }

    // Filter by regulation if selected
    if (selectedRegulationTypeId) {
      filtered = filtered.filter((pc) => pc.regulationType?.id === selectedRegulationTypeId);
    }

    return filtered;
  }, [programCourses, selectedAffiliationId, selectedRegulationTypeId]);

  // Helper to get papers for a subject
  const getPapersForSubject = useCallback(
    (subjectId: number): PaperDto[] => {
      return papers.filter((paper) => paper.subjectId === subjectId && paper.isActive !== false);
    },
    [papers],
  );

  // NEW FLOW HELPERS

  // Get available program courses for selected subjects (from their papers)
  // Only returns program courses that still have papers that haven't been added
  const getAvailableProgramCoursesForSubjects = useCallback(
    (subjectIds: number[]): Array<{ id: number; name: string }> => {
      if (subjectIds.length === 0) return [];

      const addedPaperIds = new Set(selectedSubjectPapers.map((sp) => sp.paperId));
      const programCourseIds = new Set<number>();

      // Get papers for all selected subjects
      subjectIds.forEach((subjectId) => {
        const subjectPapers = getPapersForSubject(subjectId);
        subjectPapers.forEach((paper) => {
          // Only include program course if the paper hasn't been added yet
          if (paper.programCourseId && paper.id && !addedPaperIds.has(paper.id)) {
            programCourseIds.add(paper.programCourseId);
          }
        });
      });

      return Array.from(programCourseIds)
        .map((pcId) => {
          const pc = programCourses.find((p) => p.id === pcId);
          return pc ? { id: pcId, name: pc.name || `Program Course ${pcId}` } : null;
        })
        .filter((pc): pc is { id: number; name: string } => pc !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [getPapersForSubject, programCourses, selectedSubjectPapers],
  );

  // Get available papers based on current filters (subjects + component + program courses)
  const getFilteredPapersForCurrentSelection = useCallback((): PaperDto[] => {
    if (currentSubjectIds.length === 0) return [];

    // Get papers for all selected subjects
    let filtered: PaperDto[] = [];
    currentSubjectIds.forEach((subjectId) => {
      filtered = [...filtered, ...getPapersForSubject(subjectId)];
    });

    // Filter by selected exam component if one is selected
    if (selectedExamComponent !== null) {
      filtered = filtered.filter((paper) => {
        return (
          paper.components &&
          Array.isArray(paper.components) &&
          paper.components.some((component) => component.examComponent?.id === selectedExamComponent)
        );
      });
    }

    // Filter by selected program courses if any are selected
    if (currentProgramCourseIds.length > 0) {
      filtered = filtered.filter(
        (paper) => paper.programCourseId && currentProgramCourseIds.includes(paper.programCourseId),
      );
    }

    // Filter out already-added papers
    const addedPaperIds = new Set(selectedSubjectPapers.map((sp) => sp.paperId));
    filtered = filtered.filter((paper) => paper.id && !addedPaperIds.has(paper.id));

    return filtered;
  }, [currentSubjectIds, selectedExamComponent, currentProgramCourseIds, getPapersForSubject, selectedSubjectPapers]);

  // Calculate end time based on start time and duration (in minutes)
  const calculateEndTime = useCallback((startTime: string, durationMinutes: string): string => {
    if (!startTime || !durationMinutes) return "";

    const timeParts = startTime.split(":");
    const hours = parseInt(timeParts[0] || "", 10);
    const minutes = parseInt(timeParts[1] || "", 10);
    const duration = parseInt(durationMinutes, 10);

    if (isNaN(hours) || isNaN(minutes) || isNaN(duration)) return "";

    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const endHours = endDate.getHours().toString().padStart(2, "0");
    const endMinutes = endDate.getMinutes().toString().padStart(2, "0");

    return `${endHours}:${endMinutes}`;
  }, []);

  // Convert 24-hour time to 12-hour AM/PM format
  const formatTimeToAMPM = useCallback((time24: string): string => {
    if (!time24) return "";

    const timeParts = time24.split(":");
    const hours = parseInt(timeParts[0] || "", 10);
    const minutes = parseInt(timeParts[1] || "", 10);

    if (isNaN(hours) || isNaN(minutes)) return time24;

    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    const minutesStr = minutes.toString().padStart(2, "0");

    return `${hours12}:${minutesStr} ${period}`;
  }, []);

  // Check if a subject has any papers that haven't been added yet
  const subjectHasAvailablePapers = useCallback(
    (subjectId: number): boolean => {
      const subjectPapers = getPapersForSubject(subjectId);
      const addedPaperIds = new Set(selectedSubjectPapers.map((sp) => sp.paperId));

      // Check if there are any papers for this subject that haven't been added
      return subjectPapers.some((paper) => paper.id && !addedPaperIds.has(paper.id));
    },
    [getPapersForSubject, selectedSubjectPapers],
  );

  // Get subjects that still have available papers (not fully added)
  const getAvailableSubjects = useCallback(() => {
    return getDistinctSubjects().filter((subject) => {
      if (subject.subjectId == null) return false;
      return subjectHasAvailablePapers(subject.subjectId);
    });
  }, [getDistinctSubjects, subjectHasAvailablePapers]);

  // Handle adding papers with current date/time settings
  const handleAddPapers = useCallback(() => {
    if (currentSubjectIds.length === 0 || currentPaperIds.length === 0) {
      toast.error("Please select at least one subject and one paper");
      return;
    }

    if (!currentDate) {
      toast.error("Please select a date");
      return;
    }

    if (!currentStartTime) {
      toast.error("Please select a start time");
      return;
    }

    if (!currentDuration) {
      toast.error("Please enter duration");
      return;
    }

    const endTime = calculateEndTime(currentStartTime, currentDuration);

    if (!endTime) {
      toast.error("Invalid duration or start time");
      return;
    }

    // Validate end time is not before start time
    if (endTime <= currentStartTime) {
      toast.error("Duration must be greater than 0");
      return;
    }

    // Create new subject-paper schedules for each selected paper
    const newSchedules: SubjectPaperSchedule[] = [];

    currentPaperIds.forEach((paperId) => {
      // Find which subject this paper belongs to
      const paper = papers.find((p) => p.id === paperId);
      if (paper && paper.subjectId && currentSubjectIds.includes(paper.subjectId)) {
        newSchedules.push({
          subjectId: paper.subjectId,
          paperId,
          schedule: {
            date: currentDate,
            startTime: currentStartTime,
            endTime,
          },
        });
      }
    });

    if (newSchedules.length === 0) {
      toast.error("No valid papers to add");
      return;
    }

    setSelectedSubjectPapers((prev) => [...prev, ...newSchedules]);

    // Update selectedSubjectIds with any new subjects
    const newSubjectIds = [...new Set(newSchedules.map((s) => s.subjectId))];
    setSelectedSubjectIds((prev) => {
      const updated = new Set([...prev, ...newSubjectIds]);
      return Array.from(updated);
    });

    // Reset current selections
    setCurrentPaperIds([]);
    setCurrentDate("");
    setCurrentStartTime("");
    setCurrentDuration("");

    toast.success(`Added ${newSchedules.length} paper(s) to exam schedule`);
  }, [currentSubjectIds, currentPaperIds, currentDate, currentStartTime, currentDuration, calculateEndTime, papers]);

  // Room selection handlers moved to allot-exam-page

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

  // Reset selected program courses when affiliation or regulation changes
  useEffect(() => {
    // Clear program courses that don't match the new affiliation/regulation filters
    const filteredIds = getFilteredProgramCourses()
      .map((pc) => pc.id)
      .filter((id): id is number => id !== undefined);
    setSelectedProgramCourses((prev) => prev.filter((id) => filteredIds.includes(id)));
  }, [selectedAffiliationId, selectedRegulationTypeId, getFilteredProgramCourses]);

  // Reset selected subjects when program courses, subject categories, or semester change
  useEffect(() => {
    setSelectedSubjectIds([]);
    setSelectedSubjectPapers([]);
    // Reset new flow state
    setCurrentSubjectIds([]);
    setCurrentProgramCourseIds([]);
    setCurrentPaperIds([]);
    setCurrentDate("");
    setCurrentStartTime("");
    setCurrentDuration("");
  }, [selectedProgramCourses, selectedSubjectCategories, semester]);

  // Auto-reset currentSubjectIds when subjects run out of available papers
  useEffect(() => {
    if (currentSubjectIds.length === 0) return;

    // Check which currently selected subjects still have available papers
    const validSubjectIds = currentSubjectIds.filter((subjectId) => subjectHasAvailablePapers(subjectId));

    // If some subjects no longer have available papers, remove them
    if (validSubjectIds.length !== currentSubjectIds.length) {
      setCurrentSubjectIds(validSubjectIds);

      // Also reset dependent selections
      setCurrentProgramCourseIds([]);
      setCurrentPaperIds([]);

      if (validSubjectIds.length === 0) {
        toast.info("All papers for selected subjects have been added");
      }
    }
  }, [selectedSubjectPapers, currentSubjectIds, subjectHasAvailablePapers]);

  // Auto-reset currentProgramCourseIds when program courses run out of available papers
  useEffect(() => {
    if (currentProgramCourseIds.length === 0 || currentSubjectIds.length === 0) return;

    // Get program courses that still have available papers for current subjects
    const availableProgramCourses = getAvailableProgramCoursesForSubjects(currentSubjectIds);
    const availableProgramCourseIds = new Set(availableProgramCourses.map((pc) => pc.id));

    // Check which currently selected program courses still have available papers
    const validProgramCourseIds = currentProgramCourseIds.filter((pcId) => availableProgramCourseIds.has(pcId));

    // If some program courses no longer have available papers, remove them
    if (validProgramCourseIds.length !== currentProgramCourseIds.length) {
      setCurrentProgramCourseIds(validProgramCourseIds);
      setCurrentPaperIds([]); // Reset paper selection
    }
  }, [selectedSubjectPapers, currentProgramCourseIds, currentSubjectIds, getAvailableProgramCoursesForSubjects]);

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
          scheduledByUserId: user?.id ?? null,
          lastUpdatedByUserId: user?.id ?? null,
          admitCardStartDownloadDate: null,
          admitCardLastDownloadDate: null,
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
    user?.id,
  ]);

  // Student count query - fetch count based on selected filters
  // Show breakdown as soon as class, program courses, and shifts are selected
  // Papers are still needed for the count, but schedules don't need to be complete
  const canFetchStudentCount =
    selectedAcademicYearId &&
    semester &&
    selectedProgramCourses.length > 0 &&
    selectedShifts.length > 0 &&
    selectedSubjectPapers.length > 0; // Just need papers selected, schedules can be incomplete

  // Fetch student count breakdown by program course and shift (single API call)
  const { data: studentCountData, isLoading: loadingStudentCount } = useQuery(
    [
      "studentCountBreakdown",
      selectedAcademicYearId,
      semester,
      selectedProgramCourses,
      selectedShifts,
      selectedSubjectPapers.map((sp) => sp.paperId).sort(),
    ],
    async () => {
      // Enable query as soon as class, program courses, and shifts are selected
      if (!selectedAcademicYearId || !semester || selectedProgramCourses.length === 0 || selectedShifts.length === 0) {
        return { breakdown: [], total: 0 };
      }

      const classObj = classes.find((c) => c.id?.toString() === semester);
      const classId = classObj?.id;
      if (!classId) return { breakdown: [], total: 0 };

      // Get paper IDs - use all selected papers even if schedules aren't complete
      const paperIds = selectedSubjectPapers.map((sp) => sp.paperId).filter((id): id is number => id !== undefined);

      // If no papers selected yet, return empty (but query is still enabled for when papers are added)
      if (paperIds.length === 0) return { breakdown: [], total: 0 };

      // Build all combinations
      const combinations: Array<{ programCourseId: number; shiftId: number }> = [];
      for (const programCourseId of selectedProgramCourses) {
        for (const shiftId of selectedShifts) {
          combinations.push({ programCourseId, shiftId });
        }
      }

      if (combinations.length === 0) return { breakdown: [], total: 0 };

      try {
        const response = await countStudentsBreakdownForExam(
          {
            classId,
            paperIds,
            academicYearIds: [selectedAcademicYearId],
            combinations,
            gender: null,
          },
          null, // No Excel file
        );

        if (response.httpStatus === "SUCCESS" && response.payload) {
          // Transform results into breakdown format with names
          const breakdown: StudentCountBreakdown[] = response.payload.breakdown.map((item) => {
            const programCourse = programCourses.find((pc) => pc.id === item.programCourseId);
            const shift = shifts.find((s) => s.id === item.shiftId);
            return {
              programCourseId: item.programCourseId,
              programCourseName: programCourse?.name || `Program Course ${item.programCourseId}`,
              shiftId: item.shiftId,
              shiftName: shift?.name || `Shift ${item.shiftId}`,
              count: item.count,
            };
          });

          return {
            breakdown,
            total: response.payload.total,
          };
        }
        return { breakdown: [], total: 0 };
      } catch (error) {
        console.error("[SCHEDULE-EXAM] Error fetching student count breakdown:", error);
        return { breakdown: [], total: 0 };
      }
    },
    {
      // Enable as soon as class, program courses, and shifts are selected
      enabled: !!selectedAcademicYearId && !!semester && selectedProgramCourses.length > 0 && selectedShifts.length > 0,
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );

  const totalStudentCount = studentCountData?.total ?? 0;
  const studentCountBreakdown = studentCountData?.breakdown ?? [];

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
        scheduledByUserId: null,
        lastUpdatedByUserId: null,
        admitCardStartDownloadDate: null,
        admitCardLastDownloadDate: null,
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
    setSelectedExamComponent(null);
    setSelectedAcademicYearId(null);
    setSelectedAffiliationId(null);
    setSelectedRegulationTypeId(null);
    setSelectedSubjectPapers([]);
    setSelectedSubjectIds([]);
    setDuplicateCheckResult(null);
    // Reset new flow state
    setCurrentSubjectIds([]);
    setCurrentProgramCourseIds([]);
    setCurrentPaperIds([]);
    setCurrentDate("");
    setCurrentStartTime("");
    setCurrentDuration("");
  };

  const handleScheduleExam = () => {
    assignExamMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full p-7 py-4">
      <div className=" w-full flex flex-col gap-4">
        <div className="w-full  px-4 mx-auto">
          {/* Page Heading */}
          <div className="mb-6 border-b pb-3">
            <h1 className="text-3xl font-bold text-gray-800">Schedule Exam</h1>
            <p className="text-gray-600 mt-1">Create and schedule exams for your academic year</p>
          </div>
          {/* Top filter strip (A.Y, Aff, Reg, Exam type, Semester, Shifts, Program Course, Subject Category) */}
          <div className="mb-4 mt-3 space-y-3">
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-5 pb-4 pt-4">
                {/* First Row: Academic Year, Affiliation, Regulation, Exam Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Academic Year */}
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Academic Year</Label>
                    <Select
                      value={selectedAcademicYearId ? selectedAcademicYearId.toString() : ""}
                      onValueChange={(val) => setSelectedAcademicYearId(val ? Number(val) : null)}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Affiliation</Label>
                    <Select
                      value={selectedAffiliationId ? selectedAffiliationId.toString() : ""}
                      onValueChange={(val) => setSelectedAffiliationId(val ? Number(val) : null)}
                      disabled={loading.affiliations}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Regulation</Label>
                    <Select
                      value={selectedRegulationTypeId ? selectedRegulationTypeId.toString() : ""}
                      onValueChange={(val) => setSelectedRegulationTypeId(val ? Number(val) : null)}
                      disabled={loading.regulationTypes}
                    >
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Exam Type</Label>
                    <Select value={examType} onValueChange={setExamType} disabled={loading.examTypes}>
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
                </div>
                {/* Second Row: Semester, Shift(s), Program Course(s), Subject Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Semester */}
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Semester</Label>
                    <Select value={semester} onValueChange={setSemester} disabled={loading.classes}>
                      <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
                  {/* Shift(s) */}
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Shift(s)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          disabled={loading.shifts}
                        >
                          <span className="text-gray-600">
                            {loading.shifts
                              ? "Loading..."
                              : selectedShifts.length > 0
                                ? `Select Shifts (${selectedShifts.length})`
                                : "Select Shifts"}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {shifts.map((shift) => (
                            <button
                              key={shift.id}
                              type="button"
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
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

                  {/* Program Course(s) */}
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Program Course(s)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          disabled={
                            loading.programCourses ||
                            !selectedAffiliationId ||
                            !selectedRegulationTypeId ||
                            getFilteredProgramCourses().length === 0
                          }
                        >
                          <span className="text-gray-600">
                            {loading.programCourses
                              ? "Loading..."
                              : !selectedAffiliationId || !selectedRegulationTypeId
                                ? "Select affiliation & regulation first"
                                : getFilteredProgramCourses().length === 0
                                  ? "No program courses available"
                                  : selectedProgramCourses.length > 0
                                    ? `Select Program Courses (${selectedProgramCourses.length})`
                                    : "Select Program Courses"}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {getFilteredProgramCourses().length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                              No program courses available for selected affiliation and regulation
                            </div>
                          ) : (
                            getFilteredProgramCourses().map((course) => (
                              <button
                                key={course.id}
                                type="button"
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
                                onClick={() => course.id && handleProgramCourseToggle(course.id)}
                              >
                                <Checkbox
                                  checked={course.id !== undefined && selectedProgramCourses.includes(course.id)}
                                  onCheckedChange={() => course.id && handleProgramCourseToggle(course.id)}
                                  className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <span className="text-left">{course.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Subject Category */}
                  <div className="flex flex-col gap-1">
                    <Label className="font-medium text-gray-700">Subject Category</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          disabled={loading.subjectTypes}
                        >
                          <span className="text-gray-600">
                            {loading.subjectTypes
                              ? "Loading..."
                              : selectedSubjectCategories.length > 0
                                ? `Select Subject Categories (${selectedSubjectCategories.length})`
                                : "Select Subject Categories"}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {subjectTypes.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
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

            {/* Check if all required fields from first section are selected */}
            {examType &&
            semester &&
            selectedProgramCourses.length > 0 &&
            selectedShifts.length > 0 &&
            selectedSubjectCategories.length > 0 ? (
              <>
                {/* Dotted Separator between sections */}
                <div className="border-t border-dashed border-gray-400 my-4"></div>

                <Card className="border-0 shadow-none">
                  <CardContent className="space-y-5 pb-4 pt-2">
                    {/* New Flow: Subject, Component, Program Courses, Papers, Date/Time */}
                    <div className="space-y-4 border border-gray-300 rounded-lg p-4">
                      {/* Added border to grid layout */}
                      {/* First Row: Subjects, Component, Program Courses, Papers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Subjects - Multi-Select */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Subject(s)</Label>
                          {getDistinctSubjects().length === 0 && !loading.papers ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md h-8">
                              <span className="text-gray-500 text-sm whitespace-nowrap">
                                Select filters to load subjects
                              </span>
                            </div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  disabled={getDistinctSubjects().length === 0 || getAvailableSubjects().length === 0}
                                >
                                  <span className="text-gray-600 truncate">
                                    {getAvailableSubjects().length === 0 && getDistinctSubjects().length > 0
                                      ? "All papers added"
                                      : currentSubjectIds.length > 0
                                        ? `${currentSubjectIds.length} subject(s)`
                                        : "Select Subjects"}
                                  </span>
                                  <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-2" align="start">
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                  {getAvailableSubjects().length === 0 ? (
                                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                                      All papers have been added
                                    </div>
                                  ) : (
                                    getAvailableSubjects().map((subject) => {
                                      if (subject.subjectId == null) return null;
                                      return (
                                        <button
                                          key={subject.subjectId}
                                          type="button"
                                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
                                          onClick={() => {
                                            setCurrentSubjectIds((prev) =>
                                              prev.includes(subject.subjectId!)
                                                ? prev.filter((id) => id !== subject.subjectId)
                                                : [...prev, subject.subjectId!],
                                            );
                                            // Reset dependent selections
                                            setCurrentProgramCourseIds([]);
                                            setCurrentPaperIds([]);
                                          }}
                                        >
                                          <Checkbox
                                            checked={currentSubjectIds.includes(subject.subjectId)}
                                            onCheckedChange={() => {
                                              setCurrentSubjectIds((prev) =>
                                                prev.includes(subject.subjectId!)
                                                  ? prev.filter((id) => id !== subject.subjectId)
                                                  : [...prev, subject.subjectId!],
                                              );
                                              setCurrentProgramCourseIds([]);
                                              setCurrentPaperIds([]);
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
                                    })
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Component - Single Select */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Component</Label>
                          <Select
                            value={selectedExamComponent?.toString() || "all"}
                            onValueChange={(value) => {
                              setSelectedExamComponent(value === "all" ? null : Number(value));
                              // Reset paper selection when component changes
                              setCurrentPaperIds([]);
                            }}
                            disabled={loading.examComponents || currentSubjectIds.length === 0}
                          >
                            <SelectTrigger className="h-8 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                              <SelectValue placeholder={loading.examComponents ? "Loading..." : "All"} />
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

                        {/* Program Courses (Multi-select) */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Program Course(s)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={
                                  currentSubjectIds.length === 0 ||
                                  getAvailableProgramCoursesForSubjects(currentSubjectIds).length === 0
                                }
                              >
                                <span className="text-gray-600 truncate">
                                  {currentSubjectIds.length === 0
                                    ? "Select subjects first"
                                    : getAvailableProgramCoursesForSubjects(currentSubjectIds).length === 0
                                      ? "All papers added"
                                      : currentProgramCourseIds.length > 0
                                        ? `${currentProgramCourseIds.length} selected`
                                        : "All Program Courses"}
                                </span>
                                <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-2" align="start">
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                {getAvailableProgramCoursesForSubjects(currentSubjectIds).length === 0 ? (
                                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                                    All papers have been added
                                  </div>
                                ) : (
                                  getAvailableProgramCoursesForSubjects(currentSubjectIds).map((pc) => (
                                    <button
                                      key={pc.id}
                                      type="button"
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
                                      onClick={() => {
                                        setCurrentProgramCourseIds((prev) =>
                                          prev.includes(pc.id) ? prev.filter((id) => id !== pc.id) : [...prev, pc.id],
                                        );
                                        // Reset paper selection when program courses change
                                        setCurrentPaperIds([]);
                                      }}
                                    >
                                      <Checkbox
                                        checked={currentProgramCourseIds.includes(pc.id)}
                                        onCheckedChange={() => {
                                          setCurrentProgramCourseIds((prev) =>
                                            prev.includes(pc.id) ? prev.filter((id) => id !== pc.id) : [...prev, pc.id],
                                          );
                                          setCurrentPaperIds([]);
                                        }}
                                        className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                      />
                                      <span className="text-left text-sm">{pc.name}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Papers (Multi-select) */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Paper(s)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-8 w-full justify-between focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={
                                  currentSubjectIds.length === 0 || getFilteredPapersForCurrentSelection().length === 0
                                }
                              >
                                <span className="text-gray-600 truncate">
                                  {currentSubjectIds.length === 0
                                    ? "Select subjects first"
                                    : currentPaperIds.length > 0
                                      ? `${currentPaperIds.length} paper(s)`
                                      : getFilteredPapersForCurrentSelection().length === 0
                                        ? "No papers"
                                        : "Select Papers"}
                                </span>
                                <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-2" align="start">
                              <div className="max-h-60 overflow-y-auto space-y-1">
                                {getFilteredPapersForCurrentSelection().map((paper) => {
                                  if (!paper.id) return null;
                                  const subject = subjects.find((s) => s.id === paper.subjectId);
                                  return (
                                    <button
                                      key={paper.id}
                                      type="button"
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100"
                                      onClick={() => {
                                        setCurrentPaperIds((prev) =>
                                          prev.includes(paper.id!)
                                            ? prev.filter((id) => id !== paper.id)
                                            : [...prev, paper.id!],
                                        );
                                      }}
                                    >
                                      <Checkbox
                                        checked={currentPaperIds.includes(paper.id)}
                                        onCheckedChange={() => {
                                          setCurrentPaperIds((prev) =>
                                            prev.includes(paper.id!)
                                              ? prev.filter((id) => id !== paper.id)
                                              : [...prev, paper.id!],
                                          );
                                        }}
                                        className="h-3.5 w-3.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                      />
                                      <div className="flex flex-col items-start flex-1 text-left">
                                        <span className="text-sm font-medium">{paper.name || "Unnamed Paper"}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500 font-mono">
                                            {paper.code || "No code"}
                                          </span>
                                          {subject && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50"
                                            >
                                              {subject.code || subject.name}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Second Row: Date, Start Time, Duration, Add Button */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 items-end">
                        {/* Date */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Date</Label>
                          <Input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="h-8 w-full"
                            disabled={currentSubjectIds.length === 0 || currentPaperIds.length === 0}
                          />
                        </div>

                        {/* Start Time */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Start Time</Label>
                          <Input
                            type="time"
                            value={currentStartTime}
                            onChange={(e) => setCurrentStartTime(e.target.value)}
                            className="h-8 w-full"
                            disabled={currentSubjectIds.length === 0 || currentPaperIds.length === 0}
                          />
                        </div>

                        {/* Duration (in minutes) */}
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Duration (mins)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={currentDuration}
                            onChange={(e) => setCurrentDuration(e.target.value)}
                            placeholder="e.g., 180"
                            className="h-8 w-full"
                            disabled={currentSubjectIds.length === 0 || currentPaperIds.length === 0}
                          />
                        </div>

                        {/* Add Button */}
                        <div className="flex flex-col gap-1">
                          <Button
                            onClick={handleAddPapers}
                            disabled={
                              currentSubjectIds.length === 0 ||
                              currentPaperIds.length === 0 ||
                              !currentDate ||
                              !currentStartTime ||
                              !currentDuration
                            }
                            className="h-8 bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                          >
                            Add Papers
                          </Button>
                        </div>
                      </div>

                      {/* Display calculated end time and summary */}
                      {currentPaperIds.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                          <div className="text-sm text-blue-800">
                            <span className="font-semibold">{currentPaperIds.length}</span> paper(s) will be added
                            {currentDate && currentStartTime && currentDuration && (
                              <>
                                <span> on </span>
                                <span className="font-semibold">
                                  {new Date(currentDate).toLocaleDateString("en-GB")}
                                </span>
                                <span> from </span>
                                <span className="font-mono font-semibold">{formatTimeToAMPM(currentStartTime)}</span>
                                <span> to </span>
                                <span className="font-mono font-semibold">
                                  {formatTimeToAMPM(calculateEndTime(currentStartTime, currentDuration)) || "Invalid"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Added Papers Table */}
                    <div className="w-full flex-shrink-0 mt-4">
                      <div className="rounded-lg overflow-hidden">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Scheduled Exam Papers</h3>
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
                                <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[20%]">
                                  <div className="font-medium">Subject</div>
                                </TableHead>
                                <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[20%]">
                                  <div className="font-medium">Paper</div>
                                </TableHead>
                                <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[12%]">
                                  <div className="font-medium">Code</div>
                                </TableHead>
                                <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[12%]">
                                  <div className="font-medium">Date</div>
                                </TableHead>
                                <TableHead className="p-2 text-center border-r border-gray-400 bg-gray-100 w-[11%]">
                                  <div className="font-medium">Time</div>
                                </TableHead>
                                <TableHead className="p-2 text-center bg-gray-100 w-[5%]">
                                  <div className="font-medium">Action</div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSubjectPapers.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No papers added yet. Use the form above to add papers to the exam schedule.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                selectedSubjectPapers.map((sp, index) => {
                                  const paper = papers.find((p) => p.id === sp.paperId);
                                  const subject = subjects.find((s) => s.id === sp.subjectId);
                                  if (!paper || !subject) return null;

                                  const programCourse = programCourses.find((pc) => pc.id === paper.programCourseId);
                                  const schedule = sp.schedule;

                                  return (
                                    <TableRow
                                      key={`${sp.subjectId}-${sp.paperId}-${index}`}
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
                                          <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="p-2 text-center border-r border-gray-400">
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50"
                                        >
                                          {subject.code || subject.name}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="p-2 text-center border-r border-gray-400">
                                        <span className="text-sm font-medium">
                                          {paper.name || "Unnamed Paper"}
                                          {paper.isOptional === false && <span className="text-red-500 ml-1">*</span>}
                                        </span>
                                      </TableCell>
                                      <TableCell className="p-2 text-center border-r border-gray-400 text-sm font-mono">
                                        {paper.code || "-"}
                                      </TableCell>
                                      <TableCell className="p-2 text-center border-r border-gray-400 text-sm">
                                        {schedule.date ? new Date(schedule.date).toLocaleDateString("en-GB") : "-"}
                                      </TableCell>
                                      <TableCell className="p-2 text-center border-r border-gray-400 text-sm">
                                        {schedule.startTime && schedule.endTime
                                          ? `${formatTimeToAMPM(schedule.startTime)} - ${formatTimeToAMPM(schedule.endTime)}`
                                          : "-"}
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedSubjectPapers((prev) =>
                                              prev.filter(
                                                (item) =>
                                                  !(item.subjectId === sp.subjectId && item.paperId === sp.paperId),
                                              ),
                                            );
                                            // If no more papers for this subject, remove from selectedSubjectIds
                                            const remainingForSubject = selectedSubjectPapers.filter(
                                              (item) => item.subjectId === sp.subjectId && item.paperId !== sp.paperId,
                                            );
                                            if (remainingForSubject.length === 0) {
                                              setSelectedSubjectIds((prev) => prev.filter((id) => id !== sp.subjectId));
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700">Complete the Basic Information First</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Please select all required fields above (Exam Type, Semester, Program Courses, Shifts, and Subject
                    Categories) to proceed with scheduling exam papers.
                  </p>
                </div>
              </div>
            )}

            {/* Student Count Display - Show only when subjects are selected */}
            {selectedSubjectPapers.length > 0 && (
              <Card className="border-0 shadow-none mt-6">
                <CardContent className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-900">Eligible Students</h3>
                    {loadingStudentCount ? (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Counting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-900">{Number(totalStudentCount) || 0}</span>
                        <span className="text-sm text-blue-700">students</span>
                      </div>
                    )}
                  </div>

                  {/* Breakdown by Program Course and Shift - Table Format */}
                  {(() => {
                    // Show actual data when available
                    // Transform data into table format: rows = program courses, columns = shifts
                    if (!Array.isArray(studentCountBreakdown) || studentCountBreakdown.length === 0) {
                      // Build empty table structure based on selected program courses and shifts
                      const sortedProgramCourses = selectedProgramCourses
                        .map((pcId) => {
                          const pc = programCourses.find((p) => p.id === pcId);
                          return { id: pcId, name: pc?.name || `Program Course ${pcId}` };
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));

                      const sortedShifts = selectedShifts
                        .map((shiftId) => {
                          const shift = shifts.find((s) => s.id === shiftId);
                          return { id: shiftId, name: shift?.name || `Shift ${shiftId}` };
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));

                      if (sortedProgramCourses.length === 0 || sortedShifts.length === 0) {
                        return null;
                      }

                      return (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs font-medium text-blue-800 mb-3">Breakdown by Program Course & Shift:</p>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white rounded-lg border border-blue-200">
                              <thead>
                                <tr className="bg-blue-100">
                                  <th className="border border-blue-200 px-3 py-2 text-left text-xs font-semibold text-blue-900">
                                    Sr. No.
                                  </th>
                                  <th className="border border-blue-200 px-3 py-2 text-left text-xs font-semibold text-blue-900">
                                    Program Course
                                  </th>
                                  {sortedShifts.map((shift) => (
                                    <th
                                      key={shift.id}
                                      className="border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-blue-900"
                                    >
                                      {shift.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sortedProgramCourses.map((pc, index) => (
                                  <tr key={pc.id} className="hover:bg-blue-50">
                                    <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700 text-center">
                                      {index + 1}
                                    </td>
                                    <td className="border border-blue-200 px-3 py-2 text-xs font-medium text-gray-700">
                                      {pc.name}
                                    </td>
                                    {sortedShifts.map((shift) => (
                                      <td
                                        key={shift.id}
                                        className="border border-blue-200 px-3 py-2 text-xs text-gray-700 text-center"
                                      >
                                        {loadingStudentCount ? (
                                          <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    // Show actual data when available
                    // Transform data into table format: rows = program courses, columns = shifts
                    const programCourseMap = new Map<
                      number,
                      { name: string; shifts: Map<number, { name: string; count: number }> }
                    >();

                    // Get all unique shifts
                    const allShiftIds = new Set<number>();
                    const shiftIdToName = new Map<number, string>();

                    for (const item of studentCountBreakdown) {
                      allShiftIds.add(item.shiftId);
                      shiftIdToName.set(item.shiftId, item.shiftName);

                      if (!programCourseMap.has(item.programCourseId)) {
                        programCourseMap.set(item.programCourseId, {
                          name: item.programCourseName,
                          shifts: new Map(),
                        });
                      }

                      const pcData = programCourseMap.get(item.programCourseId)!;
                      pcData.shifts.set(item.shiftId, { name: item.shiftName, count: item.count });
                    }

                    // Sort shifts by name for consistent column order
                    const sortedShiftIds = Array.from(allShiftIds).sort((a, b) => {
                      const nameA = shiftIdToName.get(a) || "";
                      const nameB = shiftIdToName.get(b) || "";
                      return nameA.localeCompare(nameB);
                    });

                    // Sort program courses by name
                    const sortedProgramCourses = Array.from(programCourseMap.entries()).sort((a, b) =>
                      a[1].name.localeCompare(b[1].name),
                    );

                    return (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-800 mb-3">Breakdown by Program Course & Shift:</p>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white rounded-lg border border-blue-200">
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-blue-200 px-3 py-2 text-left text-xs font-semibold text-blue-900">
                                  Sr. No.
                                </th>
                                <th className="border border-blue-200 px-3 py-2 text-left text-xs font-semibold text-blue-900">
                                  Program Course
                                </th>
                                {sortedShiftIds.map((shiftId) => (
                                  <th
                                    key={shiftId}
                                    className="border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-blue-900"
                                  >
                                    {shiftIdToName.get(shiftId) || `Shift ${shiftId}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sortedProgramCourses.map(([programCourseId, pcData], index) => (
                                <tr key={programCourseId} className="hover:bg-blue-50">
                                  <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700 text-center">
                                    {index + 1}
                                  </td>
                                  <td className="border border-blue-200 px-3 py-2 text-xs font-medium text-gray-700">
                                    {pcData.name}
                                  </td>
                                  {sortedShiftIds.map((shiftId) => {
                                    const shiftData = pcData.shifts.get(shiftId);
                                    return (
                                      <td
                                        key={shiftId}
                                        className="border border-blue-200 px-3 py-2 text-xs text-gray-700 text-center"
                                      >
                                        {shiftData ? shiftData.count : "-"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {totalStudentCount === 0 && !loadingStudentCount && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        ⚠️ No eligible students found. Please check your filters (Program Courses, Shifts, Subjects).
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Only show these sections when all basic fields are selected */}
          {examType &&
            semester &&
            selectedProgramCourses.length > 0 &&
            selectedShifts.length > 0 &&
            selectedSubjectCategories.length > 0 && (
              <>
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
                      }) ||
                      (canFetchStudentCount && totalStudentCount === 0) ||
                      loadingStudentCount
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
              </>
            )}
        </div>
      </div>
    </div>
  );
}
