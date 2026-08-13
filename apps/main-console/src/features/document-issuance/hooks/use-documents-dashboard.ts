import { useQuery } from "@tanstack/react-query";
import {
  getDashboardFeeClearance,
  getDashboardHandovers,
  getDashboardSummary,
} from "@/features/document-issuance/services/documents-dashboard.service";

export const documentsDashboardKeys = {
  all: ["documents-dashboard"] as const,
  summary: () => [...documentsDashboardKeys.all, "summary"] as const,
  handovers: () => [...documentsDashboardKeys.all, "handovers"] as const,
  feeClearance: () => [...documentsDashboardKeys.all, "fee-clearance"] as const,
};

export const useDashboardSummary = () =>
  useQuery({
    queryKey: documentsDashboardKeys.summary(),
    queryFn: getDashboardSummary,
    staleTime: 30 * 1000,
  });

export const useDashboardHandovers = () =>
  useQuery({
    queryKey: documentsDashboardKeys.handovers(),
    queryFn: () => getDashboardHandovers(),
    staleTime: 30 * 1000,
  });

export const useDashboardFeeClearance = () =>
  useQuery({
    queryKey: documentsDashboardKeys.feeClearance(),
    queryFn: () => getDashboardFeeClearance(),
    staleTime: 30 * 1000,
  });
