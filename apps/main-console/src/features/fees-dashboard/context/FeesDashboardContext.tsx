import { createContext, ReactNode, useContext } from "react";
import { useFeesDashboardData } from "../hooks/useFeesDashboardData";
import type { FeesDashboardFilters } from "../types/dashboard-api";

type FeesDashboardContextValue = ReturnType<typeof useFeesDashboardData>;

const FeesDashboardContext = createContext<FeesDashboardContextValue | null>(null);

export function FeesDashboardProvider({
  children,
  filters = {},
}: {
  children: ReactNode;
  filters?: FeesDashboardFilters;
}) {
  const value = useFeesDashboardData(filters);
  return <FeesDashboardContext.Provider value={value}>{children}</FeesDashboardContext.Provider>;
}

export function useFeesDashboard() {
  const ctx = useContext(FeesDashboardContext);
  if (!ctx) {
    throw new Error("useFeesDashboard must be used within FeesDashboardProvider");
  }
  return ctx;
}
