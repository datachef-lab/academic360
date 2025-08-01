import { Course } from "@/features/course-design/models/course.model.js";
import { Paper } from "@/features/course-design/models/paper.model";
import { Subject } from "@/features/course-design/models/subject.model";
import { SubjectType } from "@/features/course-design/models/subject-type.model";
import { Degree } from "@/features/resources/models/degree.model";
import { Specialization } from "@/features/course-design/models/specialization.model";
import { PaperComponent } from "@/features/course-design/models/paper-component.model";
import { ExamComponent } from "@/features/course-design/models/exam-component.model";
import { Topic } from "@/features/course-design/models/topic.model";
import { Affiliation } from "@/features/course-design/models/affiliation.model";
import { RegulationType } from "@/features/course-design/models/regulation-type.model";
import { AcademicYear } from "@/features/academics/models/academic-year.model";

export interface CourseDto extends Omit<Course, "degreeId"> {
    degree: Degree | null;
}

export interface PaperComponentDto extends Omit<PaperComponent, "examComponentId"> {
    examComponent: ExamComponent;
}

export interface PaperDto extends Paper {
    components: PaperComponentDto[];
    topics: Topic[];
}
