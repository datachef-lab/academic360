import { AcademicYear } from "../academics/academic-year";
import { Class } from "../academics/class";
import { Course } from "../course-design";
import { Shift } from "../academics/shift";

export interface AddOn {
  readonly id?: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesHead {
  readonly id?: number;
  name: string;
  defaultPercentage: number;
  sequence: number;
  remarks: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesReceiptType {
  readonly id?: number;
  name: string;
  chk: string | null;
  chkMisc: string | null;
  printChln: string | null;
  splType: string | null;
  addOnId: number | null;
  printReceipt: string | null;
  chkOnline: string | null;
  chkOnSequence: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesSlabMapping {
  readonly id?: number;
  feesStructureId: number;
  feesSlabId: number;
  feeConcessionRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesSlab {
  readonly id?: number;
  name: string;
  description: string | null;
  sequence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeeConcessionSlab {
  readonly id?: number;
  legacyFeeSlabId?: number | null;
  name: string;
  description: string;
  defaultConcessionRate: number;
  sequence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesComponent {
  readonly id?: number;
  feesStructureId: number;
  feesHeadId: number;
  isConcessionApplicable: boolean;
  baseAmount: number;
  // concessionAmount: doublePrecision().notNull().default(0),
  sequence: number;
  remarks: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Instalment {
  readonly id?: number;
  feesStructureId: number;
  instalmentNumber: number;
  baseAmount: number;
  startDate: Date;
  endDate: Date;
  onlineStartDate: Date;
  onlineEndDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateFeesStructureDto = Omit<FeesStructureDto, "course"> & { courses: Course[]; semester?: number | null };

export interface FeesStructureDto {
  readonly id?: number;
  closingDate: Date | null;
  class: Class;
  advanceForSemester: number | null;
  startDate: Date | null;
  endDate: Date | null;
  onlineStartDate: Date | null;
  onlineEndDate: Date | null;
  numberOfInstalments: number | null;

  feesReceiptTypeId: number | null;
  shift?: Shift | null;
  createdAt?: Date;
  updatedAt?: Date;
  academicYear?: AcademicYear;
  course: Course;
  advanceForCourse?: Course | null;
  components: FeesComponent[];
  feesSlabMappings: FeesSlabMapping[];
  instalments: Instalment[];
  semester?: number | null;
}

export interface FeesDesignAbstractLevel {
  academicYear: AcademicYear;
  courses: {
    id: number;
    name: string;
    semesters: number[];
    shifts: string[];
    startDate: Date;
    endDate: Date;
  }[];
}

export interface StudentFeesMapping {
  readonly id?: number;
  studentId: number;
  feesStructureId: number;
  type: "FULL" | "INSTALMENT";
  instalmentNumber: number | null;
  baseAmount: number;
  lateFee: number;
  totalPayable: number;
  amountPaid: number | null;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentMode: "CASH" | "CHEQUE" | "ONLINE";
  transactionRef: string | null;
  transactionDate: Date | null;
  receiptNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeesStructureForm {
  feesStructure: FeesStructureDto;
  feesSlabYears: FeesSlabMapping[];
}
