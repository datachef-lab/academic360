// import { AcademicYear } from "@repo/db/schemas/models/academics";
// import { Class } from "@repo/db/schemas/models/academics";
// import { Course } from "@repo/db/schemas/models/course-design";
// import { Shift } from "@repo/db/schemas/models/academics";
// // import { FeesComponent } from "@repo/db/schemas/models/fees";
// // import { FeesSlabMapping } from "@repo/db/schemas/models/fees";
// // import { FeesStructure } from "@/features/fees/models/fees-structure.model.js";
// // import { Instalment } from "@repo/db/schemas/models/fees";

// export interface FeesStructureDto
//   extends Omit<
//     FeesStructure,
//     "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"
//   > {
//   shift?: Shift;
//   academicYear: AcademicYear;
//   course: Course;
//   class: Class;
//   advanceForCourse: Course | null;
//   components: FeesComponent[];
//   feesSlabMappings: FeesSlabMapping[];
//   instalments: Instalment[];
// }

// export interface CreateFeesStructureDto
//   extends Omit<
//     FeesStructure,
//     "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"
//   > {
//   shift?: Shift;
//   academicYear: AcademicYear;
//   courses: Course[];
//   class: Class;
//   advanceForCourse: Course | null;
//   components: FeesComponent[];
//   feesSlabMappings: FeesSlabMapping[];
//   instalments: Instalment[];
// }

// export interface FeesDesignAbstractLevel {
//   academicYear: AcademicYear;
//   courses: {
//     id: number;
//     name: string;
//     semesters: number[];
//     shifts: string[];
//     startDate: Date;
//     endDate: Date;
//   }[];
// }
