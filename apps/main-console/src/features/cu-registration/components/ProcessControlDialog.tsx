import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Settings, BookOpen, FileText, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { ProcessControlService, ProcessControlFilters } from "@/services/process-control";
import { ProcessControl } from "@repo/db/schemas/models/process-control";

interface ProgramCourse {
  id: number;
  name: string;
  shortName: string;
  totalSemesters: number;
  isActive: boolean;
}

interface ProcessControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessUpdate: (updates: ProcessControlUpdate[]) => void;
}

interface ProcessControlUpdate {
  programCourseId: number;
  semester: number;
  processType: "SUBJECT_SELECTION" | "CU_REGISTRATION";
  status: "ACTIVE" | "INACTIVE";
}

export default function ProcessControlDialog({ open, onOpenChange, onProcessUpdate }: ProcessControlDialogProps) {
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<number>>(new Set());
  const [selectedSemesters, setSelectedSemesters] = useState<Map<number, Set<number>>>(new Map()); // programId -> Set of semesters
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [processType, setProcessType] = useState<"SUBJECT_SELECTION" | "CU_REGISTRATION">("SUBJECT_SELECTION");
  const [action, setAction] = useState<"ACTIVATE" | "DEACTIVATE">("ACTIVATE");
  const [loading, setLoading] = useState(false);

  // Load program courses
  useEffect(() => {
    const loadProgramCourses = async () => {
      // Mock data - replace with actual API call
      setProgramCourses([
        {
          id: 1,
          name: "B.A. English (H)",
          shortName: "BA-ENG",
          totalSemesters: 6,
          isActive: true,
        },
        {
          id: 2,
          name: "B.A. History (H)",
          shortName: "BA-HIST",
          totalSemesters: 6,
          isActive: true,
        },
        {
          id: 3,
          name: "B.COM (H)",
          shortName: "BCOM-H",
          totalSemesters: 6,
          isActive: true,
        },
        {
          id: 4,
          name: "B.Sc. Computer Science (H)",
          shortName: "BSC-CS",
          totalSemesters: 6,
          isActive: true,
        },
        {
          id: 5,
          name: "BBA (H)",
          shortName: "BBA-H",
          totalSemesters: 6,
          isActive: true,
        },
        {
          id: 6,
          name: "M.A. English",
          shortName: "MA-ENG",
          totalSemesters: 4,
          isActive: true,
        },
        {
          id: 7,
          name: "M.Com",
          shortName: "MCOM",
          totalSemesters: 4,
          isActive: true,
        },
      ]);
    };

    loadProgramCourses();
  }, []);

  const handleProgramToggle = (programId: number, checked: boolean) => {
    const newSelected = new Set(selectedPrograms);
    if (checked) {
      newSelected.add(programId);
    } else {
      newSelected.delete(programId);
    }
    setSelectedPrograms(newSelected);
  };

  const handleSemesterToggle = (programId: number, semester: number, checked: boolean) => {
    const newSelected = new Map(selectedSemesters);
    const programSemesters = newSelected.get(programId) || new Set<number>();

    if (checked) {
      programSemesters.add(semester);
    } else {
      programSemesters.delete(semester);
    }

    if (programSemesters.size > 0) {
      newSelected.set(programId, programSemesters);
    } else {
      newSelected.delete(programId);
    }

    setSelectedSemesters(newSelected);
  };

  const handleSelectAllPrograms = (checked: boolean) => {
    if (checked) {
      setSelectedPrograms(new Set(programCourses.map((pc) => pc.id)));
    } else {
      setSelectedPrograms(new Set());
    }
  };

  const handleSelectAllSemesters = (checked: boolean) => {
    if (checked) {
      const newSelected = new Map<number, Set<number>>();
      programCourses.forEach((program) => {
        const semesters = new Set<number>();
        for (let i = 1; i <= program.totalSemesters; i++) {
          semesters.add(i);
        }
        newSelected.set(program.id, semesters);
      });
      setSelectedSemesters(newSelected);
    } else {
      setSelectedSemesters(new Map());
    }
  };

  const handleShiftToggle = (shift: string, checked: boolean) => {
    const newSelected = new Set(selectedShifts);
    if (checked) {
      newSelected.add(shift);
    } else {
      newSelected.delete(shift);
    }
    setSelectedShifts(newSelected);
  };

  const handleApplyChanges = async () => {
    if (selectedPrograms.size === 0 || selectedSemesters.size === 0) {
      alert("Please select at least one program and one semester");
      return;
    }

    setLoading(true);
    try {
      const updates: ProcessControlUpdate[] = [];

      for (const programId of selectedPrograms) {
        const programSemesters = selectedSemesters.get(programId);
        if (programSemesters && programSemesters.size > 0) {
          for (const semester of programSemesters) {
            updates.push({
              programCourseId: programId,
              semester,
              processType,
              status: action === "ACTIVATE" ? "ACTIVE" : "INACTIVE",
            });
          }
        }
      }

      // TODO: Implement bulk update API call
      console.log("Applying changes:", updates);
      onProcessUpdate(updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply changes:", error);
      alert("Failed to apply changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getProcessIcon = (processType: string) => {
    switch (processType) {
      case "SUBJECT_SELECTION":
        return <BookOpen className="h-4 w-4" />;
      case "CU_REGISTRATION":
        return <FileText className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "ACTIVATE":
        return <Play className="h-4 w-4" />;
      case "DEACTIVATE":
        return <Pause className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const selectedProgramsCount = selectedPrograms.size;
  const selectedSemestersCount = Array.from(selectedSemesters.values()).reduce(
    (total, semesters) => total + semesters.size,
    0,
  );
  const totalUpdates = Array.from(selectedSemesters.entries()).reduce((total, [programId, semesters]) => {
    return selectedPrograms.has(programId) ? total + semesters.size : total;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Process Control Management
          </DialogTitle>
          <DialogDescription>
            Select programs and semesters to manage subject selection and CU registration processes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Column - Controls and Summary */}
          <div className="w-80 flex flex-col space-y-4">
            {/* Process Type and Action Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="process-type">Process Type</Label>
                <Select value={processType} onValueChange={(value: any) => setProcessType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select process type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBJECT_SELECTION">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Subject Selection
                      </div>
                    </SelectItem>
                    <SelectItem value="CU_REGISTRATION">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CU Registration
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select value={action} onValueChange={(value: any) => setAction(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVATE">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Activate
                      </div>
                    </SelectItem>
                    <SelectItem value="DEACTIVATE">
                      <div className="flex items-center gap-2">
                        <Pause className="h-4 w-4" />
                        Deactivate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Shift Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Shift</h4>
              <div className="grid grid-cols-2 gap-3">
                {["Day", "Morning", "Afternoon", "Evening"].map((shift) => (
                  <div key={shift} className="flex items-center space-x-2">
                    <Checkbox
                      id={`shift-${shift.toLowerCase()}`}
                      checked={selectedShifts.has(shift)}
                      onCheckedChange={(checked) => handleShiftToggle(shift, checked as boolean)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor={`shift-${shift.toLowerCase()}`} className="text-sm">
                      {shift}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="flex-1 flex flex-col justify-end">
              {totalUpdates > 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Summary</span>
                  </div>
                  <div className="text-sm text-emerald-800">
                    <p className="mb-1">
                      {action === "ACTIVATE" ? "Activating" : "Deactivating"}{" "}
                      <strong>{processType.replace("_", " ").toLowerCase()}</strong>
                    </p>
                    <div className="space-y-1">
                      <p>
                        <strong>{selectedProgramsCount}</strong> program{selectedProgramsCount !== 1 ? "s" : ""}
                      </p>
                      <p>
                        <strong>{selectedSemestersCount}</strong> semester{selectedSemestersCount !== 1 ? "s" : ""}
                      </p>
                      <p className="font-semibold text-emerald-900">
                        <strong>{totalUpdates}</strong> total process{totalUpdates !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-sm text-slate-600 text-center">Select programs and semesters to see summary</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Table */}
          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Programs and Semesters</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-programs"
                    checked={selectedPrograms.size === programCourses.length}
                    onCheckedChange={handleSelectAllPrograms}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="select-all-programs" className="text-sm">
                    Select All Programs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-semesters"
                    checked={selectedSemestersCount > 0}
                    onCheckedChange={handleSelectAllSemesters}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="select-all-semesters" className="text-sm">
                    Select All Semesters
                  </Label>
                </div>
                <div className="text-sm text-slate-600">
                  {selectedProgramsCount} programs, {selectedSemestersCount} semesters selected
                </div>
              </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden min-h-0">
              <div className="h-full overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 w-1/2">
                        Program Courses
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 w-1/2">Semesters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {programCourses.map((program) => (
                      <tr key={program.id} className="hover:bg-gray-50">
                        {/* Program Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`program-${program.id}`}
                              checked={selectedPrograms.has(program.id)}
                              onCheckedChange={(checked) => handleProgramToggle(program.id, checked as boolean)}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`program-${program.id}`} className="cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-800">{program.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {program.totalSemesters} semesters
                                  </Badge>
                                </div>
                              </Label>
                            </div>
                          </div>
                        </td>

                        {/* Semester Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => {
                              const isRelevant = semester <= program.totalSemesters;
                              const programSemesters = selectedSemesters.get(program.id) || new Set<number>();
                              const isSelected = programSemesters.has(semester);
                              return (
                                <div
                                  key={semester}
                                  className={`relative w-8 h-8 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                                    isRelevant
                                      ? isSelected
                                        ? "bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md"
                                        : "bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer"
                                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                  }`}
                                  onClick={() => isRelevant && handleSemesterToggle(program.id, semester, !isSelected)}
                                >
                                  <span className="text-sm font-semibold">{semester}</span>
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyChanges}
            disabled={totalUpdates === 0 || loading}
            className="flex items-center gap-2"
          >
            {getActionIcon(action)}
            {loading ? "Applying..." : `Apply Changes (${totalUpdates})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
