import { Framework } from "@/types/enums";
import { Student } from "@/types/user/student";
import { create } from "zustand";

interface Subject {
  name: string;
  obtained: number;
  outOf: number;
  status: string;
  credit: number;
  letterGrade: string;
}

interface Report {
  id: number;
  rollNumber: string;
  registrationNumber: string;
  uid: string;
  name: string;
  semester: number;
  stream: string;
  framework: string;
  year: number;
  sgpa: number;
  cgpa: number;
  letterGrade: string;
  remarks: string;
  percentage: string;
  subjects: Subject[];
  totalFullMarks: number;
  totalObtainedMarks: number;
  totalCredit: number;
  isFailed: boolean;
  status: string;
  historicalStatus: string;
}
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
  export?: boolean;

  page?: number | 0;
  pageSize?: number | 0;
};

interface ReportStore {
  filters: ReportFilters;
  uiFilters: uiFilters;
  filteredData: Report[];
  
  setFilters: (filters: ReportFilters) => void;
  setFilteredData: (data: Report[]) => void;
  StudentData: Student[];
  setStudentData:(data:Student[])=>void;
  setUiFilters: (uiFilters: Partial<uiFilters>) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
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
