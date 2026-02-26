import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/hooks/UserAvatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Trash2, Loader2, Upload, DoorOpen, Download, ArrowLeft, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllRooms } from "@/services/room.service";
import { getAllFloors } from "@/services/floor.service";
import {
  getEligibleRooms,
  getStudentsForExam,
  countStudentsForExam,
  countStudentsBreakdownForExam,
} from "@/services/exam-schedule.service";
import { fetchExams, fetchExamById } from "@/services/exam.service";
import { allotExamRoomsAndStudents, type AllotExamParams } from "../services";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RoomDto, ExamDto } from "@repo/db/index";
import { getPapersPaginated } from "@/services/course-design.api";
import type { PaperDto } from "@repo/db/index";

interface SelectedRoom extends RoomDto {
  capacity: number;
  maxStudentsPerBenchOverride?: number;
}

export default function AllotExamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get("examId");
  const queryClient = useQueryClient();

  // Exam selection
  const [selectedExamId, setSelectedExamId] = useState<number | null>(examIdParam ? Number(examIdParam) : null);
  const [selectedExam, setSelectedExam] = useState<ExamDto | null>(null);

  // Room and student selection state
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "ALL" | null>("ALL");
  const [assignBy, setAssignBy] = useState<"CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER">("UID");
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [enableFoilNumber, setEnableFoilNumber] = useState(false);
  const [enableRoomSelection, setEnableRoomSelection] = useState(true);

  // Excel file upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [foilNumberMap, setFoilNumberMap] = useState<Record<string, string>>({});
  const [foilExcelValidationDialogOpen, setFoilExcelValidationDialogOpen] = useState(false);
  const [foilExcelValidationMessage, setFoilExcelValidationMessage] = useState<string>("");
  const [foilExcelMissingHeaders, setFoilExcelMissingHeaders] = useState<string[]>([]);

  // Admit card download dates state
  const [admitCardStartDate, setAdmitCardStartDate] = useState<string>("");
  const [admitCardEndDate, setAdmitCardEndDate] = useState<string>("");

  // Validate admit card dates
  const areAdmitCardDatesValid = useCallback(() => {
    if (!admitCardStartDate || admitCardStartDate.trim() === "") return false;
    if (!admitCardEndDate || admitCardEndDate.trim() === "") return false;

    // Check if end date is after start date
    const startDate = new Date(admitCardStartDate);
    const endDate = new Date(admitCardEndDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
    if (endDate <= startDate) return false;

    return true;
  }, [admitCardStartDate, admitCardEndDate]);

  // Fetch all exams for selection
  const { data: examsData, isLoading: loadingExams } = useQuery(
    ["exams", "for-allotment"],
    async () => {
      const data = await fetchExams(1, 1000); // Fetch many exams
      return data.content;
    },
    {
      onError: (error) => {
        console.error("Error fetching exams:", error);
        toast.error("Failed to load exams");
      },
    },
  );

  // Helper function to convert Date to datetime-local format
  const toDatetimeLocal = (value: Date | string | null | undefined): string => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // Fetch selected exam details
  const {
    data: fetchedExam,
    isLoading: loadingExam,
    isError: examError,
  } = useQuery(
    ["exam", selectedExamId],
    async () => {
      if (!selectedExamId) return null;
      try {
        console.log("[ALLOT-EXAM] Fetching exam with ID:", selectedExamId);
        const exam = await fetchExamById(selectedExamId);
        console.log("[ALLOT-EXAM] Exam fetched successfully:", exam?.id);
        return exam;
      } catch (error) {
        console.error("[ALLOT-EXAM] Error fetching exam:", error);
        throw error;
      }
    },
    {
      enabled: !!selectedExamId,
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1, // Only retry once
      retryDelay: 1000, // Wait 1 second before retry
      // Keep in cache for 5 minutes (v4 uses gcTime; keep staleTime/retry settings and avoid type mismatch)
      // @ts-ignore - supports gcTime in v4+, but some typings may not include it depending on setup
      gcTime: 300000,
      onError: (error) => {
        console.error("[ALLOT-EXAM] Error fetching exam details:", error);
        toast.error("Failed to load exam details. Please try selecting the exam again.");
        // Clear the selected exam ID on error so user can try again
        setSelectedExamId(null);
      },
    },
  );

  // Sync fetched exam to selectedExam state and set admit card dates
  useEffect(() => {
    if (fetchedExam) {
      console.log("[ALLOT-EXAM] Exam fetched successfully:", fetchedExam.id);
      setSelectedExam(fetchedExam);
      // Set admit card dates if they exist
      if (fetchedExam.admitCardStartDownloadDate) {
        setAdmitCardStartDate(toDatetimeLocal(fetchedExam.admitCardStartDownloadDate));
      }
      if (fetchedExam.admitCardLastDownloadDate) {
        setAdmitCardEndDate(toDatetimeLocal(fetchedExam.admitCardLastDownloadDate));
      }
    } else if (selectedExamId === null) {
      // Clear exam state when no exam is selected
      setSelectedExam(null);
      setAdmitCardStartDate("");
      setAdmitCardEndDate("");
    }
  }, [fetchedExam, selectedExamId]);

  // Debug: Log loading states
  useEffect(() => {
    if (selectedExamId) {
      console.log("[ALLOT-EXAM] Selected exam ID:", selectedExamId, "Loading:", loadingExam, "Error:", examError);
    }
  }, [selectedExamId, loadingExam, examError]);

  // Fetch papers for the selected exam
  const {
    data: papersForExam = [],
    isLoading: loadingPapers,
    isError: papersError,
    refetch: refetchPapers,
  } = useQuery({
    queryKey: ["papersForExam", selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam) return [];
      return await getPapersForExam();
    },
    enabled: !!selectedExam,
    retry: false, // Don't retry automatically to avoid multiple error toasts
    onError: (error) => {
      console.error("Error fetching papers for exam:", error);
      // Don't show toast here as the error will be displayed in the table
    },
  });

  // Fetch floors
  const { data: floors = [] } = useQuery({
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

  // Fetch eligible rooms based on exam schedule
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["eligibleRooms", selectedExam?.examSubjects],
    queryFn: async () => {
      if (!selectedExam || !selectedExam.examSubjects || selectedExam.examSubjects.length === 0) {
        const res = await getAllRooms();
        if (res.httpStatus === "SUCCESS" && res.payload) {
          return res.payload
            .filter((room) => room.isActive !== false)
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
        return [];
      }

      // Build exam subjects array from exam details
      const examSubjects = selectedExam.examSubjects.map((es) => ({
        subjectId: es.subject.id!,
        startTime: new Date(es.startTime),
        endTime: new Date(es.endTime),
      }));

      // Fetch eligible rooms
      const res = await getEligibleRooms({ examSubjects });
      if (res.httpStatus === "SUCCESS" && res.payload) {
        return res.payload.rooms.sort((a, b) => (a.name || "").localeCompare(b.name || "")) as RoomDto[];
      }
      return [];
    },
    enabled: !!selectedExam,
    onError: (error) => {
      console.error("Error fetching eligible rooms:", error);
      toast.error("Failed to load eligible rooms");
    },
  });

  // Handle Excel file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)");
        event.target.value = "";
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        event.target.value = "";
        return;
      }
      try {
        const normalizeHeaderKey = (key: unknown): string =>
          String(key ?? "")
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, " ");

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
        const matrix = sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][]) : [];

        if (!matrix || matrix.length < 2) {
          toast.error("Excel file has no data rows.");
          event.target.value = "";
          return;
        }

        const headerRow = matrix[0] || [];
        const headers = headerRow.map(normalizeHeaderKey);

        const uidCandidates = ["uid"];
        const foilCandidates = ["foil number", "foil no", "foil no.", "foil_number", "foilnumber", "foil"];

        const uidIdx = headers.findIndex((h: string) => uidCandidates.includes(h));
        const foilIdx = headers.findIndex((h: string) => foilCandidates.includes(h));

        const missing: string[] = [];
        if (uidIdx === -1) missing.push("uid");
        if (foilIdx === -1) missing.push("foil_number");

        if (missing.length > 0) {
          setFoilExcelMissingHeaders(missing);
          setFoilExcelValidationMessage(
            "Your Excel file is missing required columns in the header row (row 1). Please add the missing columns and try again.",
          );
          setFoilExcelValidationDialogOpen(true);
          setExcelFile(null);
          setFoilNumberMap({});
          event.target.value = "";
          return;
        }

        // Parse foil map based on detected columns (order-independent)
        const foilMap: Record<string, string> = {};
        for (let r = 1; r < matrix.length; r++) {
          const row = matrix[r] || [];
          const uid = String(row[uidIdx] ?? "").trim();
          const foilNumber = String(row[foilIdx] ?? "").trim();
          const isRowEmpty = row.every((cell: any) => String(cell ?? "").trim() === "");
          if (isRowEmpty) continue;
          if (!uid || !foilNumber) continue;
          foilMap[uid] = foilNumber;
        }

        if (Object.keys(foilMap).length === 0) {
          toast.error("No valid rows found. Please ensure UID and foil_number values are present.");
          setExcelFile(null);
          setFoilNumberMap({});
          event.target.value = "";
          return;
        }

        setExcelFile(file);
        setFoilNumberMap(foilMap);
        console.log("[EXCEL] Parsed foil numbers:", Object.keys(foilMap).length);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        setExcelFile(null);
        setFoilNumberMap({});
        event.target.value = "";
        toast.error("Failed to read Excel file");
        return;
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

  // Normalize paper code for comparison (trim and lowercase)
  const normalizePaperCode = (code: string | null | undefined): string => {
    return (code || "").trim().toLowerCase();
  };

  // Get papers for selected exam
  const getPapersForExam = useCallback(async (): Promise<PaperDto[]> => {
    if (!selectedExam) return [];

    const programCourseIds = selectedExam.examProgramCourses.map((epc) => epc.programCourse.id!);
    const subjectIds = selectedExam.examSubjects.map((es) => es.subject.id!);
    const subjectTypeIds = selectedExam.examSubjectTypes.map((est) => est.subjectType.id!);

    const allPapers: PaperDto[] = [];
    const seenPaperIds = new Set<number>();

    for (const programCourseId of programCourseIds) {
      for (const subjectTypeId of subjectTypeIds) {
        try {
          const papersData = await getPapersPaginated(1, 1000, {
            academicYearId: selectedExam.academicYear.id ?? null,
            affiliationId: null,
            regulationTypeId: null,
            programCourseId: programCourseId,
            classId: selectedExam.class.id ?? null,
            subjectTypeId: subjectTypeId,
          });
          if (papersData?.content) {
            for (const paper of papersData.content) {
              if (
                paper.id &&
                !seenPaperIds.has(paper.id) &&
                paper.isActive !== false &&
                subjectIds.includes(paper.subjectId!)
              ) {
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
    return allPapers;
  }, [selectedExam]);

  // Fetch total eligible students count
  const { data: totalEligibleStudents = 0, isLoading: loadingTotalStudents } = useQuery({
    queryKey: ["totalEligibleStudents", selectedExam?.id, gender, excelFile?.name],
    queryFn: async () => {
      if (!selectedExam) return 0;

      const papers = await getPapersForExam();
      const paperIds = papers.map((p) => p.id).filter((id): id is number => id !== undefined);

      if (paperIds.length === 0) return 0;

      const programCourseIds = selectedExam.examProgramCourses.map((epc) => epc.programCourse.id!);
      const shiftIds = selectedExam.examShifts.map((es) => es.shift.id!);

      const response = await countStudentsForExam(
        {
          classId: selectedExam.class.id!,
          programCourseIds,
          paperIds,
          academicYearIds: [selectedExam.academicYear.id!],
          shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
          gender: gender === "ALL" ? null : gender,
        },
        excelFile,
      );

      if (response.httpStatus === "SUCCESS" && response.payload) {
        return response.payload.count;
      }
      return 0;
    },
    enabled: !!selectedExam,
    onError: (error) => {
      console.error("[ALLOT-EXAM] Error fetching total student count:", error);
    },
  });

  // Student count breakdown interface
  interface StudentCountBreakdown {
    programCourseId: number;
    programCourseName: string;
    shiftId: number;
    shiftName: string;
    count: number;
  }

  // Fetch student count breakdown by program course and shift
  const { data: studentCountBreakdownData, isLoading: loadingStudentCount } = useQuery(
    ["studentCountBreakdown", selectedExam?.id, gender, excelFile?.name],
    async () => {
      if (!selectedExam) return { breakdown: [], total: 0 };

      const papers = await getPapersForExam();
      const paperIds = papers.map((p) => p.id).filter((id): id is number => id !== undefined);
      if (paperIds.length === 0) return { breakdown: [], total: 0 };

      const programCourseIds = selectedExam.examProgramCourses.map((epc) => epc.programCourse.id!);
      const shiftIds = selectedExam.examShifts.map((es) => es.shift.id!);

      // Build all combinations
      const combinations: Array<{ programCourseId: number; shiftId: number }> = [];
      for (const programCourseId of programCourseIds) {
        for (const shiftId of shiftIds) {
          combinations.push({ programCourseId, shiftId });
        }
      }

      if (combinations.length === 0) return { breakdown: [], total: 0 };

      try {
        const response = await countStudentsBreakdownForExam(
          {
            classId: selectedExam.class.id!,
            paperIds,
            academicYearIds: [selectedExam.academicYear.id!],
            combinations,
            gender: gender === "ALL" ? null : gender,
          },
          excelFile,
        );

        if (response.httpStatus === "SUCCESS" && response.payload) {
          // Transform results into breakdown format with names
          const breakdown: StudentCountBreakdown[] = response.payload.breakdown.map((item) => {
            const programCourse = selectedExam.examProgramCourses.find(
              (epc) => epc.programCourse.id === item.programCourseId,
            );
            const shift = selectedExam.examShifts.find((es) => es.shift.id === item.shiftId);
            return {
              programCourseId: item.programCourseId,
              programCourseName: programCourse?.programCourse.name || `Program Course ${item.programCourseId}`,
              shiftId: item.shiftId,
              shiftName: shift?.shift.name || `Shift ${item.shiftId}`,
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
        console.error("[ALLOT-EXAM] Error fetching student count breakdown:", error);
        return { breakdown: [], total: 0 };
      }
    },
    {
      enabled: !!selectedExam,
    },
  );

  const studentCountBreakdown = studentCountBreakdownData?.breakdown ?? [];
  const totalStudentCount = studentCountBreakdownData?.total ?? 0;

  // Fetch students with seat assignments
  const { data: studentsWithSeats = [], isLoading: loadingStudents } = useQuery({
    queryKey: [
      "studentsWithSeats",
      selectedExam?.id,
      selectedRooms,
      assignBy,
      gender,
      excelFile?.name,
      enableRoomSelection,
    ],
    queryFn: async () => {
      if (!selectedExam) return [];

      // If room selection is enabled and no rooms selected, return empty
      if (enableRoomSelection && selectedRooms.length === 0) return [];

      const papers = await getPapersForExam();
      const paperIds = papers.map((p) => p.id).filter((id): id is number => id !== undefined);

      if (paperIds.length === 0) return [];

      const programCourseIds = selectedExam.examProgramCourses.map((epc) => epc.programCourse.id!);
      const shiftIds = selectedExam.examShifts.map((es) => es.shift.id!);

      // If room selection is disabled, use empty roomAssignments
      const roomAssignments = enableRoomSelection
        ? selectedRooms.map((room) => {
            const floor = floors.find((f) => f.id === room.floor.id);
            const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
            const numberOfBenches = room.numberOfBenches || 0;
            const capacity = room.capacity || numberOfBenches * maxStudentsPerBench;
            return {
              roomId: room.id!,
              floorId: room.floor.id,
              floorName: floor?.name || null,
              roomName: room.name || `Room ${room.id}`,
              maxStudentsPerBench,
              numberOfBenches,
              capacity,
            };
          })
        : [];

      const response = await getStudentsForExam(
        {
          classId: selectedExam.class.id!,
          programCourseIds,
          paperIds,
          academicYearIds: [selectedExam.academicYear.id!],
          shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
          assignBy: assignBy,
          roomAssignments,
          gender: gender === "ALL" ? null : gender,
        },
        excelFile,
      );

      if (response.httpStatus === "SUCCESS" && response.payload) {
        return response.payload.students;
      }
      return [];
    },
    enabled:
      !!selectedExam &&
      (enableRoomSelection ? selectedRooms.length > 0 : true) &&
      assignBy !== undefined &&
      gender !== null,
    onError: (error) => {
      console.error("[ALLOT-EXAM] Error fetching students with seats:", error);
    },
  });

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

  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [insufficientCapacityDialogOpen, setInsufficientCapacityDialogOpen] = useState(false);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (e) {
      console.error("Failed to copy:", e);
      toast.error("Failed to copy");
    }
  };

  // Reset form function
  const resetForm = () => {
    setSelectedExamId(null);
    setSelectedExam(null);
    setGender("ALL");
    setAssignBy("UID");
    setSelectedRooms([]);
    setEnableFoilNumber(false);
    setEnableRoomSelection(true);
    setExcelFile(null);
    setFoilNumberMap({});
    setAdmitCardStartDate("");
    setAdmitCardEndDate("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Allot exam mutation
  const allotExamMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExamId || !selectedExam) {
        throw new Error("Please select an exam");
      }

      if (enableRoomSelection && selectedRooms.length === 0) {
        throw new Error("Please select at least one room");
      }

      const locations = enableRoomSelection
        ? selectedRooms.map((room) => ({
            roomId: room.id!,
            studentsPerBench: room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2,
            capacity: room.capacity,
            room: {
              id: room.id!,
              name: room.name,
              floor: room.floor,
            },
          }))
        : [];

      const params: AllotExamParams = {
        locations,
        orderType: assignBy,
        gender: gender === "ALL" ? null : gender,
        admitCardStartDownloadDate:
          admitCardStartDate && admitCardStartDate.trim() !== "" ? new Date(admitCardStartDate).toISOString() : null,
        admitCardLastDownloadDate:
          admitCardEndDate && admitCardEndDate.trim() !== "" ? new Date(admitCardEndDate).toISOString() : null,
      };

      const response = await allotExamRoomsAndStudents(selectedExamId, params, excelFile);
      return response;
    },
    onSuccess: () => {
      toast.success(`Successfully allotted rooms and students to exam`);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam", selectedExamId] });
      queryClient.invalidateQueries({ queryKey: ["studentsWithSeats"] });
      queryClient.invalidateQueries({ queryKey: ["studentCount"] });
      // Reset form after successful allotment
      resetForm();
      // Navigate back to exams list or exam details
      navigate(`/dashboard/exam-management/exams/${selectedExamId}`);
    },
    onError: (error) => {
      console.log("In allot exam api, error:", error);
      toast.error(`Something went wrong while allotting exam!`);
    },
  });

  // Calculate insufficient capacity
  const calculateInsufficientCapacity = () => {
    if (loadingTotalStudents || !selectedExam) {
      return { hasInsufficientCapacity: false, shortage: 0 };
    }

    const totalCapacity = selectedRooms.reduce((total, room) => {
      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
      const numberOfBenches = room.numberOfBenches || 0;
      return total + numberOfBenches * maxStudentsPerBench;
    }, 0);

    const shortage = totalEligibleStudents - totalCapacity;
    return {
      hasInsufficientCapacity: shortage > 0,
      shortage,
      totalCapacity,
      totalStudents: totalEligibleStudents,
    };
  };

  const handleAllotExam = () => {
    // Validate admit card dates are provided
    if (!admitCardStartDate || admitCardStartDate.trim() === "") {
      toast.error("Please provide Admit Card Start Date & Time");
      return;
    }
    if (!admitCardEndDate || admitCardEndDate.trim() === "") {
      toast.error("Please provide Admit Card End Date & Time");
      return;
    }

    // Validate dates are valid
    const startDate = new Date(admitCardStartDate);
    const endDate = new Date(admitCardEndDate);

    if (isNaN(startDate.getTime())) {
      toast.error("Invalid Admit Card Start Date");
      return;
    }
    if (isNaN(endDate.getTime())) {
      toast.error("Invalid Admit Card End Date");
      return;
    }
    if (endDate <= startDate) {
      toast.error("Admit Card End Date must be after Start Date");
      return;
    }

    const capacityInfo = calculateInsufficientCapacity();

    // If there's insufficient capacity, show confirmation dialog
    if (capacityInfo.hasInsufficientCapacity) {
      setInsufficientCapacityDialogOpen(true);
      return;
    }

    // Otherwise, proceed directly with allotment
    allotExamMutation.mutate();
  };

  const handleConfirmAllotment = () => {
    setInsufficientCapacityDialogOpen(false);
    allotExamMutation.mutate();
  };

  // Filter exams that are available for allotment
  // Show exams that:
  // 1. Have NO rooms/locations assigned (never allotted with rooms), AND
  // 2. Have NO candidates (never allotted without rooms)
  const examsWithoutRooms =
    examsData?.filter((exam) => {
      // Skip exams that already have rooms assigned
      if (exam.locations && exam.locations.length > 0) {
        return false;
      }

      // Skip exams that already have candidates allotted (allotted without rooms)
      if (exam.candidateCount && exam.candidateCount > 0) {
        return false;
      }

      // Include only newly scheduled exams with no allotment yet
      return true;
    }) || [];

  return (
    <div className="min-h-screen w-full p-7 py-4">
      <div className="w-full flex flex-col gap-4">
        <div className="w-full px-4 mx-auto">
          {/* Page Heading */}
          <div className="mb-6 border-b pb-3">
            <h1 className="text-3xl font-bold text-gray-800">Allot Exam</h1>
            <p className="text-gray-600 mt-1">Assign rooms and students to scheduled exams</p>
          </div>
          {/* Header with back button */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/exam-management/exams")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Exams
            </Button>
          </div>

          {/* Controls Row - Select Exam, Gender, Order By */}
          <Card className="border-0 shadow-none mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[300px]">
                  <Label className="font-medium text-gray-700 mb-2 block">Select Exam</Label>
                  <Select
                    value={selectedExamId?.toString() || ""}
                    onValueChange={(val) => {
                      const id = val ? Number(val) : null;
                      setSelectedExamId(id);
                      setSelectedExam(null);
                      setSelectedRooms([]);
                      setEnableFoilNumber(false);
                      setEnableRoomSelection(true);
                      setExcelFile(null);
                      setAdmitCardStartDate("");
                      setAdmitCardEndDate("");
                    }}
                    disabled={loadingExams || (loadingExam && !!selectedExamId)}
                  >
                    <SelectTrigger className="h-10 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue
                        placeholder={
                          loadingExams
                            ? "Loading exams..."
                            : loadingExam && selectedExamId
                              ? "Loading exam details..."
                              : "Select an exam"
                        }
                      />
                      {loadingExam && selectedExamId && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    </SelectTrigger>
                    <SelectContent>
                      {examsWithoutRooms.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No exams available for allotment</div>
                      ) : (
                        examsWithoutRooms
                          .filter((exam) => exam.id !== null && exam.id !== undefined)
                          .map((exam) => (
                            <SelectItem key={exam.id} value={exam.id!.toString()}>
                              {exam.examType.name} - {exam.class.name} - {exam.academicYear.year}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 sm:flex-initial min-w-[180px]">
                  <Label htmlFor="gender-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Gender
                  </Label>
                  <Select value={gender || ""} onValueChange={(value) => setGender(value as typeof gender)}>
                    <SelectTrigger
                      id="gender-select"
                      className="h-10 w-full sm:w-48 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
                      className="h-10 w-full sm:w-52 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
            </CardContent>
          </Card>

          {/* View Rooms and View Students Buttons Row */}
          {selectedExam && (
            <Card className="border-0 shadow-none mb-4 min-h-[122px] flex flex-col justify-center">
              <CardContent className="pt-2 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    onClick={() => setRoomsModalOpen(true)}
                    variant="outline"
                    disabled={!selectedExam || selectedExam.examSubjects.length === 0 || !enableRoomSelection}
                    className="h-10 border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-4 h-4 mr-2" />
                    View Rooms ({selectedRooms.length})
                  </Button>
                  <Button
                    onClick={() => setStudentsModalOpen(true)}
                    variant="outline"
                    className="h-10 border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50"
                    disabled={studentsWithSeats.length === 0}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Students ({studentsWithSeats.length})
                  </Button>
                  {/* Room Selection and Foil Number Switches */}
                  {selectedExam && (
                    <div className="flex items-center gap-6 ml-auto">
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor="room-selection-switch"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Room Selection
                        </Label>
                        <Switch
                          id="room-selection-switch"
                          checked={enableRoomSelection}
                          onCheckedChange={(checked) => {
                            setEnableRoomSelection(checked);
                            if (!checked) {
                              setSelectedRooms([]);
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor="foil-number-switch"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Enable Foil Number
                        </Label>
                        <Switch
                          id="foil-number-switch"
                          checked={enableFoilNumber}
                          onCheckedChange={(checked) => {
                            setEnableFoilNumber(checked);
                            if (!checked) {
                              setExcelFile(null);
                              setFoilNumberMap({});
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Excel File Upload - Only show if foil number switch is enabled */}
                  {selectedExam && enableFoilNumber && (
                    <Card className="border-0 shadow-none mb-6">
                      <CardContent className="pt-6 pb-4">
                        <div className="flex flex-col gap-1">
                          <Label className="font-medium text-gray-700">Upload Excel</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-10 w-full sm:w-auto sm:min-w-[200px] justify-between border-purple-300"
                              >
                                <Upload className="w-4 h-4 mr-2" />
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
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admit Card Download Dates - Only show if exam is selected */}
          {selectedExam && (
            <Card className="border-0 shadow-none mb-4">
              <CardContent className="pt-4 pb-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Admit Card Download Dates: <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="admit-card-start-date" className="text-sm font-medium text-gray-700">
                      Start Date & Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admit-card-start-date"
                      type="datetime-local"
                      value={admitCardStartDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAdmitCardStartDate(value);
                        // Validate that start date is before end date if both are set
                        if (value && admitCardEndDate && new Date(value) > new Date(admitCardEndDate)) {
                          toast.error("Start date must be before end date");
                        }
                      }}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="admit-card-end-date" className="text-sm font-medium text-gray-700">
                      End Date & Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admit-card-end-date"
                      type="datetime-local"
                      value={admitCardEndDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAdmitCardEndDate(value);
                        // Validate that end date is after start date if both are set
                        if (value && admitCardStartDate && new Date(value) < new Date(admitCardStartDate)) {
                          toast.error("End date must be after start date");
                        }
                      }}
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="text-red-500">*</span> Required: Set the date range when students can download their
                  admit cards.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading indicator when exam is being fetched */}
          {loadingExam && selectedExamId && !examError && (
            <Card className="border-0 shadow-none mb-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Loading exam details...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error indicator */}
          {examError && selectedExamId && (
            <Card className="border-0 shadow-none mb-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-center gap-3 text-red-600 py-8">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Failed to load exam details. Please try again.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Table - Only show if exam is selected and loaded */}
          {selectedExam && !loadingExam && (
            <Card className="border-0 shadow-none mb-4">
              <CardContent className="pt-4 pb-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Exam Summary:</Label>
                <div className="border border-gray-400 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-400">
                        <TableHead className="w-[25%] p-2 text-center border-r border-gray-400 bg-gray-100">
                          <div className="font-medium">Shift(s)</div>
                        </TableHead>
                        <TableHead className="w-[25%] p-2 text-center border-r border-gray-400 bg-gray-100">
                          <div className="font-medium">Program Course(s)</div>
                        </TableHead>
                        <TableHead className="w-[25%] p-2 text-center border-r border-gray-400 bg-gray-100">
                          <div className="font-medium">Subject Category</div>
                        </TableHead>
                        <TableHead className="w-[25%] p-2 text-center bg-gray-100">
                          <div className="font-medium">Semester</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-t border-gray-400">
                        <TableCell className="text-center p-2 border-r border-gray-400">
                          {selectedExam.examShifts.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedExam.examShifts.map((es) => (
                                <Badge
                                  key={es.shift.id}
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 bg-orange-50"
                                >
                                  {es.shift.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2 border-r border-gray-400">
                          {selectedExam.examProgramCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedExam.examProgramCourses.map((epc) => (
                                <Badge
                                  key={epc.programCourse.id}
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 bg-blue-50"
                                >
                                  {epc.programCourse.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2 border-r border-gray-400">
                          {selectedExam.examSubjectTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {selectedExam.examSubjectTypes.map((est) => (
                                <Badge
                                  key={est.subjectType.id}
                                  variant="outline"
                                  className="border-green-300 text-green-700 bg-green-50"
                                >
                                  {est.subjectType.code || est.subjectType.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-2">
                          {selectedExam.class ? (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                              {selectedExam.class.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Subjects Table */}
                {!loadingExam && selectedExam.examSubjects.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Subjects Schedule:</Label>
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingPapers ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Loading papers data...
                              </TableCell>
                            </TableRow>
                          ) : papersError ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex flex-col items-center gap-2">
                                  <span className="text-red-600 font-medium">Error 404</span>
                                  <span className="text-muted-foreground">An error occurred.</span>
                                  <Button variant="outline" size="sm" onClick={() => refetchPapers()} className="mt-2">
                                    Retry
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : papersForExam.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No papers found for this exam configuration.
                              </TableCell>
                            </TableRow>
                          ) : (
                            (() => {
                              // Group papers by subjectId and normalized code
                              const grouped = new Map<
                                string,
                                {
                                  subjectId: number;
                                  normalizedCode: string;
                                  papers: Array<{ paper: PaperDto; examSubject: any }>;
                                  representativePaper: PaperDto;
                                  representativeExamSubject: any;
                                }
                              >();

                              papersForExam.forEach((paper) => {
                                const examSubject = selectedExam.examSubjects.find(
                                  (es) => es.subject.id === paper.subjectId,
                                );
                                if (!examSubject) return;

                                const normalizedCode = normalizePaperCode(paper.code);
                                const groupKey = `${paper.subjectId}|${normalizedCode}`;

                                if (!grouped.has(groupKey)) {
                                  grouped.set(groupKey, {
                                    subjectId: paper.subjectId!,
                                    normalizedCode,
                                    papers: [],
                                    representativePaper: paper,
                                    representativeExamSubject: examSubject,
                                  });
                                }

                                const group = grouped.get(groupKey)!;
                                group.papers.push({ paper, examSubject });
                              });

                              const groupedArray = Array.from(grouped.values());

                              // Format date as dd/mm/yyyy
                              const formatDateDDMMYYYY = (date: Date): string => {
                                const day = String(date.getDate()).padStart(2, "0");
                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              };

                              // Format time as HH:MM AM/PM
                              const formatTime = (date: Date): string => {
                                return date.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                });
                              };

                              return groupedArray.map((group, index) => {
                                const { representativePaper, representativeExamSubject } = group;
                                const startDate = new Date(representativeExamSubject.startTime);
                                const endDate = new Date(representativeExamSubject.endTime);

                                const startDateStr = formatDateDDMMYYYY(startDate);
                                const endDateStr = formatDateDDMMYYYY(endDate);
                                const dateDisplay =
                                  startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
                                const timeDisplay = `${formatTime(startDate)} - ${formatTime(endDate)}`;

                                // Collect all unique program courses for this group
                                const uniqueProgramCourseIds = new Set<number>();
                                group.papers.forEach(({ paper }) => {
                                  if (paper.programCourseId) {
                                    uniqueProgramCourseIds.add(paper.programCourseId);
                                  }
                                });

                                const programCoursesForGroup = Array.from(uniqueProgramCourseIds)
                                  .map((pcId) =>
                                    selectedExam.examProgramCourses.find((epc) => epc.programCourse.id === pcId),
                                  )
                                  .filter((epc): epc is NonNullable<typeof epc> => epc !== undefined);

                                // Find subject type for representative paper
                                const subjectType = selectedExam.examSubjectTypes.find(
                                  (est) => est.subjectType.id === representativePaper.subjectTypeId,
                                );

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
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        {programCoursesForGroup.length > 0 ? (
                                          programCoursesForGroup.map((epc) => (
                                            <Badge
                                              key={epc.programCourse.id}
                                              variant="outline"
                                              className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                                            >
                                              {epc.programCourse.name}
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="p-2 text-center border-r border-gray-400">
                                      <div className="flex flex-col gap-1.5 items-center">
                                        <span className="text-sm font-medium">
                                          {representativePaper.name || "-"}
                                          {representativePaper.isOptional === false && (
                                            <span className="text-red-500 ml-1">*</span>
                                          )}
                                          {showCount && (
                                            <span className="text-gray-500 ml-1 text-xs">({paperCount})</span>
                                          )}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 w-fit"
                                        >
                                          {representativeExamSubject.subject.code ||
                                            representativeExamSubject.subject.name}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="p-2 text-center border-r border-gray-400 text-sm font-mono">
                                      {representativePaper.code || "-"}
                                      {showCount && <span className="text-gray-500 ml-1 text-xs">({paperCount})</span>}
                                    </TableCell>
                                    <TableCell className="p-2 text-center border-r border-gray-400">
                                      {subjectType ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-green-300 text-green-700 bg-green-50"
                                        >
                                          {subjectType.subjectType.code || subjectType.subjectType.name}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="p-2 text-center border-r border-gray-400 text-sm">
                                      {dateDisplay}
                                    </TableCell>
                                    <TableCell className="p-2 text-center text-sm">{timeDisplay}</TableCell>
                                  </TableRow>
                                );
                              });
                            })()
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Student Count Breakdown - Show only when rooms are selected */}
          {selectedExam && selectedRooms.length > 0 && (
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
                  if (!Array.isArray(studentCountBreakdown) || studentCountBreakdown.length === 0) {
                    return null;
                  }

                  // Calculate allotted counts by programCourse and shift from studentsWithSeats
                  const allottedCountMap = new Map<string, number>(); // key: "programCourseId|shiftId"
                  studentsWithSeats.forEach((student) => {
                    if (student.programCourseId && student.shiftId) {
                      const key = `${student.programCourseId}|${student.shiftId}`;
                      allottedCountMap.set(key, (allottedCountMap.get(key) || 0) + 1);
                    }
                  });

                  // Transform data into table format: rows = program courses, columns = shifts
                  const programCourseMap = new Map<
                    number,
                    { name: string; shifts: Map<number, { name: string; count: number; allotted: number }> }
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
                    const allottedKey = `${item.programCourseId}|${item.shiftId}`;
                    const allottedCount = allottedCountMap.get(allottedKey) || 0;
                    pcData.shifts.set(item.shiftId, {
                      name: item.shiftName,
                      count: item.count,
                      allotted: allottedCount,
                    });
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
                              <th className="border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-blue-900">
                                Total
                              </th>
                              <th className="border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-blue-900">
                                Allotted
                              </th>
                              <th className="border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-blue-900">
                                Insufficient
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedProgramCourses.map(([programCourseId, pcData], index) => {
                              const rowTotal = Array.from(pcData.shifts.values()).reduce(
                                (sum, shift) => sum + shift.count,
                                0,
                              );
                              const rowAllottedTotal = Array.from(pcData.shifts.values()).reduce(
                                (sum, shift) => sum + shift.allotted,
                                0,
                              );
                              const insufficientSeats = Math.max(0, rowTotal - rowAllottedTotal);
                              const hasMismatch = rowTotal !== rowAllottedTotal;
                              return (
                                <tr
                                  key={programCourseId}
                                  className={`hover:bg-blue-50 ${hasMismatch ? "bg-yellow-50" : ""}`}
                                >
                                  <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700 text-center">
                                    {index + 1}
                                  </td>
                                  <td className="border border-blue-200 px-3 py-2 text-xs font-medium text-gray-700">
                                    {pcData.name}
                                  </td>
                                  {sortedShiftIds.map((shiftId) => {
                                    const shiftData = pcData.shifts.get(shiftId);
                                    const shiftHasMismatch = shiftData && shiftData.count !== shiftData.allotted;
                                    return (
                                      <td
                                        key={shiftId}
                                        className={`border border-blue-200 px-3 py-2 text-sm text-center ${
                                          shiftHasMismatch
                                            ? "bg-yellow-100 text-orange-800 font-semibold"
                                            : "text-gray-700 font-medium"
                                        }`}
                                      >
                                        {shiftData ? shiftData.count : "-"}
                                      </td>
                                    );
                                  })}
                                  <td
                                    className={`border border-blue-200 px-3 py-2 text-sm font-bold text-center ${
                                      hasMismatch ? "bg-yellow-100 text-orange-800" : "text-blue-900"
                                    }`}
                                  >
                                    {rowTotal}
                                  </td>
                                  <td className="border border-blue-200 px-3 py-2 text-sm font-bold text-center bg-green-100 text-green-800">
                                    {rowAllottedTotal}
                                  </td>
                                  <td
                                    className={`border border-blue-200 px-3 py-2 text-sm font-bold text-center ${
                                      insufficientSeats > 0 ? "bg-red-100 text-red-800" : "text-gray-600"
                                    }`}
                                  >
                                    {insufficientSeats > 0 ? insufficientSeats : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {totalStudentCount === 0 && !loadingStudentCount && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      ⚠️ No eligible students found. Please check your filters (Gender, Excel File).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Allot Exam button - Only show if exam is selected */}
          {selectedExam && (
            <div className="mt-8 flex flex-col items-end gap-2">
              <Button
                onClick={handleAllotExam}
                disabled={
                  allotExamMutation.status === "loading" ||
                  (enableRoomSelection && selectedRooms.length === 0) ||
                  !selectedExam ||
                  !areAdmitCardDatesValid()
                }
                className="w-full sm:w-auto sm:min-w-[180px] h-12 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {allotExamMutation.status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Allotting...
                  </>
                ) : (
                  "Allot Exam"
                )}
              </Button>
              {!areAdmitCardDatesValid() && (
                <p className="text-xs text-red-500">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {!admitCardStartDate || admitCardStartDate.trim() === ""
                    ? "Please provide admit card start date"
                    : !admitCardEndDate || admitCardEndDate.trim() === ""
                      ? "Please provide admit card end date"
                      : new Date(admitCardEndDate) <= new Date(admitCardStartDate)
                        ? "End date must be after start date"
                        : "Invalid admit card dates"}
                </p>
              )}
              {enableRoomSelection && selectedRooms.length === 0 && (
                <p className="text-xs text-red-500">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Please select at least one room
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rooms Modal */}
      <Dialog open={roomsModalOpen} onOpenChange={setRoomsModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden p-0">
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
            {/* Capacity and Student Statistics */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1">Total Capacity</div>
                <div className="text-lg font-bold text-blue-900">
                  {selectedRooms.reduce((total, room) => {
                    const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                    const numberOfBenches = room.numberOfBenches || 0;
                    return total + numberOfBenches * maxStudentsPerBench;
                  }, 0)}
                </div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">Total Students</div>
                <div className="text-lg font-bold text-green-900">
                  {loadingTotalStudents ? <Loader2 className="h-4 w-4 animate-spin inline" /> : totalEligibleStudents}
                </div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-xs text-purple-600 font-medium mb-1">Available Seats</div>
                <div className="text-lg font-bold text-purple-900">
                  {(() => {
                    const totalCapacity = selectedRooms.reduce((total, room) => {
                      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                      const numberOfBenches = room.numberOfBenches || 0;
                      return total + numberOfBenches * maxStudentsPerBench;
                    }, 0);
                    const totalStudents = loadingTotalStudents ? 0 : totalEligibleStudents;
                    const insufficientCapacity = Math.max(0, totalStudents - totalCapacity);
                    // Occupied Seats = Total Students - Insufficient Capacity
                    const occupiedSeats = totalStudents - insufficientCapacity;
                    // Available Seats = Total Capacity - Occupied Seats
                    return Math.max(0, totalCapacity - occupiedSeats);
                  })()}
                </div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-xs text-orange-600 font-medium mb-1">Occupied Seats</div>
                <div className="text-lg font-bold text-orange-900">
                  {(() => {
                    if (loadingTotalStudents) {
                      return <Loader2 className="h-4 w-4 animate-spin inline" />;
                    }
                    const totalCapacity = selectedRooms.reduce((total, room) => {
                      const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                      const numberOfBenches = room.numberOfBenches || 0;
                      return total + numberOfBenches * maxStudentsPerBench;
                    }, 0);
                    const totalStudents = totalEligibleStudents;
                    const insufficientCapacity = Math.max(0, totalStudents - totalCapacity);
                    // Occupied Seats = Total Students - Insufficient Capacity
                    // When insufficient: Occupied = Total Students - (Total Students - Total Capacity) = Total Capacity
                    // When sufficient: Occupied = Total Students - 0 = Total Students
                    return totalStudents - insufficientCapacity;
                  })()}
                </div>
              </div>
            </div>

            {/* Insufficient Capacity Warning */}
            {!loadingTotalStudents &&
              (() => {
                const totalCapacity = selectedRooms.reduce((total, room) => {
                  const maxStudentsPerBench = room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2;
                  const numberOfBenches = room.numberOfBenches || 0;
                  return total + numberOfBenches * maxStudentsPerBench;
                }, 0);
                const insufficientCapacity = totalEligibleStudents > totalCapacity;
                const shortage = totalEligibleStudents - totalCapacity;

                return insufficientCapacity ? (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-bold text-red-900">
                      ⚠️ Insufficient Capacity: {shortage} more seat(s) needed
                    </div>
                  </div>
                ) : null;
              })()}

            {loadingRooms ? (
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
                <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
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
                        <th className="sticky top-0 z-10 bg-gray-100 h-12 px-4 text-left align-middle font-medium text-sm w-[180px]">
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
                              <td className="p-4 align-middle text-sm w-[180px] h-[56px]">
                                <div className="h-full flex items-center">
                                  {isSelected ? (
                                    <div className="flex items-center gap-2">
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
                                      <span className="text-xs text-gray-400 whitespace-nowrap">
                                        Max: {room.maxStudentsPerBench || 2}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </div>
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
                <span className="font-medium text-gray-700">{selectedRooms.length}</span> room(s) selected
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
                <div className="overflow-y-auto max-h-[60vh] relative custom-scrollbar">
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
                          {assignBy === "UID" ? "UID" : assignBy === "CU_ROLL_NUMBER" ? "CU Roll No." : "CU Reg. No."}
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
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                user={{
                                  name: student.name,
                                  image: `${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${student.uid}.jpg`,
                                }}
                                size="sm"
                              />
                              <span>{student.name}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm font-mono">
                            {assignBy === "UID"
                              ? student.uid
                              : assignBy === "CU_ROLL_NUMBER"
                                ? student.rollNumber || "N/A"
                                : student.registrationNumber || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm text-center font-mono">
                            {foilNumberMap[student.uid] || "0"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">{student.email || "N/A"}</td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.whatsappPhone || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.floorName || "N/A"}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm">
                            {student.roomName || "N/A"}
                          </td>
                          <td className="p-4 align-middle text-sm font-mono">{student.seatNumber || "N/A"}</td>
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
                <span className="font-medium text-gray-700">{studentsWithSeats.length}</span> student(s) assigned
              </p>
              <div className="flex items-center gap-3">
                {studentsWithSeats.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const exportData = studentsWithSeats.map((student, idx) => ({
                        "Sr. No.": idx + 1,
                        Name: student.name || "N/A",
                        UID: assignBy === "UID" ? student.uid || "N/A" : "N/A",
                        "CU Reg. No.":
                          assignBy === "CU_REGISTRATION_NUMBER" ? student.registrationNumber || "N/A" : "N/A",
                        "CU Roll No.": assignBy === "CU_ROLL_NUMBER" ? student.rollNumber || "N/A" : "N/A",
                        "Foil Number": foilNumberMap[student.uid] || "0",
                        Email: student.email || "N/A",
                        WhatsApp: student.whatsappPhone || "N/A",
                        Floor: student.floorName || "N/A",
                        Room: student.roomName || "N/A",
                        "Seat Number": student.seatNumber || "N/A",
                      }));

                      const workbook = XLSX.utils.book_new();
                      const worksheet = XLSX.utils.json_to_sheet(exportData);

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

      {/* Insufficient Capacity Confirmation Dialog */}
      <Dialog open={insufficientCapacityDialogOpen} onOpenChange={setInsufficientCapacityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-red-900">Insufficient Capacity</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Warning: The selected rooms do not have enough capacity for all eligible students.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Eligible Students:</span>
                <span className="text-sm font-bold text-gray-900">{calculateInsufficientCapacity().totalStudents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Room Capacity:</span>
                <span className="text-sm font-bold text-gray-900">{calculateInsufficientCapacity().totalCapacity}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-red-200">
                <span className="text-sm font-semibold text-red-700">Shortage:</span>
                <span className="text-sm font-bold text-red-900">
                  {calculateInsufficientCapacity().shortage} seat(s)
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Some students may not be assigned seats if you proceed. Are you sure you want to continue with the
              allotment?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInsufficientCapacityDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAllotment}
              className="flex-1"
              disabled={allotExamMutation.status === "loading"}
            >
              {allotExamMutation.status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Allotting...
                </>
              ) : (
                "Proceed Anyway"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Foil Excel Missing Columns Dialog */}
      <AlertDialog open={foilExcelValidationDialogOpen} onOpenChange={setFoilExcelValidationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-700" />
              </span>
              Missing required columns
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700">
              {foilExcelValidationMessage || "Your Excel file is missing required columns."}
              <span className="block mt-2 text-slate-600">
                Header matching is case-insensitive and ignores extra spaces.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold text-slate-700">Expected headers</div>
            <div className="flex flex-wrap gap-2">
              {["uid", "foil_number"].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => copyToClipboard(h)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  title="Click to copy"
                >
                  <span className="font-mono">{h}</span>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {foilExcelMissingHeaders.length > 0 ? (
            <div className="rounded border border-red-200 bg-red-50/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-red-800">Missing headers</div>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100" variant="secondary">
                  {foilExcelMissingHeaders.length}
                </Badge>
              </div>
              <div className="max-h-44 overflow-y-auto rounded border border-red-100 bg-white p-2">
                <ul className="space-y-1 text-xs text-slate-700">
                  {foilExcelMissingHeaders.map((h) => (
                    <li key={h} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-slate-50">
                      <span className="font-mono">{h}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => copyToClipboard(h)}
                        title="Copy header"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
