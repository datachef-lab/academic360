import React, { useEffect } from 'react';
import { Select } from 'antd';
import { FeesStructureDto } from '@/types/fees';
import { Course } from '@/types/academics/course';
import { AcademicYear } from '@/types/fees/index';

interface AcademicSetupProps {
  feesStructure: FeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
}

export const AcademicSetup: React.FC<AcademicSetupProps> = ({
  feesStructure,
  setFeesStructure,
  courses,
  academicYears,
}) => {
  const handleInputChange = (field: keyof FeesStructureDto, value: unknown) => {
    setFeesStructure(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };

  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<AcademicYear | null>(null);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[0]);
      handleInputChange('academicYear', academicYears[0])
    }
  }, [academicYears, selectedAcademicYear, setSelectedAcademicYear]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="grid grid-cols-1 gap-y-8 max-w-md w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <Select
            className="w-full"
            size="large"
            placeholder="Select Academic Year"
            value={feesStructure.academicYear?.id}
            onChange={(value) => handleInputChange('academicYear', academicYears.find(ay => ay.id === value))}
          >
            {academicYears.map(ay => (
              <Select.Option key={ay.id} value={ay.id!}>
                {`${new Date(ay.startYear).getFullYear()}`}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          <Select
            className="w-full"
            size="large"
            placeholder="Select Course"
            value={feesStructure.course?.id}
            onChange={(value) => handleInputChange('course', courses.find(c => c.id === value))}
          >
            {courses.map(course => (
              <Select.Option key={course.id} value={course.id!}>
                {course.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};
