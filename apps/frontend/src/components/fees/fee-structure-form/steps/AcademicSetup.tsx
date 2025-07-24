import React from 'react';
import { Select } from 'antd';
import { FeesStructureDto, CreateFeesStructureDto } from '@/types/fees';
import { Course } from '@/types/course-design/course';
import { AcademicYear } from '@/types/academics/academic-year';
// import { Checkbox } from '@/components/ui/checkbox';
import { Select as ShadcnSelect, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { Class } from '@/types/academics/class';
import { Shift } from '@/types/academics/shift';

interface AcademicSetupPropsAdd {
  feesStructure: CreateFeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  classes: Class[];
  shifts: Shift[];
  formType: 'ADD';
}

interface AcademicSetupPropsEdit {
  feesStructure: FeesStructureDto;
  setFeesStructure: React.Dispatch<React.SetStateAction<FeesStructureDto>>;
  courses: Course[];
  academicYears: AcademicYear[];
  classes: Class[];
  shifts: Shift[];
  formType: 'EDIT';
}

type AcademicSetupProps = AcademicSetupPropsAdd | AcademicSetupPropsEdit;

export const AcademicSetup: React.FC<AcademicSetupProps> = (props) => {
  const { courses, academicYears, formType, } = props;

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
      <div className="flex flex-col gap-y-8 w-full ">
        {/* Top row: Academic Year, Class, Shift, Semester */}
        <div className="flex flex-row gap-4 w-full">
          <div className="flex-1 min-w-[120px]">
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
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <ShadcnSelect
              value={props.feesStructure.class?.id ? String(props.feesStructure.class.id) : ''}
              onValueChange={(val) => {
                const selectedClass = props.classes.find((cls: Class) => String(cls.id) === val);
                if (!selectedClass) return;
                if (formType === 'ADD') {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, class: selectedClass }));
                } else {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)(prev => ({ ...prev, class: selectedClass }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {props.classes.map((cls: Class) => (
                  <SelectItem key={cls.id} value={String(cls.id)}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
            <ShadcnSelect
              value={props.feesStructure.shift?.id ? String(props.feesStructure.shift.id) : ''}
              onValueChange={(val) => {
                const selectedShift = props.shifts.find((sh: Shift) => String(sh.id) === val);
                if (!selectedShift) return;
                if (formType === 'ADD') {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, shift: selectedShift }));
                } else {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)(prev => ({ ...prev, shift: selectedShift }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                {props.shifts.map((sh) => (
                  <SelectItem key={sh.id} value={String(sh.id)}>
                    {sh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>
          {/* Semester Dropdown */}
          {/* <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <ShadcnSelect
              value={props.feesStructure.semester ? String(props.feesStructure.semester) : ''}
              onValueChange={(val) => {
                const semesterNum = Number(val);
                if (formType === 'ADD') {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, semester: semesterNum }));
                } else {
                  (props.setFeesStructure as React.Dispatch<React.SetStateAction<FeesStructureDto>>)(prev => ({ ...prev, semester: semesterNum }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.name} value={cls.name}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div> */}
        </div>
        {/* Courses Dual Listbox as Compact Card Lists */}
        <div>
          {/* <label className="block text-sm font-medium text-gray-700 mb-2">Course</label> */}
          {formType === 'ADD' ? (
            <div className="flex flex-row gap-8 w-full h-[50vh]">
              {/* Selected Courses Card List */}
              <div className="flex-1 bg-white border border-gray-200 rounded-md shadow p-4 flex flex-col h-full">
                <div className="text-base font-semibold text-purple-800 mb-3 border-l-4 border-purple-400 pl-3">Selected Courses ({props.feesStructure.courses.length})</div>
                <div className="max-h-80 h-80 min-h-[8rem] overflow-y-auto flex flex-col gap-2">
                  {props.feesStructure.courses.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center w-full h-full text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="w-8 h-8 mx-auto" />
                        <span>No courses selected</span>
                      </div>
                    </div>
                  ) : (
                    props.feesStructure.courses.map((course: Course) => (
                      <div key={course.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 shadow-sm hover:bg-purple-50 transition">
                        <span className="font-semibold text-gray-900 text-sm">{course.name}</span>
                        <button
                          type="button"
                          className="bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-700 transition flex items-center justify-center"
                          title="Remove"
                          onClick={() => {
                            const selected = props.feesStructure.courses.filter((c: Course) => c.id !== course.id);
                            (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, courses: selected }));
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* Available Courses Card List */}
              <div className="flex-1 bg-white border border-gray-200 rounded-md shadow p-4 flex flex-col h-full">
                <div className="text-base font-semibold text-purple-800 mb-3 border-l-4 border-purple-400 pl-3">Available Courses ({courses.filter(c => !props.feesStructure.courses.some((sc: Course) => sc.id === c.id)).length})</div>
                <div className="max-h-80 h-80 min-h-[8rem] overflow-y-auto flex flex-col gap-2">
                  {courses.filter(c => !props.feesStructure.courses.some((sc: Course) => sc.id === c.id)).length === 0 ? (
                    <div className="flex flex-1 items-center justify-center w-full h-full text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Plus className="w-8 h-8 mx-auto" />
                        <span>No available courses</span>
                      </div>
                    </div>
                  ) : (
                    courses.filter(c => !props.feesStructure.courses.some((sc: Course) => sc.id === c.id)).map((course) => (
                      <div key={course.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 shadow-sm hover:bg-purple-50 transition">
                        <span className="font-semibold text-gray-900 text-sm">{course.name}</span>
                        <button
                          type="button"
                          className="bg-purple-500 text-white rounded-full p-1 shadow hover:bg-purple-700 transition flex items-center justify-center"
                          title="Add"
                          onClick={() => {
                            const selected = [...props.feesStructure.courses, course];
                            (props.setFeesStructure as React.Dispatch<React.SetStateAction<CreateFeesStructureDto>>)(prev => ({ ...prev, courses: selected }));
                          }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
