import { useState, useEffect, useCallback } from "react";
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
  StudentFeesMapping,
  FeesSlabMapping,
  CreateFeesStructureDto,
} from "@/types/fees";
import { CreateFeeStructureDto, FeeStructureDto } from "@repo/db/dtos/fees";
import { AcademicYear } from "@/types/academics/academic-year";
import { Course } from "@/types/course-design";
import {
  getAcademicYearsFromFeesStructures,
  getCoursesFromFeesStructures,
  getFeesStructuresByAcademicYearAndCourse,
} from "@/services/fees-api";
import { FeeConcessionSlabT } from "@/schemas";

// ==================== FEES STRUCTURE HOOKS ====================

export const useFeesStructures = () => {
  const [feesStructures, setFeesStructures] = useState<FeeStructureDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const { showError } = useError();

  const fetchFeesStructures = useCallback(
    async (
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
      try {
        setLoading(true);
        const response = await getAllFeesStructures(page, pageSize, filters);
        if (response.payload) {
          setFeesStructures(response.payload.content);
          setPagination({
            page: response.payload.page,
            pageSize: response.payload.pageSize,
            totalElements: response.payload.totalElements,
            totalPages: response.payload.totalPages,
          });
        } else {
          setFeesStructures([]);
        }
      } catch {
        showError({ message: "Failed to fetch fees structures" });
        setFeesStructures([]);
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  const addFeesStructure = useCallback(
    async (newFeesStructure: CreateFeesStructureDto | CreateFeeStructureDto) => {
      try {
        // Check if it's the new CreateFeeStructureDto format (has programCourseIds and shiftIds arrays)
        const isNewDto = "programCourseIds" in newFeesStructure && "shiftIds" in newFeesStructure;

        if (isNewDto) {
          // Use the new bulk creation endpoint
          const response = await createFeeStructureByDto(newFeesStructure as CreateFeeStructureDto);
          await fetchFeesStructures(1, 10);
          return response.payload;
        } else {
          // Use the old single creation endpoint
          const response = await createFeesStructure(newFeesStructure);
          await fetchFeesStructures(1, 10);
          return response.payload;
        }
      } catch (error) {
        console.error("Error creating fees structure:", error);
        showError({ message: "Failed to create fees structure" });
        return null;
      }
    },
    [fetchFeesStructures, showError],
  );

  const updateFeesStructureById = useCallback(
    async (id: number, feesStructure: Partial<FeeStructureDto>) => {
      try {
        const response = await updateFeesStructure(id, feesStructure);
        await fetchFeesStructures(1, 10);
        return response.payload;
      } catch {
        showError({ message: "Failed to update fees structure" });
        return null;
      }
    },
    [fetchFeesStructures, showError],
  );

  const deleteFeesStructureById = useCallback(
    async (id: number) => {
      try {
        await deleteFeesStructure(id);
        await fetchFeesStructures(1, 10);
        return true;
      } catch {
        showError({ message: "Failed to delete fees structure" });
        return false;
      }
    },
    [fetchFeesStructures, showError],
  );

  // Remove initial fetch - let the component control when to fetch
  // useEffect(() => {
  //   fetchFeesStructures();
  // }, []);

  return {
    feesStructures,
    loading,
    pagination,
    refetch: fetchFeesStructures,
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
      setFeesSlabs(response || []);
    } catch {
      showError({ message: "Failed to fetch fees slabs" });
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
  const [studentFeesMappings, setStudentFeesMappings] = useState<StudentFeesMapping[]>([]);
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
    async (newStudentFeesMapping: StudentFeesMapping) => {
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
    async (id: number, studentFeesMapping: Partial<StudentFeesMapping>) => {
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
  const [concessionSlabs, setConcessionSlabs] = useState<FeeConcessionSlabT[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeeConcessionSlabs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFeeConcessionSlabs();
      if (response.payload) {
        setConcessionSlabs(response.payload);
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
    async (newSlab: FeeConcessionSlabT) => {
      try {
        // Map FeeConcessionSlabT to NewFeeConcessionSlab format
        const mappedSlab: NewFeeConcessionSlab = {
          name: newSlab.name,
          description: newSlab.description,
          defaultConcessionRate: newSlab.defaultConcessionRate ?? 0,
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
    async (id: number, slab: Partial<FeeConcessionSlabT>) => {
      try {
        // Map Partial<FeeConcessionSlabT> to Partial<NewFeeConcessionSlab> format
        const mappedSlab: Partial<NewFeeConcessionSlab> = {
          ...(slab.name !== undefined && { name: slab.name }),
          ...(slab.description !== undefined && { description: slab.description }),
          ...(slab.defaultConcessionRate !== undefined &&
            slab.defaultConcessionRate !== null && {
              defaultConcessionRate: slab.defaultConcessionRate,
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
