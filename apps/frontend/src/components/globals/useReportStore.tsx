// stores/reportStore.ts
import { create } from 'zustand';

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

type ReportFilters= {
  stream: string | null;
  year: string | null;
  framework?: string | null;
  semester?: number | 0;
  showFailedOnly?: boolean;
 
  page?: number | 0;
  pageSize?: number | 0;
}

interface ReportStore {
  filters: ReportFilters;
  filteredData: Report[];
  setFilters: (filters: ReportFilters) => void;
  setFilteredData: (data: Report[]) => void;
}



export const useReportStore = create<ReportStore>((set) => ({
  filters: {
    stream: null,
    year: null,
    framework: null,
    semester: 0,
    showFailedOnly: false,
    page: 0,
    pageSize: 0,
  },
  filteredData: [],
  setFilters: (filters) => {
    console.log('Setting filters:', filters);
    set({ filters });
  },
  setFilteredData: (filteredData) => {
    console.log('Setting filtered data:1***', filteredData);
    set({ filteredData });
  },
}));