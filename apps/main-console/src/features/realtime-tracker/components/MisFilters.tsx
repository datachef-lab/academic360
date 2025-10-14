import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { MisFilters } from "../types/mis-types";
import { Session } from "@/types/academics/session";
import { Class } from "@/types/academics/class";

interface MisFiltersProps {
  filters: MisFilters;
  onFiltersChange: (filters: MisFilters) => void;
  sessions?: Session[];
  classes?: Class[];
  isLoadingSessions?: boolean;
  isLoadingClasses?: boolean;
}

export function MisFiltersComponent({
  filters,
  onFiltersChange,
  sessions = [],
  classes = [],
  isLoadingSessions = false,
  isLoadingClasses = false,
}: MisFiltersProps) {
  const handleSessionChange = (sessionId: string) => {
    const newFilters = {
      ...filters,
      sessionId: parseInt(sessionId),
    };
    onFiltersChange(newFilters);
  };

  const handleClassChange = (classId: string) => {
    const newFilters = {
      ...filters,
      classId: parseInt(classId),
    };
    onFiltersChange(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Session Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Session</label>
            <Select
              value={filters.sessionId?.toString() || ""}
              onValueChange={handleSessionChange}
              disabled={isLoadingSessions}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id?.toString() || ""}>
                    {session.name}
                    {session.isCurrentSession && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Current
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Class</label>
            <Select
              value={filters.classId?.toString() || ""}
              onValueChange={handleClassChange}
              disabled={isLoadingClasses}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id?.toString() || ""}>
                    {classItem.name}
                    {classItem.shortName && <span className="text-gray-500 ml-1">({classItem.shortName})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
