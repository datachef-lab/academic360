import { Student } from "@/features/user/models/student.model.js";
import { PersonalDetailsType } from "./personal-details.js";
import { AcademicIdentifierType } from "./academic-identifier.js";

export interface StudentType extends Omit<Student, "specializationId"> {
    specialization: string | null;
    academicIdentifier: AcademicIdentifierType;
    personalDetails: PersonalDetailsType;
}
