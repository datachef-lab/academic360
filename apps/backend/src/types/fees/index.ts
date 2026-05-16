// import { AcademicYear } from "@repo/db/schemas/models/academics";
// import { Class } from "@repo/db/schemas/models/academics";
// import { Course } from "@repo/db/schemas/models/course-design";
// import { Shift } from "@repo/db/schemas/models/academics";
// // import { FeesComponent } from "@repo/db/schemas/models/fees";
// // import { FeesSlabMapping } from "@repo/db/schemas/models/fees";
// // import { FeesStructure } from "@/features/fees/models/fees-structure.model.js";
// // import { Instalment } from "@repo/db/schemas/models/fees";

// export interface FeesStructureDto
//   extends Omit<
//     FeesStructure,
//     "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"
//   > {
//   shift?: Shift;
//   academicYear: AcademicYear;
//   course: Course;
//   class: Class;
//   advanceForCourse: Course | null;
//   components: FeesComponent[];
//   feesSlabMappings: FeesSlabMapping[];
//   instalments: Instalment[];
// }

// export interface CreateFeesStructureDto
//   extends Omit<
//     FeesStructure,
//     "academicYearId" | "classId" | "courseId" | "shiftId" | "advanceForCourseId"
//   > {
//   shift?: Shift;
//   academicYear: AcademicYear;
//   courses: Course[];
//   class: Class;
//   advanceForCourse: Course | null;
//   components: FeesComponent[];
//   feesSlabMappings: FeesSlabMapping[];
//   instalments: Instalment[];
// }

// export interface FeesDesignAbstractLevel {
//   academicYear: AcademicYear;
//   courses: {
//     id: number;
//     name: string;
//     semesters: number[];
//     shifts: string[];
//     startDate: Date;
//     endDate: Date;
//   }[];
// }

export interface LegacyStudentFeeMappingRow {
  // Installment Id
  installment_id: number;
  // Student Details
  Student: string;
  Uid: string;
  "Is Active?": "Yes" | "No";
  // Batch Details
  "Academic Year": string;
  Course: string;
  Semester: string;
  Shift: string;
  Section: string;
  "Installment Total Amount To Pay": string | number | null;
  "Amount In Words": string | null;
  "Fee Head (or Component)": number | string | null;
  // Installment Summary
  "Installment Fee Head (or Component) Amount To Pay": string | null | number;
  "Has Fees Paid?": "Yes" | "No";
  "College Payment Mode": string | null;
  "Is Paid At Counter?": "Yes" | "No";
  "Fees Paid Timestamp": string | null | Date;
  "Challan Number": string | null;
  "Fee Receipt Entry Created At": string | null | Date;
  "Online Payment Order Id": string | null;
  "Online Payment Initiated Timestamp": string | null | Date;
  "Online Payment Status": string | null;
  "Bank Name": string | null;
  "Online Payment Reference Number": string | null;
  "Online Payment Message": string | null;
  "Online Payment Status Message": string | null;
  "Is Advance Payment?": "Yes" | "No";
  "Is Cancelled?": "Yes" | "No";
  // Fee Structure Meta
  Context: string | null;
  "Receipt Type": string | null;
  "Fees Quarter": string | null;
  "Installment Number": number | null;
  "Fees Type": string | null;
  "Total Amount Configured (in Fee Structure)": string | number | null;
  "Installment Type Name": string | null;
  Variant: string | null;
  "Amount Configured (For Fee Head / Component)": string | number | null;
  "Is Concession Applicable For the Fee Head (or Component)?": string | null;
  "Fee Slab": string | null;
  "Concessional Amount (For Fee Head) Approved": string | number | null;
  "Installment Closing Date": string | null | Date;
  "Installment Last Date": string | null | Date;
  "Advance For Session": string | null;
  "Advance For Course": string | null;
  "Advance For Class": string | null;
  "Installment Start Date": string | null | Date;
  "Installment End Date": string | null | Date;
  "Online Payment Start Date": string | null | Date;
  "Online Payment End Date": string | null | Date;

  legacyStudentId: number;
  legacyAcademicYearId: number;
  legacySessionId: number;
  legacyCourseId: number;
  legacySemesterId: number;
  legacyShiftId: number;
  legacySectionId: number;
  legacyFeeHeadId: number;
  legacyCollegeFeesModeId: number;
  legacyFeeStructureId: number;
  legacyFeeStructureSubId: number;
  legacyReceiptTypeId: number;
  legacyAdvanceSessionId: number | null;
  legacyAdvanceCourseId: number | null;
  legacyAdvanceClassId: number | null;
}

export interface LegacyReceiptType {
  readonly id: number;
  name: string;
  chk: string;
  chkmisc: string | null;
  printchln: string | null;
  spltype: string | null;
}

export interface LegacyFeeStructureRow {
  // Fee Structure Meta
  readonly fee_structure_id: number;
  receipt_type: string;
  variant: "Admission" | "Annual" | "Casual" | "TC Fees";
  installment_number: number;
  fees_quarter: string;
  // Batch Details
  session: string;
  course: string;
  semester: string;
  shift: string;
  // Fee Component Details
  installment_type: "Forfeit" | "Full" | 0;
  concession: "yes" | string;
  fee_head: string | null;
  fees_type: "College Fees" | string;
  amount: number | string | null;
  fee_component_variant: 0 | "Casual" | "Excess" | null;
  late_type_calculation: string | null | number;
  // Time Period
  last_date: string | Date | null;
  closing_date: string | Date | null;
  installment_from_date: string | Date | null;
  installment_to_date: string | Date | null;
  last_online_from_date: string | Date | null;
  last_online_to_date: string | Date | null;
  // Advance Configurations
  advance_for_course: string | null;
  advance_for_session: string | null;
  advance_for_semester: string | null;
  institution: string | null;

  // Legacy Ids
  legacyFeeStructureSubId: number | null;
  legacyReceiptTypeId: number;
  legacySessionId: number;
  legacyCourseId: number;
  legacySemesterId: number;
  legacyShiftId: number;
  legacyFeeHeadId: number;
  legacyAdvanceCourseId: number;
  legacyAdvanceSessionId: number;
  legacyAdvanceSemesterId: number;
  legacyAcademicYearId: number;
}

export interface LegacyFeeHead {
  readonly id: number;
  name: string;
}
