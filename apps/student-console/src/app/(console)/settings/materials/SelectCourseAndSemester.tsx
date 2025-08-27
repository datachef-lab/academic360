import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AcademicClass } from "@/types/academics/academic-class";
import { Course } from "@/types/academics/course";
import { Download, Filter } from "lucide-react";
import React from "react";

type SelectCourseAndSemesterProps = {
  courses: Course[];
  classes: AcademicClass[];
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course) => void;
  selectedSemester: AcademicClass | null;
  setSelectedSemester: (semester: AcademicClass) => void;
};

export default function SelectCourseAndSemester({
  courses,
  classes,
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
}: SelectCourseAndSemesterProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Filter size={15} className="mr-2" />
          <span className="text-sm font-medium mr-3">Filter Materials</span>
        </div>

        <div className="flex space-x-2">
          <Select
            value={selectedCourse?.id?.toString()}
            onValueChange={(value) => {
              const course = courses.find((c) => c.id?.toString() === value);
              setSelectedCourse(course as Course);
            }}
          >
            <SelectTrigger className="h-8 w-[200px] rounded-md border px-3 text-xs">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id?.toString() || ""}>
                  {course.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSemester?.id?.toString()}
            onValueChange={(value) => {
              const semester = classes.find((c) => c.id?.toString() === value);
              setSelectedSemester(semester as AcademicClass);
            }}
          >
            <SelectTrigger className="h-8 w-[160px] rounded-md border px-3 text-xs">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classItem) => (
                <SelectItem
                  key={classItem.id}
                  value={classItem.id?.toString() || ""}
                >
                  {classItem.classname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
        <Download size={13} />
        Export
      </Button>
    </div>
  );
}
