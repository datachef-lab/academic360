import { Student } from "@repo/db/schemas/models/user";
import { PersonalDetailsType } from "./personal-details.js";

import { Specialization } from "@repo/db/schemas/models/course-design";

export interface StudentType extends Omit<Student, "specializationId"> {
  name: string;
  specialization?: Specialization | null;
  // academicIdentifier?: AcademicIdentifierType | null;
  personalDetails?: PersonalDetailsType | null;
}
