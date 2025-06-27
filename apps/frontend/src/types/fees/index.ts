import { Course } from "../academics/course";
import { Shift } from "../resources/shift";

export interface AcademicYear {
    readonly id?: number;
    startYear: number;
    sessionId: number | null;
    isCurrentYear: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AddOn {
    readonly id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FeesHead {
    readonly id?: number;
    name: string;
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

export interface FeesComponent {
    readonly id?: number;
    feesStructureId: number;
    feesHeadId: number;
    isConcessionApplicable: boolean;
    amount: number,
    // concessionAmount: doublePrecision().notNull().default(0),
    sequence: number,
    remarks: string |  null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FeesStructureDto {
    readonly id?: number; 
    closingDate: Date | null;
    semester: number | null;
    advanceForSemester: number | null;
    startDate: Date | null;
    endDate: Date | null;
    onlineStartDate: Date | null;
    onlineEndDate: Date | null;
    numberOfInstalments: number | null;
    instalmentStartDate: Date | null;
    instalmentEndDate: Date | null;
    feesReceiptTypeId: number | null;
    shift?: Shift | null;
    createdAt?: Date;
    updatedAt?: Date;
    academicYear?: AcademicYear;
    course?: Course;
    advanceForCourse?: Course | null;
    components: FeesComponent[];
    feesSlabMappings: FeesSlabMapping[];
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