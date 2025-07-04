import React, { useEffect } from 'react';
import { Select } from 'antd';
import { FeesStructureDto, CreateFeesStructureDto } from '@/types/fees';
import { Course } from '@/types/academics/course';
import { AcademicYear } from '@/types/academics/academic-year';

interface AcademicSetupPropsAdd {
  feesStructure: CreateFeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  formType: 'add';
}

interface AcademicSetupPropsEdit {
  feesStructure: FeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  formType: 'edit';
}

type AcademicSetupProps = AcademicSetupPropsAdd | AcademicSetupPropsEdit;

export const AcademicSetup: React.FC<AcademicSetupProps> = (props) => {
  const { courses, academicYears, formType } = props;
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState<AcademicYear | null>(null);

  React.useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(academicYears[0]);
      if (formType === 'add') {
        props.setFeesStructure(prev => ({ ...prev, academicYear: academicYears[0] }));
      } else {
        props.setFeesStructure(prev => ({ ...prev, academicYear: academicYears[0] }));
      }
    }
  }, [academicYears, selectedAcademicYear, setSelectedAcademicYear, formType, props]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="grid grid-cols-1 gap-y-8 max-w-md w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <Select
            className="w-full"
            size="large"
            placeholder="Select Academic Year"
            value={formType === 'add' ? props.feesStructure.academicYear?.id : props.feesStructure.academicYear?.id}
            onChange={(value) => {
              if (formType === 'add') {
                props.setFeesStructure(prev => ({ ...prev, academicYear: academicYears.find(ay => ay.id === value) }));
              } else {
                props.setFeesStructure(prev => ({ ...prev, academicYear: academicYears.find(ay => ay.id === value) }));
              }
            }}
          >
            {academicYears.map(ay => (
              <Select.Option key={ay.id} value={ay.id!}>
                {`${new Date(ay.year).getFullYear()}`}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          {formType === 'add' ? (
            <div className="flex flex-col gap-2">
              {courses.map(course => (
                <label key={course.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={props.feesStructure.courses.some((c: Course) => c.id === course.id)}
                    onChange={e => {
                      const selected = [...props.feesStructure.courses];
                      if (e.target.checked) {
                        selected.push(course);
                      } else {
                        const idx = selected.findIndex((c: Course) => c.id === course.id);
                        if (idx > -1) selected.splice(idx, 1);
                      }
                      props.setFeesStructure(prev => ({ ...prev, courses: selected }));
                    }}
                  />
                  {course.name}
                </label>
              ))}
            </div>
          ) : (
            <Select
              className="w-full"
              size="large"
              placeholder="Select Course"
              value={props.feesStructure.course?.id}
              onChange={(value) => {
                const found = courses.find(c => c.id === value);
                if (found) {
                  props.setFeesStructure(prev => ({ ...prev, course: found }));
                }
              }}
            >
              {courses.map(course => (
                <Select.Option key={course.id} value={course.id!}>
                  {course.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};
