import { useCallback } from "react";
import { AcademicYear } from "@repo/db/index";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  setCurrentAcademicYear,
  setAvailableAcademicYears,
  setLoading,
  setError,
  clearError,
  resetAcademicYearState,
  selectCurrentAcademicYear,
  selectAvailableAcademicYears,
  selectAcademicYearLoading,
  selectAcademicYearError,
} from "@/store/slices/academicYearSlice";

/**
 * Custom hook for managing academic year state
 * Provides easy access to academic year data and actions
 */
export const useAcademicYear = () => {
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();

  // Selectors
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);
  const availableAcademicYears = useAppSelector(selectAvailableAcademicYears);
  const loading = useAppSelector(selectAcademicYearLoading);
  const error = useAppSelector(selectAcademicYearError);

  // Actions
  const setCurrentYear = useCallback(
    (academicYear: AcademicYear) => {
      dispatch(setCurrentAcademicYear(academicYear));
    },
    [dispatch],
  );

  const setAvailableYears = useCallback(
    (academicYears: AcademicYear[]) => {
      dispatch(setAvailableAcademicYears(academicYears));
    },
    [dispatch],
  );

  const setLoadingState = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoading(isLoading));
    },
    [dispatch],
  );

  const setErrorState = useCallback(
    (errorMessage: string) => {
      dispatch(setError(errorMessage));
    },
    [dispatch],
  );

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetState = useCallback(() => {
    dispatch(resetAcademicYearState());
  }, [dispatch]);

  // Helper functions
  const isCurrentYear = useCallback(
    (academicYear: AcademicYear) => {
      return currentAcademicYear?.id === academicYear.id;
    },
    [currentAcademicYear],
  );

  const findAcademicYearById = useCallback(
    (id: number) => {
      return availableAcademicYears.find((year) => year.id === id);
    },
    [availableAcademicYears],
  );

  const getActiveAcademicYears = useCallback(() => {
    return availableAcademicYears.filter((year) => year.isCurrentYear === true);
  }, [availableAcademicYears]);

  // API functions
  const loadAcademicYears = useCallback(async () => {
    // Only load if access token is available
    if (!accessToken) {
      console.log("Academic Year Hook: Access token not available, skipping academic year load");
      return;
    }

    console.log("Academic Year Hook: Loading academic years with token:", accessToken ? "Present" : "Missing");
    setLoadingState(true);
    try {
      const response = await getAllAcademicYears();
      console.log("Academic Year Hook: API Response:", response);
      const allYears = response.payload;

      setAvailableYears(allYears);
      console.log("Academic Year Hook: Set available years:", allYears.length);

      // Find and set current academic year (the one marked as isCurrentYear)
      const currentYear = allYears.find((year) => year.isCurrentYear === true);
      if (currentYear && !currentAcademicYear) {
        setCurrentYear(currentYear);
        console.log("Academic Year Hook: Set current year:", currentYear.year);
      }
    } catch (err) {
      console.error("Academic Year Hook: Error loading academic years:", err);
      setErrorState(err instanceof Error ? err.message : "Failed to load academic years");
    } finally {
      setLoadingState(false);
    }
  }, [accessToken, setAvailableYears, setCurrentYear, setLoadingState, setErrorState, currentAcademicYear]);

  const switchToAcademicYear = useCallback(
    async (academicYear: AcademicYear) => {
      setLoadingState(true);
      try {
        // Optionally call API to set as current year on backend
        // await academicYearService.setCurrentAcademicYear(academicYear.id);
        setCurrentYear(academicYear);
      } catch (err) {
        setErrorState(err instanceof Error ? err.message : "Failed to switch academic year");
      } finally {
        setLoadingState(false);
      }
    },
    [setCurrentYear, setLoadingState, setErrorState],
  );

  return {
    // State
    currentAcademicYear,
    availableAcademicYears,
    loading,
    error,

    // Actions
    setCurrentYear,
    setAvailableYears,
    setLoadingState,
    setErrorState,
    clearErrorState,
    resetState,

    // API functions
    loadAcademicYears,
    switchToAcademicYear,

    // Helper functions
    isCurrentYear,
    findAcademicYearById,
    getActiveAcademicYears,
  };
};
