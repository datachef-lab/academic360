import { Framework } from "@/types/enums";

import { Student } from "@/types/user/student";
import { create } from "zustand";





type uiFilters = {
  selectedStream: { name: string } | null;
  selectedYear: string | null;
  selectedSemester: number | null;
  selectedFramework: Framework | null;
};
type StudentFilters = {
  stream: string | null;
  year: string | null;
  framework?: string | null;
  semester?: number | null;
  // showFailedOnly?: boolean;
  export?: boolean;

  page?: number | 0;
  pageSize?: number | 0;
};

interface StudentDownloadStore {
  filters: StudentFilters;
  uiFilters: uiFilters;
  filteredData: Student[];
  
  setFilters: (filters: StudentFilters) => void;
  setFilteredData: (data: Student[]) => void;
  StudentData: Student[];
  setStudentData:(data:Student[])=>void;
  setUiFilters: (uiFilters: Partial<uiFilters>) => void;
}

export const useStudentDownloadStore = create<StudentDownloadStore>((set) => ({
  filters: {
    stream: null,
    year: null,
    framework: null,
    semester: null,
    // showFailedOnly: false,
    page: 0,
    pageSize: 0,
  },
  uiFilters: {
    selectedStream: null,
    selectedYear: null,
    selectedSemester: null,
    selectedFramework: null,
  },
  StudentData: [],
  
  filteredData: [],
  setFilters: (filters) => {
    set({ filters });
  },
  setUiFilters: (uiFilters) => {
    set((state) => ({ uiFilters: { ...state.uiFilters, ...uiFilters } }));
  },
  setStudentData:(StudentData)=>{
    set({StudentData});
  },
  setFilteredData: (filteredData) => {
    set({ filteredData });
  },
}));
