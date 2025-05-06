import { Framework } from "@/types/enums";
import { MarksheetTableType } from "@/types/tableTypes/MarksheetTableType";
import { Student } from "@/types/user/student";
import { create } from "zustand";




type uiFilters = {
  selectedStream: { name: string } | null;
  selectedYear: string | null;
  selectedSemester: number | null;
  selectedFramework: Framework | null;
};
type ReportFilters = {
  stream: string | null;
  year: string | null;
  framework?: string | null;
  semester?: number | null;
  // showFailedOnly?: boolean;

  page?: number | 0;
  pageSize?: number | 0;
};

interface ReportStore {
  filters: ReportFilters;
  uiFilters: uiFilters;
  filteredData: MarksheetTableType[];
  
  setFilters: (filters: ReportFilters) => void;
  setFilteredData: (data: MarksheetTableType[]) => void;
  StudentData: Student[];
  setStudentData:(data:Student[])=>void;
  setUiFilters: (uiFilters: Partial<uiFilters>) => void;
}

export const useMarksheetStore = create<ReportStore>((set) => ({
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
