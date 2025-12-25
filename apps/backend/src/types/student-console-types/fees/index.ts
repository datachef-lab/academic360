// // import { AcademicYear, Class, FeesComponent, FeesSlabMapping, FeesStructure, Instalment, Shift, StudentFeesMapping } from "@/db/schema";
// import { FeesStructure } from "@repo/db/schemas/models/fees";
// // import { CourseDto } from "../academics";
// import { Shift } from "@repo/db/schemas/models/academics";
// import { AcademicYear } from "@repo/db/schemas/models/academics";
// import { Class } from "@repo/db/schemas/models/academics";
// import { FeesComponent } from "@repo/db/schemas/models/fees";
// import { FeesSlabMapping } from "@repo/db/schemas/models/fees";
// import { Instalment } from "@repo/db/schemas/models/fees";
// import { StudentFeesMapping } from "@repo/db/schemas/models/fees";
// import { CourseDto } from "@/types/course-design/index.type";

// export interface FeesStructureDto
//   extends Omit<
//     FeesStructure,
//     "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"
//   > {
//   shift?: Shift;
//   academicYear: AcademicYear;
//   course: CourseDto;
//   class: Class;
//   advanceForCourse: CourseDto | null;
//   components: FeesComponent[];
//   feesSlabMappings: FeesSlabMapping[];
//   instalments: Instalment[];
// }

// export interface StudentMappingDto
//   extends Omit<StudentFeesMapping, "feesStructureId"> {
//   feesStructure: FeesStructureDto;
// }
