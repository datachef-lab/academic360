export { store } from "./store";
export type { RootState, AppDispatch } from "./store";
export { useAppDispatch, useAppSelector } from "./hooks";

// Re-export slice actions and selectors
export {
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
} from "./slices/academicYearSlice";
