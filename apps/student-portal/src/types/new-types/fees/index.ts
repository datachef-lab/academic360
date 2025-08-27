import { AcademicYear, Class, FeesComponent, FeesSlabMapping, FeesStructure, Instalment, Shift, StudentFeesMapping } from "@/db/schema";
import { CourseDto } from "../academics";

export interface FeesStructureDto extends Omit<FeesStructure, "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"> {
    shift?: Shift;
    academicYear: AcademicYear;
    course: CourseDto;
    class: Class
    advanceForCourse: CourseDto | null;
    components: FeesComponent[];
    feesSlabMappings: FeesSlabMapping[];
    instalments: Instalment[];
}

export interface StudentMappingDto extends Omit<StudentFeesMapping, "feesStructureId"> {
    feesStructure: FeesStructureDto;
}