import { AcademicYear } from "@repo/db/schemas";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the initial state interface
export interface AcademicYearState {
  currentAcademicYear: AcademicYear | null;
  availableAcademicYears: AcademicYear[];
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: AcademicYearState = {
  currentAcademicYear: null,
  availableAcademicYears: [],
  loading: false,
  error: null,
};

// Create the academic year slice
const academicYearSlice = createSlice({
  name: "academicYear",
  initialState,
  reducers: {
    // Set the current academic year
    setCurrentAcademicYear: (state, action: PayloadAction<AcademicYear>) => {
      state.currentAcademicYear = action.payload;
      state.error = null;
    },

    // Set available academic years
    setAvailableAcademicYears: (state, action: PayloadAction<AcademicYear[]>) => {
      state.availableAcademicYears = action.payload;
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetAcademicYearState: (state) => {
      state.currentAcademicYear = null;
      state.availableAcademicYears = [];
      state.loading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setCurrentAcademicYear,
  setAvailableAcademicYears,
  setLoading,
  setError,
  clearError,
  resetAcademicYearState,
} = academicYearSlice.actions;

// Export reducer
export default academicYearSlice.reducer;

// Selectors
export const selectCurrentAcademicYear = (state: { academicYear: AcademicYearState }) =>
  state.academicYear.currentAcademicYear;

export const selectAvailableAcademicYears = (state: { academicYear: AcademicYearState }) =>
  state.academicYear.availableAcademicYears;

export const selectAcademicYearLoading = (state: { academicYear: AcademicYearState }) => state.academicYear.loading;

export const selectAcademicYearError = (state: { academicYear: AcademicYearState }) => state.academicYear.error;
