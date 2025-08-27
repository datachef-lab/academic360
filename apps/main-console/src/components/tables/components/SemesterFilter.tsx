import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SemesterFilterProps {
  semesters: number[];
  currentSemester: string;
  onSemesterChange: (value: string) => void;
  totalSubjects: number;
}

const SemesterFilter: React.FC<SemesterFilterProps> = ({
  semesters,
  currentSemester,
  onSemesterChange,
  totalSubjects,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Select
          value={currentSemester}
          onValueChange={onSemesterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester} value={semester.toString()}>
                Semester {semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <p className="text-sm font-medium">
        Total: {totalSubjects} subjects
      </p>
    </div>
  );
};

export default SemesterFilter; 