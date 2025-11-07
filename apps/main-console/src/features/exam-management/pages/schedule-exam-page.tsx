import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Download, AlertCircle, CheckCircle2, GraduationCap, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const examTypes = [
  { value: "CIE", label: "CIE (Continuous Internal Evaluation)" },
  { value: "IA", label: "Internal Assessment" },
  { value: "UE", label: "University Examination" },
];

const semesters = ["Semester I", "Semester II", "Semester III", "Semester IV", "Semester V", "Semester VI"];

const programCourses = ["B.Com (H)", "B.Com (P)", "BBA", "B.A. (H)", "B.A. (P)", "B.Sc. (H)", "B.Sc. (P)", "B.C.A."];

const shifts = ["Morning", "Day", "Afternoon", "Evening"];

const subjectCategories = ["ALL", "Major", "Minor", "Core", "Elective", "Skill Enhancement"];

interface Subject {
  id: string;
  name: string;
  category: string;
  programCourse: string;
}

const mockSubjects: Subject[] = [
  { id: "s1", name: "Financial Accounting", category: "Major", programCourse: "B.Com (H)" },
  { id: "s2", name: "Business Mathematics", category: "Core", programCourse: "B.Com (H)" },
  { id: "s3", name: "Economics", category: "Minor", programCourse: "B.Com (H)" },
  { id: "s4", name: "Management Principles", category: "Major", programCourse: "BBA" },
  { id: "s5", name: "Business Communication", category: "Core", programCourse: "BBA" },
  { id: "s6", name: "Marketing", category: "Minor", programCourse: "BBA" },
];

interface Paper {
  id: string;
  name: string;
  type: "Theory" | "Practical" | "Tutorial";
  subjectId: string;
}

const mockPapers: Paper[] = [
  { id: "p1", name: "Financial Accounting - Theory", type: "Theory", subjectId: "s1" },
  { id: "p2", name: "Financial Accounting - Practical", type: "Practical", subjectId: "s1" },
  { id: "p3", name: "Business Mathematics - Theory", type: "Theory", subjectId: "s2" },
  { id: "p4", name: "Economics - Theory", type: "Theory", subjectId: "s3" },
  { id: "p5", name: "Management Principles - Theory", type: "Theory", subjectId: "s4" },
  { id: "p6", name: "Business Communication - Theory", type: "Theory", subjectId: "s5" },
];

interface Room {
  id: string;
  number: string;
  benches: number;
  building?: string;
}

const mockRooms: Room[] = [
  { id: "r1", number: "101", benches: 15, building: "Main Block" },
  { id: "r2", number: "102", benches: 20, building: "Main Block" },
  { id: "r3", number: "103", benches: 18, building: "Main Block" },
  { id: "r4", number: "201", benches: 25, building: "Science Block" },
  { id: "r5", number: "202", benches: 22, building: "Science Block" },
  { id: "r6", number: "301", benches: 30, building: "Arts Block" },
];

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

interface SelectedRoom extends Room {
  capacity: number;
  capacityOverride?: number;
}

export default function ScheduleExamPage() {
  // Step 1: Exam Information
  const [examType, setExamType] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedProgramCourses, setSelectedProgramCourses] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedSubjectCategories, setSelectedSubjectCategories] = useState<string[]>(["ALL"]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["ALL"]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // Step 2: Room Selection
  const [gender, setGender] = useState("All");
  const [assignBy, setAssignBy] = useState("CU Roll No.");
  const [studentsPerBench, setStudentsPerBench] = useState(2);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);

  // Step 3: Exam Schedule
  const [paperSchedules, setPaperSchedules] = useState<Record<string, Schedule>>({});

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAssigned, setIsAssigned] = useState(false);

  // Generate mock students based on selections
  const generateMockStudents = (): Student[] => {
    const students: Student[] = [];
    let counter = 1;

    selectedProgramCourses.forEach((course) => {
      const shiftsToUse = selectedShifts.length > 0 ? selectedShifts : shifts;
      shiftsToUse.forEach((shift) => {
        const studentsPerGroup = 15;
        for (let i = 0; i < studentsPerGroup; i++) {
          students.push({
            uid: `UID${String(counter).padStart(6, "0")}`,
            name: `Student ${counter}`,
            cuRollNo: `CUR${String(counter).padStart(6, "0")}`,
            cuRegNo: `REG${String(counter).padStart(6, "0")}`,
            programCourse: course,
            semester: semester,
            shift: shift,
            gender: i % 2 === 0 ? "Male" : "Female",
          });
          counter++;
        }
      });
    });

    return students;
  };

  const getFilteredStudents = (): Student[] => {
    const allStudents = generateMockStudents();
    if (gender === "All") return allStudents;
    return allStudents.filter((s) => s.gender === gender);
  };

  useEffect(() => {
    if (selectedProgramCourses.length > 0 && semester) {
      const filtered = getFilteredStudents();
      setTotalStudents(filtered.length);
    } else {
      setTotalStudents(0);
    }
  }, [selectedProgramCourses, selectedShifts, semester, gender]);

  const getAvailableSubjects = (): Subject[] => {
    if (selectedSubjectCategories.includes("ALL")) {
      return mockSubjects.filter((s) => selectedProgramCourses.includes(s.programCourse));
    }
    return mockSubjects.filter(
      (s) => selectedProgramCourses.includes(s.programCourse) && selectedSubjectCategories.includes(s.category),
    );
  };

  const getAvailablePapers = (): Paper[] => {
    if (selectedSubjects.includes("ALL")) {
      const subjects = getAvailableSubjects();
      return mockPapers.filter((p) => subjects.some((s) => s.id === p.subjectId));
    }
    return mockPapers.filter((p) => selectedSubjects.includes(p.subjectId));
  };

  useEffect(() => {
    if (selectedSubjectCategories.includes("ALL")) {
      setSelectedSubjects(["ALL"]);
    }
  }, [selectedSubjectCategories]);

  useEffect(() => {
    const capacity = selectedRooms.reduce((total, room) => {
      return total + (room.capacityOverride || room.capacity);
    }, 0);
    setTotalCapacity(capacity);
  }, [selectedRooms, studentsPerBench]);

  const handleProgramCourseToggle = (course: string) => {
    setSelectedProgramCourses((prev) => (prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]));
  };

  const handleShiftToggle = (shift: string) => {
    setSelectedShifts((prev) => (prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]));
  };

  const handleSubjectCategoryToggle = (category: string) => {
    if (category === "ALL") {
      setSelectedSubjectCategories(["ALL"]);
    } else {
      setSelectedSubjectCategories((prev) => {
        const newCategories = prev.includes(category)
          ? prev.filter((c) => c !== category && c !== "ALL")
          : [...prev.filter((c) => c !== "ALL"), category];
        return newCategories.length === 0 ? ["ALL"] : newCategories;
      });
    }
  };

  const handleRoomSelection = (room: Room, selected: boolean) => {
    if (selected) {
      const capacity = room.benches * studentsPerBench;
      setSelectedRooms((prev) => [...prev, { ...room, capacity }]);
    } else {
      setSelectedRooms((prev) => prev.filter((r) => r.id !== room.id));
    }
  };

  const handleCapacityOverride = (roomId: string, override: number) => {
    setSelectedRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, capacityOverride: override } : r)));
  };

  const handleScheduleChange = (paperId: string, field: keyof Schedule, value: string) => {
    setPaperSchedules((prev) => ({
      ...prev,
      [paperId]: {
        ...prev[paperId],
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

  const generateSeatNumber = (benchNumber: number, positionOnBench: number): string => {
    const letters = studentsPerBench === 2 ? ["A", "C"] : ["A", "B", "C"];
    return `${benchNumber}${letters[positionOnBench - 1]}`;
  };

  const handleGenerate = () => {
    const students = getFilteredStudents();

    students.sort((a, b) => {
      if (assignBy === "UID") return a.uid.localeCompare(b.uid);
      if (assignBy === "CU Roll No.") return a.cuRollNo.localeCompare(b.cuRollNo);
      return a.cuRegNo.localeCompare(b.cuRegNo);
    });

    const newAssignments: Assignment[] = [];
    let currentRoomIndex = 0;
    let currentBench = 1;
    let currentPosition = 1;

    students.forEach((student) => {
      if (currentRoomIndex >= selectedRooms.length) return;

      const currentRoom = selectedRooms[currentRoomIndex]!;
      const roomCapacity = currentRoom.capacityOverride || currentRoom.capacity;

      const studentPapers = getAvailablePapers()
        .filter((p) => selectedPapers.includes(p.id))
        .map((paper) => ({
          paperId: paper.id,
          name: paper.name,
          date: paperSchedules[paper.id]?.date || "TBD",
          time: paperSchedules[paper.id]?.startTime
            ? `${formatTime(paperSchedules[paper.id]?.startTime)} - ${formatTime(paperSchedules[paper.id]?.endTime)}`
            : "TBD",
        }));

      const seatNo = generateSeatNumber(currentBench, currentPosition);

      newAssignments.push({
        uid: student.uid,
        name: student.name,
        cuRollNo: student.cuRollNo,
        cuRegNo: student.cuRegNo,
        programCourse: student.programCourse,
        papers: studentPapers,
        room: currentRoom.number,
        seatNo,
      });

      currentPosition++;
      if (currentPosition > studentsPerBench) {
        currentPosition = 1;
        currentBench++;
      }

      const studentsInRoom = newAssignments.filter((a) => a.room === currentRoom.number).length;
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
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger id="examType" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm font-semibold">
                  Class / Semester
                </Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger id="semester" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Program Course</Label>
                <Select
                  value={selectedProgramCourses.length > 0 ? selectedProgramCourses[0] : ""}
                  onValueChange={(value) => {
                    if (!selectedProgramCourses.includes(value)) {
                      setSelectedProgramCourses([...selectedProgramCourses, value]);
                    }
                  }}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue>
                      {selectedProgramCourses.length === 0
                        ? "Select courses..."
                        : `${selectedProgramCourses.length} course${selectedProgramCourses.length > 1 ? "s" : ""} selected`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {programCourses.map((course) => (
                      <SelectItem key={course} value={course} disabled={selectedProgramCourses.includes(course)}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProgramCourses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProgramCourses.map((course) => (
                      <Badge
                        key={course}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => handleProgramCourseToggle(course)}
                      >
                        {course} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Shift</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shifts.map((shift) => (
                    <div
                      key={shift}
                      className="flex items-center space-x-2 bg-gray-100/50 p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
                    >
                      <Checkbox
                        id={`shift-${shift}`}
                        checked={selectedShifts.includes(shift)}
                        onCheckedChange={() => handleShiftToggle(shift)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 text-white focus:ring-2 focus:ring-purple-500"
                      />
                      <Label htmlFor={`shift-${shift}`} className="cursor-pointer text-sm font-medium">
                        {shift}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Subject Category</Label>
                <div className="flex flex-wrap gap-2">
                  {subjectCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedSubjectCategories.includes(category) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        selectedSubjectCategories.includes(category)
                          ? "bg-purple-500 text-white border-transparent hover:bg-purple-600"
                          : "border-purple-300 text-purple-700 hover:bg-purple-50"
                      }`}
                      onClick={() => handleSubjectCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Papers</Label>
                <div className="max-h-[240px] overflow-y-auto border-2 rounded-xl p-3 space-y-2 bg-gray-100/50 scrollbar-hide">
                  {availablePapers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Select courses and categories to see papers
                    </p>
                  ) : (
                    availablePapers.map((paper) => {
                      const subject = mockSubjects.find((s) => s.id === paper.subjectId);
                      return (
                        <div
                          key={paper.id}
                          className="flex items-start space-x-3 p-3 bg-white rounded-lg border-2 hover:border-purple-400/50 transition-colors"
                        >
                          <Checkbox
                            id={`paper-${paper.id}`}
                            checked={selectedPapers.includes(paper.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPapers((prev) => [...prev, paper.id]);
                              } else {
                                setSelectedPapers((prev) => prev.filter((p) => p !== paper.id));
                              }
                            }}
                            className="mt-1 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 text-white focus:ring-2 focus:ring-purple-500"
                          />
                          <Label htmlFor={`paper-${paper.id}`} className="cursor-pointer flex-1">
                            <div className="font-semibold text-sm">{paper.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {subject?.name} • {subject?.programCourse}
                            </div>
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
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Students</SelectItem>
                    <SelectItem value="Male">Male Only</SelectItem>
                    <SelectItem value="Female">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignBy" className="text-sm font-semibold">
                  Assign By
                </Label>
                <Select value={assignBy} onValueChange={setAssignBy}>
                  <SelectTrigger id="assignBy" className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UID">UID (University ID)</SelectItem>
                    <SelectItem value="CU Roll No.">CU Roll Number</SelectItem>
                    <SelectItem value="CU Reg. No.">CU Registration Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentsPerBench" className="text-sm font-semibold">
                  Max Students per Bench
                </Label>
                <Input
                  id="studentsPerBench"
                  type="number"
                  min="2"
                  max="3"
                  value={studentsPerBench}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 2 && val <= 3) setStudentsPerBench(val);
                  }}
                />
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
                        <DialogDescription>Choose rooms and optionally override capacity</DialogDescription>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {mockRooms.map((room) => {
                            const isSelected = selectedRooms.some((r) => r.id === room.id);
                            const selectedRoom = selectedRooms.find((r) => r.id === room.id);
                            const calculatedCapacity = room.benches * studentsPerBench;

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
                                    <div className="font-bold text-base">Room {room.number}</div>
                                    <div className="text-xs text-gray-500">{room.building}</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="bg-gray-100/50 p-2 rounded">
                                    <div className="text-gray-500 text-xs">Benches</div>
                                    <div className="font-semibold text-sm">{room.benches}</div>
                                  </div>
                                  <div className="bg-gray-100/50 p-2 rounded">
                                    <div className="text-gray-500 text-xs">Capacity</div>
                                    <div className="font-semibold text-sm">{calculatedCapacity}</div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="bg-purple-50 p-2 rounded">
                                    <div className="text-gray-500 text-xs mb-1">Override Capacity</div>
                                    <Input
                                      type="number"
                                      min="1"
                                      max={calculatedCapacity}
                                      placeholder={calculatedCapacity.toString()}
                                      value={selectedRoom?.capacityOverride || ""}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val && val <= calculatedCapacity) {
                                          handleCapacityOverride(room.id, val);
                                        } else if (!e.target.value) {
                                          handleCapacityOverride(room.id, 0);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
                      const capacity = room.capacityOverride || room.capacity;
                      return (
                        <div
                          key={room.id}
                          className="p-3 bg-white rounded-lg border-2 flex items-center justify-between hover:border-purple-400/50 transition-colors"
                        >
                          <div>
                            <div className="font-semibold">Room {room.number}</div>
                            <div className="text-xs text-gray-500">
                              {room.benches} benches • Capacity: {capacity}
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
              {availablePapers.filter((p) => selectedPapers.includes(p.id)).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="font-semibold text-gray-600">No Papers Selected</p>
                  <p className="text-sm text-gray-400 mt-1">Select papers in Section 1</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availablePapers
                    .filter((paper) => selectedPapers.includes(paper.id))
                    .map((paper) => {
                      const subject = mockSubjects.find((s) => s.id === paper.subjectId);
                      return (
                        <div
                          key={paper.id}
                          className="p-4 border-2 rounded-xl hover:border-purple-400/50 transition-colors bg-white"
                        >
                          <div className="space-y-4">
                            <div>
                              <Label className="font-semibold">{paper.name}</Label>
                              <div className="text-xs text-gray-500 mt-1">
                                {subject?.name} • {subject?.programCourse}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block">Exam Date</Label>
                                <Input
                                  type="date"
                                  value={paperSchedules[paper.id]?.date || ""}
                                  onChange={(e) => handleScheduleChange(paper.id, "date", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-semibold mb-1.5 block">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={paperSchedules[paper.id]?.startTime || ""}
                                    onChange={(e) => handleScheduleChange(paper.id, "startTime", e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-semibold mb-1.5 block">End Time</Label>
                                  <Input
                                    type="time"
                                    value={paperSchedules[paper.id]?.endTime || ""}
                                    onChange={(e) => handleScheduleChange(paper.id, "endTime", e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
      </div>
    </div>
  );
}
