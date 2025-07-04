import React from 'react';
import { Select } from 'antd';
import { FeesStructureDto, CreateFeesStructureDto } from '@/types/fees';
import { Course } from '@/types/academics/course';
import { AcademicYear } from '@/types/academics/academic-year';

interface AcademicSetupPropsAdd {
  feesStructure: CreateFeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  formType: 'ADD';
}

interface AcademicSetupPropsEdit {
  feesStructure: FeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  formType: 'EDIT';
}

type AcademicSetupProps = AcademicSetupPropsAdd | AcademicSetupPropsEdit;

export const AcademicSetup: React.FC<AcademicSetupProps> = (props) => {
  const { courses, academicYears, formType } = props;

  React.useEffect(() => {
    // Set default academic year if not set
    if (academicYears.length > 0 && !props.feesStructure.academicYear) {
      if (formType === 'ADD') {
        (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, academicYear: academicYears[0] }));
      } else {
        (props.setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)(prev => ({ ...prev, academicYear: academicYears[0] }));
      }
    }
  }, [academicYears, props.feesStructure.academicYear, formType, props.setFeesStructure]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="grid grid-cols-1 gap-y-8 max-w-md w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <Select
            className="w-full"
            size="large"
            placeholder="Select Academic Year"
            value={props.feesStructure.academicYear?.id}
            onChange={(value) => {
              const selectedYear = academicYears.find(ay => ay.id === value);
              if (!selectedYear) return;
              if (formType === 'ADD') {
                (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, academicYear: selectedYear }));
              } else {
                (props.setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)(prev => ({ ...prev, academicYear: selectedYear }));
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
          {formType === 'ADD' ? (
            <div className="flex flex-col gap-2">
              {courses.map(course => (
                <label key={course.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={props.feesStructure.courses.some((c: Course) => c.id === course.id)}
                    onChange={e => {
                      const selected = [...props.feesStructure.courses];
                      if (e.target.checked) {
                        if (!selected.some((c: Course) => c.id === course.id)) {
                          selected.push(course);
                        }
                      } else {
                        const idx = selected.findIndex((c: Course) => c.id === course.id);
                        if (idx > -1) selected.splice(idx, 1);
                      }
                      (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, courses: selected }));
                    }}
                  />
                  {course.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm h-[38px] flex items-center">
              {props.feesStructure.course?.name || "Not Selected"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicSetup;
