import React from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface AcademicYearDisplayProps {
  className?: string;
  showIcon?: boolean;
  showCurrentBadge?: boolean;
  variant?: "default" | "compact" | "minimal";
}

/**
 * Academic Year Display Component
 * Shows the current academic year with optional styling variants
 * Uses Redux for global state management
 */
export const AcademicYearDisplay: React.FC<AcademicYearDisplayProps> = ({
  className = "",
  showIcon = true,
  showCurrentBadge = true,
  variant = "default",
}) => {
  const { currentAcademicYear, loading, error } = useAcademicYear();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Calendar className="h-4 w-4 animate-pulse" />}
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Calendar className="h-4 w-4 text-destructive" />}
        <span className="text-sm text-destructive">Error loading year</span>
      </div>
    );
  }

  if (!currentAcademicYear) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">No year selected</span>
      </div>
    );
  }

  const renderContent = () => {
    switch (variant) {
      case "minimal":
        return <span className="text-sm font-medium">{currentAcademicYear.year}</span>;

      case "compact":
        return (
          <div className="flex items-center gap-1">
            {showIcon && <Calendar className="h-3 w-3" />}
            <span className="text-xs font-medium">{currentAcademicYear.year}</span>
            {showCurrentBadge && currentAcademicYear.isCurrentYear === true && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Current
              </Badge>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2">
            {showIcon && <Calendar className="h-4 w-4" />}
            <span className="text-sm font-medium">{currentAcademicYear.year}</span>
            {showCurrentBadge && currentAcademicYear.isCurrentYear === true && (
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            )}
          </div>
        );
    }
  };

  return <div className={className}>{renderContent()}</div>;
};
