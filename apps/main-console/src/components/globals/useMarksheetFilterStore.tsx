// stores/filterStore.ts
import { create } from 'zustand';

interface FilterState {
  semester: number | null;
  Category: string | null;
  setSemester: (semester: number) => void;
  setCategory: (Category: string) => void;
}

export const useMarksheetFilterStore = create<FilterState>((set) => ({
  semester: null,
  Category: null,
  setSemester: (semester) => set({ semester }),
  setCategory: (Category) => set({ Category }),
}));