// // import { AcademicYear, Class, FeesComponent, FeesSlabMapping, FeesStructure, Instalment, Shift, StudentFeesMapping } from "@/db/schema";
// import { FeesStructure } from "@academic/db/schemas/models/fees";
// // import { CourseDto } from "../academics";
// import { Shift } from "@academic/db/schemas/models/academics";
// import { AcademicYear } from "@academic/db/schemas/models/academics";
// import { Class } from "@academic/db/schemas/models/academics";
// import { FeesComponent } from "@academic/db/schemas/models/fees";
// import { FeesSlabMapping } from "@academic/db/schemas/models/fees";
// import { Instalment } from "@academic/db/schemas/models/fees";
// import { StudentFeesMapping } from "@academic/db/schemas/models/fees";
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
