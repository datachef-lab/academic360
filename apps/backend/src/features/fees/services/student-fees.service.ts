// import { db } from "@/db/index.js";
// import {
//   studentFeesMappingModel,
//   StudentFeesMapping,
// } from "../models/student-fees-mapping.model.js";
// type StudentFeesMappingInsert = typeof studentFeesMappingModel.$inferInsert;

// import { eq } from "drizzle-orm";

// export const getStudentFeesMappings = async () => {
//   try {
//     const studentFeesMappings = await db.select().from(studentFeesMappingModel);
//     return studentFeesMappings;
//   } catch (error) {
//     return null;
//   }
// };

// export const getStudentFeesMappingById = async (id: number) => {
//   try {
//     const studentFeesMapping = await db
//       .select()
//       .from(studentFeesMappingModel)
//       .where(eq(studentFeesMappingModel.id, id));
//     return studentFeesMapping[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const createStudentFeesMapping = async (
//   studentFeesMapping: StudentFeesMapping,
// ) => {
//   try {
//     const payload: StudentFeesMappingInsert = {
//       studentId: Number((studentFeesMapping as any).studentId),
//       feesStructureId: Number((studentFeesMapping as any).feesStructureId),
//       type: (studentFeesMapping as any).type ?? "FULL",
//       instalmentId: (studentFeesMapping as any).instalmentId
//         ? Number((studentFeesMapping as any).instalmentId)
//         : undefined,
//       baseAmount: Number((studentFeesMapping as any).baseAmount ?? 0),
//       lateFee: Number((studentFeesMapping as any).lateFee ?? 0),
//       totalPayable: Number((studentFeesMapping as any).totalPayable ?? 0),
//       amountPaid:
//         (studentFeesMapping as any).amountPaid != null
//           ? Number((studentFeesMapping as any).amountPaid)
//           : undefined,
//       paymentStatus: (studentFeesMapping as any).paymentStatus ?? "PENDING",
//       paymentMode: (studentFeesMapping as any).paymentMode ?? undefined,
//       transactionRef: (studentFeesMapping as any).transactionRef ?? undefined,
//       transactionDate: (studentFeesMapping as any).transactionDate
//         ? new Date((studentFeesMapping as any).transactionDate)
//         : undefined,
//       receiptNumber: (studentFeesMapping as any).receiptNumber ?? undefined,
//     };
//     const newStudentFeesMapping = await db
//       .insert(studentFeesMappingModel)
//       .values(payload)
//       .returning();
//     return newStudentFeesMapping[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const updateStudentFeesMapping = async (
//   id: number,
//   studentFeesMapping: StudentFeesMapping,
// ) => {
//   try {
//     const payload: Partial<StudentFeesMappingInsert> = {
//       studentId:
//         (studentFeesMapping as any).studentId != null
//           ? Number((studentFeesMapping as any).studentId)
//           : undefined,
//       feesStructureId:
//         (studentFeesMapping as any).feesStructureId != null
//           ? Number((studentFeesMapping as any).feesStructureId)
//           : undefined,
//       type: (studentFeesMapping as any).type,
//       instalmentId:
//         (studentFeesMapping as any).instalmentId != null
//           ? Number((studentFeesMapping as any).instalmentId)
//           : undefined,
//       baseAmount:
//         (studentFeesMapping as any).baseAmount != null
//           ? Number((studentFeesMapping as any).baseAmount)
//           : undefined,
//       lateFee:
//         (studentFeesMapping as any).lateFee != null
//           ? Number((studentFeesMapping as any).lateFee)
//           : undefined,
//       totalPayable:
//         (studentFeesMapping as any).totalPayable != null
//           ? Number((studentFeesMapping as any).totalPayable)
//           : undefined,
//       amountPaid:
//         (studentFeesMapping as any).amountPaid != null
//           ? Number((studentFeesMapping as any).amountPaid)
//           : undefined,
//       paymentStatus: (studentFeesMapping as any).paymentStatus,
//       paymentMode: (studentFeesMapping as any).paymentMode,
//       transactionRef: (studentFeesMapping as any).transactionRef,
//       transactionDate: (studentFeesMapping as any).transactionDate
//         ? new Date((studentFeesMapping as any).transactionDate)
//         : undefined,
//       receiptNumber: (studentFeesMapping as any).receiptNumber,
//     };
//     const updatedStudentFeesMapping = await db
//       .update(studentFeesMappingModel)
//       .set(payload)
//       .where(eq(studentFeesMappingModel.id, Number(id)))
//       .returning();
//     return updatedStudentFeesMapping[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const deleteStudentFeesMapping = async (id: number) => {
//   try {
//     const deletedStudentFeesMapping = await db
//       .delete(studentFeesMappingModel)
//       .where(eq(studentFeesMappingModel.id, id))
//       .returning();
//     return deletedStudentFeesMapping[0];
//   } catch (error) {
//     return null;
//   }
// };
