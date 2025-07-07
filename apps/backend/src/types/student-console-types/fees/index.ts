// import { AcademicYear, Class, FeesComponent, FeesSlabMapping, FeesStructure, Instalment, Shift, StudentFeesMapping } from "@/db/schema";
import { FeesStructure } from "@/features/fees/models/fees-structure.model";
import { CourseDto } from "../academics";
import { Shift } from "@/features/academics/models/shift.model";
import { AcademicYear } from "@/features/academics/models/academic-year.model";
import { Class } from "@/features/academics/models/class.model";
import { FeesComponent } from "@/features/fees/models/fees-component.model";
import { FeesSlabMapping } from "@/features/fees/models/fees-slab-mapping.model";
import { Instalment } from "@/features/fees/models/instalment.model";
import { StudentFeesMapping } from "@/features/fees/models/student-fees-mapping.model";

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