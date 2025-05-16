import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CourseFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  degreeFilter: string;
  setDegreeFilter: (value: string) => void;
  programmeFilter: string;
  setProgrammeFilter: (value: string) => void;
  resetFilters: () => void;
  uniqueDegrees: string[];
  uniqueProgrammes: string[];
  filteredCoursesCount: number;
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  degreeFilter,
  setDegreeFilter,
  programmeFilter,
  setProgrammeFilter,
  resetFilters,
  uniqueDegrees,
  uniqueProgrammes,
  filteredCoursesCount,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Search input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-purple-500" />
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-white"
            />
          </div>

          {/* Degree filter */}
          <Select
            value={degreeFilter}
            onValueChange={setDegreeFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="Filter by Degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Degrees</SelectItem>
              {uniqueDegrees.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Programme filter */}
          <Select
            value={programmeFilter}
            onValueChange={setProgrammeFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="Filter by Programme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programmes</SelectItem>
              {uniqueProgrammes.map((programme) => (
                <SelectItem key={programme} value={programme}>
                  {programme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset button */}
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="bg-white hover:bg-purple-50"
          >
            Reset Filters
          </Button>
        </div>

        {/* Results count */}
        <div className="text-sm text-purple-600">
          Showing {filteredCoursesCount} {filteredCoursesCount === 1 ? 'course' : 'courses'}
        </div>
      </div>
    </div>
  );
};

export default CourseFilters; 