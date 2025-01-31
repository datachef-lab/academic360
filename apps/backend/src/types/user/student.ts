import { Student } from "@/features/user/models/student.model.ts";
import { PersonalDetailsType } from "./personal-details.ts";
import { AcademicIdentifierType } from "./academic-identifier.ts";

export interface StudentType extends Omit<Student, "specializationId"> {
    specialization: string | null;
    academicIdentifier: AcademicIdentifierType;
    personalDetails: PersonalDetailsType;
}
