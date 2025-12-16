import React, { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/features/auth/providers/auth-provider";
import type { AcademicYear } from "@repo/db/index";

interface AcademicYearSelectorProps {
  onAcademicYearChange?: (academicYear: AcademicYear | null) => void;
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * Academic Year Selector Component
 * Allows users to select and switch between academic years
 * Uses Redux for global state management
 */
export const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({
  onAcademicYearChange,
  className = "",
  disabled = false,
  showLabel = true,
}) => {
  const { accessToken } = useAuth();
  const { currentAcademicYear, availableAcademicYears, loading, error, setCurrentYear, loadAcademicYears } =
    useAcademicYear();

  // Load academic years only when access token is available
  useEffect(() => {
    if (accessToken && availableAcademicYears.length === 0) {
      loadAcademicYears();
    }
  }, [accessToken, availableAcademicYears.length, loadAcademicYears]);

  const handleAcademicYearChange = (yearId: string) => {
    const selectedYear = availableAcademicYears.find((year) => year.id?.toString() === yearId);
    if (selectedYear) {
      setCurrentYear(selectedYear);
      onAcademicYearChange?.(selectedYear);
    }
  };

  if (loading) {
    return (
      <div className={`${showLabel ? "space-y-2" : ""} ${className}`}>
        {showLabel && <Label>Academic Year</Label>}
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${showLabel ? "space-y-2" : ""} ${className}`}>
        {showLabel && <Label>Academic Year</Label>}
        <div className="rounded-md border border-destructive p-2 text-sm text-destructive">
          Error loading academic years: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`${showLabel ? "space-y-2" : ""} ${className}`}>
      {showLabel && (
        <Label htmlFor="academic-year-select" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Academic Year
          {currentAcademicYear?.isCurrentYear === true && (
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
          )}
        </Label>
      )}
      <Select
        value={currentAcademicYear?.id?.toString() || ""}
        onValueChange={handleAcademicYearChange}
        disabled={disabled || availableAcademicYears.length === 0}
      >
        <SelectTrigger id="academic-year-select">
          <SelectValue placeholder="Select Academic Year" />
        </SelectTrigger>
        <SelectContent>
          {availableAcademicYears.map((year) => (
            <SelectItem key={year.id} value={year.id?.toString() || ""}>
              <div className="flex items-center justify-between w-full">
                <span>{year.year}</span>
                {year.isCurrentYear === true && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
