import { Course } from "@repo/db/schemas/models/course-design";
import { Paper } from "@repo/db/schemas/models/course-design";
import { Subject } from "@repo/db/schemas/models/course-design";
import { SubjectType } from "@repo/db/schemas/models/course-design";
import { Degree } from "@/features/resources/models/degree.model";
import { Specialization } from "@repo/db/schemas/models/course-design";
import { PaperComponent } from "@repo/db/schemas/models/course-design";
import { ExamComponent } from "@repo/db/schemas/models/course-design";
import { Topic } from "@repo/db/schemas/models/course-design";
import { Affiliation } from "@repo/db/schemas/models/course-design";
import { RegulationType } from "@repo/db/schemas/models/course-design";
import { AcademicYear } from "@repo/db/schemas/models/academics";

export interface CourseDto extends Omit<Course, "degreeId"> {
  degree: Degree | null;
}

export interface PaperComponentDto extends Omit<
  PaperComponent,
  "examComponentId"
> {
  examComponent: ExamComponent;
}

export interface PaperDto extends Paper {
  components: PaperComponentDto[];
  topics: Topic[];
}
