import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AcademicYear } from "@/types/academics/academic-year";

interface AcademicYearState {
  selectedAcademicYearId: number | null;
  selectedAcademicYear: AcademicYear | null;
  setSelectedById: (id: number | null, list?: AcademicYear[]) => void;
  reset: () => void;
}

export const useAcademicYearStore = create<AcademicYearState>()(
  persist(
    (set) => ({
      selectedAcademicYearId: null,
      selectedAcademicYear: null,
      setSelectedById: (id, list) =>
        set(() => {
          const selected =
            id != null && Array.isArray(list)
              ? list.find((ay) => ay.id === id) ?? null
              : null;
          return { selectedAcademicYearId: id, selectedAcademicYear: selected };
        }),
      reset: () => set({ selectedAcademicYearId: null, selectedAcademicYear: null }),
    }),
    { name: "academic-year-store" }
  )
);
