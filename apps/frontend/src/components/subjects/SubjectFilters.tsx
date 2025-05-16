import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentSemester: string;
  setCurrentSemester: (semester: string) => void;
  degreeFilter: string;
  setDegreeFilter: (degree: string) => void;
  subjectType: string;
  setSubjectType: (type: string) => void;
  isOptionalFilter: string;
  setIsOptionalFilter: (isOptional: string) => void;
  uniqueSemesters: number[];
  uniqueDegrees: string[];
  uniqueSubjectTypes: string[];
  resetFilters: () => void;
  filteredSubjectsCount: number;
}

const SubjectFilters: React.FC<SubjectFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  currentSemester,
  setCurrentSemester,
  degreeFilter,
  setDegreeFilter,
  subjectType,
  setSubjectType,
  isOptionalFilter,
  setIsOptionalFilter,
  uniqueSemesters,
  uniqueDegrees,
  uniqueSubjectTypes,
  resetFilters,
  filteredSubjectsCount,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-900">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-purple-500" />
            <Input
              placeholder="Search by name or code..."
              className="pl-8 border-purple-300 focus:border-purple-700 focus:ring-purple-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-900">Semester</label>
          <Select value={currentSemester} onValueChange={setCurrentSemester}>
            <SelectTrigger className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              <SelectItem value="all">All Semesters</SelectItem>
              {uniqueSemesters.map((semester) => (
                <SelectItem key={semester} value={semester.toString()}>
                  Semester {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-900">Degree</label>
          <Select value={degreeFilter} onValueChange={setDegreeFilter}>
            <SelectTrigger className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="All Degrees" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              <SelectItem value="all">All Degrees</SelectItem>
              {uniqueDegrees.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-900">Subject Type</label>
          <Select value={subjectType} onValueChange={setSubjectType}>
            <SelectTrigger className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              <SelectItem value="all">All Types</SelectItem>
              {uniqueSubjectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-900">Optional</label>
          <Select value={isOptionalFilter} onValueChange={setIsOptionalFilter}>
            <SelectTrigger className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="Optional Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="true">Optional Only</SelectItem>
              <SelectItem value="false">Required Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-purple-700" />
          <span className="text-sm font-medium text-purple-900">Filters Applied</span>
          {currentSemester !== "all" && (
            <Badge variant="outline" className="gap-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
              Semester {currentSemester}
              <Check className="h-3 w-3 text-purple-700" />
            </Badge>
          )}
          {degreeFilter !== "all" && (
            <Badge variant="outline" className="gap-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
              {degreeFilter}
              <Check className="h-3 w-3 text-purple-700" />
            </Badge>
          )}
          {subjectType !== "all" && (
            <Badge variant="outline" className="gap-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
              {subjectType}
              <Check className="h-3 w-3 text-purple-700" />
            </Badge>
          )}
          {isOptionalFilter !== "all" && (
            <Badge variant="outline" className="gap-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
              {isOptionalFilter === "true" ? "Optional" : "Required"}
              <Check className="h-3 w-3 text-purple-700" />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="outline" className="gap-1 text-xs bg-purple-100 text-purple-800 border-purple-300">
              Search: {searchQuery}
              <Check className="h-3 w-3 text-purple-700" />
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="border-purple-300 text-purple-800 hover:bg-purple-100 hover:text-purple-900"
          >
            Reset Filters
          </Button>
          <Badge className="bg-purple-700 text-white hover:bg-purple-800">
            Total: {filteredSubjectsCount} subjects
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default SubjectFilters; 