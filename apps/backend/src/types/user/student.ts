import { Student } from "@/features/user/models/student.model.js";
import { PersonalDetailsType } from "./personal-details.js";
import { AcademicIdentifierType } from "./academic-identifier.js";
import { Specialization } from "@/features/user/models/specialization.model.js";

export interface StudentType extends Omit<Student, "specializationId"> {
    name: string;
    specialization?: Specialization | null;
    academicIdentifier?: AcademicIdentifierType | null;
    personalDetails?: PersonalDetailsType | null;
}
