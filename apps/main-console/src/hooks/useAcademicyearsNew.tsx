import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllAcademicYears } from "../services/academic-year-api";
import type { AcademicYear } from "../types/academics/academic-year";
import type { ApiResonse } from "../types/api-response";
import { useAuth } from "@/features/auth/providers/auth-provider";

export function useAcademicYears() {
  const { isInitialized, accessToken } = useAuth();
  
  return useQuery({
    queryKey: ["academicYears"],
    queryFn: getAllAcademicYears,
    enabled: isInitialized && !!accessToken, // Only run when auth is initialized and token exists
    staleTime: 1 * 60 * 1000, // cache for 1 min
  });
}

export type AcademicYearOption = { value: number; label: string };

export function useAcademicYearOptions() {
  const query = useAcademicYears();

  const list = useMemo<AcademicYear[]>(() => {
    const payload = (query.data as ApiResonse<AcademicYear[]> | undefined)?.payload;
    return Array.isArray(payload) ? payload : [];
  }, [query.data]);

  const options = useMemo<AcademicYearOption[]>(() => {
    return list.map((ay) => ({
      value: ay.id ?? 0,
      label: ay.year,
    }));
  }, [list]);

  return { ...query, list, options };
}