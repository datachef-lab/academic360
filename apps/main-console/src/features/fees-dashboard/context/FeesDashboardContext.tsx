import { createContext, ReactNode, useContext } from "react";
import { useFeesDashboardData } from "../hooks/useFeesDashboardData";
import type { DefaultDashboardFiltersResult } from "../utils/scope-filter-defaults";
import type { FeesDashboardFilters } from "../types/dashboard-api";

type FeesDashboardContextValue = ReturnType<typeof useFeesDashboardData>;

const FeesDashboardContext = createContext<FeesDashboardContextValue | null>(null);

export function FeesDashboardProvider({
  children,
  filters = {},
  enabled = true,
  academicYearLabel,
  onScopeFiltersRefresh,
}: {
  children: ReactNode;
  filters?: FeesDashboardFilters;
  enabled?: boolean;
  academicYearLabel?: string;
  /** Re-apply dashboard filters when academic activity scopes change (live socket). */
  onScopeFiltersRefresh?: (resolved: DefaultDashboardFiltersResult) => void;
}) {
  const value = useFeesDashboardData(filters, {
    enabled,
    academicYearLabel,
    onScopeFiltersRefresh,
  });
  return <FeesDashboardContext.Provider value={value}>{children}</FeesDashboardContext.Provider>;
}

export function useFeesDashboard() {
  const ctx = useContext(FeesDashboardContext);
  if (!ctx) {
    throw new Error("useFeesDashboard must be used within FeesDashboardProvider");
  }
  return ctx;
}
