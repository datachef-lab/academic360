// import { db } from "@/db/index.js";
// import { findSubjectMetdataByStreamId } from "./subjectMetadata.service.js";
// import { offeredSubjectModel } from "../models/offeredSubject.model.js";
// import { eq, inArray, or } from "drizzle-orm";
// import { paperModel } from "../models/paper.model.js";
// import { batchModel } from "../models/batch.model.js";
// import { batchPaperModel } from "../models/batchPaper.model.js";
// import { BatchType } from "@/types/academics/batch.js";
// import { BatchPaperType } from "@/types/academics/batch-paper.js";
// import { batchFormatResponse, findBatchById } from "./batch.service.js";
// import { studentPaperModel } from "../models/studentPaper.model.js";
// // import { batchPaperFormatResponse } from "./batchPaper.service.js";
// import { count } from 'drizzle-orm';
// import { AcademicIdentifier, academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
// import path from "path";
// import { fileURLToPath } from "url";
// import { writeExcelFile } from "@/utils/writeExcel.js";
// import { findAcademicIdentifierByStudentId } from "@/features/user/services/academicIdentifier.service.js";
// import { CourseType } from "@/types/academics/course.js";
// import { Class } from "../models/class.model.js";
// import { Section } from "../models/section.model.js";
// import { Shift } from "../models/shift.model.js";
// import { Session } from "../models/session.model.js";
// import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
// import { PaperType } from "@/types/academics/paper.js";
// import { SubjectType } from "@/types/academics/subject.js";

// const directoryName = path.dirname(fileURLToPath(import.meta.url));

// interface StudentPaperResultType {
//     course: CourseType | null | undefined;
//     academicClass: Class | null | undefined;
//     section: Section | null | undefined;
//     shift: Shift | null | undefined;
//     session: Session | null | undefined;
//     academicIdentifier: AcademicIdentifierType;
//     paper: PaperType | null | undefined;
// }

// interface FormattedStudentBatchPaperResult {
//     batch: BatchType | null;
//     papers: BatchPaperType[]
// }

// export async function findStudents() {
//     // Fetch the distinct student-ids 
//     const studentIds = await db
//         .selectDistinct({ studentId: studentPaperModel.studentId })
//         .from(studentPaperModel);


//     const arr = [];

//     for (let p = 0; p < studentIds.length; p++) {
//         const studentPapersArr = await db.select().from(studentPaperModel).where(eq(studentPaperModel.studentId, studentIds[p].studentId));

//         const foundAcademicIdentifier = await findAcademicIdentifierByStudentId(studentIds[p].studentId);

//         for (let i = 0; i < studentPapersArr.length; i++) {
//             const [foundBatchPaper] = await db.select().from(batchPaperModel).where(eq(batchPaperModel.id, studentPapersArr[i].batchPaperId));

//             if (!foundBatchPaper) continue;

//             const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, foundBatchPaper.batchId));

//             if (!foundBatch) continue;

//             const formattedBatch = await batchFormatResponse(foundBatch);

//             const formattedBatchPaper = await batchPaperFormatResponse(foundBatchPaper);

//             const obj = {
//                 course: formattedBatch?.course?.name,
//                 class: formattedBatch?.academicClass?.name,
//                 section: formattedBatch?.section?.name,
//                 shift: formattedBatch?.shift?.name,
//                 session: formattedBatch?.session,
//                 rollNumber: foundAcademicIdentifier?.rollNumber,
//                 paper: formattedBatchPaper?.paper.name,
//                 subject: formattedBatchPaper?.paper.offeredSubject.subjectMetadata.name,
//                 code: formattedBatchPaper?.paper.offeredSubject.subjectMetadata.marksheetCode,
//             }

//             arr.push(obj);

//         }


//     }



//     // write in excel
//     path.resolve(directoryName, "../../../..", "public/temp"),

//         writeExcelFile(directoryName, "student-subjects", arr);


//     // const BATCH_SIZE = 10;
//     // // Fetch the paginated wise and loop
//     // const [{ count: totalRows }] = await db.select({ count: count() }).from(studentPaperModel);

//     // const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches


//     // for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {


//     // }
// }

// export async function findStudentPapersByRollNumber(rollNumber: string) {
//     const [foundAcademicIdentifier] =
//         await db
//             .select()
//             .from(academicIdentifierModel)
//             .where(or(
//                 eq(academicIdentifierModel.rollNumber, rollNumber.toString()),
//             ));

//     if (!foundAcademicIdentifier) return [];

//     const studentPapersArr = await db
//         .select()
//         .from(studentPaperModel)
//         .where(eq(studentPaperModel.studentId, foundAcademicIdentifier.studentId));


//     const arr: StudentPaperResultType[] = [];
//     for (let i = 0; i < studentPapersArr.length; i++) {
//         const [foundBatchPaper] = await db.select().from(batchPaperModel).where(eq(batchPaperModel.id, studentPapersArr[i].batchPaperId));

//         if (!foundBatchPaper) continue;

//         const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, foundBatchPaper.batchId));

//         if (!foundBatch) continue;

//         const formattedBatch = await batchFormatResponse(foundBatch);

//         const formattedBatchPaper = await batchPaperFormatResponse(foundBatchPaper);
//         const academicIdentifier = await findAcademicIdentifierByStudentId(foundAcademicIdentifier.studentId);
//         const obj: StudentPaperResultType = {
//             course: formattedBatch?.course,
//             academicClass: formattedBatch?.academicClass,
//             section: formattedBatch?.section,
//             shift: formattedBatch?.shift,
//             session: formattedBatch?.session,
//             academicIdentifier: academicIdentifier as AcademicIdentifierType,
//             paper: formattedBatchPaper?.paper
//         }

//         arr.push(obj);
//     }

//     return arr;
// }



// export async function getExtractedData() {
//     const BATCH_SIZE = 10;
//     // Fetch the paginated wise and loop
//     const [{ count: totalRows }] = await db.select({ count: count() }).from(batchModel);

//     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches


//     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//         const batch = await db.select().from(batchModel);
//     }
// }

// export async function studentFormatResponse() {

// }