import { createContext, ReactNode, useContext } from "react";
import { useFeesDashboardData } from "../hooks/useFeesDashboardData";

type FeesDashboardContextValue = ReturnType<typeof useFeesDashboardData>;

const FeesDashboardContext = createContext<FeesDashboardContextValue | null>(null);

export function FeesDashboardProvider({ children }: { children: ReactNode }) {
  const value = useFeesDashboardData();
  return <FeesDashboardContext.Provider value={value}>{children}</FeesDashboardContext.Provider>;
}

export function useFeesDashboard() {
  const ctx = useContext(FeesDashboardContext);
  if (!ctx) {
    throw new Error("useFeesDashboard must be used within FeesDashboardProvider");
  }
  return ctx;
}
