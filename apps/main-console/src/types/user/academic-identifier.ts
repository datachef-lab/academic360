import { Shift } from "../academics/shift";
import { Course } from "../course-design";
import { Framework } from "../enums";

export interface AcademicIdentifier {
  readonly id?: number,
  studentId: number,
  framework: Framework | null,
  rfid: string | null,
  course: Course | null,
  cuFormNumber: string | null,
  uid: string | null,
  oldUid: string | null,
  registrationNumber: string | null,
  rollNumber: string | null,
  section: string | null,
  classRollNumber: string | null,
  apaarId: string | null,
  abcId: string | null,
  apprid: string | null,
  checkRepeat: boolean,
  shift: Shift | null,
  createdAt?: Date,
  updatedAt?: Date,
}
