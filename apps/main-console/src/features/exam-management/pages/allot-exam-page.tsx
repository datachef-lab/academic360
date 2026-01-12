import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Trash2, Loader2, Upload, DoorOpen, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllRooms } from "@/services/room.service";
import { getAllFloors } from "@/services/floor.service";
import { getEligibleRooms, getStudentsForExam } from "@/services/exam-schedule.service";
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

  // Excel file upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [foilNumberMap, setFoilNumberMap] = useState<Record<string, string>>({});

  // Fetch all exams for selection
  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["exams", "for-allotment"],
    queryFn: async () => {
      const data = await fetchExams(1, 1000); // Fetch many exams
      return data.content;
    },
    onError: (error) => {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams");
    },
  });

  // Fetch selected exam details
  useQuery({
    queryKey: ["exam", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const exam = await fetchExamById(selectedExamId);
      setSelectedExam(exam);
      return exam;
    },
    enabled: !!selectedExamId,
    onError: (error) => {
      console.error("Error fetching exam details:", error);
      toast.error("Failed to load exam details");
    },
  });

  // Fetch papers for the selected exam
  const { data: papersForExam = [], isLoading: loadingPapers } = useQuery({
    queryKey: ["papersForExam", selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam) return [];
      return await getPapersForExam();
    },
    enabled: !!selectedExam,
    onError: (error) => {
      console.error("Error fetching papers for exam:", error);
      toast.error("Failed to load papers data");
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
      setExcelFile(file);

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

  // Fetch students with seat assignments
  const { data: studentsWithSeats = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["studentsWithSeats", selectedExam?.id, selectedRooms, assignBy, gender, excelFile?.name],
    queryFn: async () => {
      if (!selectedExam || selectedRooms.length === 0) return [];

      const papers = await getPapersForExam();
      const paperIds = papers.map((p) => p.id).filter((id): id is number => id !== undefined);

      if (paperIds.length === 0) return [];

      const programCourseIds = selectedExam.examProgramCourses.map((epc) => epc.programCourse.id!);
      const shiftIds = selectedExam.examShifts.map((es) => es.shift.id!);

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
          classId: selectedExam.class.id!,
          programCourseIds,
          paperIds,
          academicYearIds: [selectedExam.academicYear.id!],
          shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
          assignBy: assignBy === "UID" ? "UID" : "CU_ROLL_NUMBER",
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
    enabled: !!selectedExam && selectedRooms.length > 0 && assignBy !== undefined && gender !== null,
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

  // Reset form function
  const resetForm = () => {
    setSelectedExamId(null);
    setSelectedExam(null);
    setGender("ALL");
    setAssignBy("UID");
    setSelectedRooms([]);
    setEnableFoilNumber(false);
    setExcelFile(null);
    setFoilNumberMap({});
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

      if (selectedRooms.length === 0) {
        throw new Error("Please select at least one room");
      }

      const locations = selectedRooms.map((room) => ({
        roomId: room.id!,
        studentsPerBench: room.maxStudentsPerBenchOverride || room.maxStudentsPerBench || 2,
        capacity: room.capacity,
        room: {
          id: room.id!,
          name: room.name,
          floor: room.floor,
        },
      }));

      const params: AllotExamParams = {
        locations,
        orderType: assignBy,
        gender: gender === "ALL" ? null : gender,
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

  const handleAllotExam = () => {
    allotExamMutation.mutate();
  };

  // Filter exams that don't have rooms assigned yet
  const examsWithoutRooms = examsData?.filter((exam) => !exam.locations || exam.locations.length === 0) || [];

  return (
    <div className="min-h-screen w-full p-7 py-4">
      <div className="w-full flex flex-col gap-4">
        <div className="w-full px-4 mx-auto">
          {/* Page Heading */}
          <div className="mb-6">
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
                      setExcelFile(null);
                    }}
                    disabled={loadingExams}
                  >
                    <SelectTrigger className="h-10 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder={loadingExams ? "Loading exams..." : "Select an exam"} />
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
            <Card className="border-0 shadow-none mb-4">
              <CardContent className="pt-2 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    onClick={() => setRoomsModalOpen(true)}
                    variant="outline"
                    disabled={!selectedExam || selectedExam.examSubjects.length === 0}
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
                  {/* Foil Number Switch */}
                  {selectedExam && (
                    <div className="flex items-center gap-3 ml-auto">
                      <Label htmlFor="foil-number-switch" className="text-sm font-medium text-gray-700 cursor-pointer">
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
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Table - Only show if exam is selected */}
          {selectedExam && (
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
                {selectedExam.examSubjects.length > 0 && (
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
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                Loading papers data...
                              </TableCell>
                            </TableRow>
                          ) : papersForExam.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                No papers found for this exam configuration.
                              </TableCell>
                            </TableRow>
                          ) : (
                            papersForExam.map((paper, index) => {
                              // Find exam subject for this paper's subject
                              const examSubject = selectedExam.examSubjects.find(
                                (es) => es.subject.id === paper.subjectId,
                              );
                              if (!examSubject) return null;

                              const startDate = new Date(examSubject.startTime);
                              const endDate = new Date(examSubject.endTime);

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

                              const startDateStr = formatDateDDMMYYYY(startDate);
                              const endDateStr = formatDateDDMMYYYY(endDate);
                              const dateDisplay =
                                startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
                              const timeDisplay = `${formatTime(startDate)} - ${formatTime(endDate)}`;

                              // Find program course for this paper
                              const programCourse = selectedExam.examProgramCourses.find(
                                (epc) => epc.programCourse.id === paper.programCourseId,
                              );

                              // Find subject type for this paper
                              const subjectType = selectedExam.examSubjectTypes.find(
                                (est) => est.subjectType.id === paper.subjectTypeId,
                              );

                              return (
                                <TableRow key={`${paper.id}-${index}`} className="border-b border-gray-400">
                                  <TableCell className="p-2 text-center border-r border-gray-400">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="p-2 text-center border-r border-gray-400">
                                    {programCourse ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                                      >
                                        {programCourse.programCourse.name}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="p-2 text-center border-r border-gray-400">
                                    <div className="flex flex-col gap-1.5 items-center">
                                      <span className="text-sm font-medium">
                                        {paper.name || "-"}
                                        {paper.isOptional === false && <span className="text-red-500 ml-1">*</span>}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 w-fit"
                                      >
                                        {examSubject.subject.code || examSubject.subject.name}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 text-center border-r border-gray-400 text-sm font-mono">
                                    {paper.code || "-"}
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
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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

          {/* Allot Exam button - Only show if exam is selected */}
          {selectedExam && (
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleAllotExam}
                disabled={allotExamMutation.status === "loading" || selectedRooms.length === 0 || !selectedExam}
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
            </div>
          )}
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
                            {student.name}
                          </td>
                          <td className="p-4 align-middle border-r border-border text-sm font-mono">
                            {assignBy === "UID"
                              ? student.uid
                              : assignBy === "CU_ROLL_NUMBER"
                                ? "N/A" // Add CU roll number if available
                                : student.cuRegistrationApplicationNumber || "N/A"}
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
                          assignBy === "CU_REGISTRATION_NUMBER"
                            ? student.cuRegistrationApplicationNumber || "N/A"
                            : "N/A",
                        "CU Roll No.": assignBy === "CU_ROLL_NUMBER" ? "N/A" : "N/A",
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
    </div>
  );
}
