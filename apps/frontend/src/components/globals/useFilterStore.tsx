import { create } from "zustand";

// Define possible values for Stream and Year
type Stream = "BCOM" | "BA" | "BSC" | "All";
type Year = "2021" | "2022" | "2023" | "2024" | "2025";

// Define the Zustand store interface
interface FilterState {
  stream: Stream | null; // Selected stream
  year: Year | null; // Selected year
  setStream: (stream: Stream) => void; // Function to update stream
  setYear: (year: Year) => void; // Function to update year
}

// Create Zustand store for managing filter states
export const useFilterStore = create<FilterState>((set) => ({
  stream: null,
  year: null,
  setStream: (stream) => set({ stream }),
  setYear: (year) => set({ year }),
}));
