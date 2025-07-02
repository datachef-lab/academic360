import { AcademicYear } from "@/features/academics/models/academic-year.model.js";
import { Class } from "@/features/academics/models/class.model.js";
import { Course } from "@/features/academics/models/course.model.js";
import { Shift } from "@/features/academics/models/shift.model.js";
import { FeesComponent } from "@/features/fees/models/fees-component.model.js";
import { FeesSlabMapping } from "@/features/fees/models/fees-slab-mapping.model.js";
import { FeesStructure } from "@/features/fees/models/fees-structure.model.js";

export interface FeesStructureDto extends Omit<FeesStructure, "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"> {
    shift?: Shift;
    academicYear: AcademicYear;
    course: Course;
    class: Class
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