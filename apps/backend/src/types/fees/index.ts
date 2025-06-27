import { AcademicYear } from "@/features/academics/models/academic-year.model";
import { Course } from "@/features/academics/models/course.model";
import { Shift } from "@/features/academics/models/shift.model";
import { FeesComponent } from "@/features/fees/models/fees-component.model";
import { FeesSlabMapping } from "@/features/fees/models/fees-slab-mapping.model";
import { FeesStructure } from "@/features/fees/models/fees-structure.model";

export interface FeesStructureDto extends Omit<FeesStructure, "academicYearId" | "courseId" | "shiftId" | "advanceForCourseId"> {
    shift?: Shift;
    academicYear: AcademicYear;
    course: Course;
    advanceForCourse: Course | null;
    components: FeesComponent[];
    feesSlabMappings: FeesSlabMapping[];
}

export interface FeesDesignAbstractLevel {
    academicYear: AcademicYear;
    courses: {
        id: number;
        name: string;
        semesters: number[];
        shifts: string[];
        startDate: Date;
        endDate: Date;
    }[];
}