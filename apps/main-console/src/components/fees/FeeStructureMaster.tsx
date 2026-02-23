// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
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
import type { FeeConcessionSlabT } from "@/schemas";
import type { FeesHead } from "@/types/fees";
import { Class } from "@/types/academics/class";
import { CreateFeeStructureDto, FeeStructureDto } from "@repo/db/dtos/fees";
import type { FeeStructureComponentT } from "@repo/db/schemas";
import { getProgramCourses, getAcademicYears } from "@/services/course-design.api";
import { getAllShifts } from "@/services/academic";
import {
  getAllFeesHeads,
  getAllFeeConcessionSlabs,
  getAllFeeGroups,
  checkUniqueFeeStructureAmounts,
  type CheckUniqueAmountsResponse,
  updateFeesStructure,
  deleteFeesStructure,
} from "@/services/fees-api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserAvatar } from "@/hooks/UserAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// UI state type that extends DTO with calculated amount for display
type ConcessionSlabUI = {
  isNewlyAdded?: boolean;
  id: number; // From FeeConcessionSlabT
  name: string; // From FeeConcessionSlabT
  defaultConcessionRate: number; // From FeeConcessionSlabT (not null)
  concessionAmount: number; // Calculated based on amount and rate
  payableAmount: number; // Payable after concession (editable)
  feeHeadAmounts: { [feeHeadId: number]: number }; // Amount for each fee head in this slab
  // allocation is calculated dynamically, not stored
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
  onRefresh?: () => void; // Callback to refresh the parent component
}

const FeeStructureMaster: React.FC<FeeStructureMasterProps> = ({
  open,
  onClose,
  receiptTypes,
  classes,
  onSave,
  feeStructure,
  onRefresh,
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
  const [feeHeads, setFeeHeads] = useState<FeesHead[]>([]);
  const [feeConcessionSlabs, setFeeConcessionSlabs] = useState<FeeConcessionSlabT[]>([]);
  const [feeGroups, setFeeGroups] = useState<any[]>([]);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(true);

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState<"components" | "slabs">("components");
  const [hasPaidMappings, setHasPaidMappings] = useState(false);
  // Check for paid mappings before allowing delete
  useEffect(() => {
    const checkPaidMappings = async () => {
      if (feeStructure?.id) {
        try {
          // Call backend API to check for paid mappings
          const res = await axios.get(`/api/fees/structure/${feeStructure.id}/has-paid-mappings`);
          setHasPaidMappings(res.data.hasPaidMappings === true);
        } catch (err) {
          setHasPaidMappings(false);
        }
      } else {
        setHasPaidMappings(false);
      }
    };
    if (open && feeStructure?.id) {
      checkPaidMappings();
    }
  }, [open, feeStructure?.id]);

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

  // Helper function to get fee category name from slab ID
  const getFeeCategoryFromSlabId = (slabId: number): string => {
    const feeGroup = feeGroups.find((fg) => fg.feeSlab?.id === slabId);
    return feeGroup?.feeCategory?.name || "General";
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

        const feeStructureSlabs = feeStructureRow.concessionSlabs.map((slab) => ({
          feeSlabId: slab.id,
          concessionRate: slab.defaultConcessionRate ?? 0,
        }));

        const result = await checkUniqueFeeStructureAmounts({
          academicYearId: Number(selectedAcademicYear),
          classId: Number(selectedClass),
          programCourseIds,
          shiftIds,
          baseAmount: feeStructureRow.amount,
          feeStructureSlabs,
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

  // Fetch academic years, program courses, shifts, fee heads, concession slabs and fee groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          academicYearsData,
          programCoursesData,
          shiftsData,
          feeHeadsData,
          concessionSlabsResponse,
          feeGroupsResponse,
        ] = await Promise.allSettled([
          getAcademicYears(),
          getProgramCourses(),
          getAllShifts(),
          getAllFeesHeads(),
          getAllFeeConcessionSlabs(),
          getAllFeeGroups(),
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

        // Handle fee groups - getAllFeeGroups returns ApiResponse<FeeGroupDto[]>
        if (feeGroupsResponse.status === "fulfilled") {
          const feeGroupsArray =
            feeGroupsResponse.value?.payload && Array.isArray(feeGroupsResponse.value.payload)
              ? feeGroupsResponse.value.payload
              : [];
          setFeeGroups(feeGroupsArray);
        } else {
          console.error("Error fetching fee groups:", feeGroupsResponse.reason);
          setFeeGroups([]);
        }

        console.log(
          "Fetched academic years, program courses, shifts, fee heads, concession slabs and fee groups from API",
        );
      } catch (error) {
        console.error("Unexpected error in fetchData:", error);
        // Fallback: set all to empty arrays
        setAcademicYears([]);
        setProgramCourses([]);
        setShifts([]);
        setFeeHeads([]);
        setFeeConcessionSlabs([]);
        setFeeGroups([]);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Populate form when feeStructure is provided (edit mode)
  useEffect(() => {
    setIsCreateMode(!feeStructure);
    if (feeStructure && open && feeConcessionSlabs.length > 0) {
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
      setFeeStructureRow((prev) => {
        // Extract unique fee heads from components
        const uniqueFeeHeads = new Map<number, FeeComponentUI>();
        feeStructure.components?.forEach((comp) => {
          if (comp.feeHead?.id && !uniqueFeeHeads.has(comp.feeHead.id)) {
            uniqueFeeHeads.set(comp.feeHead.id, {
              id: comp.feeHead.id,
              name: comp.feeHead.name || "",
              amount: 0, // Will be populated from slabs
              percentage: 0, // Not used anymore
            });
          }
        });
        const feeComponents: FeeComponentUI[] = Array.from(uniqueFeeHeads.values());

        // Group components by slab
        const slabMap = new Map<number, { feeHeadAmounts: { [feeHeadId: number]: number } }>();

        feeStructure.components?.forEach((comp) => {
          const slabId = comp.feeSlab?.id;
          const feeHeadId = comp.feeHead?.id;

          if (slabId && feeHeadId) {
            if (!slabMap.has(slabId)) {
              slabMap.set(slabId, { feeHeadAmounts: {} });
            }
            slabMap.get(slabId)!.feeHeadAmounts[feeHeadId] = comp.amount || 0;
          }
        });

        // Create concession slabs from the grouped components
        const concessionSlabs: ConcessionSlabUI[] = [];
        slabMap.forEach((slabData, slabId) => {
          // Find the slab details from feeConcessionSlabs
          const slabDetails = feeConcessionSlabs.find((s) => s.id === slabId);
          if (slabDetails) {
            const totalPayable = Object.values(slabData.feeHeadAmounts).reduce((sum, amt) => sum + amt, 0);
            concessionSlabs.push({
              id: slabDetails.id!,
              name: slabDetails.name,
              defaultConcessionRate: slabDetails.defaultConcessionRate || 0,
              concessionAmount: 0,
              payableAmount: totalPayable,
              feeHeadAmounts: slabData.feeHeadAmounts,
              isNewlyAdded: false, // ← explicit, or just omit (undefined = old)
            });
          }
        });

        return {
          ...prev,
          amount: feeStructure.baseAmount || 0,
          // Set program courses
          programs: feeStructure.programCourse?.name ? [feeStructure.programCourse.name] : [],
          // Set shifts
          shifts: feeStructure.shift?.name ? [feeStructure.shift.name] : [],
          feeComponents,
          concessionSlabs,
        };
      });
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
  }, [feeStructure, open, feeConcessionSlabs]);

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
    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      validateUniqueness(conflictsPage);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [validateUniqueness, conflictsPage, isInitializing]);

  // Reset activeSection when modal opens
  useEffect(() => {
    if (open) {
      setActiveSection("components");
    }
  }, [open]);

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
    setFeeStructureRow((prev) => {
      const slabToRemove = prev.concessionSlabs[index];
      // Prevent removing Slab F
      if (slabToRemove.name.toUpperCase() === "SLAB F") {
        return prev;
      }

      return {
        ...prev,
        concessionSlabs: prev.concessionSlabs.filter((_, i) => i !== index),
      };
    });
  };

  const removeComponent = (index: number) => {
    setFeeStructureRow((prev) => {
      const removedComponent = prev.feeComponents[index];
      const updatedComponents = prev.feeComponents.filter((_, i) => i !== index);

      // If all components are removed, clear all slabs including Slab F
      if (updatedComponents.length === 0) {
        return {
          ...prev,
          feeComponents: updatedComponents,
          concessionSlabs: [],
        };
      }

      // Update all slabs by removing the fee head from their feeHeadAmounts
      const updatedSlabs = prev.concessionSlabs.map((slab) => {
        const { [removedComponent.id]: removed, ...remainingAmounts } = slab.feeHeadAmounts || {};
        const totalPayable = Object.values(remainingAmounts).reduce((sum, amt) => sum + amt, 0);
        return {
          ...slab,
          feeHeadAmounts: remainingAmounts,
          payableAmount: totalPayable,
        };
      });

      return {
        ...prev,
        feeComponents: updatedComponents,
        concessionSlabs: updatedSlabs,
      };
    });
  };

  const addComponent = (feeHeadId: number) => {
    const feeHead = feeHeads.find((h) => h.id === feeHeadId);
    if (!feeHead) return;

    // Check if component is already added
    if (feeStructureRow.feeComponents.some((fc) => fc.id === feeHeadId)) {
      return;
    }

    const newComponent: FeeComponentUI = {
      id: feeHeadId,
      name: feeHead.name,
      amount: 0,
      percentage: 0,
    };

    setFeeStructureRow((prev) => {
      const updatedComponents = [...prev.feeComponents, newComponent];

      // If this is the first component, automatically add Slab F
      if (prev.feeComponents.length === 0) {
        const slabF = feeConcessionSlabs.find((slab) => slab.name.toUpperCase() === "SLAB F");
        if (slabF) {
          const feeHeadAmounts: { [key: number]: number } = {};
          feeHeadAmounts[feeHeadId] = 0; // Initialize with 0, will be set in Step 2

          const slabFEntry: ConcessionSlabUI = {
            id: slabF.id!,
            name: slabF.name,
            defaultConcessionRate: 0, // Slab F has 0% concession
            concessionAmount: 0,
            payableAmount: 0,
            feeHeadAmounts,
          };

          return {
            ...prev,
            feeComponents: updatedComponents,
            concessionSlabs: [slabFEntry],
          };
        }
      }

      // Update Slab F with new component
      const updatedSlabs = prev.concessionSlabs.map((slab) => {
        const newFeeHeadAmounts = { ...slab.feeHeadAmounts, [feeHeadId]: 0 };
        const totalPayable = Object.values(newFeeHeadAmounts).reduce((sum, amt) => sum + amt, 0);
        return {
          ...slab,
          feeHeadAmounts: newFeeHeadAmounts,
          payableAmount: totalPayable,
        };
      });

      return {
        ...prev,
        feeComponents: updatedComponents,
        concessionSlabs: updatedSlabs,
      };
    });
  };

  const handleAddComponent = () => {
    if (!selectedFeeHeadId) {
      alert("Please select a fee head");
      return;
    }

    addComponent(Number(selectedFeeHeadId));
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

      // Initialize fee head amounts - user will set these in Step 2
      const feeHeadAmounts: { [key: number]: number } = {};
      prev.feeComponents.forEach((component) => {
        feeHeadAmounts[component.id] = 0; // Initialize with 0, user sets amounts
      });

      const newSlab: ConcessionSlabUI = {
        id: selectedSlab.id!,
        name: selectedSlab.name,
        defaultConcessionRate: concessionRate,
        concessionAmount: 0,
        payableAmount: 0,
        feeHeadAmounts,
        isNewlyAdded: true,
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
    if (feeStructureRow.feeComponents.length === 0) issues.push("No fee heads selected");
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

  const handleSave = async () => {
    if (!onSave) {
      onClose();
      return;
    }

    // Validate required fields
    if (!selectedAcademicYear) {
      toast.error("Please select an Academic Year");
      return;
    }
    if (!selectedReceiptType) {
      toast.error("Please select a Receipt Type");
      return;
    }
    if (!selectedClass) {
      toast.error("Please select a Class");
      return;
    }
    if (feeStructureRow.programs.length === 0) {
      toast.error("Please select at least one Program Course");
      return;
    }
    if (feeStructureRow.shifts.length === 0) {
      toast.error("Please select at least one Shift");
      return;
    }
    if (feeStructureRow.feeComponents.length === 0) {
      toast.error("Please add at least one Fee Component");
      return;
    }

    setSaving(true);

    // Map slabs to feeStructureSlabs format expected by backend
    // Backend expects only feeSlabId and concessionRate (feeStructureId is set by backend)
    const feeStructureSlabs = feeStructureRow.concessionSlabs.map((slab) => {
      if (!slab.id) {
        throw new Error(`Fee slab ID not found for: ${slab.name}`);
      }
      return {
        feeSlabId: slab.id,
        concessionRate: slab.defaultConcessionRate ?? 0,
      };
    });

    // Debug logging
    console.log("Fee Structure Slabs being sent:", feeStructureSlabs);
    console.log("Concession Slabs in state:", feeStructureRow.concessionSlabs);

    // Create components for each (feeHead × slab) combination
    // If 3 fee heads and 3 slabs are selected, this creates 3 × 3 = 9 components
    const components: Omit<FeeStructureComponentT, "id" | "createdAt" | "updatedAt">[] = [];

    for (const slab of feeStructureRow.concessionSlabs) {
      for (const feeHead of feeStructureRow.feeComponents) {
        const amount = slab.feeHeadAmounts?.[feeHead.id] || 0;
        components.push({
          feeStructureId: feeStructure?.id || 0, // Use existing ID in edit mode
          feeHeadId: feeHead.id,
          feeSlabId: slab.id, // Link to the slab
          amount: amount, // Amount specific to this slab × fee head combination
          remarks: null,
        });
      }
    }

    // Map UI data to CreateFeeStructureDto
    const createFeeStructureDto: CreateFeeStructureDto = {
      receiptTypeId: Number(selectedReceiptType),
      academicYearId: Number(selectedAcademicYear),
      classId: Number(selectedClass),
      components,
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
      // Always include feeStructureSlabs as an array (even if empty)
      feeStructureSlabs,
      installments: [], // Can be added later if needed
      closingDate: null,
      startDate: null,
      endDate: null,
      onlineStartDate: null,
      onlineEndDate: null,
      numberOfInstallments: null,
      advanceForClassId: null,
    };

    // Debug logging for the full DTO
    console.log("Full CreateFeeStructureDto being sent:", JSON.stringify(createFeeStructureDto, null, 2));

    try {
      await onSave(createFeeStructureDto);
      toast.success("Fee structure saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast.error("Failed to save fee structure. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!feeStructure?.id) {
      toast.error("No fee structure selected");
      return;
    }

    setIsPublishing(true);
    try {
      await updateFeesStructure(feeStructure.id, { isPublished: true });
      toast.success("Fee structure published successfully");
      onClose();
      // Trigger a refresh
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error publishing fee structure:", error);
      toast.error("Failed to publish fee structure. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!feeStructure?.id) {
      toast.error("No fee structure selected");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFeesStructure(feeStructure.id);
      toast.success("Fee structure deleted successfully");
      setShowDeleteDialog(false);
      onClose();
      // Trigger a refresh
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast.error("Failed to delete fee structure. Please try again.");
    } finally {
      setIsDeleting(false);
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
                            <Select
                              disabled={!!feeStructure}
                              value={selectedAcademicYear}
                              onValueChange={setSelectedAcademicYear}
                            >
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
                            <Select disabled={!!feeStructure} value={selectedClass} onValueChange={setSelectedClass}>
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
                            <Select
                              disabled={!!feeStructure}
                              value={selectedReceiptType}
                              onValueChange={setSelectedReceiptType}
                            >
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
                          <TableHead className="w-[200px] border-r-2 border-gray-400 p-2 relative text-center whitespace-nowrap">
                            <Select
                              disabled={!!feeStructure}
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
                              disabled={!!feeStructure}
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
                          disabled={!!feeStructure}
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
            <div className="flex-1 min-h-0 overflow-hidden mt-6 flex flex-col space-y-4">
              {/* Fee Structure Components Section */}
              <div className="flex flex-col space-y-3 min-h-0">
                <div
                  className={`flex items-center justify-between flex-shrink-0 px-4 py-3 rounded-md transition-colors ${
                    activeSection === "components"
                      ? "bg-green-100 text-green-900 border-2 border-green-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <h3 className="text-lg font-semibold">Step 1 : Select Fee Head / Components</h3>
                  <div className="flex gap-2">
                    {isCreateMode && activeSection === "components" && (
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
                        className="h-8 bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
                        disabled={
                          feeHeads.filter((head) => !feeStructureRow.feeComponents.some((fc) => fc.id === head.id))
                            .length === 0
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Component
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (feeStructureRow.feeComponents.length > 0) {
                          setActiveSection(activeSection === "components" ? "slabs" : "components");
                        }
                      }}
                      disabled={feeStructureRow.feeComponents.length === 0 && activeSection === "components"}
                      className={`h-8 ${
                        activeSection === "components"
                          ? "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
                          : "bg-green-700 hover:bg-green-800 text-white"
                      }`}
                    >
                      {activeSection === "components" ? "Save" : "Show Components"}
                    </Button>
                  </div>
                </div>
                {activeSection === "components" && (
                  <div className="flex-1 overflow-hidden border-2 border-gray-400 rounded flex flex-col min-h-0">
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
                            {isCreateMode && (
                              <TableHead className="w-[80px] p-2 text-center text-base font-semibold whitespace-nowrap">
                                Action
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody className="border-b-2 border-gray-400">
                          {feeStructureRow.feeComponents.length === 0 ? (
                            <TableRow className="border-b-2 border-gray-400">
                              <TableCell colSpan={3} className="text-center text-gray-500 py-8 min-h-[100px]">
                                No fee heads selected. Click "Add Component" to select fee heads.
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
                                      disabled={!!feeStructure}
                                      onValueChange={(value) => {
                                        const newFeeHeadId = Number(value);
                                        const newFeeHead = feeHeads.find((h) => h.id === newFeeHeadId);
                                        if (
                                          newFeeHead &&
                                          !feeStructureRow.feeComponents.some(
                                            (fc) => fc.id === newFeeHeadId && fc.id !== component.id,
                                          )
                                        ) {
                                          setFeeStructureRow((prev) => ({
                                            ...prev,
                                            feeComponents: prev.feeComponents.map((comp, idx) =>
                                              idx === index
                                                ? {
                                                    ...comp,
                                                    id: newFeeHeadId,
                                                    name: newFeeHead.name,
                                                    amount: 0,
                                                    percentage: 0,
                                                  }
                                                : comp,
                                            ),
                                          }));
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-sm w-full">
                                        <SelectValue placeholder="Select Fee Head" />
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
                                  {isCreateMode && (
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
                                  )}
                                </TableRow>
                              ))}
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              {/* Concession Slabs Section */}
              <div
                className={`flex flex-col space-y-3 min-h-0 ${feeStructureRow.feeComponents.length === 0 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div
                  className={`flex items-center justify-between flex-shrink-0 px-4 py-3 rounded-md transition-colors ${
                    activeSection === "slabs"
                      ? "bg-green-100 text-green-900 border-2 border-green-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <h3 className="text-lg font-semibold">Step 2 : Concession Slabs</h3>
                  <div className="flex gap-2">
                    {activeSection === "slabs" && feeStructureRow.feeComponents.length > 0 && (
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
                        className="h-8 bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
                        disabled={
                          feeConcessionSlabs.filter(
                            (fcs) => !feeStructureRow.concessionSlabs.some((cs) => cs.id === fcs.id),
                          ).length === 0
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slab
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (feeStructureRow.feeComponents.length > 0) {
                          setActiveSection(activeSection === "slabs" ? "components" : "slabs");
                        }
                      }}
                      disabled={feeStructureRow.feeComponents.length === 0}
                      className={`h-8 ${
                        activeSection === "slabs"
                          ? "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
                          : "bg-green-700 hover:bg-green-800 text-white"
                      }`}
                    >
                      {activeSection === "slabs" ? "Save" : "Show Slabs"}
                    </Button>
                  </div>
                </div>
                {activeSection === "slabs" && (
                  <div className="flex-1 overflow-hidden border-2 border-gray-400 rounded flex flex-col min-h-0">
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                            <TableHead className="w-[60px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap sticky left-0 bg-gray-100 z-10">
                              Sr. No
                            </TableHead>
                            <TableHead className="min-w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap sticky left-[60px] bg-gray-100 z-10">
                              Fee Slab
                            </TableHead>
                            <TableHead className="min-w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                              Fee Category
                            </TableHead>
                            {feeStructureRow.feeComponents.map((component) => (
                              <TableHead
                                key={component.id}
                                className="min-w-[120px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap"
                              >
                                {component.name}
                              </TableHead>
                            ))}
                            <TableHead className="min-w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                              Total Payable
                            </TableHead>
                            <TableHead className="min-w-[120px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap">
                              Allocation %
                            </TableHead>
                            {isCreateMode && (
                              <TableHead className="w-[80px] p-2 text-center text-base font-semibold whitespace-nowrap sticky right-0 bg-gray-100 z-10">
                                Action
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody className="border-b-2 border-gray-400">
                          {feeStructureRow.feeComponents.length === 0 ? (
                            <TableRow className="border-b-2 border-gray-400">
                              <TableCell colSpan={5} className="text-center text-gray-500 py-8 min-h-[100px]">
                                Please add fee components first before adding slabs.
                              </TableCell>
                            </TableRow>
                          ) : feeStructureRow.concessionSlabs.length === 0 ? (
                            <TableRow className="border-b-2 border-gray-400">
                              <TableCell
                                colSpan={3 + feeStructureRow.feeComponents.length + 2}
                                className="text-center text-gray-500 py-8 min-h-[100px]"
                              >
                                No concession slabs added. Click "Add Slab" to add concession slabs.
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              {feeStructureRow.concessionSlabs.map((slab, index) => {
                                const totalPayable = feeStructureRow.feeComponents.reduce((sum, component) => {
                                  return sum + (slab.feeHeadAmounts?.[component.id] || 0);
                                }, 0);

                                // Calculate allocation percentage
                                const slabF = feeStructureRow.concessionSlabs.find(
                                  (s) => s.name.toUpperCase() === "SLAB F",
                                );
                                const slabFTotal = slabF
                                  ? Object.values(slabF.feeHeadAmounts || {}).reduce((sum, amt) => sum + amt, 0)
                                  : 0;
                                const allocation =
                                  slab.name.toUpperCase() === "SLAB F"
                                    ? 100
                                    : slabFTotal > 0
                                      ? (totalPayable / slabFTotal) * 100
                                      : 0;

                                return (
                                  <TableRow key={slab.id} className="border-b-2 border-gray-400">
                                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px] sticky left-0 bg-white">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px] sticky left-[60px] bg-white">
                                      {slab.name.toUpperCase() === "SLAB F" ? (
                                        <div className="text-sm font-semibold text-gray-900 py-1">{slab.name}</div>
                                      ) : (
                                        <Select
                                          value={String(slab.id)}
                                          disabled={
                                            !!feeStructure && // we're in edit mode
                                            slab.isNewlyAdded !== true // AND it's NOT a newly added slab
                                          }
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
                                                // Initialize fee head amounts based on concession rate
                                                const feeHeadAmounts: { [key: number]: number } = {};
                                                prev.feeComponents.forEach((component) => {
                                                  const concessionAmount = Math.round(
                                                    (component.amount * concessionRate) / 100,
                                                  );
                                                  feeHeadAmounts[component.id] = component.amount - concessionAmount;
                                                });
                                                const totalPayable = Object.values(feeHeadAmounts).reduce(
                                                  (sum, amt) => sum + amt,
                                                  0,
                                                );
                                                const concessionAmount = Math.round(
                                                  (prev.amount * concessionRate) / 100,
                                                );

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
                                                          payableAmount: totalPayable,
                                                          feeHeadAmounts,
                                                        }
                                                      : s,
                                                  ),
                                                };
                                              });
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="h-8 text-sm w-full">
                                            <SelectValue placeholder="Select Slab" />
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
                                      )}
                                    </TableCell>

                                    {/* Fee Category Badge */}
                                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                                        {getFeeCategoryFromSlabId(slab.id)}
                                      </Badge>
                                    </TableCell>

                                    {/* Dynamic columns for each fee head */}
                                    {feeStructureRow.feeComponents.map((component) => (
                                      <TableCell
                                        key={component.id}
                                        className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]"
                                      >
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="text-gray-900 font-medium">₹</span>
                                          <Input
                                            type="number"
                                            value={Number((slab.feeHeadAmounts?.[component.id] || 0).toFixed(2))}
                                            onChange={(e) => {
                                              const newAmount = parseFloat(e.target.value) || 0;
                                              // Only apply Slab F limit to non-Slab F slabs
                                              let finalAmount = newAmount;
                                              if (slab.name.toUpperCase() !== "SLAB F") {
                                                const slabF = feeStructureRow.concessionSlabs.find(
                                                  (s) => s.name.toUpperCase() === "SLAB F",
                                                );
                                                const slabFAmount = slabF?.feeHeadAmounts?.[component.id] || 0;
                                                finalAmount = Math.min(newAmount, slabFAmount);
                                              }
                                              setFeeStructureRow((prev) => ({
                                                ...prev,
                                                concessionSlabs: prev.concessionSlabs.map((s, idx) =>
                                                  idx === index
                                                    ? {
                                                        ...s,
                                                        feeHeadAmounts: {
                                                          ...s.feeHeadAmounts,
                                                          [component.id]: finalAmount,
                                                        },
                                                      }
                                                    : s,
                                                ),
                                              }));
                                            }}
                                            className="w-full h-8 text-sm text-center"
                                            min="0"
                                            step="0.01"
                                          />
                                        </div>
                                      </TableCell>
                                    ))}

                                    {/* Total Payable */}
                                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px] font-semibold">
                                      ₹{totalPayable.toLocaleString()}
                                    </TableCell>

                                    {/* Allocation */}
                                    <TableCell className="text-center border-r-2 border-gray-400 p-2 min-h-[60px]">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="text-gray-900 font-semibold">{allocation.toFixed(2)}%</span>
                                      </div>
                                    </TableCell>

                                    {/* Action */}
                                    {isCreateMode && (
                                      <TableCell className="text-center p-2 min-h-[60px] sticky right-0 bg-white">
                                        {slab.name.toUpperCase() !== "SLAB F" ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSlab(index)}
                                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-gray-400">Default</span>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={openPreview}
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={
                  !selectedClass ||
                  !selectedReceiptType ||
                  feeStructureRow.programs.length === 0 ||
                  feeStructureRow.shifts.length === 0 ||
                  feeStructureRow.feeComponents.length === 0 ||
                  feeStructureRow.concessionSlabs.length === 0
                }
              >
                Preview Structure
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {feeStructure?.id && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting || saving || hasPaidMappings}
                  title={hasPaidMappings ? "Cannot delete: Some students have already paid." : "Delete"}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving || isPublishing || isDeleting}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  saving ||
                  isPublishing ||
                  isDeleting ||
                  feeStructureRow.feeComponents.length === 0 ||
                  (validationResult !== null && !validationResult.isUnique)
                }
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
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
                        await validateUniqueness(newPage);
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
                        await validateUniqueness(newPage);
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

            {/* Fee Components Table - Slabs as Rows */}
            {feeStructureRow.feeComponents.length > 0 && feeStructureRow.concessionSlabs.length > 0 && (
              <div className="border-2 border-gray-400 rounded overflow-hidden">
                {/* Fee Components Header */}
                <div className="bg-gray-100 border-b-2 border-gray-400 p-3">
                  <h3 className="text-lg font-semibold text-gray-900">Fee Components</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b-2 border-gray-400 bg-gray-100">
                        <TableHead className="w-[80px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-gray-50">
                          Sr. No
                        </TableHead>
                        <TableHead className="min-w-[180px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-gray-50">
                          Slab
                        </TableHead>
                        {feeStructureRow.feeComponents.map((component, componentIndex) => (
                          <TableHead
                            key={component.id}
                            className="min-w-[140px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor:
                                componentIndex % 5 === 0
                                  ? "#fef3c7" // yellow-100
                                  : componentIndex % 5 === 1
                                    ? "#fce7f3" // pink-100
                                    : componentIndex % 5 === 2
                                      ? "#dbeafe" // blue-100
                                      : componentIndex % 5 === 3
                                        ? "#e0e7ff" // indigo-100
                                        : "#dcfce7", // green-100
                            }}
                          >
                            {component.name}
                          </TableHead>
                        ))}
                        <TableHead className="min-w-[150px] border-r-2 border-gray-400 p-2 text-center text-base font-semibold whitespace-nowrap bg-blue-50">
                          Total Payable
                        </TableHead>
                        <TableHead className="min-w-[120px] p-2 text-center text-base font-semibold whitespace-nowrap bg-yellow-50">
                          Allocation
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructureRow.concessionSlabs.map((slab, slabIndex) => {
                        const totalPayable = feeStructureRow.feeComponents.reduce((sum, component) => {
                          return sum + (slab.feeHeadAmounts?.[component.id] || 0);
                        }, 0);

                        // Calculate allocation percentage
                        const slabF = feeStructureRow.concessionSlabs.find((s) => s.name.toUpperCase() === "SLAB F");
                        const slabFTotal = slabF
                          ? Object.values(slabF.feeHeadAmounts || {}).reduce((sum, amt) => sum + amt, 0)
                          : 0;
                        const allocation =
                          slab.name.toUpperCase() === "SLAB F"
                            ? 100
                            : slabFTotal > 0
                              ? (totalPayable / slabFTotal) * 100
                              : 0;

                        return (
                          <TableRow
                            key={slab.id}
                            className="border-b-2 border-gray-400"
                            style={{
                              backgroundColor: slabIndex % 2 === 0 ? "#f9fafb" : "#ffffff",
                            }}
                          >
                            <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-gray-50">
                              {slabIndex + 1}
                            </TableCell>
                            <TableCell className="text-center border-r-2 border-gray-400 p-2 font-medium bg-gray-50">
                              {slab.name}
                              {slab.defaultConcessionRate > 0 && (
                                <span className="text-xs text-gray-600 ml-1">
                                  ({slab.defaultConcessionRate.toFixed(0)}%)
                                </span>
                              )}
                            </TableCell>
                            {feeStructureRow.feeComponents.map((component, componentIndex) => (
                              <TableCell
                                key={component.id}
                                className="text-center border-r-2 border-gray-400 p-2 font-semibold"
                                style={{
                                  backgroundColor:
                                    componentIndex % 5 === 0
                                      ? "#fef3c7" // yellow-100
                                      : componentIndex % 5 === 1
                                        ? "#fce7f3" // pink-100
                                        : componentIndex % 5 === 2
                                          ? "#dbeafe" // blue-100
                                          : componentIndex % 5 === 3
                                            ? "#e0e7ff" // indigo-100
                                            : "#dcfce7", // green-100
                                }}
                              >
                                ₹
                                {(slab.feeHeadAmounts?.[component.id] || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            ))}
                            <TableCell className="text-center border-r-2 border-gray-400 p-2 font-bold bg-blue-50">
                              ₹
                              {totalPayable.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-center p-2 font-semibold bg-yellow-50">
                              {allocation.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
                feeStructureRow.feeComponents.length === 0 ||
                (validationResult !== null && !validationResult.isUnique)
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the fee structure
              {feeStructure?.id && ` (ID: ${feeStructure.id})`} and all associated data including components, concession
              slabs, and installments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeeStructureMaster;
