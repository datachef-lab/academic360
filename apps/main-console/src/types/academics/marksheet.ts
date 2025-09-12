import { UserDto } from "@repo/db/dtos/user";
import { AcademicIdentifier } from "../user/academic-identifier";

import { AcademicYear } from "./academic-year";
import { Subject } from "./subject";

export interface Marksheet {
  readonly id?: number;
  studentId: number | null;
  semester: number;
  academicYear: AcademicYear;
  sgpa: number | null;
  cgpa: number | null;
  classification: string | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  source: "FILE_UPLOAD" | "ADDED";
  file: string | null;
  createdByUser: UserDto;
  updatedByUser: UserDto;
  subjects: Subject[];
  name: string;
  academicIdentifier: AcademicIdentifier;
}

export interface MarksheetLog {
  item: string;
  source: string;
  file: string | null;
  createdByUser: UserDto;
  updatedByUser: UserDto;
  createdAt: Date;
  updatedAt: Date;
}
