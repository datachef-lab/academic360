import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Download,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Building2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllExamTypes, type ExamTypeT } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getProgramCourses } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getSubjectTypes } from "@/services/course-design.api";
import { getPapersPaginated } from "@/services/course-design.api";
import { getAllSubjects } from "@/services/subject.api";
import { getAllRooms, type RoomT } from "@/services/room.service";
import { getAllFloors, type FloorT } from "@/services/floor.service";
import { countStudentsForExam, getStudentsForExam, type StudentWithSeat } from "@/services/exam-schedule.service";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import type { Class } from "@/types/academics/class";
import type { ProgramCourse, SubjectType, PaperDto } from "@repo/db";
import type { Shift } from "@/types/academics/shift";
import type { Subject } from "@repo/db";

interface SelectedRoom extends RoomT {
  capacity: number;
  maxStudentsPerBenchOverride?: number;
}

interface Student {
  uid: string;
  name: string;
  cuRollNo: string;
  cuRegNo: string;
  programCourse: string;
  semester: string;
  shift: string;
  gender: "Male" | "Female";
}

interface Schedule {
  date: string;
  startTime: string;
  endTime: string;
}

interface Assignment {
  uid: string;
  name: string;
  cuRollNo: string;
  cuRegNo: string;
  programCourse: string;
  papers: { paperId: string; name: string; date: string; time: string }[];
  room: string;
  seatNo: string;
}

export default function ScheduleExamPage() {
  // Academic Year hook - get current academic year from Redux slice
  const { currentAcademicYear, loadAcademicYears } = useAcademicYear();

  // API Data States
  const [examTypes, setExamTypes] = useState<ExamTypeT[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([]);
  const [papers, setPapers] = useState<PaperDto[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<RoomT[]>([]);
  const [floors, setFloors] = useState<FloorT[]>([]);
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
  });

  // Step 1: Exam Information
  const [examType, setExamType] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [selectedProgramCourses, setSelectedProgramCourses] = useState<number[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [selectedSubjectCategories, setSelectedSubjectCategories] = useState<number[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsWithSeats, setStudentsWithSeats] = useState<StudentWithSeat[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Step 2: Room Selection
  const [gender, setGender] = useState<"ALL" | "MALE" | "FEMALE" | "OTHER">("ALL");
  const [assignBy, setAssignBy] = useState<"UID" | "CU Reg. No.">("UID");
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);

  // Step 3: Exam Schedule
  const [paperSchedules, setPaperSchedules] = useState<Record<string, Schedule>>({});

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAssigned, setIsAssigned] = useState(false);

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
  }, [selectedProgramCourses, semester, selectedSubjectCategories, classes]);

  useEffect(() => {
    void fetchPapers();
  }, [fetchPapers]);

  const generateMockStudents = useCallback((): Student[] => {
    const students: Student[] = [];
    let counter = 1;

    selectedProgramCourses.forEach((courseId) => {
      const course = programCourses.find((c) => c.id === courseId);
      const courseName = course?.name || `Course ${courseId}`;
      const shiftsToUse =
        selectedShifts.length > 0
          ? selectedShifts
          : shifts.map((s) => s.id).filter((id): id is number => id !== undefined);
      shiftsToUse.forEach((shiftId) => {
        const shift = shifts.find((s) => s.id === shiftId);
        const shiftName = shift?.name || `Shift ${shiftId}`;
        const studentsPerGroup = 15;
        for (let i = 0; i < studentsPerGroup; i++) {
          students.push({
            uid: `UID${String(counter).padStart(6, "0")}`,
            name: `Student ${counter}`,
            cuRollNo: `CUR${String(counter).padStart(6, "0")}`,
            cuRegNo: `REG${String(counter).padStart(6, "0")}`,
            programCourse: courseName,
            semester: semester,
            shift: shiftName,
            gender: i % 2 === 0 ? "Male" : "Female",
          });
          counter++;
        }
      });
    });

    return students;
  }, [selectedProgramCourses, selectedShifts, semester, programCourses, shifts]);

  const getFilteredStudents = useCallback((): Student[] => {
    const allStudents = generateMockStudents();
    if (gender === "ALL") return allStudents;
    // Map enum values to student gender format
    const genderMap: Record<string, "Male" | "Female"> = {
      MALE: "Male",
      FEMALE: "Female",
    };
    const filterGender = genderMap[gender] || gender;
    return allStudents.filter((s) => s.gender === filterGender);
  }, [gender, generateMockStudents]);

  // Fetch student count from API based on selected papers
  useEffect(() => {
    const fetchStudentCount = async () => {
      // Check if currentAcademicYear is available
      if (!currentAcademicYear?.id) {
        console.log("[SCHEDULE-EXAM] Waiting for academic year to be loaded...");
        setTotalStudents(0);
        return;
      }

      if (selectedProgramCourses.length === 0 || !semester || !selectedPaper) {
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
          paperIds: [selectedPaper],
          academicYearIds: [currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
        });

        const response = await countStudentsForExam({
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds: [selectedPaper],
          academicYearIds: [currentAcademicYear.id],
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
  }, [selectedProgramCourses, selectedShifts, semester, selectedPaper, classes, currentAcademicYear]);

  const getAvailablePapers = (): PaperDto[] => {
    return papers;
  };

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
        !selectedPaper ||
        !currentAcademicYear?.id
      ) {
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
          const floor = floors.find((f) => f.id === room.floorId);
          const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
          return {
            roomId: room.id!,
            floorId: room.floorId,
            floorName: floor?.name || null,
            roomName: room.name || `Room ${room.id}`,
            maxStudentsPerBench,
            numberOfBenches: room.numberOfBenches || 0,
          };
        });

        const response = await getStudentsForExam({
          classId: classObj.id,
          programCourseIds: selectedProgramCourses,
          paperIds: [selectedPaper],
          academicYearIds: [currentAcademicYear.id],
          shiftIds: selectedShifts.length > 0 ? selectedShifts : undefined,
          assignBy,
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
    selectedPaper,
    classes,
    currentAcademicYear,
    assignBy,
    floors,
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

  const handleRoomSelection = (room: RoomT, selected: boolean) => {
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

  const handleScheduleChange = (paperId: number | string, field: keyof Schedule, value: string) => {
    const id = typeof paperId === "number" ? paperId.toString() : paperId;
    setPaperSchedules((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      } as Schedule,
    }));
  };

  const formatTime = (time24?: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours!);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateSeatNumber = (benchNumber: number, positionOnBench: number, maxStudentsPerBench: number): string => {
    const letters = maxStudentsPerBench === 2 ? ["A", "C"] : ["A", "B", "C"];
    return `${benchNumber}${letters[positionOnBench - 1]}`;
  };

  const handleGenerate = () => {
    const students = getFilteredStudents();

    students.sort((a, b) => {
      if (assignBy === "UID") return a.uid.localeCompare(b.uid);
      return a.cuRegNo.localeCompare(b.cuRegNo);
    });

    const newAssignments: Assignment[] = [];
    let currentRoomIndex = 0;
    let currentBench = 1;
    let currentPosition = 1;

    students.forEach((student) => {
      if (currentRoomIndex >= selectedRooms.length) return;

      const currentRoom = selectedRooms[currentRoomIndex]!;
      const maxStudentsPerBench = currentRoom.maxStudentsPerBenchOverride || currentRoom.maxStudentsPerBench || 2;
      const roomCapacity = (currentRoom.numberOfBenches || 0) * maxStudentsPerBench;

      const studentPapers = getAvailablePapers()
        .filter((p) => p.id === selectedPaper)
        .map((paper) => ({
          paperId: paper.id?.toString() || "",
          name: paper.name || "Unnamed Paper",
          date: paperSchedules[paper.id?.toString() || ""]?.date || "TBD",
          time: paperSchedules[paper.id?.toString() || ""]?.startTime
            ? `${formatTime(paperSchedules[paper.id?.toString() || ""]?.startTime)} - ${formatTime(paperSchedules[paper.id?.toString() || ""]?.endTime)}`
            : "TBD",
        }));

      const seatNo = generateSeatNumber(currentBench, currentPosition, maxStudentsPerBench);

      newAssignments.push({
        uid: student.uid,
        name: student.name,
        cuRollNo: student.cuRollNo,
        cuRegNo: student.cuRegNo,
        programCourse: student.programCourse,
        papers: studentPapers,
        room: currentRoom.name || `Room ${currentRoom.id}`,
        seatNo,
      });

      currentPosition++;
      if (currentPosition > maxStudentsPerBench) {
        currentPosition = 1;
        currentBench++;
      }

      const studentsInRoom = newAssignments.filter(
        (a) => a.room === (currentRoom.name || `Room ${currentRoom.id}`),
      ).length;
      if (studentsInRoom >= roomCapacity) {
        currentRoomIndex++;
        currentBench = 1;
        currentPosition = 1;
      }
    });

    setAssignments(newAssignments);
    setIsAssigned(true);
    toast.success(`Successfully assigned ${newAssignments.length} students`);
  };

  const handleExportCSV = () => {
    if (assignments.length === 0) {
      toast.error("No assignments to export");
      return;
    }

    const headers = [
      "UID",
      "Name",
      "CU Roll No",
      "CU Reg No",
      "Program Course",
      "Papers",
      "Dates",
      "Times",
      "Room No",
      "Seat No",
    ];

    const rows = assignments.map((a) => [
      a.uid,
      a.name,
      a.cuRollNo,
      a.cuRegNo,
      a.programCourse,
      a.papers.map((p) => p.name).join("; "),
      a.papers.map((p) => p.date).join("; "),
      a.papers.map((p) => p.time).join("; "),
      a.room,
      a.seatNo,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-assignments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Assignments exported successfully");
  };

  const capacityStatus = totalCapacity >= totalStudents;
  const availablePapers = getAvailablePapers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Exam Scheduler</h1>
                <p className="text-gray-500 mt-1">Plan schedules and generate seating assignments</p>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Calendar className="w-5 h-5 mr-2" /> Generate Assignments
            </Button>
          </div>
        </div>

        {/* Three Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Section 1: Exam Information */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gray-100/50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <CardTitle className="text-xl">Exam Information</CardTitle>
                  <CardDescription>Set up basic exam details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-hide">
              <div className="space-y-2">
                <Label htmlFor="examType" className="text-sm font-semibold">
                  Exam Type
                </Label>
                <Select value={examType} onValueChange={setExamType} disabled={loading.examTypes}>
                  <SelectTrigger id="examType" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder={loading.examTypes ? "Loading..." : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id?.toString() || ""}>
                        {type.name} {type.shortName ? `(${type.shortName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm font-semibold">
                  Class / Semester
                </Label>
                <Select value={semester} onValueChange={setSemester} disabled={loading.classes}>
                  <SelectTrigger id="semester" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder={loading.classes ? "Loading..." : "Select semester"} />
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

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Program Course</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const courseId = Number(value);
                    if (!selectedProgramCourses.includes(courseId)) {
                      setSelectedProgramCourses([...selectedProgramCourses, courseId]);
                    }
                  }}
                  disabled={loading.programCourses}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue
                      placeholder={
                        loading.programCourses
                          ? "Loading..."
                          : selectedProgramCourses.length === 0
                            ? "Select courses..."
                            : `Add more courses...`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {programCourses
                      .filter((course) => course.id && !selectedProgramCourses.includes(course.id))
                      .map((course) => (
                        <SelectItem key={course.id} value={course.id?.toString() || ""}>
                          {course.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedProgramCourses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProgramCourses.map((courseId) => {
                      const course = programCourses.find((c) => c.id === courseId);
                      return (
                        <Badge
                          key={courseId}
                          variant="secondary"
                          className="cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => handleProgramCourseToggle(courseId)}
                        >
                          {course?.name || `Course ${courseId}`} ×
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Shift</Label>
                {loading.shifts ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading shifts...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center space-x-2 bg-gray-100/50 p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
                      >
                        <Checkbox
                          id={`shift-${shift.id}`}
                          checked={shift.id !== undefined && selectedShifts.includes(shift.id)}
                          onCheckedChange={() => shift.id && handleShiftToggle(shift.id)}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 text-white focus:ring-2 focus:ring-purple-500"
                        />
                        <Label htmlFor={`shift-${shift.id}`} className="cursor-pointer text-sm font-medium">
                          {shift.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Subject Category</Label>
                {loading.subjectTypes ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjectTypes.map((category) => (
                      <Badge
                        key={category.id}
                        variant={
                          category.id !== undefined && selectedSubjectCategories.includes(category.id)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-colors ${
                          category.id !== undefined && selectedSubjectCategories.includes(category.id)
                            ? "bg-purple-500 text-white border-transparent hover:bg-purple-600"
                            : "border-purple-300 text-purple-700 hover:bg-purple-50"
                        }`}
                        onClick={() => category.id && handleSubjectCategoryToggle(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Papers</Label>
                <div className="max-h-[240px] overflow-y-auto border-2 rounded-xl p-3 space-y-2 bg-gray-100/50 scrollbar-hide">
                  {loading.papers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading papers...</span>
                    </div>
                  ) : availablePapers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Select courses and categories to see papers
                    </p>
                  ) : (
                    availablePapers.map((paper) => {
                      const isSelected = paper.id !== undefined && paper.id === selectedPaper;
                      return (
                        <div
                          key={paper.id}
                          className={`flex items-start space-x-3 p-3 bg-white rounded-lg border-2 transition-colors cursor-pointer ${
                            isSelected ? "border-purple-500 bg-purple-50" : "hover:border-purple-400/50"
                          }`}
                          onClick={() => {
                            if (paper.id !== undefined) {
                              setSelectedPaper(paper.id);
                            }
                          }}
                        >
                          <div className="mt-1 flex items-center justify-center">
                            <div
                              className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-purple-600 bg-purple-600" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                          <Label className="cursor-pointer flex-1">
                            <div className="font-semibold text-sm">
                              {paper.subjectId
                                ? subjects.find((s) => s.id === paper.subjectId)?.name ||
                                  `Subject ID: ${paper.subjectId}`
                                : "Unknown Subject"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Paper: {paper.name || "Unnamed Paper"}</div>
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-100/60 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Total Students:</span>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">{totalStudents}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Room Selection */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gray-100/50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl">Room Selection</CardTitle>
                  <CardDescription>Configure rooms and capacity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-hide">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-semibold">
                  Gender Filter
                </Label>
                <Select value={gender} onValueChange={(value) => setGender(value as typeof gender)}>
                  <SelectTrigger id="gender" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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

              <div className="space-y-2">
                <Label htmlFor="assignBy" className="text-sm font-semibold">
                  Assign By
                </Label>
                <Select value={assignBy} onValueChange={(value) => setAssignBy(value as typeof assignBy)}>
                  <SelectTrigger id="assignBy" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UID">UID (University ID)</SelectItem>
                    <SelectItem value="CU Reg. No.">CU Registration Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Select Rooms</Label>
                  <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-500 text-purple-600 hover:bg-purple-50"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Manage ({selectedRooms.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
                      <DialogHeader className="px-6 py-4 border-b bg-gray-100/50 shrink-0">
                        <DialogTitle className="text-xl">Select Rooms</DialogTitle>
                        <DialogDescription>
                          Choose rooms and optionally override max students per bench
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                        {loading.rooms ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2 text-sm text-gray-500">Loading rooms...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rooms
                              .filter((room) => room.isActive !== false)
                              .map((room) => {
                                const isSelected = selectedRooms.some((r) => r.id === room.id);
                                const selectedRoom = selectedRooms.find((r) => r.id === room.id);
                                const currentMaxStudentsPerBench =
                                  selectedRoom?.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                                const calculatedCapacity = (room.numberOfBenches || 0) * currentMaxStudentsPerBench;
                                const floorName = room.floorId
                                  ? floors.find((f) => f.id === room.floorId)?.name
                                  : undefined;

                                return (
                                  <div
                                    key={room.id}
                                    className={`p-3 border-2 rounded-lg transition-all cursor-pointer ${
                                      isSelected ? "border-purple-500 bg-purple-50" : "hover:border-purple-400/50"
                                    }`}
                                    onClick={() => handleRoomSelection(room, !isSelected)}
                                  >
                                    <div className="flex items-start gap-2 mb-3">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleRoomSelection(room, !!checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 text-white focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex-1">
                                        <div className="font-bold text-base">Room {room.name}</div>
                                        {floorName && <div className="text-xs text-gray-500">{floorName}</div>}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <div className="bg-gray-100/50 p-2 rounded">
                                        <div className="text-gray-500 text-xs">Benches</div>
                                        <div className="font-semibold text-sm">{room.numberOfBenches || 0}</div>
                                      </div>
                                      <div className="bg-gray-100/50 p-2 rounded">
                                        <div className="text-gray-500 text-xs">Capacity</div>
                                        <div className="font-semibold text-sm">{calculatedCapacity}</div>
                                      </div>
                                    </div>
                                    <div className="bg-gray-100/50 p-2 rounded mb-2">
                                      <div className="text-gray-500 text-xs">Max Students per Bench</div>
                                      <div className="font-semibold text-sm">{currentMaxStudentsPerBench}</div>
                                    </div>

                                    {isSelected && (
                                      <div className="bg-purple-50 p-2 rounded">
                                        <div className="text-gray-500 text-xs mb-1">
                                          Override Max Students per Bench
                                        </div>
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

                                            // Check if input is a valid positive integer (no decimals, no negative)
                                            const isPositiveInteger = /^\d+$/.test(inputValue);
                                            if (!isPositiveInteger) {
                                              return; // Don't update if not a valid positive integer
                                            }

                                            const val = parseInt(inputValue, 10);
                                            const maxAllowed = room.maxStudentsPerBench || 2;

                                            // Only allow positive integers that don't exceed the room's maxStudentsPerBench
                                            if (val > 0 && val <= maxAllowed) {
                                              handleMaxStudentsPerBenchOverride(room.id!, val);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-8 text-sm"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                          Max: {room.maxStudentsPerBench || 2}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="px-6 py-4 border-t bg-gray-100/50 flex items-center justify-between shrink-0">
                        <div className="text-sm text-gray-500">
                          {selectedRooms.length} room{selectedRooms.length !== 1 ? "s" : ""} selected
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => setIsRoomDialogOpen(false)}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            Apply Selection
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="max-h-[220px] overflow-y-auto border-2 rounded-xl p-3 space-y-2 bg-gray-100/50 scrollbar-hide">
                  {selectedRooms.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No rooms selected</p>
                  ) : (
                    selectedRooms.map((room) => {
                      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                      const capacity = (room.numberOfBenches || 0) * maxStudentsPerBench;
                      return (
                        <div
                          key={room.id}
                          className="p-3 bg-white rounded-lg border-2 flex items-center justify-between hover:border-purple-400/50 transition-colors"
                        >
                          <div>
                            <div className="font-semibold">Room {room.name}</div>
                            <div className="text-xs text-gray-500">
                              {room.numberOfBenches || 0} benches • Capacity: {capacity}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoomSelection(room, false)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label="Remove room"
                            title="Remove room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 ${
                  capacityStatus ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {capacityStatus ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-bold">{capacityStatus ? "Capacity Sufficient" : "Insufficient Capacity"}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-white/60 rounded">
                    <span>Total Capacity:</span>
                    <span className="font-bold">{totalCapacity} seats</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/60 rounded">
                    <span>Total Students:</span>
                    <span className="font-bold">{totalStudents}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white/60 rounded">
                    <span>Available:</span>
                    <span className={`font-bold ${capacityStatus ? "text-green-700" : "text-red-600"}`}>
                      {totalCapacity - totalStudents} seats
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Exam Schedule */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gray-100/50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <CardTitle className="text-xl">Exam Schedule</CardTitle>
                  <CardDescription>Set dates and times for papers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-hide">
              {!selectedPaper || !availablePapers.find((p) => p.id === selectedPaper) ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="font-semibold text-gray-600">No Paper Selected</p>
                  <p className="text-sm text-gray-400 mt-1">Select a paper in Section 1</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availablePapers
                    .filter((paper) => paper.id === selectedPaper)
                    .map((paper) => {
                      if (!paper.id) return null;
                      const paperId = paper.id.toString();
                      return (
                        <div
                          key={paper.id}
                          className="p-4 border-2 rounded-xl hover:border-purple-400/50 transition-colors bg-white"
                        >
                          <div className="space-y-4">
                            <div>
                              <Label className="font-semibold">
                                {paper.subjectId
                                  ? subjects.find((s) => s.id === paper.subjectId)?.name ||
                                    `Subject ID: ${paper.subjectId}`
                                  : "Unknown Subject"}
                              </Label>
                              <div className="text-xs text-gray-500 mt-1">Paper: {paper.name || "Unnamed Paper"}</div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block">Exam Date</Label>
                                <Input
                                  type="date"
                                  value={paperSchedules[paperId]?.date || ""}
                                  onChange={(e) => handleScheduleChange(paperId, "date", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-semibold mb-1.5 block">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={paperSchedules[paperId]?.startTime || ""}
                                    onChange={(e) => handleScheduleChange(paperId, "startTime", e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-semibold mb-1.5 block">End Time</Label>
                                  <Input
                                    type="time"
                                    value={paperSchedules[paperId]?.endTime || ""}
                                    onChange={(e) => handleScheduleChange(paperId, "endTime", e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignments Table */}
        {isAssigned && assignments.length > 0 && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gray-100/50 border-b">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-2xl">Exam Assignments ({assignments.length} Students)</CardTitle>
                  <CardDescription>Complete seating arrangement</CardDescription>
                </div>
                <Button
                  onClick={handleExportCSV}
                  size="lg"
                  className="shadow-lg bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Download className="w-5 h-5 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto rounded-xl border-2">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr className="border-b-2">
                      <th className="px-3 py-2 text-left font-bold text-xs">UID</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Name</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Roll No</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Reg No</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Course</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Papers</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Room</th>
                      <th className="px-3 py-2 text-left font-bold text-xs">Seat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, idx) => (
                      <tr
                        key={assignment.uid}
                        className={`border-b hover:bg-gray-100/60 transition-colors ${
                          idx % 2 === 0 ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="px-3 py-1.5 font-mono text-xs">{assignment.uid}</td>
                        <td className="px-3 py-1.5 text-xs font-medium">{assignment.name}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{assignment.cuRollNo}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{assignment.cuRegNo}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {assignment.programCourse}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="space-y-1.5 text-xs max-w-xs">
                            {assignment.papers.map((paper, idx) => (
                              <div key={idx} className="bg-gray-100/50 p-2 rounded border-l-4 border-purple-500 pl-3">
                                <div className="font-medium">{paper.name}</div>
                                <div className="text-gray-500 text-xs mt-0.5">
                                  {paper.date} • {paper.time}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <Badge className="font-mono text-xs bg-purple-500 hover:bg-purple-600 text-white">
                            Room {assignment.room}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5">
                          <Badge variant="outline" className="font-mono font-bold border-2 text-xs">
                            {assignment.seatNo}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table - Display when rooms are selected */}
        {selectedRooms.length > 0 && (
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow mt-6">
            <CardHeader className="bg-gray-100/50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Student Assignments</CardTitle>
                  <CardDescription>List of students with their assigned seats</CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {studentsWithSeats.length} {studentsWithSeats.length === 1 ? "Student" : "Students"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-500">Loading students...</span>
                </div>
              ) : studentsWithSeats.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="font-semibold text-gray-600">No Students Assigned</p>
                  <p className="text-sm text-gray-400 mt-1">Select rooms to see student assignments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="relative max-h-[600px] overflow-y-auto border border-gray-300 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr className="border-b-2 border-gray-300">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            Sr. No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            {assignBy === "UID" ? "UID" : "CU Reg. No."}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            WhatsApp Phone
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            Floor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-100">
                            Room
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100">
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
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                              {student.name}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-700 border-r border-gray-300">
                              {assignBy === "UID" ? student.uid : student.cuRegistrationApplicationNumber || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                              {student.email || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                              {student.whatsappPhone || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                              {student.floorName || "N/A"}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-300">
                              <Badge className="font-mono text-xs bg-purple-500 hover:bg-purple-600 text-white">
                                {student.roomName}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="font-mono font-bold border-2 text-xs">
                                {student.seatNumber}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
