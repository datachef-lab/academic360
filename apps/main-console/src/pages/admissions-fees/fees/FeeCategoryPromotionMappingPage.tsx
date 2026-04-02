// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link2, Trash2, Upload, Download, Loader2, Pencil } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/hooks/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { useFeeCategories, useFeeGroups } from "@/hooks/useFees";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { FeeGroupPromotionMappingDto } from "@repo/db/dtos/fees";
import { toast } from "sonner";
import { NewFeeGroupPromotionMapping, BulkUploadResult, BulkUploadRow } from "@/services/fees-api";
import {
  useFeeGroupPromotionMappings,
  useCreateFeeGroupPromotionMapping,
  useUpdateFeeGroupPromotionMapping,
  useDeleteFeeGroupPromotionMapping,
  useBulkUploadFeeGroupPromotionMappings,
} from "@/hooks/useFeeGroupPromotionMappings";
import { useError } from "@/hooks/useError";
import { PromotionDto } from "@repo/db/dtos/user";
import { getAcademicYears, getProgramCourses } from "@/services/course-design.api";
import { getAllReligions } from "@/services/religion.service";
import { getAllCategories } from "@/services/categories.service";
import { getAllClasses } from "@/services/classes.service";
import { findAdminsAndStaff } from "@/services/user";
import type { Community } from "@/types/enums";
import axiosInstance from "@/utils/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import type { ProgressUpdate } from "@/types/progress";

const FeeGroupPromotionMappingPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeGroupPromotionMappingDto | null>(null);
  const [editingItem, setEditingItem] = useState<FeeGroupPromotionMappingDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    feeGroupId: number | null;
    remarks: string;
    updatedByUserId: number | null;
  }>({ feeGroupId: null, remarks: "", updatedByUserId: null });
  const [adminStaffUsers, setAdminStaffUsers] = useState<
    { id: number; name: string; email: string; image: string | null; type?: string }[]
  >([]);
  const [approvalSearchText, setApprovalSearchText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [feeGroupTotalsById, setFeeGroupTotalsById] = useState<Record<number, number>>({});
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadResult | null>(null);
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semesterOrClassOptions, setSemesterOrClassOptions] = useState<string[]>([]);
  const [programCourseOptions, setProgramCourseOptions] = useState<string[]>([]);
  const [shiftOptions, setShiftOptions] = useState<string[]>([]);
  const [religionOptions, setReligionOptions] = useState<string[]>([]);
  const [communityOptions] = useState<Community[]>(["GUJARATI", "NON-GUJARATI"]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    academicYear: string;
    semesterOrClass: string;
    programCourse: string;
    shift: string;
    religion: string;
    community: string;
    category: string;
    feeCategory: string;
  }>({
    academicYear: "",
    semesterOrClass: "",
    programCourse: "",
    shift: "",
    religion: "",
    community: "",
    category: "",
    feeCategory: "",
  });
  const { showError } = useError();
  const { feeCategories } = useFeeCategories();
  const { feeGroups } = useFeeGroups();
  const { currentAcademicYear } = useAcademicYear();

  // Only fetch when user has applied at least one filter
  const hasFilters =
    !!filters.academicYear ||
    !!filters.semesterOrClass ||
    !!filters.programCourse ||
    !!filters.shift ||
    !!filters.religion ||
    !!filters.community ||
    !!filters.category ||
    !!filters.feeCategory;

  const {
    data: mappings = [],
    isLoading: loading,
    refetch: refetchMappings,
  } = useFeeGroupPromotionMappings(10000, hasFilters);
  const createMutation = useCreateFeeGroupPromotionMapping();
  const updateMutation = useUpdateFeeGroupPromotionMapping();
  const deleteMutation = useDeleteFeeGroupPromotionMapping();
  const bulkUploadMutation = useBulkUploadFeeGroupPromotionMappings();

  // Socket connection for bulk upload progress (same pattern as reports page)
  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      if (currentOperation && data?.meta?.operation && data.meta.operation !== currentOperation) {
        return;
      }
      setCurrentProgressUpdate(data);
      if (data.status === "completed") {
        setIsBulkUploading(false);
        setExportProgressOpen(false);
        setCurrentOperation(null);
        refetchMappings();
      } else if (data.status === "error") {
        setIsBulkUploading(false);
        setExportProgressOpen(false);
        setCurrentOperation(null);
      }
    },
    [currentOperation, refetchMappings],
  );

  const { socket, isConnected } = useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  // Listen for fee group promotion mapping socket events (only for staff/admin)
  useEffect(() => {
    if (!socket || !isConnected || (user?.type !== "ADMIN" && user?.type !== "STAFF")) return;

    const handleFeeGroupPromotionMappingCreated = (data: {
      mappingId: number;
      type: string;
      message: string;
    }) => {
      console.log("[Fee Group Promotion Mapping Page] Mapping created:", data);
      // Silently refresh UI without showing toast
      refetchMappings();
    };

    const handleFeeGroupPromotionMappingUpdated = (data: {
      mappingId: number;
      type: string;
      message: string;
    }) => {
      console.log("[Fee Group Promotion Mapping Page] Mapping updated:", data);
      // Silently refresh UI without showing toast
      refetchMappings();
    };

    const handleFeeGroupPromotionMappingDeleted = (data: {
      mappingId: number;
      type: string;
      message: string;
    }) => {
      console.log("[Fee Group Promotion Mapping Page] Mapping deleted:", data);
      // Silently refresh UI without showing toast
      refetchMappings();
    };

    socket.on("fee_group_promotion_mapping_created", handleFeeGroupPromotionMappingCreated);
    socket.on("fee_group_promotion_mapping_updated", handleFeeGroupPromotionMappingUpdated);
    socket.on("fee_group_promotion_mapping_deleted", handleFeeGroupPromotionMappingDeleted);

    return () => {
      socket.off("fee_group_promotion_mapping_created", handleFeeGroupPromotionMappingCreated);
      socket.off("fee_group_promotion_mapping_updated", handleFeeGroupPromotionMappingUpdated);
      socket.off("fee_group_promotion_mapping_deleted", handleFeeGroupPromotionMappingDeleted);
    };
  }, [socket, isConnected, user?.type, refetchMappings]);

  const [form, setForm] = useState<{
    feeCategoryId: number | undefined;
    promotionId: number | undefined;
  }>({
    feeCategoryId: undefined,
    promotionId: undefined,
  });

  // Extract unique promotions from mappings

  // Disabled: No data by default - user must apply filters to load data.
  // Previously auto-applied academic year from currentAcademicYear.
  // useEffect(() => {
  //   const year = currentAcademicYear?.year;
  //   if (!year) return;
  //   if (filters.academicYear) return;
  //   if (academicYearOptions.includes(year)) {
  //     setFilters((prev) => ({ ...prev, academicYear: year }));
  //   }
  // }, [currentAcademicYear, filters.academicYear, academicYearOptions]);

  // Extract unique promotions from existing mappings
  useEffect(() => {
    if (mappings.length > 0) {
      const uniquePromotions = new Map<number, PromotionDto>();
      mappings.forEach((mapping) => {
        if (mapping.promotion && mapping.promotion.id) {
          uniquePromotions.set(mapping.promotion.id, mapping.promotion);
        }
      });
      setPromotions(Array.from(uniquePromotions.values()));
    }
  }, [mappings]);

  // NOTE:
  // Do NOT auto-apply an academic year filter on initial load.
  // This ensures that, by default, all mappings are visible even if
  // the academic year name format differs between the global state
  // and the promotion DTOs.

  // Fetch filter dropdown data from backend APIs
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Academic years
        const academicYears = await getAcademicYears();
        if (Array.isArray(academicYears)) {
          setAcademicYearOptions(
            academicYears
              .map((y: any) => y.year || y.name)
              .filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Classes / semesters
        const classes = await getAllClasses();
        if (Array.isArray(classes)) {
          setSemesterOrClassOptions(
            classes
              .map((c: any) => c.name)
              .filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Program courses
        const programCourses = await getProgramCourses();
        if (Array.isArray(programCourses)) {
          setProgramCourseOptions(
            programCourses
              .map((pc: any) => pc.name)
              .filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Shifts
        const shiftsResponse = await axiosInstance.get("/api/v1/shifts");
        const shiftsData = Array.isArray(shiftsResponse.data?.payload)
          ? shiftsResponse.data.payload
          : Array.isArray(shiftsResponse.data)
            ? shiftsResponse.data
            : [];
        setShiftOptions(
          shiftsData
            .map((s: any) => s.name)
            .filter((v: unknown): v is string => typeof v === "string"),
        );

        // Religions
        const religions = await getAllReligions();
        if (Array.isArray(religions)) {
          setReligionOptions(
            religions
              .map((r: any) => r.name)
              .filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Social categories (SC / ST / OBC / etc.)
        const categories = await getAllCategories();
        if (Array.isArray(categories)) {
          setCategoryOptions(
            categories
              .map((c: any) => c.name)
              .filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Community & semester/class options are still derived from existing mappings,
        // because there are no dedicated masters for them exposed in the frontend yet.
        // We keep them wired from mappings via the memo below.
      } catch (error) {
        console.error("Error loading filter dropdown data:", error);
        showError({ message: "Failed to load filter options" });
      }
    };

    loadFilterData();
  }, [showError]);

  // Helper function to get promotion display text
  const getPromotionDisplayText = (promotion: PromotionDto | null | undefined): string => {
    if (!promotion) return "-";
    // Use classRollNumber or rollNumber as identifier
    return promotion.classRollNumber || promotion.rollNumber || `ID: ${promotion.id}`;
  };

  const filterOptions = useMemo(() => {
    const academicYears = new Set<string>();
    const semestersOrClasses = new Set<string>();
    const programCourses = new Set<string>();
    const religions = new Set<string>();
    const communities = new Set<string>();
    const categories = new Set<string>();

    mappings.forEach((mapping) => {
      const promo: any = mapping.promotion || {};
      const academicYearName = promo.academicYearName || promo.session?.name;
      const semesterName = promo.class?.name;
      const religionName = promo.religionName;
      const categoryName = promo.categoryName;
      const communityName = promo.communityName || promo.community;
      const programCourseName = promo.programCourse?.name;

      if (academicYearName) academicYears.add(academicYearName);
      if (semesterName) semestersOrClasses.add(semesterName);
      if (programCourseName) programCourses.add(programCourseName);
      if (religionName) religions.add(religionName);
      if (categoryName) categories.add(categoryName);
      if (communityName) communities.add(communityName);
    });

    return {
      academicYears:
        academicYearOptions.length > 0 ? academicYearOptions : Array.from(academicYears),
      semestersOrClasses:
        semesterOrClassOptions.length > 0 ? semesterOrClassOptions : Array.from(semestersOrClasses),
      programCourses:
        programCourseOptions.length > 0 ? programCourseOptions : Array.from(programCourses),
      religions: religionOptions.length > 0 ? religionOptions : Array.from(religions),
      communities: communityOptions.length > 0 ? communityOptions : Array.from(communities),
      categories: categoryOptions.length > 0 ? categoryOptions : Array.from(categories),
      shifts: shiftOptions,
    };
  }, [
    mappings,
    academicYearOptions,
    semesterOrClassOptions,
    programCourseOptions,
    religionOptions,
    communityOptions,
    categoryOptions,
  ]);

  // Pre-compute counts of mappings per promotion for delete-visibility logic
  const promotionMappingCounts = useMemo(() => {
    const counts = new Map<number, number>();
    mappings.forEach((m) => {
      const pid = m.promotion?.id;
      if (!pid) return;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    });
    return counts;
  }, [mappings]);

  const matchesFilters = (mapping: FeeGroupPromotionMappingDto) => {
    const promo: any = mapping.promotion || {};
    const academicYearName = promo.academicYearName || promo.session?.name || "";
    const semesterName = promo.class?.name || "";
    const programCourseName = promo.programCourse?.name || "";
    const shiftName = promo.shift?.name || promo.shiftName || "";
    const religionName = promo.religionName || "";
    const categoryName = promo.categoryName || "";
    const communityName = promo.communityName || promo.community || "";

    if (filters.academicYear && academicYearName !== filters.academicYear) return false;
    if (filters.semesterOrClass && semesterName !== filters.semesterOrClass) return false;
    if (filters.programCourse && programCourseName !== filters.programCourse) return false;
    if (filters.shift && shiftName !== filters.shift) return false;
    if (filters.religion && religionName !== filters.religion) return false;
    if (filters.category && categoryName !== filters.category) return false;
    if (filters.community && communityName !== filters.community) return false;
    if (
      filters.feeCategory &&
      mapping.feeGroup?.feeCategory?.name !== filters.feeCategory &&
      mapping.feeCategory?.name !== filters.feeCategory
    )
      return false;

    return true;
  };

  // Filter mappings based on search text and selected filters
  const filteredMappings =
    mappings?.filter((mapping) => {
      if (!searchText.trim()) {
        return matchesFilters(mapping);
      }

      const searchLower = searchText.toLowerCase();
      const promo: any = mapping.promotion || {};
      const studentName = (promo.studentName || promo.name || "").toLowerCase();
      const uid = (promo.uid || promo.studentUid || "").toLowerCase();
      const classRollNumber = (promo.classRollNumber || "").toLowerCase();
      const rollNumber = (promo.rollNumber || "").toLowerCase();
      const programCourseName = (promo.programCourse?.name || "").toLowerCase();
      const semesterName = (promo.class?.name || "").toLowerCase();
      const shiftName = (promo.shift?.name || "").toLowerCase();
      const categoryName = (promo.categoryName || "").toLowerCase();
      const religionName = (promo.religionName || "").toLowerCase();
      const feeCategoryName = (
        mapping.feeGroup?.feeCategory?.name ||
        mapping.feeCategory?.name ||
        ""
      ).toLowerCase();
      const feeSlabName = (mapping.feeGroup?.feeSlab?.name || "").toLowerCase();
      const mappingId = mapping.id?.toString() || "";

      const matchesSearch =
        studentName.includes(searchLower) ||
        uid.includes(searchLower) ||
        classRollNumber.includes(searchLower) ||
        rollNumber.includes(searchLower) ||
        programCourseName.includes(searchLower) ||
        semesterName.includes(searchLower) ||
        shiftName.includes(searchLower) ||
        categoryName.includes(searchLower) ||
        religionName.includes(searchLower) ||
        feeCategoryName.includes(searchLower) ||
        feeSlabName.includes(searchLower) ||
        mappingId.includes(searchText);

      return matchesSearch && matchesFilters(mapping);
    }) || [];

  const totalPages = Math.max(1, Math.ceil(filteredMappings.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedMappings = filteredMappings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const allSelectedOnPage =
    paginatedMappings.length > 0 &&
    paginatedMappings.every((m) => m.id && selectedIds.includes(m.id));

  const toggleSelectAllOnPage = (checked: boolean | string) => {
    const idsOnPage = paginatedMappings
      .map((m) => m.id)
      .filter((id): id is number => typeof id === "number");

    if (!idsOnPage.length) return;

    if (checked) {
      const merged = new Set<number>([...selectedIds, ...idsOnPage]);
      setSelectedIds(Array.from(merged));
    } else {
      setSelectedIds(selectedIds.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const toggleOne = (id: number | undefined, checked: boolean | string) => {
    if (!id) return;
    if (checked) {
      if (!selectedIds.includes(id)) {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      academicYear: "",
      semesterOrClass: "",
      programCourse: "",
      shift: "",
      religion: "",
      community: "",
      category: "",
      feeCategory: "",
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      feeCategoryId: undefined,
      promotionId: undefined,
    });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        UID: "",
        "Student Name": "",
        "Program Course Name": "",
        "Academic Year": "",
        Semester: "",
        Shift: "",
        "Fee Slab": "",
        "Fee Category": "",
        "Approved By User Email": "",
        "Approved Timestamp": "",
        Remarks: "",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // UID
      { wch: 25 }, // Student Name
      { wch: 25 }, // Program Course Name
      { wch: 15 }, // Academic Year
      { wch: 15 }, // Semester
      { wch: 15 }, // Shift
      { wch: 20 }, // Fee Slab
      { wch: 20 }, // Fee Category
      { wch: 30 }, // Approved By User Email
      { wch: 22 }, // Approved Timestamp
      { wch: 30 }, // Remarks
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "fee-group-promotion-mapping-template.xlsx");
  };

  const REQUIRED_BULK_UPLOAD_COLUMNS = [
    "UID",
    "Student Name",
    "Program Course Name",
    "Academic Year",
    "Semester",
    "Shift",
    "Fee Slab",
    "Fee Category",
    "Approved By User Email",
    "Approved Timestamp",
  ] as const;

  const validateBulkUploadFile = async (
    file: File,
  ): Promise<{
    isValid: boolean;
    errors: Array<{ row: number; data: Record<string, string>; error: string }>;
    missingColumns: string[];
    data: Array<Record<string, string>>;
  }> => {
    const errors: Array<{ row: number; data: Record<string, string>; error: string }> = [];
    const missingColumns: string[] = [];
    const data: Array<Record<string, string>> = [];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames?.[0] ?? "Sheet1";
      const worksheet = workbook.Sheets?.[sheetName];
      if (!worksheet) {
        errors.push("Failed to read worksheet from Excel file");
        return { isValid: false, errors, missingColumns, data: [] };
      }
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet as XLSX.WorkSheet,
      );

      if (jsonData.length === 0) {
        errors.push({ row: 0, data: {}, error: "Excel file is empty" });
        return { isValid: false, errors, missingColumns, data: [] };
      }

      // Check required columns exist in first row
      const firstRowKeys = new Set(Object.keys(jsonData[0] || {}).map((k) => k.toString().trim()));
      for (const col of REQUIRED_BULK_UPLOAD_COLUMNS) {
        const found = [...firstRowKeys].some((k) => k.toLowerCase() === col.toLowerCase());
        if (!found) {
          missingColumns.push(col);
        }
      }
      if (missingColumns.length > 0) {
        errors.push({
          row: 0,
          data: {},
          error: `Missing required columns: ${missingColumns.join(", ")}`,
        });
        return { isValid: false, errors, missingColumns, data: [] };
      }

      // Map column names (case-insensitive)
      const getVal = (row: Record<string, unknown>, key: string): string =>
        (Object.entries(row).find(([k]) => k.trim().toLowerCase() === key.toLowerCase())?.[1] ?? "")
          .toString()
          .trim();

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2;
        const uid = getVal(row, "UID");
        const studentName = getVal(row, "Student Name");
        const programCourseName = getVal(row, "Program Course Name");
        const academicYear = getVal(row, "Academic Year");
        const semester = getVal(row, "Semester");
        const shift = getVal(row, "Shift");
        const feeSlab = getVal(row, "Fee Slab");
        const feeCategory = getVal(row, "Fee Category");
        const approvedByEmail = getVal(row, "Approved By User Email");
        const approvedTimestamp = getVal(row, "Approved Timestamp");
        const remarks = getVal(row, "Remarks");

        const missing: string[] = [];
        if (!uid) missing.push("UID");
        if (!studentName) missing.push("Student Name");
        if (!programCourseName) missing.push("Program Course Name");
        if (!academicYear) missing.push("Academic Year");
        if (!semester) missing.push("Semester");
        if (!shift) missing.push("Shift");
        if (!feeSlab) missing.push("Fee Slab");
        if (!feeCategory) missing.push("Fee Category");
        if (!approvedByEmail) missing.push("Approved By User Email");
        if (!approvedTimestamp) missing.push("Approved Timestamp");

        if (missing.length > 0) {
          errors.push({
            row: rowNumber,
            data: {
              UID: uid,
              "Student Name": studentName,
              "Program Course Name": programCourseName,
              "Academic Year": academicYear,
              Semester: semester,
              Shift: shift,
              "Fee Slab": feeSlab,
              "Fee Category": feeCategory,
              "Approved By User Email": approvedByEmail,
              "Approved Timestamp": approvedTimestamp,
              Remarks: remarks,
            },
            error: `Missing required fields: ${missing.join(", ")}`,
          });
          return;
        }

        data.push({
          UID: uid,
          "Student Name": studentName,
          "Program Course Name": programCourseName,
          "Academic Year": academicYear,
          Semester: semester,
          Shift: shift,
          "Fee Slab": feeSlab,
          "Fee Category": feeCategory,
          "Approved By User Email": approvedByEmail,
          "Approved Timestamp": approvedTimestamp,
          Remarks: remarks,
        });
      });

      return {
        isValid: errors.length === 0,
        errors,
        missingColumns,
        data,
      };
    } catch (error) {
      errors.push(
        `Failed to read Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { isValid: false, errors, missingColumns, data: [] };
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadResult(null);

    try {
      // Validate file
      const validation = await validateBulkUploadFile(bulkUploadFile);
      if (!validation.isValid) {
        const msg =
          validation.missingColumns.length > 0
            ? `Missing required columns: ${validation.missingColumns.join(", ")}`
            : `Validation failed: ${validation.errors.length} error(s) found`;
        toast.error(msg);
        setBulkUploadResult({
          summary: {
            total: validation.data.length + validation.errors.length,
            successful: 0,
            failed: validation.errors.length,
          },
          errors: validation.errors.map((e) => ({
            row: e.row,
            data: e.data as BulkUploadRow,
            error: e.error,
          })),
          success: [],
        });
        setIsBulkUploading(false);
        return;
      }

      setCurrentOperation("fee_group_promotion_bulk_upload");
      setExportProgressOpen(true);
      setCurrentProgressUpdate({
        id: `bulk_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Starting bulk upload...",
        progress: 0,
        status: "started",
        createdAt: new Date(),
        meta: { operation: "fee_group_promotion_bulk_upload" },
      });

      const formData = new FormData();
      formData.append("file", bulkUploadFile);

      const response = await axiosInstance.post<{
        status: string;
        payload: BulkUploadResult;
        message: string;
      }>(`/api/v1/fees/group-promotion-mappings/bulk-upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const result = response.data.payload;

      if (result) {
        setBulkUploadResult(result);
        if (result.summary.failed > 0 && result.summary.successful > 0) {
          toast.warning(
            `Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
          );
        } else if (result.summary.failed === 0) {
          toast.success(`Bulk upload completed: ${result.summary.successful} mappings created`);
        }
        refetchMappings();
      }
    } catch (error) {
      console.error("Error uploading bulk mappings:", error);
      setIsBulkUploading(false);
      setExportProgressOpen(false);
      setCurrentOperation(null);
      toast.error(
        `Bulk upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleEditClick = (mapping: FeeGroupPromotionMappingDto) => {
    setEditingItem(mapping);
    const mappingAny = mapping as { updatedByUserId?: number | null };
    setEditForm({
      feeGroupId: mapping.feeGroup?.id ?? null,
      remarks: mapping.remarks ?? "",
      updatedByUserId: mappingAny?.updatedByUserId ?? null,
    });
    setEditDialogOpen(true);
  };

  // Load admin/staff users when edit dialog opens
  useEffect(() => {
    if (editDialogOpen) {
      setApprovalSearchText("");
      findAdminsAndStaff(1, 200).then((users) => {
        setAdminStaffUsers(
          users.map((u) => ({
            id: u.id as number,
            name: u.name,
            email: u.email,
            image: u.image ?? null,
            type: (u as { type?: string }).type,
          })),
        );
      });
    }
  }, [editDialogOpen]);

  // Load fee-group totals (amount) for slab dropdown
  useEffect(() => {
    const promotionId = editingItem?.promotion?.id;
    if (!editDialogOpen || !promotionId) {
      setFeeGroupTotalsById({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/fees/groups/promotion/${promotionId}/totals`);
        const payload = Array.isArray(res.data?.payload) ? res.data.payload : [];
        const map: Record<number, number> = {};
        payload.forEach((row: any) => {
          if (typeof row?.feeGroupId === "number") {
            map[row.feeGroupId] = Number(row?.totalPayable ?? 0);
          }
        });
        if (!cancelled) setFeeGroupTotalsById(map);
      } catch (e) {
        if (!cancelled) setFeeGroupTotalsById({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editDialogOpen, editingItem?.promotion?.id]);

  const filteredAdminStaffUsers = useMemo(() => {
    if (!approvalSearchText.trim()) return adminStaffUsers;
    const q = approvalSearchText.toLowerCase().trim();
    return adminStaffUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.type?.toLowerCase().includes(q) ?? false),
    );
  }, [adminStaffUsers, approvalSearchText]);

  /** Linked payment status SUCCESS — read-only dialog (Okay only) */
  const isEditSaveHidden = editingItem?.saveBlockedForEdit === true;

  const editDialogSlabTotal = useMemo(() => {
    const fgId = editForm.feeGroupId ?? editingItem?.feeGroup?.id ?? null;
    if (fgId == null) return null;
    const v = feeGroupTotalsById[fgId];
    return typeof v === "number" ? v : null;
  }, [editForm.feeGroupId, editingItem?.feeGroup?.id, feeGroupTotalsById]);

  /** Sum from fee_student_mappings, else slab total for mapped fee group */
  const editReadOnlyTotalPayable = useMemo(() => {
    const tp = editingItem?.totalPayableAmount;
    if (tp != null && tp > 0) return tp;
    const fgId = editingItem?.feeGroup?.id;
    if (fgId != null && typeof feeGroupTotalsById[fgId] === "number") {
      return feeGroupTotalsById[fgId] as number;
    }
    return null;
  }, [editingItem?.totalPayableAmount, editingItem?.feeGroup?.id, feeGroupTotalsById]);

  const handleEditSave = async () => {
    if (!editingItem?.id || !editForm.feeGroupId) {
      toast.error("Please select a slab type");
      return;
    }
    if (editingItem?.saveBlockedForEdit) {
      toast.error("Cannot save: a successful payment is already recorded for this mapping.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        data: {
          feeGroupId: editForm.feeGroupId,
          remarks: editForm.remarks || undefined,
          updatedByUserId: editForm.updatedByUserId ?? undefined,
        },
      });
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch {
      // Error handled by mutation
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = (mapping: FeeGroupPromotionMappingDto) => {
    setDeletingItem(mapping);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem?.id) return;

    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleSubmit = async () => {
    if (!form.feeCategoryId || !form.promotionId) {
      toast.error("Please select both Fee Category and Student / Class context");
      return;
    }

    // Check for duplicate mapping
    const existingMapping = mappings.find(
      (m) =>
        m.feeCategory?.id === form.feeCategoryId &&
        m.promotion?.id === form.promotionId &&
        m.id !== editingItem?.id,
    );

    if (existingMapping) {
      toast.error("This fee category and student combination already exists");
      return;
    }

    try {
      const mappingData: NewFeeGroupPromotionMapping = {
        feeCategoryId: form.feeCategoryId,
        promotionId: form.promotionId,
      };

      if (editingItem?.id) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: mappingData,
        });
      } else {
        await createMutation.mutateAsync(mappingData);
      }

      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <div className="container mx-auto min-w-0 max-w-full px-4 py-4 sm:p-6 space-y-6">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Link2 className="h-6 w-6" />
                Student Fee Group Mapping
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure mappings between students (by class/UID/roll) and fee groups
              </p>
            </div>
            <Button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Bulk Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className="w-full md:w-auto"
              >
                Filters
              </Button>

              {/* Active filter badges */}
              <div className="flex flex-wrap items-center gap-1 md:ml-2 text-xs">
                {filters.academicYear && (
                  <Badge
                    variant="outline"
                    className="border-slate-300 text-slate-700 bg-slate-50 flex items-center gap-1"
                  >
                    AY: {filters.academicYear}
                  </Badge>
                )}
                {filters.semesterOrClass && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 text-orange-700 bg-orange-50 flex items-center gap-1"
                  >
                    Sem: {filters.semesterOrClass}
                  </Badge>
                )}
                {filters.programCourse && (
                  <Badge
                    variant="outline"
                    className="border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                  >
                    {filters.programCourse}
                  </Badge>
                )}
                {filters.shift && (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 bg-emerald-50 flex items-center gap-1"
                  >
                    {filters.shift}
                  </Badge>
                )}
                {filters.category && (
                  <Badge
                    variant="outline"
                    className="border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-1"
                  >
                    Cat: {filters.category}
                  </Badge>
                )}
                {filters.religion && (
                  <Badge
                    variant="outline"
                    className="border-teal-300 text-teal-700 bg-teal-50 flex items-center gap-1"
                  >
                    Rel: {filters.religion}
                  </Badge>
                )}
                {filters.community && (
                  <Badge
                    variant="outline"
                    className="border-rose-300 text-rose-700 bg-rose-50 flex items-center gap-1"
                  >
                    {filters.community}
                  </Badge>
                )}
                {filters.feeCategory && (
                  <Badge
                    variant="outline"
                    className="border-indigo-300 text-indigo-700 bg-indigo-50 flex items-center gap-1"
                  >
                    {filters.feeCategory}
                  </Badge>
                )}
              </div>
            </div>
            <Input
              placeholder="Search by fee category, UID, roll no, class roll, or ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="md:max-w-md md:ml-3"
            />
          </div>

          {selectedIds.length > 0 && !loading && (
            <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
              <span>
                <span className="font-semibold">{selectedIds.length}</span> row
                {selectedIds.length > 1 ? "s" : ""} selected. You can apply a fee category in bulk
                from here (bulk action UI to be wired).
              </span>
            </div>
          )}

          {loading && hasFilters ? (
            <div className="text-center py-8">Loading mappings...</div>
          ) : (
            <div className="min-w-0 rounded-md border overflow-hidden">
              <Table
                containerClassName="overflow-x-hidden max-w-full"
                className="border-0 rounded-none text-[11px] sm:text-sm table-fixed w-full [&_th]:!h-auto [&_th]:!px-1.5 [&_th]:!py-2 sm:[&_th]:!px-2.5 [&_tbody_td]:!px-1.5 [&_tbody_td]:!py-2 sm:[&_tbody_td]:!px-2.5"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 min-w-0 p-0">
                      <Checkbox
                        aria-label="Select all on page"
                        checked={allSelectedOnPage}
                        onCheckedChange={toggleSelectAllOnPage}
                      />
                    </TableHead>
                    <TableHead className="w-8 min-w-0 text-center">#</TableHead>
                    <TableHead className="min-w-0 w-[18%]">Student</TableHead>
                    <TableHead className="min-w-0 w-[14%] leading-tight">
                      <span className="hidden sm:inline">Program</span>
                      <span className="sm:hidden">Prog.</span>
                    </TableHead>
                    <TableHead className="text-center min-w-0 w-[9%]">Sem.</TableHead>
                    <TableHead className="min-w-0 w-[8%]">Shift</TableHead>
                    <TableHead className="min-w-0 w-[10%] leading-tight">Pay status</TableHead>
                    <TableHead className="min-w-0 w-[9%]">Amt</TableHead>
                    <TableHead className="min-w-0 w-[16%] leading-tight">Slab</TableHead>
                    <TableHead className="min-w-0 w-[8%] text-right pr-1">Act.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasFilters ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                        <p className="font-medium">Apply filters to load data</p>
                        <p className="text-sm mt-1">
                          Select at least one filter (e.g. Academic Year, Semester) to view student
                          fee group mappings.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No mappings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMappings.map((mapping, index) => {
                      const promo: any = mapping.promotion || {};
                      const studentName = promo.studentName || promo.name || "-";
                      const uid = promo.uid || promo.studentUid || "";
                      const programCourseName = promo.programCourse?.name || "-";
                      const rawSemesterName = promo.class?.name || "-";
                      const semesterParts =
                        typeof rawSemesterName === "string" ? rawSemesterName.split(/\s+/) : [];
                      const semesterName =
                        semesterParts.length > 1 ? semesterParts[1] : rawSemesterName;
                      const shiftName = promo.shift?.name || "-";
                      const paymentStatus = mapping.paymentStatus ?? "Pending";
                      const amountToPay = mapping.amountToPay ?? 0;
                      const totalPayableAmt = mapping.totalPayableAmount ?? 0;
                      const displayAmount = totalPayableAmt > 0 ? totalPayableAmt : amountToPay;

                      const globalIndex = (currentPage - 1) * pageSize + index + 1;

                      const promotionId = promo.id as number | undefined;
                      const mappingCountForPromotion = promotionId
                        ? (promotionMappingCounts.get(promotionId) ?? 0)
                        : 0;
                      const canDelete = mappingCountForPromotion > 1;

                      return (
                        <TableRow key={mapping.id}>
                          <TableCell className="min-w-0 p-1 align-middle">
                            <Checkbox
                              aria-label="Select row"
                              checked={mapping.id ? selectedIds.includes(mapping.id) : false}
                              onCheckedChange={(checked) => toggleOne(mapping.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="min-w-0 text-center tabular-nums">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="min-w-0">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="line-clamp-2 break-words leading-tight">
                                {studentName}
                              </span>
                              {uid && (
                                <span className="text-[10px] text-gray-500 truncate" title={uid}>
                                  {uid}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0">
                            {programCourseName !== "-" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs border-blue-300 text-blue-700 bg-blue-50 whitespace-normal text-left leading-tight max-w-full block"
                              >
                                {programCourseName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center min-w-0">
                            {semesterName !== "-" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs border-orange-300 text-orange-700 bg-orange-50 whitespace-normal leading-tight max-w-full"
                              >
                                {semesterName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0">
                            {shiftName !== "-" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs border-emerald-300 text-emerald-700 bg-emerald-50 whitespace-normal leading-tight max-w-full"
                              >
                                {shiftName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0">
                            <Badge
                              className={
                                paymentStatus === "Paid"
                                  ? "bg-green-100 text-green-800 border-green-300 text-[10px] sm:text-xs px-1.5 py-0.5 whitespace-normal"
                                  : paymentStatus === "Pending"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] sm:text-xs px-1.5 py-0.5 whitespace-normal"
                                    : "bg-red-100 text-red-800 border-red-300 text-[10px] sm:text-xs px-1.5 py-0.5 whitespace-normal"
                              }
                            >
                              {paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-0 tabular-nums">
                            <span className="font-semibold text-gray-900 text-[11px] sm:text-sm">
                              ₹{displayAmount.toLocaleString("en-IN")}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-0">
                            {mapping.feeGroup?.feeCategory?.name &&
                            mapping.feeGroup?.feeSlab?.name ? (
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] sm:text-xs border-pink-300 text-pink-700 bg-pink-50 whitespace-normal leading-tight w-full justify-start"
                                >
                                  {mapping.feeGroup.feeSlab.name}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] sm:text-xs border-purple-300 text-purple-700 bg-purple-50 whitespace-normal leading-tight w-full justify-start"
                                >
                                  {mapping.feeGroup.feeCategory.name}
                                </Badge>
                              </div>
                            ) : mapping.feeCategory?.name ? (
                              // Fallback for old structure if feeGroup is not available
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs border-purple-300 text-purple-700 bg-purple-50 whitespace-normal leading-tight max-w-full"
                              >
                                {mapping.feeCategory.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-0 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(mapping)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(mapping)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Simple pagination controls */}
          {!loading && filteredMappings.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div>
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filteredMappings.length)}
                </span>{" "}
                of <span className="font-medium">{filteredMappings.length}</span> students
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page{" "}
                  <span className="font-medium">
                    {currentPage} / {totalPages}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Filter Student Fee Category Mappings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      academicYear: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All academic years" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.academicYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={filters.semesterOrClass}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      semesterOrClass: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All semesters / classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.semestersOrClasses.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program Course</Label>
                <Select
                  value={filters.programCourse}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      programCourse: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All program courses" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.programCourses.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={filters.shift}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      shift: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.shifts.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Religion</Label>
                <Select
                  value={filters.religion}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      religion: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All religions" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.religions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Community </Label>
                <Select
                  value={filters.community}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      community: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All communities" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.communities.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.categories.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fee Category</Label>
                <Select
                  value={filters.feeCategory}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      feeCategory: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All fee categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeCategories?.map((fc) => (
                      <SelectItem key={fc.id} value={fc.name}>
                        {fc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear filters
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilterModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowFilterModal(false)}>Apply filters</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Mapping" : "Add New Mapping"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feeCategory">Fee Category *</Label>
              <Select
                value={form.feeCategoryId?.toString() || ""}
                onValueChange={(value) => setForm({ ...form, feeCategoryId: Number(value) })}
              >
                <SelectTrigger id="feeCategory">
                  <SelectValue placeholder="Select Fee Category" />
                </SelectTrigger>
                <SelectContent>
                  {feeCategories?.map((category) => (
                    <SelectItem key={category.id} value={category.id?.toString() || ""}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promotion">Student / Class *</Label>
              <Select
                value={form.promotionId?.toString() || ""}
                onValueChange={(value) => setForm({ ...form, promotionId: Number(value) })}
              >
                <SelectTrigger id="promotion">
                  <SelectValue placeholder="Select Student / Class" />
                </SelectTrigger>
                <SelectContent>
                  {promotions?.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id?.toString() || ""}>
                      {getPromotionDisplayText(promotion)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingItem ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Bulk Fee Category Promotion Mappings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Excel File</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setBulkUploadFile(file);
                    setBulkUploadResult(null);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Excel file must contain columns: UID, Semester, Fee Category Name
              </p>
            </div>

            {bulkUploadFile && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-gray-600">{bulkUploadFile.name}</p>
              </div>
            )}

            {bulkUploadResult && (
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium mb-2">Upload Results:</p>
                  <div className="text-sm space-y-1">
                    <p>
                      Total: <span className="font-semibold">{bulkUploadResult.summary.total}</span>
                    </p>
                    <p className="text-green-600">
                      Successful:{" "}
                      <span className="font-semibold">{bulkUploadResult.summary.successful}</span>
                    </p>
                    <p className="text-red-600">
                      Failed:{" "}
                      <span className="font-semibold">{bulkUploadResult.summary.failed}</span>
                    </p>
                  </div>
                </div>

                {bulkUploadResult.errors.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-md max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {bulkUploadResult.errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkUploadModal(false);
                setBulkUploadFile(null);
                setBulkUploadResult(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!bulkUploadFile || isBulkUploading}
              className="flex items-center gap-2"
            >
              {isBulkUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Group Mapping Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={
                    (editingItem?.promotion as { uid?: string } | undefined)?.uid
                      ? `${import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ?? "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid="}${(editingItem.promotion as { uid: string }).uid}`
                      : undefined
                  }
                />
                <AvatarFallback className="bg-slate-200 text-slate-700 text-lg">
                  {(editingItem?.promotion as { studentName?: string } | undefined)?.studentName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg">
                  {editingItem?.promotion &&
                    (editingItem.promotion as { studentName?: string }).studentName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  UID: {editingItem?.promotion && (editingItem.promotion as { uid?: string }).uid}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs border-teal-300 text-teal-700 bg-teal-50"
                  >
                    {(editingItem?.promotion as { religionName?: string })?.religionName || "—"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs border-purple-300 text-purple-700 bg-purple-50"
                  >
                    {(editingItem?.promotion as { categoryName?: string })?.categoryName || "—"}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[90vh]">
            {isEditSaveHidden ? (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md text-sm">
                  <div>
                    <span className="text-muted-foreground">Program Course:</span>
                    <p className="font-medium">
                      {editingItem?.promotion?.programCourse?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Semester:</span>
                    <p className="font-medium">{editingItem?.promotion?.class?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shift:</span>
                    <p className="font-medium">{editingItem?.promotion?.shift?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total payable:</span>
                    <p className="font-semibold">
                      {editReadOnlyTotalPayable != null
                        ? `₹${editReadOnlyTotalPayable.toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slab Type</Label>
                  <div className="rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm">
                    {editingItem?.feeGroup
                      ? (() => {
                          const fg = editingItem.feeGroup;
                          const amt = feeGroupTotalsById[fg.id as number];
                          return (
                            <span className="font-medium text-foreground">
                              {fg.feeSlab?.name ?? "—"}
                              <span className="text-muted-foreground"> | </span>₹
                              {Number(amt ?? 0).toLocaleString("en-IN")}
                              <span className="text-muted-foreground">
                                {" "}
                                ({fg.feeCategory?.name ?? "—"})
                              </span>
                            </span>
                          );
                        })()
                      : "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Approval Details</Label>
                  {editingItem?.updatedByUser ? (
                    <div className="flex items-center gap-3 rounded-md border border-input bg-muted/40 px-3 py-2.5">
                      <UserAvatar
                        user={{
                          name: editingItem.updatedByUser.name,
                          image: editingItem.updatedByUser.avatarUrl ?? undefined,
                        }}
                        size="sm"
                        className="rounded-full shrink-0"
                      />
                      <p className="text-sm font-medium">{editingItem.updatedByUser.name}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2.5">
                      —
                    </p>
                  )}
                  {editingItem?.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {new Date(editingItem.updatedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <div className="rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm whitespace-pre-wrap min-h-[4.5rem]">
                    {editingItem?.remarks?.trim() ? editingItem.remarks : "—"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md text-sm">
                  <div>
                    <span className="text-muted-foreground">Program Course:</span>
                    <p className="font-medium">
                      {editingItem?.promotion?.programCourse?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Semester:</span>
                    <p className="font-medium">{editingItem?.promotion?.class?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shift:</span>
                    <p className="font-medium">{editingItem?.promotion?.shift?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slab fee (total):</span>
                    <p className="font-semibold">
                      {editDialogSlabTotal != null
                        ? `₹${editDialogSlabTotal.toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slab Type</Label>
                  <Select
                    value={editForm.feeGroupId?.toString() ?? ""}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, feeGroupId: v ? Number(v) : null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select slab type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const groups =
                          feeGroups && feeGroups.length > 0
                            ? feeGroups
                            : (() => {
                                const seen = new Set<number>();
                                const out: typeof feeGroups = [];
                                for (const m of mappings) {
                                  if (m.feeGroup?.id && !seen.has(m.feeGroup.id)) {
                                    seen.add(m.feeGroup.id);
                                    out.push(m.feeGroup);
                                  }
                                }
                                if (
                                  editingItem?.feeGroup?.id &&
                                  !seen.has(editingItem.feeGroup.id)
                                ) {
                                  out.unshift(editingItem.feeGroup);
                                }
                                return out;
                              })();
                        return groups?.map((fg) => (
                          <SelectItem key={fg.id} value={fg.id?.toString() ?? ""}>
                            <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
                              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                                <span>{fg.feeSlab?.name || "-"}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-slate-700 font-semibold whitespace-nowrap">
                                  ₹
                                  {Number(
                                    feeGroupTotalsById?.[fg.id as number] ?? 0,
                                  ).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <span className="justify-self-end text-right whitespace-nowrap text-slate-700">
                                ({fg.feeCategory?.name || "-"})
                              </span>
                            </div>
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label>Approval Details</Label>
                      <p className="text-xs text-muted-foreground">Select approver (admin/staff)</p>
                    </div>
                    <Input
                      placeholder="Search by name, email, type..."
                      value={approvalSearchText}
                      onChange={(e) => setApprovalSearchText(e.target.value)}
                      className="max-w-[200px] h-8 text-sm"
                    />
                  </div>
                  <div
                    className="border rounded-md max-h-48 overflow-y-auto divide-y"
                    role="listbox"
                    aria-label="Select approver"
                  >
                    {filteredAdminStaffUsers.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        {approvalSearchText ? "No users match your search" : "No users available"}
                      </p>
                    ) : (
                      filteredAdminStaffUsers.map((u) => {
                        const isSelected = editForm.updatedByUserId === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                updatedByUserId: isSelected ? null : u.id,
                              }))
                            }
                            className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-slate-100 ${
                              isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "bg-transparent"
                            }`}
                          >
                            <UserAvatar
                              user={{ name: u.name, image: u.image ?? undefined }}
                              size="sm"
                              className="rounded-full shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{u.name}</p>
                                {u.type && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                                  >
                                    {u.type}
                                  </Badge>
                                )}
                              </div>
                              {u.email && (
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {editForm.updatedByUserId && editingItem?.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {new Date(editingItem.updatedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    placeholder="Optional remarks"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className={isEditSaveHidden ? "sm:justify-end" : undefined}>
            {isEditSaveHidden ? (
              <Button onClick={() => setEditDialogOpen(false)}>Okay</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={savingEdit}>
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Fee Category Mapping"
        itemName={
          deletingItem?.feeGroup?.feeCategory?.name || deletingItem?.feeCategory?.name || ""
        }
        description={`Are you sure you want to delete the mapping between fee group "${deletingItem?.feeGroup?.feeCategory?.name || deletingItem?.feeCategory?.name}" and student "${getPromotionDisplayText(deletingItem?.promotion)}"? This action cannot be undone.`}
      />

      {/* Bulk Upload Progress Dialog (socket-driven, like reports page) */}
      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setCurrentOperation(null);
        }}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
};

export default FeeGroupPromotionMappingPage;
