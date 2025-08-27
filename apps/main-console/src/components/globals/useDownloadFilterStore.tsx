import { Framework } from "@/types/enums";

import { User } from "@/types/user/user";
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
type downloadUiFilters = {
  selectedStream: { name: string } | null;
  selectedYear: string | null;
  selectedSemester: number | null;
  selectedFramework: Framework | null;
};
type DownloadReportFilters = {
  stream: string | null;
  year: string | null;
  framework?: string | null;
  semester?: number | null;
  // showFailedOnly?: boolean;

  page?: number | 0;
  pageSize?: number | 0;
};

interface ReportStore {
  downloadfilters: DownloadReportFilters;
  downloadUiFilters: downloadUiFilters;
  downloadFilteredData: Report[];
  
  setDownloadFilters: (downloadfilters: DownloadReportFilters) => void;
  setDownloadFilteredData: (data: Report[]) => void;
  SearchStudentData: User[];
  setSearchStudentData:(data:User[])=>void;
  setDownloadUiFilters: (uiFilters: Partial<downloadUiFilters>) => void;
}

export const useDownloadFilterStore = create<ReportStore>((set) => ({
  downloadfilters: {
    stream: null,
    year: null,
    framework: null,
    semester: null,
    // showFailedOnly: false,
    page: 0,
    pageSize: 0,
  },
  downloadUiFilters: {
    selectedStream: null,
    selectedYear: null,
    selectedSemester: null,
    selectedFramework: null,
  },
  SearchStudentData: [],
  
  downloadFilteredData: [],
  setDownloadFilters: (filters) => {
    set({ downloadfilters: filters });
  },
  setDownloadUiFilters: (uiFilters) => {
    set((state) => ({ downloadUiFilters: { ...state.downloadUiFilters, ...uiFilters } }));
  },
  setSearchStudentData:(SearchStudentData)=>{
    set({SearchStudentData});
  },
  setDownloadFilteredData: (downloadFilteredData) => {
    set({ downloadFilteredData });
  },
}));


type ToggleStore = {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (value: boolean) => void;
};

export const useToggleStore = create<ToggleStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (value) => set({ isOpen: value }),
}));
