import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Trash2 } from "lucide-react";
import { AcademicYear } from "@/types/academics/academic-year";
import { Shift } from "@/types/academics/shift";
import { FeesReceiptType } from "@/types/fees";
import type { FeeHead, FeeConcessionSlab } from "@repo/db/schemas";
import { Class } from "@/types/academics/class";
import { CreateFeeStructureDto, FeeStructureDto } from "@repo/db/dtos/fees";
import type { FeeStructureComponentT, FeeStructureConcessionSlabT } from "@repo/db/schemas";
import { getProgramCourses, getAcademicYears } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import {
  getAllFeesHeads,
  getAllFeeConcessionSlabs,
  checkUniqueFeeStructureAmounts,
  type CheckUniqueAmountsResponse,
} from "@/services/fees-api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserAvatar } from "@/hooks/UserAvatar";

// UI state type that extends DTO with calculated amount for display
type ConcessionSlabUI = {
  id: number; // From FeeConcessionSlabT
  name: string; // From FeeConcessionSlabT
  defaultConcessionRate: number; // From FeeConcessionSlabT (not null)
  concessionAmount: number; // Calculated based on amount and rate
  payableAmount: number; // Payable after concession (editable)
};

type FeeComponentUI = {
  id: number; // From FeeHead
  name: string; // From FeeHead
  percentage: number; // Calculated percentage based on amount
  amount: number; // User input amount
};

interface FeeStructureRow {
  feeType: string;
  amount: number;
  components: string[];
  feeComponents: FeeComponentUI[]; // New structure for components with percentage and amount
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
  feeStructure?: FeeStructureDto | null; // For edit mode
}

const FeeStructureMaster: React.FC<FeeStructureMasterProps> = ({
  open,
  onClose,
  receiptTypes,
  classes,
  onSave,
  feeStructure,
}) => {
  const { user } = useAuth();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedReceiptType, setSelectedReceiptType] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const showSlabs = false; // Temporarily disabled - will be re-enabled later
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [conflictsPage, setConflictsPage] = useState(1);
  const conflictsPageSize = 10;
  const [selectedFeeHeadId, setSelectedFeeHeadId] = useState<string>("");
  const [componentPercentage, setComponentPercentage] = useState<string>("");
  const [selectedSlabId, setSelectedSlabId] = useState<string>("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [programCourses, setProgramCourses] = useState<Array<{ id?: number; name: string | null }>>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [feeConcessionSlabs, setFeeConcessionSlabs] = useState<FeeConcessionSlab[]>([]);

  const [feeStructureRow, setFeeStructureRow] = useState<FeeStructureRow>({
    feeType: "Admission",
    amount: 0,
    components: [],
    feeComponents: [],
    programs: [],
    shifts: [],
    semester: "Sem 1",
    concessionSlabs: [],
  });
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<CheckUniqueAmountsResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Helper function to check if a concession slab has conflicts
  const hasSlabConflict = (slabId: number): boolean => {
    if (!validationResult || validationResult.isUnique) return false;

    return validationResult.conflicts.content.some((conflict) => conflict.concessionSlabId === slabId);
  };

  // Helper function to check if a program course has conflicts
  const hasProgramConflict = (programName: string): boolean => {
    if (!validationResult || validationResult.isUnique) return false;

    return validationResult.conflicts.content.some((conflict) => {
      const programCourse = programCourses.find((pc) => pc.id === conflict.programCourseId);
      return programCourse?.name === programName;
    });
  };

  // Helper function to check if a shift has conflicts
  const hasShiftConflict = (shiftName: string): boolean => {
    if (!validationResult || validationResult.isUnique) return false;

    return validationResult.conflicts.content.some((conflict) => {
      const shift = shifts.find((s) => s.id === conflict.shiftId);
      return shift?.name === shiftName;
    });
  };

  // Validate uniqueness of fee structure amounts
  const validateUniqueness = useCallback(
    async (page: number = conflictsPage) => {
      // Only validate if we have all required fields
      if (
        !selectedAcademicYear ||
        !selectedClass ||
        feeStructureRow.amount <= 0 ||
        feeStructureRow.programs.length === 0 ||
        feeStructureRow.shifts.length === 0 ||
        feeStructureRow.concessionSlabs.length === 0
      ) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);
      try {
        const programCourseIds = feeStructureRow.programs
          .map((p) => {
            const program = programCourses.find((pc) => pc.name === p);
            return program?.id;
          })
          .filter((id): id is number => id !== undefined);

        const shiftIds = feeStructureRow.shifts
          .map((s) => {
            const shift = shifts.find((sh) => sh.name === s);
            return shift?.id;
          })
          .filter((id): id is number => id !== undefined);

        if (programCourseIds.length === 0 || shiftIds.length === 0) {
          setValidationResult(null);
          setIsValidating(false);
          return;
        }

        const feeStructureConcessionSlabs = feeStructureRow.concessionSlabs.map((slab) => ({
          feeConcessionSlabId: slab.id,
          concessionRate: slab.defaultConcessionRate,
        }));

        const result = await checkUniqueFeeStructureAmounts({
          academicYearId: Number(selectedAcademicYear),
          classId: Number(selectedClass),
          programCourseIds,
          shiftIds,
          baseAmount: feeStructureRow.amount,
          feeStructureConcessionSlabs,
          excludeFeeStructureId: feeStructure?.id || undefined, // Exclude current fee structure when editing
          page: page,
          pageSize: conflictsPageSize,
        });

        if (result.payload) {
          setValidationResult(result.payload);
        }
      } catch (error) {
        console.error("Error validating fee structure amounts:", error);
        setValidationResult(null);
      } finally {
        setIsValidating(false);
      }
    },
    [
      selectedAcademicYear,
      selectedClass,
      feeStructureRow.amount,
      feeStructureRow.programs,
      feeStructureRow.shifts,
      feeStructureRow.concessionSlabs,
      programCourses,
      shifts,
      conflictsPage,
      conflictsPageSize,
      feeStructure?.id, // Include feeStructure.id to exclude it from conflict check when editing
    ],
  );

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

  // Populate form when feeStructure is provided (edit mode)
  useEffect(() => {
    if (feeStructure && open) {
      // Set academic year
      if (feeStructure.academicYear?.id) {
        setSelectedAcademicYear(String(feeStructure.academicYear.id));
      }
      // Set receipt type
      if (feeStructure.receiptType?.id) {
        setSelectedReceiptType(String(feeStructure.receiptType.id));
      }
      // Set class
      if (feeStructure.class?.id) {
        setSelectedClass(String(feeStructure.class.id));
      }
      // Set amount
      setFeeStructureRow((prev) => ({
        ...prev,
        amount: feeStructure.baseAmount || 0,
        // Set program courses
        programs: feeStructure.programCourse?.name ? [feeStructure.programCourse.name] : [],
        // Set shifts
        shifts: feeStructure.shift?.name ? [feeStructure.shift.name] : [],
        // Map components
        feeComponents:
          feeStructure.components?.map((comp) => {
            const baseAmount = feeStructure.baseAmount || 0;
            const percentage = comp.feeHeadPercentage || 0;
            const amount = Math.round((baseAmount * percentage) / 100);
            return {
              id: comp.feeHead?.id || 0,
              name: comp.feeHead?.name || "",
              amount: amount,
              percentage: percentage,
            };
          }) || [],
        // Map concession slabs
        concessionSlabs:
          feeStructure.feeStructureConcessionSlabs?.map((slab) => {
            const baseAmount = feeStructure.baseAmount || 0;
            const concessionRate = slab.concessionRate || 0;
            const concessionAmount = Math.round((baseAmount * concessionRate) / 100);
            const payableAmount = baseAmount - concessionAmount;
            return {
              id: slab.feeConcessionSlab?.id || 0,
              name: slab.feeConcessionSlab?.name || "",
              defaultConcessionRate: concessionRate,
              concessionAmount,
              payableAmount,
            };
          }) || [],
      }));
      // Mark initialization as complete after a short delay to allow form to populate
      setTimeout(() => setIsInitializing(false), 300);
    } else if (!feeStructure && open) {
      // Reset form for create mode
      setIsInitializing(false); // Not initializing in create mode
      setSelectedAcademicYear("");
      setSelectedReceiptType("");
      setSelectedClass("");
      setFeeStructureRow({
        feeType: "Admission",
        amount: 0,
        components: [],
        feeComponents: [],
        programs: [],
        shifts: [],
        semester: "Sem 1",
        concessionSlabs: [],
      });
    } else if (!open) {
      // Reset initialization flag when modal closes
      setIsInitializing(false);
    }
  }, [feeStructure, open]);

  // Auto-select current/active academic year when academic years are loaded (only for create mode)
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear && !feeStructure) {
      // First, try to find the academic year marked as current
      const currentYear = academicYears.find((year) => year.isCurrentYear === true);
      if (currentYear?.id) {
        setSelectedAcademicYear(String(currentYear.id));
      } else if (academicYears[0]?.id) {
        // Fallback to first academic year if no current year is found
        setSelectedAcademicYear(String(academicYears[0].id));
      }
    }
  }, [academicYears, selectedAcademicYear, feeStructure]);

  useEffect(() => {
    if (feeStructureRow.amount > 0) {
      recalcSlabs();
      recalcComponents(); // Recalculate percentages when total course fee changes
    }
  }, [feeStructureRow.amount]);

  // Auto-validate when relevant fields change
  useEffect(() => {
    // Skip validation if we're still initializing the form (edit mode)
    if (isInitializing) {
      return;
    }
    // TEMPORARILY DISABLED: Conflict-detection validation in UI
    // Reason: [Add reason here if needed] - Disabled on January 30, 2026
    // TODO: Re-enable this validation by uncommenting the code below
    /*
    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      validateUniqueness(conflictsPage);
    }, 500);

    return () => clearTimeout(timeoutId);
    */
    // Clear any existing validation results since validation is disabled
    setValidationResult(null);
  }, [validateUniqueness, conflictsPage, isInitializing]);

  const recalcSlabs = () => {
    setFeeStructureRow((prev) => ({
      ...prev,
      concessionSlabs: prev.concessionSlabs.map((slab) => {
        const concessionAmount = Math.round((prev.amount * (slab.defaultConcessionRate || 0)) / 100);
        const payableAmount = prev.amount - concessionAmount;
        return {
          ...slab,
          concessionAmount,
          payableAmount, // Recalculate based on rate when total course fee changes
        };
      }),
    }));
  };

  const recalcComponents = () => {
    setFeeStructureRow((prev) => ({
      ...prev,
      feeComponents: prev.feeComponents.map((component) => ({
        ...component,
        percentage: prev.amount > 0 ? (component.amount / prev.amount) * 100 : 0,
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

  const removeComponent = (index: number) => {
    setFeeStructureRow((prev) => ({
      ...prev,
      feeComponents: prev.feeComponents.filter((_, i) => i !== index),
    }));
  };

  const addComponent = (feeHeadId: number, amount?: number) => {
    const feeHead = feeHeads.find((h) => h.id === feeHeadId);
    if (!feeHead) return;

    // Check if component is already added
    if (feeStructureRow.feeComponents.some((fc) => fc.id === feeHeadId)) {
      return;
    }

    // Use defaultPercentage from fee head as the allocation percentage
    const defaultPercentage = feeHead.defaultPercentage ?? 0;
    // If amount is provided, calculate percentage from it; otherwise use defaultPercentage and calculate amount
    const componentAmount = amount ?? Math.round((feeStructureRow.amount * defaultPercentage) / 100);
    const componentPercentage = amount
      ? feeStructureRow.amount > 0
        ? (amount / feeStructureRow.amount) * 100
        : 0
      : defaultPercentage;

    const newComponent: FeeComponentUI = {
      id: feeHeadId,
      name: feeHead.name,
      amount: componentAmount,
      percentage: componentPercentage,
    };

    setFeeStructureRow((prev) => ({
      ...prev,
      feeComponents: [...prev.feeComponents, newComponent],
    }));
  };

  const handleAddComponent = () => {
    if (!selectedFeeHeadId || !componentPercentage) {
      alert("Please select a fee head and enter an amount");
      return;
    }

    const amount = parseFloat(componentPercentage);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    // Check if total amount exceeds base amount
    const currentTotal = feeStructureRow.feeComponents.reduce((sum, comp) => sum + comp.amount, 0);
    if (currentTotal + amount > feeStructureRow.amount) {
      alert(
        `Total component amount cannot exceed the total course fee (₹${feeStructureRow.amount.toLocaleString()}). Current total: ₹${currentTotal.toLocaleString()}`,
      );
      return;
    }

    addComponent(Number(selectedFeeHeadId), amount);
    setSelectedFeeHeadId("");
    setComponentPercentage("");
    setShowComponentModal(false);
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
      const concessionRate = selectedSlab.defaultConcessionRate || 0;
      const concessionAmount = Math.round((prev.amount * concessionRate) / 100);
      const payableAmount = prev.amount - concessionAmount;
      const newSlab: ConcessionSlabUI = {
        id: selectedSlab.id!,
        name: selectedSlab.name,
        defaultConcessionRate: concessionRate,
        concessionAmount,
        payableAmount,
      };
      return {
        ...prev,
        concessionSlabs: [...prev.concessionSlabs, newSlab],
      };
    });
  };

  // Temporarily disabled - will be re-enabled when Fee Heads column is added back
  // const openComponentModal = (index: number) => {
  //   setSelectedComponentIndex(index);
  //   setSelectedComponents(new Set(feeStructureRow.components));
  //   setShowComponentModal(true);
  // };

  // Calculate total allocation amount
  const totalAllocationAmount = useMemo(() => {
    return feeStructureRow.feeComponents.reduce((sum, comp) => sum + comp.amount, 0);
  }, [feeStructureRow.feeComponents]);

  // Calculate total allocation percentage
  const totalAllocationPercentage = useMemo(() => {
    return feeStructureRow.amount > 0 ? (totalAllocationAmount / feeStructureRow.amount) * 100 : 0;
  }, [totalAllocationAmount, feeStructureRow.amount]);

  // Check if allocation exceeds total course fee
  const isAllocationExceeded = totalAllocationAmount > feeStructureRow.amount;

  // Check if allocation is exactly 100%
  const isAllocationComplete = useMemo(() => {
    return Math.abs(totalAllocationPercentage - 100) < 0.01; // Allow small floating point differences
  }, [totalAllocationPercentage]);

  const checkStructure = () => {
    recalcSlabs();
    const issues: string[] = [];

    if (!selectedAcademicYear) issues.push("Academic Year not selected");
    if (!feeStructureRow.amount || feeStructureRow.amount <= 0) issues.push("Fee Amount must be greater than 0");
    if (feeStructureRow.concessionSlabs.length === 0) issues.push("No concession slabs defined");
    if (isAllocationExceeded)
      issues.push(
        `Total component amount (₹${totalAllocationAmount.toLocaleString()}) exceeds total course fee (₹${feeStructureRow.amount.toLocaleString()})`,
      );
    if (!isAllocationComplete)
      issues.push(
        `Total allocation must be exactly 100%. Current allocation: ${totalAllocationPercentage.toFixed(2)}%`,
      );

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

  const handleSave = async () => {
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
    if (feeStructureRow.feeComponents.length === 0) {
      alert("Please add at least one Fee Component");
      return;
    }

    setSaving(true);

    // Map UI data to CreateFeeStructureDto
    const createFeeStructureDto: CreateFeeStructureDto = {
      receiptTypeId: Number(selectedReceiptType),
      baseAmount: feeStructureRow.amount,
      academicYearId: Number(selectedAcademicYear),
      classId: Number(selectedClass),
      // Map feeComponents to FeeStructureComponentT
      components: feeStructureRow.feeComponents.map((component, index) => {
        return {
          feeStructureId: feeStructure?.id || 0, // Use existing ID in edit mode
          feeHeadId: component.id,
          isConcessionApplicable: true, // Default, can be made configurable
          feeHeadPercentage: component.percentage,
          sequence: index + 1,
          remarks: null,
        } satisfies Omit<FeeStructureComponentT, "id" | "createdAt" | "updatedAt">;
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
          feeStructureId: feeStructure?.id || 0, // Use existing ID in edit mode
          feeConcessionSlabId: slab.id,
          concessionRate: slab.defaultConcessionRate,
        } satisfies Omit<FeeStructureConcessionSlabT, "id" | "createdAt" | "updatedAt">;
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

    try {
      await onSave(createFeeStructureDto);
      onClose();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      alert("Failed to save fee structure. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[98vh] max-h-[98vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pr-8">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-2xl font-bold flex-1">
                {feeStructure ? "Edit Fee Structure & Concession Master" : "Fee Structure & Concession Master"}
              </DialogTitle>
              {validationResult && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {validationResult.isUnique ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">All amounts unique</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConflictsModal(true)}
                      className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {validationResult.conflicts.totalElements} conflict
                        {validationResult.conflicts.totalElements !== 1 ? "s" : ""} detected
                      </span>
                    </button>
                  )}
                  {isValidating && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-sm">Validating...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col pr-2 min-h-0">
            <div className="flex-shrink-0 space-y-4">
              <Card className="flex-shrink-0 border-2 border-gray-400">
                <CardContent className="pt-6 p-0">
                  <div className="overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                          <TableHead className="w-[140px] border-r-2 border-gray-400 p-2 relative text-center whitespace-nowrap">
                            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                              <SelectTrigger className="absolute inset-0 w-full h-full border-0 shadow-none bg-transparent focus:border-0 focus:ring-0 focus:ring-offset-0 [&>span]:hidden">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {academicYears.map((year) => (
                                  <SelectItem key={year.id} value={String(year.id)}>
                                    {year.year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                              <div className="text-base font-semibold text-gray-900 pointer-events-none">
                                Academic Year
                              </div>
                            </Select>
                          </TableHead>
                          <TableHead className="w-[140px] border-r-2 border-gray-400 p-2 relative text-center whitespace-nowrap">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                              <SelectTrigger className="absolute inset-0 w-full h-full border-0 shadow-none bg-transparent focus:border-0 focus:ring-0 focus:ring-offset-0 [&>span]:hidden">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map((cls) => (
                                  <SelectItem key={cls.id} value={String(cls.id)}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                              <div className="text-base font-semibold text-gray-900 pointer-events-none">Class</div>
                            </Select>
                          </TableHead>
                          <TableHead className="w-[140px] border-r-2 border-gray-400 p-2 relative text-center whitespace-nowrap">
                            <Select value={selectedReceiptType} onValueChange={setSelectedReceiptType}>
                              <SelectTrigger className="absolute inset-0 w-full h-full border-0 shadow-none bg-transparent focus:border-0 focus:ring-0 focus:ring-offset-0 [&>span]:hidden">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {receiptTypes.map((type) => (
                                  <SelectItem key={type.id} value={String(type.id)}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                              <div className="text-base font-semibold text-gray-900 pointer-events-none">
                                Receipt Type
                              </div>
                            </Select>
                          </TableHead>
                          <TableHead className="w-[120px] border-r-2 border-gray-400 p-2 text-center bg-gray-100 whitespace-nowrap">
                            <div className="text-base font-semibold text-gray-900">Total Course Fee</div>
                          </TableHead>
                          <TableHead className="w-[200px] border-r-2 border-gray-400 p-2 relative text-center whitespace-nowrap">
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
                              <SelectTrigger className="absolute inset-0 w-full h-full border-0 shadow-none bg-transparent focus:border-0 focus:ring-0 focus:ring-offset-0 [&>span]:hidden">
                                <SelectValue />
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
                              <div className="text-base font-semibold text-gray-900 pointer-events-none">
                                Program Course
                              </div>
                            </Select>
                          </TableHead>
                          <TableHead className="w-[180px] p-2 relative text-center whitespace-nowrap">
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
                              <SelectTrigger className="absolute inset-0 w-full h-full border-0 shadow-none bg-transparent focus:border-0 focus:ring-0 focus:ring-offset-0 [&>span]:hidden">
                                <SelectValue />
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
                              <div className="text-base font-semibold text-gray-900 pointer-events-none">Shift</div>
                            </Select>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-b-2 border-gray-400">
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[500px]">
                            {selectedAcademicYear ? (
                              <div className="flex justify-center">
                                <Badge
                                  variant="secondary"
                                  className="text-sm bg-blue-100 text-blue-800 border-blue-300"
                                >
                                  {academicYears.find((y) => String(y.id) === selectedAcademicYear)?.year || "-"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[500px]">
                            {selectedClass ? (
                              <div className="flex justify-center">
                                <Badge
                                  variant="secondary"
                                  className="text-sm bg-green-100 text-green-800 border-green-300"
                                >
                                  {classes.find((c) => String(c.id) === selectedClass)?.name || "-"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[500px]">
                            {selectedReceiptType ? (
                              <div className="flex justify-center">
                                <Badge
                                  variant="secondary"
                                  className="text-sm bg-purple-100 text-purple-800 border-purple-300"
                                >
                                  {receiptTypes.find((r) => String(r.id) === selectedReceiptType)?.name || "-"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[500px]">
                            <div className="flex justify-center items-center gap-1">
                              <span className="text-gray-900 font-medium">₹</span>
                              <Input
                                type="number"
                                value={feeStructureRow.amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                className="w-full max-w-[150px] border-0 shadow-none focus:ring-0 focus:ring-offset-0 text-gray-900 text-center"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[500px]">
                            {feeStructureRow.programs.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {feeStructureRow.programs.map((prog, idx) => {
                                  const hasConflict = hasProgramConflict(prog);
                                  return (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={`text-xs py-0.5 px-2 flex items-center gap-1 ${
                                        hasConflict
                                          ? "bg-red-100 text-red-800 border-red-400"
                                          : "bg-indigo-100 text-indigo-800 border-indigo-300"
                                      }`}
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
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center p-2 min-h-[500px]">
                            {feeStructureRow.shifts.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {feeStructureRow.shifts.map((shift, idx) => {
                                  const hasConflict = hasShiftConflict(shift);
                                  return (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className={`text-xs py-0.5 px-2 flex items-center gap-1 ${
                                        hasConflict
                                          ? "bg-red-100 text-red-800 border-red-400"
                                          : "bg-orange-100 text-orange-800 border-orange-300"
                                      }`}
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
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
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
                                  <TableCell className="font-medium">
                                    {slab.defaultConcessionRate.toFixed(2)}%
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    ₹
                                    {(
                                      slab.payableAmount ?? feeStructureRow.amount - slab.concessionAmount
                                    ).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
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
            </div>

            {/* Fee Components and Concession Slabs Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden mt-6">
              {/* Left Section: Fee Structure Components */}
              <div className="flex flex-col space-y-3 min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">Fee Structure Components</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      const availableFeeHead = feeHeads.find(
                        (head) => !feeStructureRow.feeComponents.some((fc) => fc.id === head.id),
                      );
                      if (availableFeeHead) {
                        // Use defaultPercentage from fee head
                        addComponent(availableFeeHead.id!);
                      }
                    }}
                    className="h-8"
                    disabled={
                      feeHeads.filter((head) => !feeStructureRow.feeComponents.some((fc) => fc.id === head.id))
                        .length === 0
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Component
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden border-2 border-gray-400 rounded flex flex-col min-h-0">
                  {isAllocationExceeded && (
                    <div className="bg-red-50 border-b-2 border-red-300 px-4 py-2 text-sm text-red-700">
                      ⚠️ Total component amount (₹{totalAllocationAmount.toLocaleString()}) exceeds total course fee (₹
                      {feeStructureRow.amount.toLocaleString()}). Please adjust the component amounts.
                    </div>
                  )}
                  {!isAllocationExceeded && !isAllocationComplete && (
                    <div className="bg-yellow-50 border-b-2 border-yellow-300 px-4 py-2 text-sm text-yellow-700">
                      ⚠️ Total allocation must be exactly 100%. Current allocation:{" "}
                      {totalAllocationPercentage.toFixed(2)}%
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                          <TableHead className="w-[60px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Sr. No
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Fee Head Name
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Allocation %
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Amount
                          </TableHead>
                          <TableHead className="w-[80px] p-2 text-center text-base font-semibold whitespace-nowrap">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="border-b-2 border-gray-400">
                        {feeStructureRow.feeComponents.length === 0 ? (
                          <TableRow className="border-b-2 border-gray-400">
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8 min-h-[100px]">
                              No components added. Click "Add Component" to add fee heads.
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {feeStructureRow.feeComponents.map((component, index) => (
                              <TableRow key={component.id} className="border-b-2 border-gray-400">
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  <Select
                                    value={String(component.id)}
                                    onValueChange={(value) => {
                                      const newFeeHeadId = Number(value);
                                      const newFeeHead = feeHeads.find((h) => h.id === newFeeHeadId);
                                      if (
                                        newFeeHead &&
                                        !feeStructureRow.feeComponents.some(
                                          (fc) => fc.id === newFeeHeadId && fc.id !== component.id,
                                        )
                                      ) {
                                        // Use defaultPercentage from the new fee head as the allocation percentage
                                        const defaultPercentage = newFeeHead.defaultPercentage ?? 0;
                                        const defaultAmount = Math.round(
                                          (feeStructureRow.amount * defaultPercentage) / 100,
                                        );
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          feeComponents: prev.feeComponents.map((comp, idx) =>
                                            idx === index
                                              ? {
                                                  ...comp,
                                                  id: newFeeHeadId,
                                                  name: newFeeHead.name,
                                                  amount: defaultAmount,
                                                  percentage: defaultPercentage, // Use defaultPercentage directly
                                                }
                                              : comp,
                                          ),
                                        }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {feeHeads
                                        .filter(
                                          (head) =>
                                            !feeStructureRow.feeComponents.some(
                                              (fc) => fc.id === head.id && fc.id !== component.id,
                                            ),
                                        )
                                        .map((head) => (
                                          <SelectItem key={head.id} value={String(head.id)}>
                                            {head.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      value={Number(component.percentage.toFixed(2))}
                                      onChange={(e) => {
                                        const newPercentage = parseFloat(e.target.value) || 0;
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          feeComponents: prev.feeComponents.map((comp, idx) =>
                                            idx === index
                                              ? {
                                                  ...comp,
                                                  percentage: newPercentage,
                                                  amount: Math.round((prev.amount * newPercentage) / 100),
                                                }
                                              : comp,
                                          ),
                                        }));
                                      }}
                                      className="w-full h-8 text-sm text-center"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                    />
                                    <span className="text-gray-900 font-medium">%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-gray-900 font-medium">₹</span>
                                    <Input
                                      type="number"
                                      value={Number(component.amount.toFixed(2))}
                                      onChange={(e) => {
                                        const newAmount = parseFloat(e.target.value) || 0;
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          feeComponents: prev.feeComponents.map((comp, idx) =>
                                            idx === index
                                              ? {
                                                  ...comp,
                                                  amount: newAmount,
                                                  percentage: prev.amount > 0 ? (newAmount / prev.amount) * 100 : 0,
                                                }
                                              : comp,
                                          ),
                                        }));
                                      }}
                                      className="w-full h-8 text-sm text-center"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center p-2 min-h-[60px]">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeComponent(index)}
                                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Right Section: Fee Structure Concession Slabs */}
              <div className="flex flex-col space-y-3 min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">Concession Slabs</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      const availableSlab = feeConcessionSlabs.find(
                        (slab) => !feeStructureRow.concessionSlabs.some((cs) => cs.id === slab.id),
                      );
                      if (availableSlab) {
                        addSlab(availableSlab.id!);
                      }
                    }}
                    className="h-8"
                    disabled={
                      feeConcessionSlabs.filter(
                        (fcs) => !feeStructureRow.concessionSlabs.some((cs) => cs.id === fcs.id),
                      ).length === 0
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slab
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden border-2 border-gray-400 rounded flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                          <TableHead className="w-[60px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Sr. No
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Concession Slab Name
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Concession Rate
                          </TableHead>
                          <TableHead className="border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                            Payable After Concession
                          </TableHead>
                          <TableHead className="w-[80px] p-2 text-center text-base font-semibold whitespace-nowrap">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="border-b-2 border-gray-400">
                        {feeStructureRow.concessionSlabs.length === 0 ? (
                          <TableRow className="border-b-2 border-gray-400">
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8 min-h-[100px]">
                              No concession slabs added. Click "Add Slab" to add concession slabs.
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {feeStructureRow.concessionSlabs.map((slab, index) => (
                              <TableRow key={slab.id} className="border-b-2 border-gray-400">
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  <Select
                                    value={String(slab.id)}
                                    onValueChange={(value) => {
                                      const newSlabId = Number(value);
                                      const newSlab = feeConcessionSlabs.find((s) => s.id === newSlabId);
                                      if (
                                        newSlab &&
                                        !feeStructureRow.concessionSlabs.some(
                                          (cs) => cs.id === newSlabId && cs.id !== slab.id,
                                        )
                                      ) {
                                        setFeeStructureRow((prev) => {
                                          const concessionRate = newSlab.defaultConcessionRate || 0;
                                          const concessionAmount = Math.round((prev.amount * concessionRate) / 100);
                                          const payableAmount = prev.amount - concessionAmount;
                                          return {
                                            ...prev,
                                            concessionSlabs: prev.concessionSlabs.map((s, idx) =>
                                              idx === index
                                                ? {
                                                    ...s,
                                                    id: newSlab.id!,
                                                    name: newSlab.name,
                                                    defaultConcessionRate: concessionRate,
                                                    concessionAmount,
                                                    payableAmount,
                                                  }
                                                : s,
                                            ),
                                          };
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {feeConcessionSlabs
                                        .filter(
                                          (fcs) =>
                                            !feeStructureRow.concessionSlabs.some(
                                              (cs) => cs.id === fcs.id && cs.id !== slab.id,
                                            ),
                                        )
                                        .map((fcs) => (
                                          <SelectItem key={fcs.id} value={String(fcs.id)}>
                                            {fcs.name} ({fcs.defaultConcessionRate}%)
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                  <Input
                                    type="number"
                                    value={Number(slab.defaultConcessionRate.toFixed(2))}
                                    onChange={(e) => {
                                      const newRate = parseFloat(e.target.value) || 0;
                                      setFeeStructureRow((prev) => ({
                                        ...prev,
                                        concessionSlabs: prev.concessionSlabs.map((s, idx) => {
                                          if (idx === index) {
                                            const concessionAmount = Math.round((prev.amount * newRate) / 100);
                                            const payableAmount = prev.amount - concessionAmount;
                                            return {
                                              ...s,
                                              defaultConcessionRate: newRate,
                                              concessionAmount,
                                              payableAmount,
                                            };
                                          }
                                          return s;
                                        }),
                                      }));
                                    }}
                                    className="w-full h-8 text-sm text-center"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell
                                  className={`text-center border-r-2 border-gray-400 p-2 min-h-[60px] ${
                                    hasSlabConflict(slab.id) ? "bg-red-100 border-red-400 text-red-800" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-gray-900 font-medium">₹</span>
                                    <Input
                                      type="number"
                                      value={Number(
                                        (slab.payableAmount ?? feeStructureRow.amount - slab.concessionAmount).toFixed(
                                          2,
                                        ),
                                      )}
                                      onChange={(e) => {
                                        const newPayableAmount = parseFloat(e.target.value) || 0;
                                        setFeeStructureRow((prev) => ({
                                          ...prev,
                                          concessionSlabs: prev.concessionSlabs.map((s, idx) => {
                                            if (idx === index) {
                                              // Calculate concession rate from payable amount
                                              const concessionRate =
                                                prev.amount > 0
                                                  ? ((prev.amount - newPayableAmount) / prev.amount) * 100
                                                  : 0;
                                              const concessionAmount = prev.amount - newPayableAmount;
                                              return {
                                                ...s,
                                                defaultConcessionRate: Math.max(0, Math.min(100, concessionRate)),
                                                concessionAmount: Math.max(0, concessionAmount),
                                                payableAmount: newPayableAmount,
                                              };
                                            }
                                            return s;
                                          }),
                                        }));
                                      }}
                                      className="w-full h-8 text-sm text-center"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center p-2 min-h-[60px]">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSlab(index)}
                                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={checkStructure} className="flex-1 sm:flex-none">
                Check Structure
              </Button>
              <Button
                onClick={openPreview}
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={isAllocationExceeded || !isAllocationComplete}
              >
                Preview Structure
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                isAllocationExceeded ||
                !isAllocationComplete ||
                (validationResult !== null && !validationResult.isUnique)
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Component Selection Modal */}
      <Dialog open={showComponentModal} onOpenChange={setShowComponentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fee-head-select">Fee Head</Label>
              <Select value={selectedFeeHeadId} onValueChange={setSelectedFeeHeadId}>
                <SelectTrigger id="fee-head-select">
                  <SelectValue placeholder="Select Fee Head" />
                </SelectTrigger>
                <SelectContent>
                  {feeHeads
                    .filter((head) => !feeStructureRow.feeComponents.some((fc) => fc.id === head.id))
                    .map((head) => (
                      <SelectItem key={head.id} value={String(head.id)}>
                        {head.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount-input">Amount (₹)</Label>
              <Input
                id="amount-input"
                type="number"
                value={componentPercentage}
                onChange={(e) => setComponentPercentage(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500">
                Current total: ₹
                {feeStructureRow.feeComponents.reduce((sum, comp) => sum + comp.amount, 0).toLocaleString()} / ₹
                {feeStructureRow.amount.toLocaleString()}
              </p>
            </div>
            {feeHeads.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">No fee heads available</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowComponentModal(false);
                setSelectedFeeHeadId("");
                setComponentPercentage("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddComponent} disabled={!selectedFeeHeadId || !componentPercentage}>
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Concession Slab Selection Modal */}
      <Dialog open={showSlabModal} onOpenChange={setShowSlabModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Concession Slab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="slab-select">Concession Slab</Label>
              <Select value={selectedSlabId} onValueChange={setSelectedSlabId}>
                <SelectTrigger id="slab-select">
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
            {feeConcessionSlabs.filter((fcs) => !feeStructureRow.concessionSlabs.some((cs) => cs.id === fcs.id))
              .length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">All concession slabs have been added</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSlabModal(false);
                setSelectedSlabId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSlabId) {
                  addSlab(Number(selectedSlabId));
                  setSelectedSlabId("");
                  setShowSlabModal(false);
                }
              }}
              disabled={!selectedSlabId}
            >
              Add Slab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflicts Modal */}
      <Dialog
        open={showConflictsModal}
        onOpenChange={(open) => {
          setShowConflictsModal(open);
          if (!open) setConflictsPage(1); // Reset page when closing
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-red-600">Fee Structure Conflicts</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4 min-h-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Conflicts detected: Fee structure amounts are not unique</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-300 rounded-md">
                <Table className="relative border-collapse">
                  <TableHeader className="sticky top-0 z-10 bg-gray-100">
                    <TableRow className="border-b border-gray-300">
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Sr. No
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Academic Year
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Program Course
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Shift
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Semester
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Receipt Type
                      </TableHead>
                      <TableHead className="text-center border-r border-gray-300 p-3 text-base font-semibold whitespace-nowrap">
                        Concession Slab Name
                      </TableHead>
                      <TableHead className="text-center p-3 text-base font-semibold whitespace-nowrap">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult?.conflicts.content.map((conflict, index) => {
                      const programCourse = programCourses.find((pc) => pc.id === conflict.programCourseId);
                      const shift = shifts.find((s) => s.id === conflict.shiftId);
                      const receiptType = receiptTypes.find((rt) => rt.id === conflict.receiptTypeId);
                      const actualIndex = (conflictsPage - 1) * conflictsPageSize + index;
                      return (
                        <TableRow key={actualIndex} className="border-b border-gray-300 hover:bg-gray-50">
                          <TableCell className="text-center border-r border-gray-300 p-3 font-medium">
                            {actualIndex + 1}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            {conflict.academicYearName && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 hover:text-blue-800">
                                {conflict.academicYearName}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            {programCourse?.name && (
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800">
                                {programCourse.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            {shift?.name && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 hover:text-orange-800">
                                {shift.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            {conflict.className && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-800">
                                {conflict.className}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            {receiptType?.name && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100 hover:text-purple-800">
                                {receiptType.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-300 p-3">
                            <Badge className="bg-red-100 text-red-800 border-red-300 font-semibold hover:bg-red-100 hover:text-red-800">
                              {conflict.concessionSlabName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-3 font-semibold text-gray-900">
                            ₹{conflict.conflictingAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {validationResult && validationResult.conflicts.totalElements > conflictsPageSize && (
                <div className="flex items-center justify-between mt-4 flex-shrink-0">
                  <div className="text-sm text-gray-600">
                    Showing {(conflictsPage - 1) * conflictsPageSize + 1} to{" "}
                    {Math.min(conflictsPage * conflictsPageSize, validationResult.conflicts.totalElements)} of{" "}
                    {validationResult.conflicts.totalElements} conflicts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const newPage = Math.max(1, conflictsPage - 1);
                        setConflictsPage(newPage);
                        // TEMPORARILY DISABLED: Conflict validation call in pagination
                        // await validateUniqueness(newPage);
                      }}
                      disabled={conflictsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {conflictsPage} of {validationResult.conflicts.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const newPage = Math.min(validationResult.conflicts.totalPages, conflictsPage + 1);
                        setConflictsPage(newPage);
                        // TEMPORARILY DISABLED: Conflict validation call in pagination
                        // await validateUniqueness(newPage);
                      }}
                      disabled={conflictsPage >= validationResult.conflicts.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex-shrink-0">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please adjust the base amount or concession rates to ensure unique final amounts
                for each concession slab across all program course and shift combinations.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowConflictsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Fee Structure – Preview Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 min-h-0">
            {/* Fee Structure Details - Same as Add Modal */}
            <div className="border-2 border-gray-400 rounded">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                    <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                      Academic Year
                    </TableHead>
                    <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                      Class
                    </TableHead>
                    <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                      Receipt Type
                    </TableHead>
                    <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                      Amount
                    </TableHead>
                    <TableHead className="w-[250px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                      Program Course
                    </TableHead>
                    <TableHead className="w-[200px] p-2 text-center text-base font-semibold whitespace-nowrap">
                      Shift
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b-2 border-gray-400">
                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                      {selectedAcademicYear ? (
                        <div className="flex justify-center">
                          <Badge className="text-sm bg-blue-100 text-blue-800 border-blue-300">
                            {academicYears.find((y) => String(y.id) === selectedAcademicYear)?.year || "-"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                      {selectedClass ? (
                        <div className="flex justify-center">
                          <Badge className="text-sm bg-green-100 text-green-800 border-green-300">
                            {classes.find((c) => String(c.id) === selectedClass)?.name || "-"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                      {selectedReceiptType ? (
                        <div className="flex justify-center">
                          <Badge className="text-sm bg-purple-100 text-purple-800 border-purple-300">
                            {receiptTypes.find((r) => String(r.id) === selectedReceiptType)?.name || "-"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                      <div className="flex justify-center">
                        <span className="text-gray-900 font-semibold">₹{feeStructureRow.amount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[100px]">
                      {feeStructureRow.programs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {feeStructureRow.programs.map((prog, idx) => (
                            <Badge
                              key={idx}
                              className="text-xs py-0.5 px-2 bg-indigo-100 text-indigo-800 border-indigo-300"
                            >
                              {prog}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center p-2 min-h-[100px]">
                      {feeStructureRow.shifts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {feeStructureRow.shifts.map((shift, idx) => (
                            <Badge
                              key={idx}
                              className="text-xs py-0.5 px-2 bg-orange-100 text-orange-800 border-orange-300"
                            >
                              {shift}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Concession Slab x Component Table */}
            {feeStructureRow.feeComponents.length > 0 && feeStructureRow.concessionSlabs.length > 0 && (
              <div className="border-2 border-gray-400 rounded overflow-hidden">
                {/* Fee Components Header */}
                <div className="bg-gray-100 border-b-2 border-gray-400 p-3">
                  <h3 className="text-lg font-semibold text-gray-900">Fee Components</h3>
                </div>
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-400">
                      <TableHead className="w-[80px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-blue-50">
                        Sr. No
                      </TableHead>
                      <TableHead className="w-[200px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-green-50">
                        Fee Head
                      </TableHead>
                      <TableHead className="w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-yellow-50">
                        Allocation
                      </TableHead>
                      {feeStructureRow.concessionSlabs.map((slab, slabIndex) => (
                        <TableHead
                          key={slab.id}
                          className={`w-[150px] p-2 text-center text-base font-semibold whitespace-nowrap ${
                            slabIndex < feeStructureRow.concessionSlabs.length - 1 ? "border-r-2 border-gray-400" : ""
                          }`}
                          style={{
                            backgroundColor:
                              slabIndex % 4 === 0
                                ? "#fef3c7" // yellow-100
                                : slabIndex % 4 === 1
                                  ? "#fce7f3" // pink-100
                                  : slabIndex % 4 === 2
                                    ? "#dbeafe" // blue-100
                                    : "#e0e7ff", // indigo-100
                          }}
                        >
                          {slab.name} ({slab.defaultConcessionRate.toFixed(2)}%)
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructureRow.feeComponents.map((component, index) => {
                      const componentAmount = component.amount;
                      return (
                        <TableRow
                          key={component.id}
                          className="border-b-2 border-gray-400"
                          style={{
                            backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                          }}
                        >
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-blue-50">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-green-50">
                            {component.name} <span className="text-red-600">({component.percentage.toFixed(2)}%)</span>
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-gray-400 p-2 font-semibold bg-yellow-50">
                            ₹
                            {componentAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          {feeStructureRow.concessionSlabs.map((slab, slabIndex) => {
                            // Calculate concession amount for this component with this slab
                            const concessionAmount = Math.round((componentAmount * slab.defaultConcessionRate) / 100);
                            const totalAfterConcession = componentAmount - concessionAmount;
                            const isLastColumn = slabIndex === feeStructureRow.concessionSlabs.length - 1;
                            return (
                              <TableCell
                                key={slab.id}
                                className={`text-center p-2 font-semibold ${
                                  !isLastColumn ? "border-r-2 border-gray-400" : ""
                                }`}
                                style={{
                                  backgroundColor:
                                    slabIndex % 4 === 0
                                      ? "#fef3c7" // yellow-100
                                      : slabIndex % 4 === 1
                                        ? "#fce7f3" // pink-100
                                        : slabIndex % 4 === 2
                                          ? "#dbeafe" // blue-100
                                          : "#e0e7ff", // indigo-100
                                }}
                              >
                                ₹
                                {totalAfterConcession.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                    {/* Total Row */}
                    <TableRow className="border-t-4 border-gray-600 bg-gray-100">
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-blue-50">
                        Total
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-green-50">
                        -
                      </TableCell>
                      <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold text-base bg-yellow-50">
                        ₹{feeStructureRow.amount.toLocaleString()}
                      </TableCell>
                      {feeStructureRow.concessionSlabs.map((slab, slabIndex) => {
                        // Calculate total for this slab column (sum of all components after concession)
                        const columnTotal = feeStructureRow.feeComponents.reduce((sum, component) => {
                          const componentAmount = component.amount;
                          const concessionAmount = Math.round((componentAmount * slab.defaultConcessionRate) / 100);
                          const totalAfterConcession = componentAmount - concessionAmount;
                          return sum + totalAfterConcession;
                        }, 0);
                        const isLastColumn = slabIndex === feeStructureRow.concessionSlabs.length - 1;
                        return (
                          <TableCell
                            key={slab.id}
                            className={`text-center p-2 font-bold text-base ${
                              !isLastColumn ? "border-r-2 border-gray-400" : ""
                            }`}
                            style={{
                              backgroundColor:
                                slabIndex % 4 === 0
                                  ? "#fef3c7" // yellow-100
                                  : slabIndex % 4 === 1
                                    ? "#fce7f3" // pink-100
                                    : slabIndex % 4 === 2
                                      ? "#dbeafe" // blue-100
                                      : "#e0e7ff", // indigo-100
                            }}
                          >
                            ₹
                            {columnTotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Notes Section */}
            <div className="bg-gray-50 border-t-2 border-l-2 border-r-2 border-b-2 border-gray-300 px-6 py-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Notes:</h4>
              <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-800">
                <li className="leading-relaxed">
                  <span className="font-medium">No late fee charges will be applicable</span> as this fee structure is
                  not configured with time-bound payment deadlines.
                </li>
                <li className="leading-relaxed">
                  <span className="font-medium">Full payment is required upfront</span> as no installment plan has been
                  configured for this fee structure.
                </li>
              </ol>
            </div>
          </div>

          {/* Created By Section */}
          <div className="flex-shrink-0 border-t border-gray-300 px-6 py-3 bg-white">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <div>
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <UserAvatar
                  user={
                    { name: user?.name || undefined, image: user?.image || undefined } as unknown as {
                      name?: string;
                      image?: string;
                    }
                  }
                  size="sm"
                  className="rounded-full"
                />
                <div className="text-right">
                  <div>
                    <span className="font-medium">By</span> {user?.name || "N/A"}
                  </div>
                  <div className="text-gray-500">{user?.email || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-0">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                isAllocationExceeded ||
                !isAllocationComplete ||
                (validationResult !== null && !validationResult.isUnique)
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeeStructureMaster;
