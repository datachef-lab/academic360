import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useError } from "./useError";
import {
  // Fees Structure
  getAllFeesStructures,
  createFeesStructure,
  createFeeStructureByDto,
  updateFeesStructure,
  deleteFeesStructure,

  // Fees Heads
  getAllFeesHeads,
  createFeesHead,
  updateFeesHead,
  deleteFeesHead,
  NewFeesHead,

  // Fees Slabs
  getAllFeesSlabs,
  createFeesSlab,
  updateFeesSlab,
  deleteFeesSlab,

  // Fees Receipt Types
  getAllFeesReceiptTypes,
  createFeesReceiptType,
  updateFeesReceiptType,
  deleteFeesReceiptType,
  NewFeesReceiptType,

  // Addons
  getAllAddons,
  createAddon,
  updateAddon,
  deleteAddon,

  // Fee Concession Slabs
  getAllFeeConcessionSlabs,
  createFeeConcessionSlab,
  updateFeeConcessionSlab,
  deleteFeeConcessionSlab,
  NewFeeConcessionSlab,

  // Fee Categories
  getAllFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  NewFeeCategory,
  // Fee Groups
  getAllFeeGroups,
  createFeeGroup,
  updateFeeGroup,
  deleteFeeGroup,
  NewFeeGroup,

  // Student Fees Mapping
  getAllStudentFeesMappings,
  createStudentFeesMapping,
  updateStudentFeesMapping,
  deleteStudentFeesMapping,
  createFeesSlabYear,
  getAllFeesSlabYears,
} from "@/services/fees-api";
import {
  FeesStructureDto,
  FeesHead,
  FeesSlab,
  FeesReceiptType,
  AddOn,
  FeesSlabMapping,
  CreateFeesStructureDto,
} from "@/types/fees";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import { CreateFeeStructureDto, FeeStructureDto, FeeCategoryDto, FeeGroupDto } from "@repo/db/dtos/fees";
import { AcademicYear } from "@/types/academics/academic-year";
import { Course } from "@/types/course-design";
import {
  getAcademicYearsFromFeesStructures,
  getCoursesFromFeesStructures,
  getFeesStructuresByAcademicYearAndCourse,
} from "@/services/fees-api";
import type { FeeSlabT } from "@/schemas";

// ==================== FEES STRUCTURE HOOKS ====================

import { socketService } from "../services/socketService";

export const useFeesStructures = (
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    academicYearId?: number;
    classId?: number;
    receiptTypeId?: number;
    programCourseId?: number;
    shiftId?: number;
  },
) => {
  const { showError } = useError();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["fees-structures", { page, pageSize, filters }],
    queryFn: async () => {
      const response = await getAllFeesStructures(page, pageSize, filters);
      return response;
    },
    staleTime: 30_000,
    cacheTime: 5 * 60_000,
    onError: () => {
      showError({ message: "Failed to fetch fees structures" });
    },
  });

  // Listen for socket events even if the current component isn't directly subscribing
  // so that any hook user automatically gets fresh data.
  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("fees-structures"),
      });
    };

    const socket = socketService.getSocket();
    if (socket) {
      socket.on("fee_structure_created", invalidate);
      socket.on("fee_structure_updated", invalidate);
      socket.on("fee_structure_deleted", invalidate);
    }

    return () => {
      if (socket) {
        socket.off("fee_structure_created", invalidate);
        socket.off("fee_structure_updated", invalidate);
        socket.off("fee_structure_deleted", invalidate);
      }
    };
  }, [queryClient]);

  const feesStructures = data?.payload?.content ?? [];
  const pagination = data?.payload
    ? {
        page: data.payload.page,
        pageSize: data.payload.pageSize,
        totalElements: data.payload.totalElements,
        totalPages: data.payload.totalPages,
      }
    : {
        page,
        pageSize,
        totalElements: 0,
        totalPages: 1,
      };

  const addFeesStructure = useCallback(
    async (newFeesStructure: CreateFeesStructureDto | CreateFeeStructureDto) => {
      try {
        // Check if it's the new CreateFeeStructureDto format (has programCourseIds and shiftIds arrays)
        const isNewDto = "programCourseIds" in newFeesStructure && "shiftIds" in newFeesStructure;

        if (isNewDto) {
          // Use the new bulk creation endpoint
          const response = await createFeeStructureByDto(newFeesStructure as CreateFeeStructureDto);
          await queryClient.invalidateQueries({ queryKey: ["fees-structures"] });
          return response.payload;
        } else {
          // Use the old single creation endpoint
          const response = await createFeesStructure(newFeesStructure);
          await queryClient.invalidateQueries({ queryKey: ["fees-structures"] });
          return response.payload;
        }
      } catch (error) {
        console.error("Error creating fees structure:", error);
        showError({ message: "Failed to create fees structure" });
        return null;
      }
    },
    [queryClient, showError],
  );

  const updateFeesStructureById = useCallback(
    async (id: number, feesStructure: Partial<FeeStructureDto>) => {
      try {
        const response = await updateFeesStructure(id, feesStructure);
        await queryClient.invalidateQueries({ queryKey: ["fees-structures"] });
        return response.payload;
      } catch {
        showError({ message: "Failed to update fees structure" });
        return null;
      }
    },
    [queryClient, showError],
  );

  const deleteFeesStructureById = useCallback(
    async (id: number) => {
      try {
        await deleteFeesStructure(id);
        await queryClient.invalidateQueries({ queryKey: ["fees-structures"] });
        return true;
      } catch {
        showError({ message: "Failed to delete fees structure" });
        return false;
      }
    },
    [queryClient, showError],
  );

  return {
    feesStructures,
    loading: isLoading,
    pagination,
    refetch,
    addFeesStructure,
    updateFeesStructureById,
    deleteFeesStructureById,
  };
};

export const useAcademicYearsFromFeesStructures = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAcademicYearsFromFeesStructures();
      setAcademicYears(data);
    } catch {
      showError({ message: "Failed to fetch academic years from fees structures" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  return { academicYears, loading, refetch: fetchAcademicYears };
};

export const useCoursesFromFeesStructures = (academicYearId: number | null) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useError();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!academicYearId) {
        setCourses([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getCoursesFromFeesStructures(academicYearId);
        setCourses(data);
      } catch {
        showError({ message: "Failed to fetch courses from fees structures" });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [academicYearId, showError]);

  return { courses, loading };
};

export const useFeesStructuresByAcademicYearAndCourse = (academicYearId: number | null, courseId: number | null) => {
  const [feesStructures, setFeesStructures] = useState<FeesStructureDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useError();

  useEffect(() => {
    const fetchFeesStructures = async () => {
      if (!academicYearId || !courseId) {
        setFeesStructures([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getFeesStructuresByAcademicYearAndCourse(academicYearId, courseId);
        setFeesStructures(data);
      } catch {
        showError({ message: "Failed to fetch fees structures by academic year and course" });
      } finally {
        setLoading(false);
      }
    };

    fetchFeesStructures();
  }, [academicYearId, courseId, showError]);

  return { feesStructures, loading };
};

// ==================== FEES HEADS HOOKS ====================

export const useFeesHeads = () => {
  const [feesHeads, setFeesHeads] = useState<FeesHead[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeesHeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeesHeads();
      console.log("Fees Heads API response:", response);
      setFeesHeads(response || []);
    } catch {
      showError({ message: "Failed to fetch fees heads" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // refresh fees heads when socket events fire
  useEffect(() => {
    const handle = () => fetchFeesHeads();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("fee_head_created", handle);
      socket.on("fee_head_updated", handle);
      socket.on("fee_head_deleted", handle);
    }
    return () => {
      if (socket) {
        socket.off("fee_head_created", handle);
        socket.off("fee_head_updated", handle);
        socket.off("fee_head_deleted", handle);
      }
    };
  }, [fetchFeesHeads]);

  const addFeesHead = useCallback(
    async (newFeesHead: NewFeesHead) => {
      try {
        const response = await createFeesHead(newFeesHead);
        await fetchFeesHeads();
        return response.payload;
      } catch (error) {
        console.error("Error creating fees head:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to create fees head" });
        return null;
      }
    },
    [fetchFeesHeads, showError],
  );

  const updateFeesHeadById = useCallback(
    async (id: number, feesHead: Partial<NewFeesHead>) => {
      try {
        const response = await updateFeesHead(id, feesHead);
        await fetchFeesHeads();
        return response.payload;
      } catch (error) {
        console.error("Error updating fees head:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to update fees head" });
        return null;
      }
    },
    [fetchFeesHeads, showError],
  );

  const deleteFeesHeadById = useCallback(
    async (id: number) => {
      try {
        await deleteFeesHead(id);
        await fetchFeesHeads();
        return true;
      } catch (error) {
        console.error("Error deleting fees head:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to delete fees head" });
        return false;
      }
    },
    [fetchFeesHeads, showError],
  );

  useEffect(() => {
    fetchFeesHeads();
  }, [fetchFeesHeads]);

  console.log("Fees Heads data:", feesHeads);

  return {
    feesHeads,
    loading,
    fetchFeesHeads,
    addFeesHead,
    updateFeesHeadById,
    deleteFeesHeadById,
  };
};

// ==================== FEES SLABS HOOKS ====================

export const useFeesSlabs = () => {
  const [feesSlabs, setFeesSlabs] = useState<FeesSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeesSlabs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeesSlabs();
      if (response.payload) {
        setFeesSlabs(response.payload);
      } else {
        setFeesSlabs([]);
      }
    } catch (error) {
      console.error("Error fetching fees slabs:", error);
      showError({ message: "Failed to fetch fees slabs" });
      setFeesSlabs([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // refresh fees slabs on socket events
  useEffect(() => {
    const handle = () => fetchFeesSlabs();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("fee_slab_created", handle);
      socket.on("fee_slab_updated", handle);
      socket.on("fee_slab_deleted", handle);
    }
    return () => {
      if (socket) {
        socket.off("fee_slab_created", handle);
        socket.off("fee_slab_updated", handle);
        socket.off("fee_slab_deleted", handle);
      }
    };
  }, [fetchFeesSlabs]);

  const addFeesSlab = useCallback(
    async (newFeesSlab: FeesSlab) => {
      try {
        const response = await createFeesSlab(newFeesSlab);
        await fetchFeesSlabs();
        return response.payload;
      } catch {
        showError({ message: "Failed to create fees slab" });
        return null;
      }
    },
    [fetchFeesSlabs, showError],
  );

  const updateFeesSlabById = useCallback(
    async (id: number, feesSlab: Partial<FeesSlab>) => {
      try {
        const response = await updateFeesSlab(id, feesSlab);
        await fetchFeesSlabs();
        return response.payload;
      } catch {
        showError({ message: "Failed to update fees slab" });
        return null;
      }
    },
    [fetchFeesSlabs, showError],
  );

  const deleteFeesSlabById = useCallback(
    async (id: number) => {
      try {
        await deleteFeesSlab(id);
        await fetchFeesSlabs();
        return true;
      } catch {
        showError({ message: "Failed to delete fees slab" });
        return false;
      }
    },
    [fetchFeesSlabs, showError],
  );

  useEffect(() => {
    fetchFeesSlabs();
  }, [fetchFeesSlabs]);

  return {
    feesSlabs,
    loading,
    fetchFeesSlabs,
    addFeesSlab,
    updateFeesSlabById,
    deleteFeesSlabById,
  };
};

// ==================== FEES RECEIPT TYPES HOOKS ====================

export const useFeesReceiptTypes = () => {
  const [feesReceiptTypes, setFeesReceiptTypes] = useState<FeesReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeesReceiptTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeesReceiptTypes();
      setFeesReceiptTypes(response || []);
    } catch {
      showError({ message: "Failed to fetch fees receipt types" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // refresh receipt types on socket events
  useEffect(() => {
    const handle = () => fetchFeesReceiptTypes();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("receipt_type_created", handle);
      socket.on("receipt_type_updated", handle);
      socket.on("receipt_type_deleted", handle);
    }
    return () => {
      if (socket) {
        socket.off("receipt_type_created", handle);
        socket.off("receipt_type_updated", handle);
        socket.off("receipt_type_deleted", handle);
      }
    };
  }, [fetchFeesReceiptTypes]);

  const addFeesReceiptType = useCallback(
    async (newFeesReceiptType: NewFeesReceiptType) => {
      try {
        const response = await createFeesReceiptType(newFeesReceiptType);
        await fetchFeesReceiptTypes();
        return response.payload;
      } catch {
        showError({ message: "Failed to create fees receipt type" });
        return null;
      }
    },
    [fetchFeesReceiptTypes, showError],
  );

  const updateFeesReceiptTypeById = useCallback(
    async (id: number, feesReceiptType: Partial<NewFeesReceiptType>) => {
      try {
        const response = await updateFeesReceiptType(id, feesReceiptType);
        await fetchFeesReceiptTypes();
        return response.payload;
      } catch {
        showError({ message: "Failed to update fees receipt type" });
        return null;
      }
    },
    [fetchFeesReceiptTypes, showError],
  );

  const deleteFeesReceiptTypeById = useCallback(
    async (id: number) => {
      try {
        await deleteFeesReceiptType(id);
        await fetchFeesReceiptTypes();
        return true;
      } catch {
        showError({ message: "Failed to delete fees receipt type" });
        return false;
      }
    },
    [fetchFeesReceiptTypes, showError],
  );

  useEffect(() => {
    fetchFeesReceiptTypes();
  }, [fetchFeesReceiptTypes]);

  return {
    feesReceiptTypes,
    loading,
    fetchFeesReceiptTypes,
    addFeesReceiptType,
    updateFeesReceiptTypeById,
    deleteFeesReceiptTypeById,
  };
};

// ==================== ADDONS HOOKS ====================

export const useAddons = () => {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchAddons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllAddons();
      setAddons(response.payload || []);
    } catch {
      showError({ message: "Failed to fetch addons" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addAddon = useCallback(
    async (newAddon: AddOn) => {
      try {
        const response = await createAddon(newAddon);
        await fetchAddons();
        return response.payload;
      } catch {
        showError({ message: "Failed to create addon" });
        return null;
      }
    },
    [fetchAddons, showError],
  );

  const updateAddonById = useCallback(
    async (id: number, addon: Partial<AddOn>) => {
      try {
        const response = await updateAddon(id, addon);
        await fetchAddons();
        return response.payload;
      } catch {
        showError({ message: "Failed to update addon" });
        return null;
      }
    },
    [fetchAddons, showError],
  );

  const deleteAddonById = useCallback(
    async (id: number) => {
      try {
        const response = await deleteAddon(id);
        if (response.httpStatusCode === 200) {
          await fetchAddons();
          return true;
        }
        showError({ message: response.message || "Failed to delete addon" });
        return false;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete addon";
        showError({ message: errorMessage });
        console.error("Error deleting addon:", error);
        return false;
      }
    },
    [fetchAddons, showError],
  );

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  return {
    addons,
    loading,
    fetchAddons,
    addAddon,
    updateAddonById,
    deleteAddonById,
  };
};

// ==================== STUDENT FEES MAPPING HOOKS ====================

export const useStudentFeesMappings = () => {
  const [studentFeesMappings, setStudentFeesMappings] = useState<FeeStudentMappingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchStudentFeesMappings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllStudentFeesMappings();
      setStudentFeesMappings(response.payload || []);
    } catch {
      showError({ message: "Failed to fetch student fees mappings" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addStudentFeesMapping = useCallback(
    async (newStudentFeesMapping: Partial<FeeStudentMappingDto>) => {
      try {
        const response = await createStudentFeesMapping(newStudentFeesMapping);
        await fetchStudentFeesMappings();
        return response.payload;
      } catch {
        showError({ message: "Failed to create student fees mapping" });
        return null;
      }
    },
    [fetchStudentFeesMappings, showError],
  );

  const updateStudentFeesMappingById = useCallback(
    async (id: number, studentFeesMapping: Partial<FeeStudentMappingDto>) => {
      try {
        const response = await updateStudentFeesMapping(id, studentFeesMapping);
        await fetchStudentFeesMappings();
        return response.payload;
      } catch {
        showError({ message: "Failed to update student fees mapping" });
        return null;
      }
    },
    [fetchStudentFeesMappings, showError],
  );

  const deleteStudentFeesMappingById = useCallback(
    async (id: number) => {
      try {
        await deleteStudentFeesMapping(id);
        await fetchStudentFeesMappings();
        return true;
      } catch {
        showError({ message: "Failed to delete student fees mapping" });
        return false;
      }
    },
    [fetchStudentFeesMappings, showError],
  );

  useEffect(() => {
    fetchStudentFeesMappings();
  }, [fetchStudentFeesMappings]);

  return {
    studentFeesMappings,
    loading,
    fetchStudentFeesMappings,
    addStudentFeesMapping,
    updateStudentFeesMappingById,
    deleteStudentFeesMappingById,
  };
};

export const useFeesSlabMappings = () => {
  const [FeesSlabMappings, setFeesSlabMappings] = useState<FeesSlabMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeesSlabMappings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeesSlabYears();
      setFeesSlabMappings(response.payload || []);
    } catch {
      showError({ message: "Failed to fetch fees slab years" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeesSlabMappings = useCallback(
    async (newFeesSlabMappings: FeesSlabMapping[]) => {
      try {
        const createdSlabYears = await Promise.all(newFeesSlabMappings.map((slabYear) => createFeesSlabYear(slabYear)));
        await fetchFeesSlabMappings();
        return createdSlabYears.map((res) => res.payload);
      } catch {
        showError({ message: "Failed to create fees slab years" });
        return null;
      }
    },
    [fetchFeesSlabMappings, showError],
  );

  useEffect(() => {
    fetchFeesSlabMappings();
  }, [fetchFeesSlabMappings]);

  return {
    FeesSlabMappings,
    loading,
    fetchFeesSlabMappings,
    addFeesSlabMappings,
  };
};

// ==================== FEE CONCESSION SLABS HOOKS ====================

export const useFeeConcessionSlabs = () => {
  const [concessionSlabs, setConcessionSlabs] = useState<FeeSlabT[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeeConcessionSlabs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeeConcessionSlabs();
      if (response.payload) {
        // Map defaultRate to defaultConcessionRate for frontend compatibility
        const mappedSlabs = response.payload.map((slab: any) => ({
          ...slab,
          defaultConcessionRate: slab.defaultRate ?? slab.defaultConcessionRate ?? 0,
        }));
        setConcessionSlabs(mappedSlabs);
      } else {
        setConcessionSlabs([]);
      }
    } catch (error) {
      console.error("Error fetching fee concession slabs:", error);
      showError({ message: "Failed to fetch fee concession slabs" });
      setConcessionSlabs([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeeConcessionSlab = useCallback(
    async (newSlab: FeeSlabT) => {
      try {
        // Map FeeConcessionSlabT to NewFeeConcessionSlab format
        const mappedSlab: NewFeeConcessionSlab = {
          name: newSlab.name,
          description: newSlab.description,
          defaultRate: newSlab.defaultRate ?? 0,
          sequence: newSlab.sequence ?? 0,
          legacyFeeSlabId: newSlab.legacyFeeSlabId ?? null,
        };
        const response = await createFeeConcessionSlab(mappedSlab);
        await fetchFeeConcessionSlabs();
        return response.payload;
      } catch (error) {
        console.error("Error creating fee concession slab:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to create fee concession slab" });
        return null;
      }
    },
    [fetchFeeConcessionSlabs, showError],
  );

  const updateFeeConcessionSlabById = useCallback(
    async (id: number, slab: Partial<FeeSlabT>) => {
      try {
        // Map Partial<FeeConcessionSlabT> to Partial<NewFeeConcessionSlab> format
        const mappedSlab: Partial<NewFeeConcessionSlab> = {
          ...(slab.name !== undefined && { name: slab.name }),
          ...(slab.description !== undefined && { description: slab.description }),
          ...(slab.defaultRate !== undefined &&
            slab.defaultRate !== null && {
              defaultRate: slab.defaultRate,
            }),
          ...(slab.sequence !== undefined && slab.sequence !== null && { sequence: slab.sequence }),
          ...(slab.legacyFeeSlabId !== undefined && { legacyFeeSlabId: slab.legacyFeeSlabId }),
        };
        const response = await updateFeeConcessionSlab(id, mappedSlab);
        await fetchFeeConcessionSlabs();
        return response.payload;
      } catch (error) {
        console.error("Error updating fee concession slab:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to update fee concession slab" });
        return null;
      }
    },
    [fetchFeeConcessionSlabs, showError],
  );

  const deleteFeeConcessionSlabById = useCallback(
    async (id: number) => {
      try {
        await deleteFeeConcessionSlab(id);
        await fetchFeeConcessionSlabs();
        return true;
      } catch (error) {
        console.error("Error deleting fee concession slab:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to delete fee concession slab" });
        return false;
      }
    },
    [fetchFeeConcessionSlabs, showError],
  );

  useEffect(() => {
    fetchFeeConcessionSlabs();
  }, [fetchFeeConcessionSlabs]);

  return {
    concessionSlabs: concessionSlabs,
    loading,
    fetchFeeConcessionSlabs,
    addFeeConcessionSlab,
    updateFeeConcessionSlabById,
    deleteFeeConcessionSlabById,
  };
};

// ==================== FEE CATEGORIES HOOKS ====================

export const useFeeCategories = () => {
  const [feeCategories, setFeeCategories] = useState<FeeCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeeCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeeCategories();
      if (response.payload) {
        setFeeCategories(response.payload);
      } else {
        setFeeCategories([]);
      }
    } catch (error) {
      console.error("Error fetching fee categories:", error);
      showError({ message: "Failed to fetch fee categories" });
      setFeeCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // refresh fee categories on socket events
  useEffect(() => {
    const handle = () => fetchFeeCategories();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("fee_category_created", handle);
      socket.on("fee_category_updated", handle);
      socket.on("fee_category_deleted", handle);
    }
    return () => {
      if (socket) {
        socket.off("fee_category_created", handle);
        socket.off("fee_category_updated", handle);
        socket.off("fee_category_deleted", handle);
      }
    };
  }, [fetchFeeCategories]);

  const addFeeCategory = useCallback(
    async (newCategory: NewFeeCategory) => {
      try {
        const response = await createFeeCategory(newCategory);
        await fetchFeeCategories();
        return response.payload;
      } catch (error) {
        console.error("Error creating fee category:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to create fee category" });
        return null;
      }
    },
    [fetchFeeCategories, showError],
  );

  const updateFeeCategoryById = useCallback(
    async (id: number, category: Partial<NewFeeCategory>) => {
      try {
        const response = await updateFeeCategory(id, category);
        await fetchFeeCategories();
        return response.payload;
      } catch (error) {
        console.error("Error updating fee category:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to update fee category" });
        return null;
      }
    },
    [fetchFeeCategories, showError],
  );

  const deleteFeeCategoryById = useCallback(
    async (id: number) => {
      try {
        await deleteFeeCategory(id);
        await fetchFeeCategories();
        return true;
      } catch (error) {
        console.error("Error deleting fee category:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to delete fee category" });
        return false;
      }
    },
    [fetchFeeCategories, showError],
  );

  useEffect(() => {
    fetchFeeCategories();
  }, [fetchFeeCategories]);

  return {
    feeCategories,
    loading,
    fetchFeeCategories,
    addFeeCategory,
    updateFeeCategoryById,
    deleteFeeCategoryById,
  };
};

// ==================== FEE GROUPS HOOKS ====================

export const useFeeGroups = () => {
  const [feeGroups, setFeeGroups] = useState<FeeGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeeGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeeGroups();
      if (response.payload) {
        setFeeGroups(response.payload);
      } else {
        setFeeGroups([]);
      }
    } catch (error) {
      console.error("Error fetching fee groups:", error);
      showError({ message: "Failed to fetch fee groups" });
      setFeeGroups([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeeGroup = useCallback(
    async (newGroup: NewFeeGroup) => {
      try {
        const response = await createFeeGroup(newGroup);
        await fetchFeeGroups();
        return response.payload;
      } catch (error) {
        console.error("Error creating fee group:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to create fee group" });
        return null;
      }
    },
    [fetchFeeGroups, showError],
  );

  const updateFeeGroupById = useCallback(
    async (id: number, group: Partial<NewFeeGroup>) => {
      try {
        const response = await updateFeeGroup(id, group);
        await fetchFeeGroups();
        return response.payload;
      } catch (error) {
        console.error("Error updating fee group:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to update fee group" });
        return null;
      }
    },
    [fetchFeeGroups, showError],
  );

  const deleteFeeGroupById = useCallback(
    async (id: number) => {
      try {
        await deleteFeeGroup(id);
        await fetchFeeGroups();
        return true;
      } catch (error) {
        console.error("Error deleting fee group:", error);
        showError({ message: error instanceof Error ? error.message : "Failed to delete fee group" });
        return false;
      }
    },
    [fetchFeeGroups, showError],
  );

  useEffect(() => {
    fetchFeeGroups();
  }, [fetchFeeGroups]);

  return {
    feeGroups,
    loading,
    fetchFeeGroups,
    addFeeGroup,
    updateFeeGroupById,
    deleteFeeGroupById,
  };
};
