import { Batch } from "@/features/academics/models/batch.model.js";
import { CourseType } from "./course.js";
import { Class } from "@/features/academics/models/class.model.js";
import { Section } from "@/features/academics/models/section.model.js";
import { Shift } from "@/features/academics/models/shift.model.js";

export interface BatchType extends Omit<Batch, "courseId" | "classId" | "sectionId" | "shiftId"> {
    course: CourseType | null;
    academicClass: Class | null;
    section: Section | null;
    shift: Shift | null;
}