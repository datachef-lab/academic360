// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link2, Trash2, Upload, Download, Loader2, Pencil } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFeeCategories, useFeeGroups } from "@/hooks/useFees";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { FeeGroupPromotionMappingDto } from "@repo/db/dtos/fees";
import { toast } from "sonner";
import { NewFeeGroupPromotionMapping, BulkUploadResult } from "@/services/fees-api";
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
import type { Community } from "@/types/enums";
import axiosInstance from "@/utils/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

const FeeGroupPromotionMappingPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeGroupPromotionMappingDto | null>(null);
  const [editingItem, setEditingItem] = useState<FeeGroupPromotionMappingDto | null>(null);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadResult | null>(null);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    processed: number;
    total: number;
    percent: number;
  } | null>(null);
  const [uploadSessionId] = useState<string>(
    () => `bulk-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );
  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [semesterOrClassOptions, setSemesterOrClassOptions] = useState<string[]>([]);
  const [programCourseOptions, setProgramCourseOptions] = useState<string[]>([]);
  const [shiftOptions, setShiftOptions] = useState<string[]>([]);
  const [religionOptions, setReligionOptions] = useState<string[]>([]);
  const [communityOptions] = useState<Community[]>(["GUJARATI", "NON-GUJARATI"]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const { showError } = useError();
  const { feeCategories } = useFeeCategories();
  const { feeGroups } = useFeeGroups();
  const { currentAcademicYear } = useAcademicYear();

  // React Query hooks
  const { data: mappings = [], isLoading: loading, refetch: refetchMappings } = useFeeGroupPromotionMappings();
  const createMutation = useCreateFeeGroupPromotionMapping();
  const updateMutation = useUpdateFeeGroupPromotionMapping();
  const deleteMutation = useDeleteFeeGroupPromotionMapping();
  const bulkUploadMutation = useBulkUploadFeeGroupPromotionMappings();

  // Socket connection for bulk upload progress
  const { socket, isConnected } = useSocket({
    userId,
  });

  // Listen to bulk upload socket events and join room
  useEffect(() => {
    if (!socket || !socket.connected) return;

    // Join the upload session room
    socket.emit("join", uploadSessionId);

    const handleBulkUploadProgress = (data: { processed: number; total: number; percent: number }) => {
      setBulkUploadProgress(data);
    };

    const handleBulkUploadDone = (data: { successCount: number }) => {
      setIsBulkUploading(false);
      setBulkUploadProgress(null);
      toast.success(`Bulk upload completed: ${data.successCount} mappings created`);
      refetchMappings();
    };

    const handleBulkUploadFailed = (data: { errorCount: number; successCount: number }) => {
      setIsBulkUploading(false);
      setBulkUploadProgress(null);
      toast.error(`Bulk upload completed with errors: ${data.successCount} successful, ${data.errorCount} failed`);
      if (data.successCount > 0) {
        refetchMappings();
      }
    };

    socket.on("bulk-upload-progress", handleBulkUploadProgress);
    socket.on("bulk-upload-done", handleBulkUploadDone);
    socket.on("bulk-upload-failed", handleBulkUploadFailed);

    return () => {
      socket.off("bulk-upload-progress", handleBulkUploadProgress);
      socket.off("bulk-upload-done", handleBulkUploadDone);
      socket.off("bulk-upload-failed", handleBulkUploadFailed);
      socket.emit("leave", uploadSessionId);
    };
  }, [socket, uploadSessionId]);

  // Listen for fee group promotion mapping socket events (only for staff/admin)
  useEffect(() => {
    if (!socket || !isConnected || (user?.type !== "ADMIN" && user?.type !== "STAFF")) return;

    const handleFeeGroupPromotionMappingCreated = (data: { mappingId: number; type: string; message: string }) => {
      console.log("[Fee Group Promotion Mapping Page] Mapping created:", data);
      // Silently refresh UI without showing toast
      refetchMappings();
    };

    const handleFeeGroupPromotionMappingUpdated = (data: { mappingId: number; type: string; message: string }) => {
      console.log("[Fee Group Promotion Mapping Page] Mapping updated:", data);
      // Silently refresh UI without showing toast
      refetchMappings();
    };

    const handleFeeGroupPromotionMappingDeleted = (data: { mappingId: number; type: string; message: string }) => {
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

  const [form, setForm] = useState<{
    feeCategoryId: number | undefined;
    promotionId: number | undefined;
  }>({
    feeCategoryId: undefined,
    promotionId: undefined,
  });

  // Extract unique promotions from mappings

  // When academic year from Redux is available, pre-select it IF it exists
  // in our filter options and no academic year filter is already applied.
  useEffect(() => {
    const year = currentAcademicYear?.year;
    if (!year) return;
    if (filters.academicYear) return;

    if (academicYearOptions.includes(year)) {
      setFilters((prev) => ({
        ...prev,
        academicYear: year,
      }));
    }
  }, [currentAcademicYear, filters.academicYear, academicYearOptions]);

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
            academicYears.map((y: any) => y.year || y.name).filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Classes / semesters
        const classes = await getAllClasses();
        if (Array.isArray(classes)) {
          setSemesterOrClassOptions(
            classes.map((c: any) => c.name).filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Program courses
        const programCourses = await getProgramCourses();
        if (Array.isArray(programCourses)) {
          setProgramCourseOptions(
            programCourses.map((pc: any) => pc.name).filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Shifts
        const shiftsResponse = await axiosInstance.get("/api/v1/shifts");
        const shiftsData = Array.isArray(shiftsResponse.data?.payload)
          ? shiftsResponse.data.payload
          : Array.isArray(shiftsResponse.data)
            ? shiftsResponse.data
            : [];
        setShiftOptions(shiftsData.map((s: any) => s.name).filter((v: unknown): v is string => typeof v === "string"));

        // Religions
        const religions = await getAllReligions();
        if (Array.isArray(religions)) {
          setReligionOptions(
            religions.map((r: any) => r.name).filter((v: unknown): v is string => typeof v === "string"),
          );
        }

        // Social categories (SC / ST / OBC / etc.)
        const categories = await getAllCategories();
        if (Array.isArray(categories)) {
          setCategoryOptions(
            categories.map((c: any) => c.name).filter((v: unknown): v is string => typeof v === "string"),
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
      academicYears: academicYearOptions.length > 0 ? academicYearOptions : Array.from(academicYears),
      semestersOrClasses: semesterOrClassOptions.length > 0 ? semesterOrClassOptions : Array.from(semestersOrClasses),
      programCourses: programCourseOptions.length > 0 ? programCourseOptions : Array.from(programCourses),
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
      const feeCategoryName = (mapping.feeGroup?.feeCategory?.name || mapping.feeCategory?.name || "").toLowerCase();
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
  const paginatedMappings = filteredMappings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allSelectedOnPage =
    paginatedMappings.length > 0 && paginatedMappings.every((m) => m.id && selectedIds.includes(m.id));

  const toggleSelectAllOnPage = (checked: boolean | string) => {
    const idsOnPage = paginatedMappings.map((m) => m.id).filter((id): id is number => typeof id === "number");

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
        Semester: "",
        "Fee Category Name": "",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // UID
      { wch: 20 }, // Semester
      { wch: 30 }, // Fee Category Name
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Fee Group Promotion Mapping");
    XLSX.writeFile(wb, "fee-group-promotion-mapping-template.xlsx");
  };

  const validateBulkUploadFile = async (
    file: File,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    data: Array<{ UID: string; Semester: string; "Fee Category Name": string }>;
  }> => {
    const errors: string[] = [];
    const data: Array<{ UID: string; Semester: string; "Fee Category Name": string }> = [];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames?.[0];
      if (!sheetName) {
        errors.push("Excel file has no sheets");
        return { isValid: false, errors, data: [] };
      }
      const worksheet = workbook.Sheets?.[sheetName];
      if (!worksheet) {
        errors.push("Failed to read worksheet from Excel file");
        return { isValid: false, errors, data: [] };
      }
      const jsonData = XLSX.utils.sheet_to_json<{
        UID?: string;
        Semester?: string;
        "Fee Category Name"?: string;
      }>(worksheet as XLSX.WorkSheet);

      if (jsonData.length === 0) {
        errors.push("Excel file is empty");
        return { isValid: false, errors, data: [] };
      }

      // Get all fee category names for validation
      const feeCategoryNames = new Set(feeCategories?.map((fc) => fc.name.toLowerCase().trim()) || []);

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because Excel is 1-indexed and we skip header
        const uid = row.UID?.toString()?.trim();
        const semester = row.Semester?.toString()?.trim();
        const feeCategoryName = row["Fee Category Name"]?.toString()?.trim();

        if (!uid || !semester || !feeCategoryName) {
          errors.push(`Row ${rowNumber}: UID, Semester, and Fee Category Name are required (no blanks allowed)`);
          return;
        }

        // Verify fee category exists
        if (!feeCategoryNames.has(feeCategoryName.toLowerCase().trim())) {
          errors.push(`Row ${rowNumber}: Fee category "${feeCategoryName}" not found`);
          return;
        }

        data.push({
          UID: uid,
          Semester: semester,
          "Fee Category Name": feeCategoryName,
        });
      });

      return {
        isValid: errors.length === 0,
        errors,
        data,
      };
    } catch (error) {
      errors.push(`Failed to read Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { isValid: false, errors, data: [] };
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
        toast.error(`Validation failed: ${validation.errors.length} error(s) found`);
        setBulkUploadResult({
          summary: {
            total: validation.data.length + validation.errors.length,
            successful: 0,
            failed: validation.errors.length,
          },
          errors: validation.errors.map((error, index) => ({
            row: index + 2,
            data: { UID: "", Semester: "", "Fee Category Name": "" },
            error,
          })),
          success: [],
        });
        setIsBulkUploading(false);
        return;
      }

      // Upload file with session ID
      const formData = new FormData();
      formData.append("file", bulkUploadFile);
      formData.append("uploadSessionId", uploadSessionId);

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
        // Note: Success/error messages and fetchMappings are handled by socket events
      }
    } catch (error) {
      console.error("Error uploading bulk mappings:", error);
      setIsBulkUploading(false);
      toast.error(`Bulk upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    // Note: setIsBulkUploading(false) is handled by socket events
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
        m.feeCategory?.id === form.feeCategoryId && m.promotion?.id === form.promotionId && m.id !== editingItem?.id,
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

  // Inline update of fee group for a specific mapping row
  const handleRowFeeCategoryChange = async (mapping: FeeGroupPromotionMappingDto, newFeeGroupId: number) => {
    if (!mapping.id) return;
    if (mapping.feeGroup?.id === newFeeGroupId) return;

    try {
      await updateMutation.mutateAsync({
        id: mapping.id,
        data: {
          feeGroupId: newFeeGroupId,
        },
      });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
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
            <Button onClick={() => setShowBulkUploadModal(true)} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Bulk Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={() => setShowFilterModal(true)} className="w-full md:w-auto">
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
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1">
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
                  <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 flex items-center gap-1">
                    Rel: {filters.religion}
                  </Badge>
                )}
                {filters.community && (
                  <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50 flex items-center gap-1">
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
                {selectedIds.length > 1 ? "s" : ""} selected. You can apply a fee category in bulk from here (bulk
                action UI to be wired).
              </span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading mappings...</div>
          ) : (
            <Table className="border rounded-md">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      aria-label="Select all on page"
                      checked={allSelectedOnPage}
                      onCheckedChange={toggleSelectAllOnPage}
                    />
                  </TableHead>
                  <TableHead className="w-[60px]">Sr No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Program Course</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Religion</TableHead>
                  <TableHead>Fee Group</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMappings.length === 0 ? (
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
                    const semesterParts = typeof rawSemesterName === "string" ? rawSemesterName.split(/\s+/) : [];
                    const semesterName = semesterParts.length > 1 ? semesterParts[1] : rawSemesterName;
                    const shiftName = promo.shift?.name || "-";
                    const categoryName = promo.categoryName || "-";
                    const religionName = promo.religionName || "-";

                    const globalIndex = (currentPage - 1) * pageSize + index + 1;

                    const promotionId = promo.id as number | undefined;
                    const mappingCountForPromotion = promotionId ? (promotionMappingCounts.get(promotionId) ?? 0) : 0;
                    const canDelete = mappingCountForPromotion > 1;

                    return (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <Checkbox
                            aria-label="Select row"
                            checked={mapping.id ? selectedIds.includes(mapping.id) : false}
                            onCheckedChange={(checked) => toggleOne(mapping.id, checked)}
                          />
                        </TableCell>
                        <TableCell>{globalIndex}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{studentName}</span>
                            {uid && <span className="text-xs text-gray-500">UID: {uid}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {programCourseName !== "-" ? (
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                              {programCourseName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {semesterName !== "-" ? (
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                              {semesterName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shiftName !== "-" ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              {shiftName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {categoryName !== "-" ? (
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                              {categoryName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {religionName !== "-" ? (
                            <Badge variant="outline" className="text-xs border-teal-300 text-teal-700 bg-teal-50">
                              {religionName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mapping.feeGroup?.feeCategory?.name && mapping.feeGroup?.feeSlab?.name ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-xs border-purple-300 text-purple-700 bg-purple-50"
                              >
                                {mapping.feeGroup.feeCategory.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs border-pink-300 text-pink-700 bg-pink-50">
                                {mapping.feeGroup.feeSlab.name}
                              </Badge>
                            </div>
                          ) : mapping.feeCategory?.name ? (
                            // Fallback for old structure if feeGroup is not available
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                              {mapping.feeCategory.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={mapping.feeGroup?.id?.toString() || mapping.feeCategory?.id?.toString() || ""}
                              onValueChange={(value) => handleRowFeeCategoryChange(mapping, Number(value))}
                            >
                              {/* Only show edit icon, clicking opens the dropdown */}
                              <SelectTrigger className="h-8 w-8 p-0 border-0 bg-transparent shadow-none [&>span]:hidden">
                                <Pencil className="h-4 w-4 text-gray-600" />
                              </SelectTrigger>
                              <SelectContent className="min-w-[280px]">
                                {feeGroups?.map((fg) => (
                                  <SelectItem key={fg.id} value={fg.id?.toString() || ""} className="cursor-pointer">
                                    <div className="flex items-center gap-2 py-1 text-sm">
                                      <span className="w-[140px] text-left truncate">
                                        {fg.feeCategory?.name || "-"}
                                      </span>
                                      <span className="text-gray-400">|</span>
                                      <span className="flex-1 text-left truncate">{fg.feeSlab?.name || "-"}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
          )}

          {/* Simple pagination controls */}
          {!loading && filteredMappings.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div>
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * pageSize, filteredMappings.length)}</span> of{" "}
                <span className="font-medium">{filteredMappings.length}</span> students
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
                <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Template
                </Button>
              </div>
              <p className="text-xs text-gray-500">Excel file must contain columns: UID, Semester, Fee Category Name</p>
            </div>

            {bulkUploadFile && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-gray-600">{bulkUploadFile.name}</p>
              </div>
            )}

            {bulkUploadProgress && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium mb-2">Upload Progress:</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${bulkUploadProgress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {bulkUploadProgress.processed} of {bulkUploadProgress.total} rows processed (
                  {bulkUploadProgress.percent}%)
                </p>
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
                      Successful: <span className="font-semibold">{bulkUploadResult.summary.successful}</span>
                    </p>
                    <p className="text-red-600">
                      Failed: <span className="font-semibold">{bulkUploadResult.summary.failed}</span>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Fee Category Mapping"
        itemName={deletingItem?.feeCategory?.name || ""}
        description={`Are you sure you want to delete the mapping between fee category "${deletingItem?.feeCategory?.name}" and student "${getPromotionDisplayText(deletingItem?.promotion)}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default FeeGroupPromotionMappingPage;
