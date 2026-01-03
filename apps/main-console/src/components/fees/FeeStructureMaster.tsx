import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { AcademicYear } from "@/types/academics/academic-year";
import { Shift } from "@/types/academics/shift";
import { FeesHead, FeesReceiptType, FeeConcessionSlab } from "@/types/fees";
import { Class } from "@/types/academics/class";
import { CreateFeeStructureDto } from "@repo/db/dtos/fees";
import { FeeStructureConcessionSlabT } from "@repo/db/schemas";
import { getProgramCourses, getAcademicYears } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import { getAllFeesHeads, getAllFeeConcessionSlabs } from "@/services/fees-api";

// UI state type that extends DTO with calculated amount for display
type ConcessionSlabUI = {
  id: number; // From FeeConcessionSlabT
  name: string; // From FeeConcessionSlabT
  defaultConcessionRate: number; // From FeeConcessionSlabT (not null)
  concessionAmount: number; // Calculated based on amount and rate
};

interface FeeStructureRow {
  feeType: string;
  amount: number;
  components: string[];
  programs: string[];
  shifts: string[];
  semester: string;
  concessionSlabs: ConcessionSlabUI[];
}

interface FeeStructureMasterProps {
  open: boolean;
  onClose: () => void;
  receiptTypes: FeesReceiptType[];
  classes: Class[];
  onSave?: (data: CreateFeeStructureDto) => void;
}

const FeeStructureMaster: React.FC<FeeStructureMasterProps> = ({ open, onClose, receiptTypes, classes, onSave }) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedReceiptType, setSelectedReceiptType] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showSlabs, setShowSlabs] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [programCourses, setProgramCourses] = useState<Array<{ id?: number; name: string | null }>>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeesHead[]>([]);
  const [feeConcessionSlabs, setFeeConcessionSlabs] = useState<FeeConcessionSlab[]>([]);

  const [feeStructureRow, setFeeStructureRow] = useState<FeeStructureRow>({
    feeType: "Admission",
    amount: 0,
    components: [],
    programs: [],
    shifts: [],
    semester: "Sem 1",
    concessionSlabs: [],
  });

  // Fetch academic years, program courses, shifts, fee heads and concession slabs on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [academicYearsData, programCoursesData, shiftsData, feeHeadsData, concessionSlabsResponse] =
          await Promise.allSettled([
            getAcademicYears(),
            getProgramCourses(),
            getAllShifts(),
            getAllFeesHeads(),
            getAllFeeConcessionSlabs(),
          ]);

        // Handle academic years - getAcademicYears already returns the payload (array)
        if (academicYearsData.status === "fulfilled") {
          const value = academicYearsData.value;
          let academicYearsArray: AcademicYear[] = [];
          if (Array.isArray(value)) {
            academicYearsArray = value;
          } else if (value && typeof value === "object" && "payload" in value) {
            const payload = (value as { payload?: AcademicYear[] }).payload;
            academicYearsArray = Array.isArray(payload) ? payload : [];
          }
          setAcademicYears(academicYearsArray);
        } else {
          console.error("Error fetching academic years:", academicYearsData.reason);
          setAcademicYears([]);
        }

        // Handle program courses - getProgramCourses already returns the payload (array)
        if (programCoursesData.status === "fulfilled") {
          const programCoursesArray = Array.isArray(programCoursesData.value) ? programCoursesData.value : [];
          setProgramCourses(programCoursesArray);
        } else {
          console.error("Error fetching program courses:", programCoursesData.reason);
          setProgramCourses([]);
        }

        // Handle shifts - getAllShifts returns Shift[] directly
        if (shiftsData.status === "fulfilled") {
          const shiftsArray = Array.isArray(shiftsData.value) ? shiftsData.value : [];
          setShifts(shiftsArray);
        } else {
          console.error("Error fetching shifts:", shiftsData.reason);
          setShifts([]);
        }

        // Handle fee heads - getAllFeesHeads returns FeesHead[] directly
        if (feeHeadsData.status === "fulfilled") {
          const feeHeadsArray = Array.isArray(feeHeadsData.value) ? feeHeadsData.value : [];
          setFeeHeads(feeHeadsArray);
        } else {
          console.error("Error fetching fee heads:", feeHeadsData.reason);
          setFeeHeads([]);
        }

        // Handle concession slabs - getAllFeeConcessionSlabs returns ApiResponse<FeeConcessionSlab[]>
        if (concessionSlabsResponse.status === "fulfilled") {
          const concessionSlabsArray =
            concessionSlabsResponse.value?.payload && Array.isArray(concessionSlabsResponse.value.payload)
              ? concessionSlabsResponse.value.payload
              : [];
          setFeeConcessionSlabs(concessionSlabsArray);
        } else {
          console.error("Error fetching concession slabs:", concessionSlabsResponse.reason);
          setFeeConcessionSlabs([]);
        }

        console.log("Fetched academic years, program courses, shifts, fee heads and concession slabs from API");
      } catch (error) {
        console.error("Unexpected error in fetchData:", error);
        // Fallback: set all to empty arrays
        setAcademicYears([]);
        setProgramCourses([]);
        setShifts([]);
        setFeeHeads([]);
        setFeeConcessionSlabs([]);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (feeStructureRow.amount > 0) {
      recalcSlabs();
    }
  }, [feeStructureRow.amount]);

  const recalcSlabs = () => {
    setFeeStructureRow((prev) => ({
      ...prev,
      concessionSlabs: prev.concessionSlabs.map((slab) => ({
        ...slab,
        concessionAmount: Math.round((prev.amount * (slab.defaultConcessionRate || 0)) / 100),
      })),
    }));
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFeeStructureRow((prev) => {
      const updated = { ...prev, amount: numValue };
      return updated;
    });
  };

  const removeSlab = (index: number) => {
    setFeeStructureRow((prev) => ({
      ...prev,
      concessionSlabs: prev.concessionSlabs.filter((_, i) => i !== index),
    }));
  };

  const addSlab = (slabId?: number) => {
    if (!slabId) return;

    const selectedSlab = feeConcessionSlabs.find((fcs) => fcs.id === slabId);
    if (!selectedSlab) return;

    // Check if slab is already added
    if (feeStructureRow.concessionSlabs.some((cs) => cs.id === slabId)) {
      return;
    }

    setFeeStructureRow((prev) => {
      const newSlab: ConcessionSlabUI = {
        id: selectedSlab.id!,
        name: selectedSlab.name,
        defaultConcessionRate: selectedSlab.defaultConcessionRate || 0,
        concessionAmount: Math.round((prev.amount * (selectedSlab.defaultConcessionRate || 0)) / 100),
      };
      return {
        ...prev,
        concessionSlabs: [...prev.concessionSlabs, newSlab],
      };
    });
  };

  const openComponentModal = (index: number) => {
    setSelectedComponentIndex(index);
    setSelectedComponents(new Set(feeStructureRow.components));
    setShowComponentModal(true);
  };

  const applyComponents = () => {
    if (selectedComponentIndex !== null) {
      setFeeStructureRow((prev) => ({
        ...prev,
        components: Array.from(selectedComponents),
      }));
    }
    setShowComponentModal(false);
    setSelectedComponentIndex(null);
  };

  const checkStructure = () => {
    recalcSlabs();
    const issues: string[] = [];

    if (!selectedAcademicYear) issues.push("Academic Year not selected");
    if (!feeStructureRow.amount || feeStructureRow.amount <= 0) issues.push("Fee Amount must be greater than 0");
    if (feeStructureRow.concessionSlabs.length === 0) issues.push("No concession slabs defined");

    if (issues.length === 0) {
      alert("Structure check passed. No issues found.");
    } else {
      alert("Please review the following:\n\n" + issues.join("\n"));
    }
  };

  const openPreview = () => {
    recalcSlabs();
    setShowPreviewModal(true);
  };

  const handleSave = () => {
    if (!onSave) {
      onClose();
      return;
    }

    // Validate required fields
    if (!selectedAcademicYear) {
      alert("Please select an Academic Year");
      return;
    }
    if (!selectedReceiptType) {
      alert("Please select a Receipt Type");
      return;
    }
    if (!selectedClass) {
      alert("Please select a Class");
      return;
    }
    if (feeStructureRow.programs.length === 0) {
      alert("Please select at least one Program Course");
      return;
    }
    if (feeStructureRow.shifts.length === 0) {
      alert("Please select at least one Shift");
      return;
    }

    // Map UI data to CreateFeeStructureDto
    const createFeeStructureDto: CreateFeeStructureDto = {
      receiptTypeId: Number(selectedReceiptType),
      baseAmount: feeStructureRow.amount,
      academicYearId: Number(selectedAcademicYear),
      classId: Number(selectedClass),
      // Map components from selected component names to FeeStructureComponentT
      components: feeStructureRow.components.map((componentName, index) => {
        const feeHead = feeHeads.find((h) => h.name === componentName);
        if (!feeHead?.id) {
          throw new Error(`Fee head not found for component: ${componentName}`);
        }
        return {
          feeStructureId: 0, // Will be set by backend when creating
          feeHeadId: feeHead.id,
          isConcessionApplicable: true, // Default, can be made configurable
          feeHeadPercentage: 0, // Default, can be calculated based on amount
          sequence: index + 1,
          remarks: null,
        };
      }),
      // Map program names to IDs
      programCourseIds: feeStructureRow.programs
        .map((progName) => {
          const programCourse = programCourses.find((pc) => pc.name === progName);
          return programCourse?.id;
        })
        .filter((id): id is number => id !== undefined),
      advanceForProgramCourseIds: [], // Can be added later if needed
      // Map shift names to IDs
      shiftIds: feeStructureRow.shifts
        .map((shiftName) => {
          const shift = shifts.find((s) => s.name === shiftName);
          return shift?.id;
        })
        .filter((id): id is number => id !== undefined),
      // Map concession slabs - use the slabId from the selected slab
      feeStructureConcessionSlabs: feeStructureRow.concessionSlabs.map((slab) => {
        if (!slab.id) {
          throw new Error(`Fee concession slab ID not found for: ${slab.name}`);
        }
        return {
          feesStructureId: 0, // Will be set by backend when creating
          feeConcessionSlabId: slab.id,
          concessionRate: slab.defaultConcessionRate,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as FeeStructureConcessionSlabT;
      }),
      installments: [], // Can be added later if needed
      closingDate: null,
      startDate: null,
      endDate: null,
      onlineStartDate: null,
      onlineEndDate: null,
      numberOfInstallments: null,
      advanceForClassId: null,
    };

    onSave(createFeeStructureDto);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[98vh] max-h-[98vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Fee Structure & Concession Master</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <Card className="flex-shrink-0">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academic-year" className="text-sm font-medium">
                      Academic Year
                    </Label>
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                      <SelectTrigger id="academic-year" className="w-full">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={String(year.id)}>
                            {year.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class" className="text-sm font-medium">
                      Class
                    </Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger id="class" className="w-full">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-shrink-0">
              <CardContent className="pt-6 p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Receipt Type</TableHead>
                        <TableHead className="min-w-[100px]">Amount</TableHead>
                        <TableHead className="min-w-[150px]">Fee Heads</TableHead>
                        <TableHead className="min-w-[180px]">Program Course</TableHead>
                        <TableHead className="min-w-[180px]">Shift</TableHead>
                        <TableHead className="min-w-[140px]">Concession Slabs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="align-top">
                          <Select value={selectedReceiptType} onValueChange={setSelectedReceiptType}>
                            <SelectTrigger className="w-full min-w-[100px]">
                              <SelectValue placeholder="Select Receipt Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {receiptTypes.map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            type="number"
                            value={feeStructureRow.amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-full min-w-[100px]"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2 min-w-[140px]">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openComponentModal(0)}
                              className="w-full"
                            >
                              Select
                            </Button>
                            {feeStructureRow.components.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                                {feeStructureRow.components.map((comp, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2">
                                    {comp}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2 min-w-[160px]">
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (value && !feeStructureRow.programs.includes(value)) {
                                  setFeeStructureRow((prev) => ({
                                    ...prev,
                                    programs: [...prev.programs, value],
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Programs" />
                              </SelectTrigger>
                              <SelectContent>
                                {programCourses
                                  .filter(
                                    (programCourse) => !feeStructureRow.programs.includes(programCourse.name || ""),
                                  )
                                  .map((programCourse) => (
                                    <SelectItem key={programCourse.id} value={programCourse.name || ""}>
                                      {programCourse.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {feeStructureRow.programs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                {feeStructureRow.programs.map((prog, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs py-0.5 px-2 flex items-center gap-1"
                                  >
                                    <span>{prog}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          programs: prev.programs.filter((_, i) => i !== idx),
                                        }));
                                      }}
                                      className="hover:text-red-600 transition-colors"
                                      aria-label={`Remove ${prog}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2 min-w-[160px]">
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (value && !feeStructureRow.shifts.includes(value)) {
                                  setFeeStructureRow((prev) => ({
                                    ...prev,
                                    shifts: [...prev.shifts, value],
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Shifts" />
                              </SelectTrigger>
                              <SelectContent>
                                {shifts
                                  .filter((shift) => !feeStructureRow.shifts.includes(shift.name))
                                  .map((shift) => (
                                    <SelectItem key={shift.id} value={shift.name}>
                                      {shift.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {feeStructureRow.shifts.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                {feeStructureRow.shifts.map((shift, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs py-0.5 px-2 flex items-center gap-1"
                                  >
                                    <span>{shift}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          shifts: prev.shifts.filter((_, i) => i !== idx),
                                        }));
                                      }}
                                      className="hover:text-red-600 transition-colors"
                                      aria-label={`Remove ${shift}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSlabs(!showSlabs)}
                            className="w-full"
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {showSlabs && (
              <Card className="flex-shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg">Concession Slabs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value) {
                            addSlab(Number(value));
                          }
                        }}
                      >
                        <SelectTrigger className="w-full max-w-[300px]">
                          <SelectValue placeholder="Select Concession Slab" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeConcessionSlabs
                            .filter((fcs) => !feeStructureRow.concessionSlabs.some((cs) => cs.id === fcs.id))
                            .map((fcs) => (
                              <SelectItem key={fcs.id} value={String(fcs.id)}>
                                {fcs.name} ({fcs.defaultConcessionRate}%)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Slab Name</TableHead>
                            <TableHead className="min-w-[150px]">Concession Rate (%)</TableHead>
                            <TableHead className="min-w-[150px]">Concession Amount</TableHead>
                            <TableHead className="min-w-[100px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeStructureRow.concessionSlabs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                                No concession slabs selected. Select from the dropdown above.
                              </TableCell>
                            </TableRow>
                          ) : (
                            feeStructureRow.concessionSlabs.map((slab, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{slab.name}</TableCell>
                                <TableCell className="font-medium">{slab.defaultConcessionRate}%</TableCell>
                                <TableCell className="font-semibold">
                                  ₹{slab.concessionAmount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSlab(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={checkStructure} className="flex-1 sm:flex-none">
                Check Structure
              </Button>
              <Button onClick={openPreview} variant="outline" className="flex-1 sm:flex-none">
                Preview Structure
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Component Selection Modal */}
      <Dialog open={showComponentModal} onOpenChange={setShowComponentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Fee Components</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3 py-2">
            {feeHeads.length > 0 ? (
              feeHeads.map((head) => (
                <div key={head.id} className="flex items-center space-x-3 py-1">
                  <Checkbox
                    id={`component-${head.id}`}
                    checked={selectedComponents.has(head.name)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedComponents);
                      if (checked) {
                        newSet.add(head.name);
                      } else {
                        newSet.delete(head.name);
                      }
                      setSelectedComponents(newSet);
                    }}
                  />
                  <Label htmlFor={`component-${head.id}`} className="cursor-pointer flex-1 text-sm font-normal">
                    {head.name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 py-8">No fee components available</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComponentModal(false)}>
              Cancel
            </Button>
            <Button onClick={applyComponents}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Fee Structure – Preview Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium w-[200px]">Academic Year</TableCell>
                      <TableCell>
                        {academicYears.find((y) => String(y.id) === selectedAcademicYear)?.year || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Receipt Type</TableCell>
                      <TableCell>
                        {receiptTypes.find((type) => String(type.id) === selectedReceiptType)?.name || "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fee Amount</TableCell>
                      <TableCell className="font-semibold">₹{feeStructureRow.amount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Components</TableCell>
                      <TableCell>
                        {feeStructureRow.components.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {feeStructureRow.components.map((comp, idx) => (
                              <Badge key={idx} variant="secondary">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Program Course</TableCell>
                      <TableCell>
                        {feeStructureRow.programs.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {feeStructureRow.programs.map((prog, idx) => (
                              <Badge key={idx} variant="secondary">
                                {prog}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Shifts</TableCell>
                      <TableCell>
                        {feeStructureRow.shifts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {feeStructureRow.shifts.map((shift, idx) => (
                              <Badge key={idx} variant="secondary">
                                {shift}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Concession Slabs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slab</TableHead>
                      <TableHead>Concession %</TableHead>
                      <TableHead>Concession Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructureRow.concessionSlabs.map((slab, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{slab.name}</TableCell>
                        <TableCell>{slab.defaultConcessionRate}%</TableCell>
                        <TableCell className="font-semibold">₹{slab.concessionAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeeStructureMaster;
