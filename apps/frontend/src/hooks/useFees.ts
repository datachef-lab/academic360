import { useState, useEffect, useCallback } from 'react';
import { useError } from './useError';
import {
  // Fees Structure

  createFeesStructure,
  updateFeesStructure,
  deleteFeesStructure,
  
  // Fees Heads
  getAllFeesHeads,
  createFeesHead,
  updateFeesHead,
  deleteFeesHead,
  
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
  
  // Addons
  getAllAddons,
  createAddon,
  updateAddon,
  deleteAddon,
  
  // Student Fees Mapping
  getAllStudentFeesMappings,
  createStudentFeesMapping,
  updateStudentFeesMapping,
  deleteStudentFeesMapping,
  
  createFeesSlabYear,

  getAllFeesSlabYears,
} from '@/services/fees-api';
import {
  FeesStructureDto,
  FeesHead,
  FeesSlab,
  FeesReceiptType,
  AddOn,
  StudentFeesMapping,
  FeesSlabMapping,
  CreateFeesStructureDto,
  
} from '@/types/fees';
import {AcademicYear } from "@/types/academics/academic-year"
import { Course } from '@/types/academics/course';
import {
  getFeesStructures,
  getAcademicYearsFromFeesStructures,
  getCoursesFromFeesStructures,
  getFeesStructuresByAcademicYearAndCourse,
  
} from '@/services/fees-api';

// ==================== FEES STRUCTURE HOOKS ====================

export const useFeesStructures = () => {
  const [feesStructures, setFeesStructures] = useState<FeesStructureDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchFeesStructures = async () => {
    try {
      setLoading(true);
      const data = await getFeesStructures();
      setFeesStructures(data);
    } catch {
      showError({ message: 'Failed to fetch fees structures' });
    } finally {
      setLoading(false);
    }
  };

  const addFeesStructure = useCallback(async (newFeesStructure: CreateFeesStructureDto) => {
    try {
      const response = await createFeesStructure(newFeesStructure);
      await fetchFeesStructures();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create fees structure' });
      return null;
    }
  }, []);

  const updateFeesStructureById = useCallback(async (id: number, feesStructure: Partial<FeesStructureDto>) => {
    try {
      const response = await updateFeesStructure(id, feesStructure);
      await fetchFeesStructures();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update fees structure' });
      return null;
    }
  }, []);

  const deleteFeesStructureById = useCallback(async (id: number) => {
    try {
      await deleteFeesStructure(id);
      await fetchFeesStructures();
      return true;
    } catch {
      showError({ message: 'Failed to delete fees structure' });
      return false;
    }
  }, []);

  useEffect(() => {
    fetchFeesStructures();
  }, []);

  return { feesStructures, loading, refetch: fetchFeesStructures, addFeesStructure, updateFeesStructureById, deleteFeesStructureById };
};

export const useAcademicYearsFromFeesStructures = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const data = await getAcademicYearsFromFeesStructures();
      setAcademicYears(data);
    } catch {
      showError({ message: 'Failed to fetch academic years from fees structures' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

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
        showError({ message: 'Failed to fetch courses from fees structures' });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [academicYearId]);

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
        showError({ message: 'Failed to fetch fees structures by academic year and course' });
      } finally {
        setLoading(false);
      }
    };

    fetchFeesStructures();
  }, [academicYearId, courseId]);

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
      showError({ message: 'Failed to fetch fees heads' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeesHead = useCallback(async (newFeesHead: FeesHead) => {
    try {
      const response = await createFeesHead(newFeesHead);
      await fetchFeesHeads();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create fees head' });
      return null;
    }
  }, [fetchFeesHeads, showError]);

  const updateFeesHeadById = useCallback(async (id: number, feesHead: Partial<FeesHead>) => {
    try {
      const response = await updateFeesHead(id, feesHead);
      await fetchFeesHeads();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update fees head' });
      return null;
    }
  }, [fetchFeesHeads, showError]);

  const deleteFeesHeadById = useCallback(async (id: number) => {
    try {
      await deleteFeesHead(id);
      await fetchFeesHeads();
      return true;
    } catch {
      showError({ message: 'Failed to delete fees head' });
      return false;
    }
  }, [fetchFeesHeads, showError]);

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
      showError({ message: 'Failed to fetch fees slabs' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeesSlab = useCallback(async (newFeesSlab: FeesSlab) => {
    try {
      const response = await createFeesSlab(newFeesSlab);
      await fetchFeesSlabs();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create fees slab' });
      return null;
    }
  }, [fetchFeesSlabs, showError]);

  const updateFeesSlabById = useCallback(async (id: number, feesSlab: Partial<FeesSlab>) => {
    try {
      const response = await updateFeesSlab(id, feesSlab);
      await fetchFeesSlabs();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update fees slab' });
      return null;
    }
  }, [fetchFeesSlabs, showError]);

  const deleteFeesSlabById = useCallback(async (id: number) => {
    try {
      await deleteFeesSlab(id);
      await fetchFeesSlabs();
      return true;
    } catch {
      showError({ message: 'Failed to delete fees slab' });
      return false;
    }
  }, [fetchFeesSlabs, showError]);

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
      showError({ message: 'Failed to fetch fees receipt types' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeesReceiptType = useCallback(async (newFeesReceiptType: FeesReceiptType) => {
    try {
      const response = await createFeesReceiptType(newFeesReceiptType);
      await fetchFeesReceiptTypes();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create fees receipt type' });
      return null;
    }
  }, [fetchFeesReceiptTypes, showError]);

  const updateFeesReceiptTypeById = useCallback(async (id: number, feesReceiptType: Partial<FeesReceiptType>) => {
    try {
      const response = await updateFeesReceiptType(id, feesReceiptType);
      await fetchFeesReceiptTypes();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update fees receipt type' });
      return null;
    }
  }, [fetchFeesReceiptTypes, showError]);

  const deleteFeesReceiptTypeById = useCallback(async (id: number) => {
    try {
      await deleteFeesReceiptType(id);
      await fetchFeesReceiptTypes();
      return true;
    } catch {
      showError({ message: 'Failed to delete fees receipt type' });
      return false;
    }
  }, [fetchFeesReceiptTypes, showError]);

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
      showError({ message: 'Failed to fetch addons' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addAddon = useCallback(async (newAddon: AddOn) => {
    try {
      const response = await createAddon(newAddon);
      await fetchAddons();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create addon' });
      return null;
    }
  }, [fetchAddons, showError]);

  const updateAddonById = useCallback(async (id: number, addon: Partial<AddOn>) => {
    try {
      const response = await updateAddon(id, addon);
      await fetchAddons();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update addon' });
      return null;
    }
  }, [fetchAddons, showError]);

  const deleteAddonById = useCallback(async (id: number) => {
    try {
      await deleteAddon(id);
      await fetchAddons();
      return true;
    } catch {
      showError({ message: 'Failed to delete addon' });
      return false;
    }
  }, [fetchAddons, showError]);

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
      showError({ message: 'Failed to fetch student fees mappings' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addStudentFeesMapping = useCallback(async (newStudentFeesMapping: StudentFeesMapping) => {
    try {
      const response = await createStudentFeesMapping(newStudentFeesMapping);
      await fetchStudentFeesMappings();
      return response.payload;
    } catch {
      showError({ message: 'Failed to create student fees mapping' });
      return null;
    }
  }, [fetchStudentFeesMappings, showError]);

  const updateStudentFeesMappingById = useCallback(async (id: number, studentFeesMapping: Partial<StudentFeesMapping>) => {
    try {
      const response = await updateStudentFeesMapping(id, studentFeesMapping);
      await fetchStudentFeesMappings();
      return response.payload;
    } catch {
      showError({ message: 'Failed to update student fees mapping' });
      return null;
    }
  }, [fetchStudentFeesMappings, showError]);

  const deleteStudentFeesMappingById = useCallback(async (id: number) => {
    try {
      await deleteStudentFeesMapping(id);
      await fetchStudentFeesMappings();
      return true;
    } catch {
      showError({ message: 'Failed to delete student fees mapping' });
      return false;
    }
  }, [fetchStudentFeesMappings, showError]);

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
      showError({ message: 'Failed to fetch fees slab years' });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const addFeesSlabMappings = useCallback(async (newFeesSlabMappings: FeesSlabMapping[]) => {
    try {
      const createdSlabYears = await Promise.all(
        newFeesSlabMappings.map(slabYear => createFeesSlabYear(slabYear))
      );
      await fetchFeesSlabMappings();
      return createdSlabYears.map(res => res.payload);
    } catch {
      showError({ message: 'Failed to create fees slab years' });
      return null;
    }
  }, [fetchFeesSlabMappings, showError]);

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