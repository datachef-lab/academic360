// import { db, mysqlConnection } from "@/db/index.js";
// import { OldBatchPaper } from "@/types/old-data/old-batch-paper.js";
// import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
// import { and, eq } from "drizzle-orm";
// import { OldSubjectType } from "@/types/old-data/old-subject-type.js";
// import { OldSubject } from "@/types/old-data/old-subject.js";
// import { processBatch, processClass, processCourse, processSection, processSession, processShift } from "./batch.service.js";
// import { OldBatch } from "@/types/old-data/old-batch.js";
// import { Batch, batchModel } from "../models/batch.model.js";
// import { subjectTypeModel } from "../models/subjectType.model.js";
// import { OldPaperList } from "@/types/old-data/old-paper-list.js";
// import { OldPaperSubject } from "@/types/old-data/old-paper-subject.js";
// import { BatchPaper, batchPaperModel } from "../models/batchPaper.model.js";
// import { paperModel } from "../models/paper.model.js";
// import { offeredSubjectModel } from "../models/offeredSubject.model.js";
// import { OldStudentPaper } from "@/types/old-data/old-student-paper.js";
// import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
// import { OldStudent } from "@/types/old-student.js";
// import { findStudentById } from "@/features/user/services/student.service.js";
// import { studentPaperModel } from "../models/studentPaper.model.js";
// import { BatchPaperType } from "@/types/academics/batch-paper.js";
// import { findPaperById } from "./paper.service.js";
// import { PaperType } from "@/types/academics/paper.js";
// import { Session, sessionModel } from "../models/session.model.js";
// import { OldSession } from "@/types/academics/session.js";
// import { Stream, streamModel } from "../models/stream.model.js";
// import { findDegreeByName } from "@/features/resources/services/degree.service.js";
// import { addStream } from "./stream.service.js";
// import { Degree, degreeModel } from "@/features/resources/models/degree.model.js";
// import { number } from "zod";

import { db, mysqlConnection } from "@/db/index";
import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model";
import { SubjectType } from "@/types/academics/subject";

import { SubjectTypeModel, subjectTypeModel } from "../models/subjectType.model";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { SubjectMetadataType } from "@/types/academics/subject-metadata";
import { OldSubjectType } from "@/types/old-data/old-subject-type";
import { OldSubject } from "@/types/old-data/old-subject";
import { processBatch } from "./batch.service";
import { OldBatch } from "@/types/old-data/old-batch";
import { OldStudentPaper } from "@/types/old-data/old-student-paper";
import { OldStudent } from "@/types/old-student";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model";
import { studentModel } from "@/features/user/models/student.model";
import { BatchPaper, batchPaperModel } from "../models/batchPaper.model";
import { Batch } from "../models/batch.model";
import { studentPaperModel } from "../models/studentPaper.model";

const BATCH_SIZE = 500;

const oldBatchPaperTable = "studentpaperlinkingpaperlist";
const oldSubjectTypeTable = "subjecttype";
const oldSubjectTable = "subject";
const oldBatchTable = "studentpaperlinkingmain";
const oldStudentPaperTable = "studentpaperlinkingstudentlist";
const oldCourseTable = "course";
const oldClassTable = "classes";
const oldSectionTable = "section";
const oldShiftTable = "shift";
const oldPaperTable = "paperlist";
const oldPaperSubjectTable = "papersubject";

// async function getMappedSubjectMetadata({ subjectTypeId, subjectId }: { subjectTypeId: number, subjectId: number }) {
//     const [oldSubjectType] = (
//         await mysqlConnection
//             .query(`
//                     SELECT * 
//                     FROM ${oldSubjectTypeTable} 
//                     WHERE id = ${subjectTypeId}`
//             ) as [OldSubjectType[], any]
//     )[0];
//     // console.log("in getMappedSubjectMetadata(), oldSubjectType:", oldSubjectType.subjectTypeName.trim().toUpperCase())
//     const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.irpName, oldSubjectType.subjectTypeName.trim().toUpperCase()));

//     if (!foundSubjectType) {
//         console.log(`Not found subject type for irpName: ${oldSubjectType.subjectTypeName.trim().toUpperCase()}`)
//         return null;
//     }

//     console.log("foundSubjectType:", foundSubjectType.irpName, foundSubjectType.marksheetName);
//     const [oldSubject] = (
//         await mysqlConnection
//             .query(`
//                     SELECT * 
//                     FROM ${oldSubjectTable} 
//                     WHERE id = ${subjectId}`
//             ) as [OldSubject[], any]
//     )[0];

//     console.log("Old subject:", oldSubject);

//     const whereConditions = [
//         eq(subjectMetadataModel.subjectTypeId, foundSubjectType.id),
//         // eq(subjectMetadataModel.irpCode, oldSubject.univcode),
//     ];

//     if (oldSubject.univcode) {
//         whereConditions.push(
//             eq(subjectMetadataModel.irpCode, oldSubject.univcode?.trim().toUpperCase())
//         );
//     }

//     const [foundSubjectMetadata] =
//         await db
//             .select()
//             .from(subjectMetadataModel)
//             .where(and(...whereConditions));

//     console.log('found subjectMetadata:', foundSubjectMetadata);
//     return foundSubjectMetadata;
// }

// async function processPaper(oldBatchPaper: OldBatchPaper, subjectMetadata: SubjectMetadata) {
//     // console.log(oldBatchPaper.paperId)
//     if (!oldBatchPaper.paperId) {
//         return null;
//     }

//     const [oldPaper] = (
//         await mysqlConnection
//             .query(`
//                     SELECT * 
//                     FROM ${oldPaperTable} 
//                     WHERE id = ${oldBatchPaper.paperId}`
//             ) as [OldPaperList[], any]
//     )[0];

//     // const [oldPaperSubject] = (
//     //     await mysqlConnection
//     //         .query(`
//     //                 SELECT * 
//     //                 FROM ${oldPaperSubjectTable} 
//     //                 WHERE id = ${oldPaper.parent_id}`
//     //         ) as [OldPaperSubject[], any]
//     // )[0];

//     // // console.log("in processPaper(), oldPaperSubject:", oldPaperSubject, "from oldBatchPaper:", oldBatchPaper);



//     // const foundSubjectMetadata = await getMappedSubjectMetadata(oldPaperSubject);

//     // if (!foundSubjectMetadata) {
//     //     return null;
//     // }

//     let [foundOfferedSubject] = await db
//         .select()
//         .from(offeredSubjectModel)
//         .where(eq(offeredSubjectModel.subjectMetadataId, subjectMetadata.id as number));

//     if (!foundOfferedSubject) {
//         const [newOfferedSubject] = await db.
//             insert(offeredSubjectModel)
//             .values({
//                 subjectMetadataId: subjectMetadata.id as number
//             })
//             .returning();
//         foundOfferedSubject = newOfferedSubject;
//     }


//     // Format the mode of paper
//     let mode: "THEORETICAL" | "PRACTICAL" | "VIVA" | "ASSIGNMENT" | "PROJECT" | "MCQ" | null = null;
//     if (oldPaper.isPractical) {
//         mode = "PRACTICAL";
//     }
//     else if (oldPaper.paperType === "Theoretical") {
//         mode = "THEORETICAL"
//     }

//     const whereConditions = [
//         eq(paperModel.offeredSubjectId, foundOfferedSubject.id),
//         eq(paperModel.name, oldPaper.paperName.trim()),
//         eq(paperModel.shortName, oldPaper.paperShortName.trim()),
//     ];

//     if (mode) {
//         whereConditions.push(
//             eq(paperModel.mode, mode)
//         )
//     }

//     if (oldPaper.displayName) {
//         whereConditions.push(
//             eq(paperModel.displayName, oldPaper.displayName)
//         );
//     }

//     const [foundPaper] = await db
//         .select()
//         .from(paperModel)
//         .where(and(...whereConditions));

//     if (foundPaper) {
//         return foundPaper;
//     }

//     const [newPaper] = await db.insert(paperModel).values({
//         offeredSubjectId: foundOfferedSubject.id,
//         mode,
//         name: oldPaper.paperName.trim(),
//         shortName: oldPaper.paperShortName.trim(),
//         displayName: oldPaper.displayName ? oldPaper.displayName.trim().toUpperCase() : null,
//     }).returning();

//     console.log("in processPaper(), created new paper");

//     return newPaper;
// }

// async function getBatch(oldBatchPaper: OldBatchPaper) {
//     console.log("oldBatchPaper:", oldBatchPaper)
//     const oldBatchResult =
//         (await mysqlConnection
//             .query(`
//                     SELECT * 
//                     FROM ${oldBatchTable} 
//                     WHERE id = ${oldBatchPaper.parent_id}`
//             ) as [OldBatch[], any])[0]
//         ;

//     if (oldBatchResult.length === 0) {
//         return null;
//     }

//     const oldBatch = oldBatchResult[0];
//     const session = await processSession(oldBatch.sessionId);



//     const course = await processCourse(oldBatch.courseId);
//     const academicClass = await processClass(oldBatch.classId);
//     const shift = await processShift(oldBatch.shiftId);
//     const section = oldBatch.sectionId ? await processSection(oldBatch.sectionId) : null;

//     const whereConditions = [
//         eq(batchModel.courseId, course.id as number),
//         eq(batchModel.classId, academicClass.id as number),
//         eq(batchModel.sessionId, session.id as number),
//     ];

//     if (shift) {
//         whereConditions.push(eq(batchModel.shiftId, shift.id as number))
//     }

//     if (section) {
//         whereConditions.push(
//             eq(batchModel.sectionId, section.id as number)
//         );
//     }

//     const [foundBatch] = await db
//         .select()
//         .from(batchModel)
//         .where(and(...whereConditions));

//     if (!foundBatch) {
//         return null;
//     }

//     return foundBatch;
// }

// async function processBatchPaper(oldBatchPaper: OldBatchPaper, subjectMetadata: SubjectMetadata) {
//     const foundBatch = await getBatch(oldBatchPaper);

//     if (!foundBatch) {
//         return null;
//     }

//     // console.log("in processBatchPaper(), oldBatchPaper:", oldBatchPaper);

//     const foundPaper = await processPaper(oldBatchPaper, subjectMetadata);
//     if (!foundPaper) {
//         console.log(`Not found paper for oldBatchPaper.id:`, oldBatchPaper.ID);
//         return null;
//     }

//     const [foundBatchPaper] = await db
//         .select()
//         .from(batchPaperModel)
//         .where(
//             and(
//                 eq(batchPaperModel.batchId, foundBatch.id),
//                 eq(batchPaperModel.paperId, foundPaper.id)
//             )
//         );

//     if (foundBatchPaper) {
//         return foundBatchPaper;
//     }

//     const [newBatchPaper] = await db
//         .insert(batchPaperModel)
//         .values({
//             batchId: foundBatch.id,
//             paperId: foundPaper.id,
//         })
//         .returning();

//     console.log("created new batch:", newBatchPaper.id);

//     return newBatchPaper;
// }

// interface StudentSubjectCourse {
//     coursename: string;
//     classname: string;
//     name: string;
//     codenumber: string;
//     subjecttypename: string;
//     subjectname: string;
// }


// async function getStream(obj: StudentSubjectCourse): Promise<Stream | null> {
//     // Normalize course name
//     const courseName = obj.coursename.toUpperCase().trim();

//     // Mapping of course names to degree short names
//     const degreeMap: Record<string, string> = {
//         "B.A": "BA",
//         "B.COM (G)": "BCOM (G)",
//         "B.COM (H)": "BCOM (H)",
//         "B.SC": "BSC",
//         "BBA": "BBA",
//         "M.A": "M.A",
//         "M.COM": "M.COM",
//     };

//     // Find the appropriate degree short name
//     const degreeKey = Object.keys(degreeMap).find((key) => courseName.trim().toUpperCase().startsWith(key));
//     if (!degreeKey) return null;

//     let degreeName = degreeMap[degreeKey];
//     let degreeProgramme: "HONOURS" | "GENERAL" | null = "HONOURS";

//     if (degreeName === "BCOM (G)") {
//         degreeName = "BCOM";
//         degreeProgramme = "GENERAL";
//     }
//     else if (degreeName === "BCOM (H)") {
//         degreeName = "BCOM";
//         degreeProgramme = "HONOURS";
//     }

//     let degree: Degree | null = await findDegreeByName(degreeName);

//     if (!degree) {
//         const [newDegree] = await db.insert(degreeModel).values({ name: degreeName }).returning();
//         degree = newDegree;
//     }

//     // Fetch the stream
//     const whereConditions = [
//         eq(streamModel.degreeId, degree.id as number),
//         eq(streamModel.framework, "CCF"),
//         eq(streamModel.degreeProgramme, degreeProgramme)
//     ];

//     let [foundStream] = await db
//         .select()
//         .from(streamModel)
//         .where(and(...whereConditions));


//     if (!foundStream) {
//         await addStream({ degree });
//         const [stream] = await db
//             .select()
//             .from(streamModel)
//             .where(
//                 and(
//                     eq(streamModel.degreeId, degree.id as number),
//                     eq(streamModel.framework, "CCF"),
//                     eq(streamModel.degreeProgramme, "HONOURS")
//                 )
//             );
//         foundStream = stream;
//     }

//     return foundStream || null;
// }





// async function processStudentPaper() {
//     // const [foundSession] = await db.select().from(sessionModel).where(eq(sessionModel.id, batch.sessionId));

//     // Find the total batches
//     const [rows] = await mysqlConnection.query(`
//         SELECT COUNT(*) AS totalRows 
//         FROM studentpaperlinkingmain
//     `);
//     const { totalRows: totalBatches } = (rows as { totalRows: number }[])[0];

//     // Find the total sessions
//     // const [rows2] = await mysqlConnection.query(`
//     //     SELECT DISTINCT COUNT(sessionId) AS sessionId 
//     //     FROM ${oldBatchTable}
//     // `);
//     // const sessions = (rows2 as { sessionId: number }[]);

//     // Find the total clasess
//     // const [rows3] = await mysqlConnection.query(`
//     //     SELECT COUNT(*) AS totalRows 
//     //     FROM classes
//     // `);
//     // const { totalRows: totalClasses } = (rows3 as { totalRows: number }[])[0];

//     for (let b = 1; b <= 2190; b++) { // Temp changes
//         console.log("b:", b)
//         if (b < 1993) continue; // Temp Condition

//         const [oldBatchResult] = (
//             await mysqlConnection.query(`
//                 SELECT * 
//                 FROM studentpaperlinkingmain
//                 WHERE id = ${b} AND sessionId >= 16
//             `) as [OldBatch[], any]
//         );

//         if (oldBatchResult.length === 0) {
//             console.log("continue, not found")
//             continue
//         };



//         if (!oldBatchResult[0].classId || (oldBatchResult[0].classId && [1, 2, 3].includes(oldBatchResult[0].classId))) {
//             console.log(b, "in continue, oldBatch.classId:", oldBatchResult[0]?.classId || "N/A")
//             continue;
//         }

//         await processBatch(oldBatchResult[0]);

//         for (let s = 1; s <= 18; s++) {

//             if (s <= 16) continue // Temp Condition

//             const session = await processSession(s);

//             for (let c = 1; c <= 9; c++) {
//                 const academicClass = await processClass(c);

//                 // console.log("academicClass:", academicClass.type)
//                 if (academicClass.type === "YEAR") continue;

//                 // TODO: Paginate
//                 console.log("fetching data...");
//                 const [result] = (
//                     await mysqlConnection.query(`
//                         (
//                             select distinct 
//                                 co.coursename,
//                                 cl.classname,
//                                 s.name,
//                                 s.codenumber,
//                                 st.subjecttypename,
//                                 sb.subjectname
//                             from 
//                                 studentpaperlinkingmain m,
//                                 studentpaperlinkingpaperlist p,
//                                 historicalrecord h,
//                                 studentpersonaldetails s,
//                                 course co,
//                                 classes cl,
//                                 subjecttype st,
//                                 subject sb
//                             where 
//                                 m.id = ${b}
//                                 and m.sessionid = ${s} 
//                                 and m.classid = ${c} 
//                                 and m.id = p.parent_id 
//                                 and p.allstudents = 1 
//                                 and m.courseid = h.courseid 
//                                 and m.classid = h.classid 
//                                 and m.sectionid = h.sectionid 
//                                 and m.shiftid = h.shiftid 
//                                 and m.sessionid = h.sessionid 
//                                 and h.parent_id = s.id 
//                                 and m.courseid = co.id 
//                                 and m.classid = cl.id 
//                                 and p.subjectTypeId = st.id 
//                                 and p.subjectId = sb.id 
//                         ) union (
//                             select distinct 
//                                 co.coursename,
//                                 cl.classname,
//                                 s.name,
//                                 s.codenumber,
//                                 st.subjecttypename,
//                                 sb.subjectname
//                             from 
//                                 studentpaperlinkingmain m,
//                                 studentpaperlinkingpaperlist p,
//                                 studentpaperlinkingstudentlist ss,
//                                 historicalrecord h,
//                                 studentpersonaldetails s,
//                                 course co,
//                                 classes cl,
//                                 subjecttype st,
//                                 subject sb 
//                             where 
//                                 m.id = ${b}
//                                 and m.sessionid = ${s} 
//                                 and m.classid = ${c} 
//                                 and m.id=p.parent_id 
//                                 and p.allstudents=0 
//                                 and p.id=ss.parent_id 
//                                 and m.courseid=h.courseid 
//                                 and m.classid=h.classid 
//                                 and m.sectionid=h.sectionid 
//                                 and m.shiftid=h.shiftid 
//                                 and m.sessionid=h.sessionid 
//                                 and h.parent_id=s.id 
//                                 and m.courseid=co.id 
//                                 and m.classid=cl.id 
//                                 and p.subjectTypeId=st.id 
//                                 and p.subjectId=sb.id 
//                                 and ss.studentid=s.id 
//                         )
//                     order by coursename, codenumber, subjectTypeName;
//                     `) as [StudentSubjectCourse[], any]
//                 );

//                 if (s == 16 && c == 5 && b === 2190) {

//                     console.log(`
//                         (
//                             select distinct 
//                                 co.coursename,
//                                 cl.classname,
//                                 s.name,
//                                 s.codenumber,
//                                 st.subjecttypename,
//                                 sb.subjectname
//                             from 
//                                 studentpaperlinkingmain m,
//                                 studentpaperlinkingpaperlist p,
//                                 historicalrecord h,
//                                 studentpersonaldetails s,
//                                 course co,
//                                 classes cl,
//                                 subjecttype st,
//                                 subject sb
//                             where 
//                                 m.id = ${b}
//                                 and m.sessionid = ${s} 
//                                 and m.classid = ${c} 
//                                 and m.id = p.parent_id 
//                                 and p.allstudents = 1 
//                                 and m.courseid = h.courseid 
//                                 and m.classid = h.classid 
//                                 and m.sectionid = h.sectionid 
//                                 and m.shiftid = h.shiftid 
//                                 and m.sessionid = h.sessionid 
//                                 and h.parent_id = s.id 
//                                 and m.courseid = co.id 
//                                 and m.classid = cl.id 
//                                 and p.subjectTypeId = st.id 
//                                 and p.subjectId = sb.id 
//                         ) union (
//                             select distinct 
//                                 co.coursename,
//                                 cl.classname,
//                                 s.name,
//                                 s.codenumber,
//                                 st.subjecttypename,
//                                 sb.subjectname
//                             from 
//                                 studentpaperlinkingmain m,
//                                 studentpaperlinkingpaperlist p,
//                                 studentpaperlinkingstudentlist ss,
//                                 historicalrecord h,
//                                 studentpersonaldetails s,
//                                 course co,
//                                 classes cl,
//                                 subjecttype st,
//                                 subject sb 
//                             where 
//                                 m.id = ${b}
//                                 and m.sessionid = ${s} 
//                                 and m.classid = ${c} 
//                                 and m.id=p.parent_id 
//                                 and p.allstudents=0 
//                                 and p.id=ss.parent_id 
//                                 and m.courseid=h.courseid 
//                                 and m.classid=h.classid 
//                                 and m.sectionid=h.sectionid 
//                                 and m.shiftid=h.shiftid 
//                                 and m.sessionid=h.sessionid 
//                                 and h.parent_id=s.id 
//                                 and m.courseid=co.id 
//                                 and m.classid=cl.id 
//                                 and p.subjectTypeId=st.id 
//                                 and p.subjectId=sb.id 
//                                 and ss.studentid=s.id 
//                         )
//                     order by coursename, codenumber, subjectTypeName;
//                     `)

//                 }

//                 console.log("after fetch, total data:", result.length);
//                 // Process all the student's subjects
//                 for (let i = 0; i < result.length; i++) {
//                     console.log(`session: ${s} \t class: ${c} batch: ${b} `);
//                     // 1. Identify the stream
//                     const stream = await getStream(result[i]);
//                     console.log(stream);
//                     if (!stream) {
//                         console.log("stream for", result[i].coursename, "not found");
//                         continue;
//                     }
//                     console.log(result[i]);
//                     // 2. Identify the semester
//                     let sem: number | undefined;
//                     switch (academicClass.name.trim().toUpperCase()) {
//                         case "SEMESTER I":
//                             sem = 1;
//                             break;
//                         case "SEMESTER II":
//                             sem = 2;
//                             break;
//                         case "SEMESTER III":
//                             sem = 3;
//                             break;
//                         case "SEMESTER IV":
//                             sem = 4;
//                             break;
//                         case "SEMESTER V":
//                             sem = 5;
//                             break;
//                         case "SEMESTER VI":
//                             sem = 6;
//                             break;
//                         case "SEMESTER VII":
//                             sem = 7;
//                             break;
//                         case "SEMESTER VIII":
//                             sem = 8;
//                             break;
//                     }
//                     console.log("sem:", sem, session, academicClass);
//                     // 3. Identify the subject-type
//                     const [foundSubjectType] = await db
//                         .select()
//                         .from(subjectTypeModel)
//                         .where(eq(subjectTypeModel.irpName, result[i].subjecttypename.trim().toUpperCase()));
//                     console.log("foundSubjectType:", foundSubjectType.irpName, "res:", result[i].subjecttypename.trim().toUpperCase())
//                     if (!foundSubjectType) continue;

//                     if (!sem) continue;

//                     // 4. Map and add all the subjects to the batch-papers
//                     console.log("using:", stream?.id, sem, foundSubjectType.id, result[i].subjectname.trim().toUpperCase())
//                     const [foundSubjectMetadata] = await db
//                         .select()
//                         .from(subjectMetadataModel)
//                         .where(
//                             and(
//                                 eq(subjectMetadataModel.streamId, stream?.id as number),
//                                 eq(subjectMetadataModel.semester, sem),
//                                 eq(subjectMetadataModel.subjectTypeId, foundSubjectType.id),
//                                 eq(subjectMetadataModel.irpName, result[i].subjectname.trim().toUpperCase()),
//                             )
//                         );
//                     console.log("foundSubjectMetadata:", foundSubjectMetadata)
//                     if (!foundSubjectMetadata) continue;

//                     // 5. Add the batch paper
//                     console.log("Add the batch paper")
//                     const [oldSubjectTypeResult] = await mysqlConnection.query(
//                         `SELECT * FROM ${oldSubjectTypeTable} WHERE subjectTypeName = ?`,
//                         [result[i].subjecttypename]
//                     ) as [OldSubjectType[], any];

//                     const oldSubjectType = oldSubjectTypeResult[0];

//                     const [oldSubjectResult] = (
//                         await mysqlConnection.query(`
//                             SELECT * FROM ${oldSubjectTable} WHERE subjectName = ?`,
//                             [result[i].subjectname]
//                         ) as [OldSubject[], any]
//                     );
//                     const oldSubject = oldSubjectResult[0];

//                     // const [oldBatchPaperResult] = (
//                     //     await mysqlConnection.query(`
//                     //         SELECT * 
//                     //         FROM ${oldBatchPaperTable} 
//                     //         WHERE 
//                     //             parent_id = ${oldBatchResult[0].id}
//                     //             AND subjectTypeId = ${oldSubjectType.id}
//                     //             AND subjectId = ${oldSubject.id}
//                     //     `) as [OldBatchPaper[], any]
//                     // );
//                     console.log(oldBatchResult[0]?.id, oldSubjectType, oldSubject)
//                     console.log(`SELECT * FROM ${oldBatchPaperTable} WHERE parent_id = ${oldBatchResult[0]?.id} AND subjectTypeId = ${oldSubjectType.id} AND subjectId = ${oldSubject.id}`)
//                     const [oldBatchPaperResult] = await mysqlConnection.query(
//                         `SELECT * FROM ${oldBatchPaperTable} WHERE parent_id = ? AND subjectTypeId = ? AND subjectId = ?`,
//                         [oldBatchResult[0]?.id, oldSubjectType?.id, oldSubject?.id]
//                     ) as [OldBatchPaper[], any];

//                     if (oldBatchPaperResult.length === 0) {
//                         console.log("continue, oldbatch paer not exist");
//                         continue;
//                     }

//                     console.log("oldBatchPaperResult[0]:", oldBatchPaperResult[0])
//                     const batchPaper = await processBatchPaper(oldBatchPaperResult[0], foundSubjectMetadata);
//                     console.log("batchPaper:", batchPaper)
//                     if (!batchPaper) {
//                         console.log("not found batchPaper")
//                         continue;
//                     }
//                     // 6. Fetch the student
//                     const [academicIdentifier] = await db
//                         .select()
//                         .from(academicIdentifierModel)
//                         .where(eq(academicIdentifierModel.uid, result[i].codenumber.trim()));

//                     // 7. Add the student paper
//                     const [foundStudentPaper] = await db
//                         .select()
//                         .from(studentPaperModel)
//                         .where(and(
//                             eq(studentPaperModel.studentId, academicIdentifier.studentId),
//                             eq(studentPaperModel.batchPaperId, batchPaper?.id as number),
//                         ));
//                     console.log("foundStudentPaper:", foundStudentPaper)
//                     if (!foundStudentPaper) {
//                         await db.insert(studentPaperModel).values({
//                             batchPaperId: batchPaper?.id as number,
//                             studentId: academicIdentifier.studentId,
//                         }).returning();

//                         console.log("Inserted student's paper subject");
//                     }

//                 }

//             }

//             console.log("done session:", s);
//         }
//         console.log("done batch:", oldBatchResult[0].id);
//     }


//     // const [rows] = await mysqlConnection.query(`
//     //     SELECT COUNT(*) AS totalRows 
//     //     FROM ${oldStudentPaperTable} 
//     //     WHERE parent_id = ${oldBatchPaper.ID}
//     // `);
//     // const { totalRows } = (rows as { totalRows: number }[])[0];
//     // console.log(`[Processing student] totalRows: ${totalRows},`, rows);

//     // const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

//     // for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//     //     const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//     //     console.log(`\n[Processing student] Migrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);

//     //     const [rows] = await mysqlConnection.query(`
//     //         SELECT * 
//     //         FROM ${oldStudentPaperTable} 
//     //         WHERE parent_id = ${oldBatchPaper.ID}
//     //         LIMIT ${BATCH_SIZE} OFFSET ${offset}
//     //     `) as [OldStudentPaper[], any];

//     //     const oldDataArr = rows as OldStudentPaper[];

//     //     for (let i = 0; i < oldDataArr.length; i++) {
//     //         // Process the data
//     //         // 1. Fetch the oldStudent
//     //         const [oldStudent] = (
//     //             await mysqlConnection
//     //                 .query(`
//     //                         SELECT * 
//     //                         FROM studentpersonaldetails
//     //                         WHERE id = ${oldDataArr[i].studentId}`
//     //                 ) as [OldStudent[], any]
//     //         )[0];

//     //         // 2. Fetch the student from academic360-db
//     //         const [foundAcademicIdentifier] = await db
//     //             .select()
//     //             .from(academicIdentifierModel)
//     //             .where(eq(academicIdentifierModel.uid, oldStudent.codeNumber.trim()));

//     //         if (!foundAcademicIdentifier) {
//     //             continue;
//     //         }

//     //         const foundStudent = await findStudentById(foundAcademicIdentifier.studentId);

//     //         if (!foundStudent) {
//     //             continue;
//     //         }

//     //         // 3. Check if the entry already exist
//     //         const [foundStudentPaper] = await db
//     //             .select()
//     //             .from(studentPaperModel)
//     //             .where(
//     //                 and(
//     //                     eq(studentPaperModel.batchPaperId, batchPaper.id as number),
//     //                     eq(studentPaperModel.studentId, foundStudent.id as number),
//     //                 )
//     //             );

//     //         if (foundStudentPaper) {
//     //             continue;
//     //         }

//     //         // 4. Insert the student's paper entry
//     //         await db
//     //             .insert(studentPaperModel)
//     //             .values({
//     //                 batchPaperId: batchPaper.id as number,
//     //                 studentId: foundStudent.id as number,
//     //             })
//     //             .returning();

//     //         console.log(`in processing student's inner nested loopBatch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);
//     //     }

//     // }
// }

// export async function loadPaperSubjects() {
//     await processStudentPaper();
//     // console.log(`\n\nCounting rows from table ${oldBatchPaperTable}...`);

//     // const subjectTypeArr = await db.select().from(subjectTypeModel);

//     // const subjectMetadataArr = await db.select().from(subjectMetadataModel);

//     // for (let i = 0; i < subjectMetadataArr.length; i++) {
//     //     const subjectType = subjectTypeArr.find(ele => ele.id === subjectMetadataArr[i].subjectTypeId);

//     //     if (!subjectType) continue;

//     //     const [oldSubjectTypeResult] = (
//     //         await mysqlConnection.query(`
//     //             SELECT * 
//     //             FROM ${oldSubjectTypeTable} 
//     //             WHERE LOWER(subjectTypeName) LIKE LOWER(?)
//     //         `, [`%${subjectType.irpName}%`]) as [OldSubjectType[], any]
//     //     );

//     //     if (oldSubjectTypeResult.length === 0) continue;
//     //     const oldSubjectType = oldSubjectTypeResult[0];


//     //     const [oldSubjectResult] = (
//     //         await mysqlConnection.query(`
//     //             SELECT * 
//     //             FROM ${oldSubjectTable} 
//     //             WHERE LOWER(subjectName) LIKE LOWER(?)
//     //         `, [`%${subjectMetadataArr[i].irpName}%`]) as [OldSubject[], any]
//     //     );

//     //     if (oldSubjectResult.length === 0) continue;
//     //     const oldSubject = oldSubjectResult[0];

//     //     const [rows] = await mysqlConnection.query(`
//     //         SELECT COUNT(*) AS totalRows 
//     //         FROM ${oldBatchPaperTable} 
//     //         WHERE subjectTypeId = ${oldSubjectType.id} AND subjectId = ${oldSubject.id}
//     //     `);
//     //     const { totalRows } = (rows as { totalRows: number }[])[0];

//     //     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

//     //     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//     //         const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//     //         console.log(`\n[main loop] - Migrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);

//     //         const [rows] = await mysqlConnection.query(`
//     //             SELECT * FROM ${oldBatchPaperTable} 
//     //             WHERE subjectTypeId = ${oldSubjectType.id} AND subjectId = ${oldSubject.id}
//     //             LIMIT ${BATCH_SIZE} OFFSET ${offset}
//     //         `) as [OldBatchPaper[], any];
//     //         const oldDataArr = rows as OldBatchPaper[];

//     //         for (let i = 0; i < oldDataArr.length; i++) {
//     //             try {
//     //                 await processBatchPaper(oldDataArr[i]);
//     //             } catch (error) {
//     //                 console.log(error)
//     //             }
//     //             console.log(`[main loop] - Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);

//     //         }
//     //     }
//     // }

//     // const [rows] = await mysqlConnection.query(`SELECT COUNT(*) AS totalRows FROM ${oldBatchPaperTable}`);
//     // const { totalRows } = (rows as { totalRows: number }[])[0];

//     // const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

//     // console.log(`\nTotal rows to migrate: ${totalRows}`);

//     // for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//     //     const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//     //     console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
//     //     const [rows] = await mysqlConnection.query(`SELECT * FROM ${oldBatchPaperTable} LIMIT ${BATCH_SIZE} OFFSET ${offset}`) as [OldBatchPaper[], any];
//     //     const oldDataArr = rows as OldBatchPaper[];

//     //     for (let i = 0; i < oldDataArr.length; i++) {
//     //         try {
//     //             await processBatchPaper(oldDataArr[i]);
//     //         } catch (error) {
//     //             console.log(error)
//     //         }
//     //         console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);

//     //     }
//     // }
// }

// export async function batchPaperFormatResponse(batchPaper: BatchPaper | null): Promise<BatchPaperType | null> {
//     if (!batchPaper) {
//         return null;
//     }

//     const { paperId, ...props } = batchPaper;

//     const foundPaper = await findPaperById(paperId);

//     const formattedBatchPaper: BatchPaperType = {
//         ...props,
//         paper: foundPaper as PaperType
//     }

//     return formattedBatchPaper;
// }












async function getOlderSubjectMappedByNew(subjectMetadata: SubjectMetadata) {
    const [foundSubjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(
            eq(subjectTypeModel.id, subjectMetadata.subjectTypeId!)
        );

    // Fetch the older subject type
    const [[oldSubjectType]] = await mysqlConnection.query(
        `SELECT * FROM ?? WHERE LOWER(subjectTypeName) LIKE LOWER(?)`,
        [oldSubjectTypeTable, foundSubjectType.irpName]
    ) as [OldSubjectType[], any];

    if (!oldSubjectType) {
        console.log("Old subject not found by finding from new irp sbjtyp name:", foundSubjectType.irpName);
        return null;
    }

    // Fetch the older subject
    const [[oldSubject]] = await mysqlConnection.query(
        `SELECT * FROM ?? WHERE LOWER(univcode) LIKE LOWER(?) AND subjectTypeId = ?`,
        [oldSubjectTable, subjectMetadata.irpCode, oldSubjectType.id]
    ) as [OldSubject[], any];

    if (!oldSubject) {
        console.log("Old subject not found by finding from new irp sbj name:", subjectMetadata.irpCode, foundSubjectType.irpName);
        return null;
    }

    return { oldSubject, oldSubjectType };
}

async function processEachBatchPaperAssociation(oldBatchPaper: {
    oldBatchIdFk: number;
    oldBatchPaperId: number;
}, batchPaper: BatchPaper) {
    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows
        FROM ${oldStudentPaperTable}
        WHERE parent_id = ${oldBatchPaper.oldBatchPaperId};
    `);

    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatch = Math.ceil(totalRows / BATCH_SIZE);

    console.log("in processEachBatchPaperAssociation(), totalRows:", totalRows);
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        const [oldStudentBatchPaperAssociation] = await mysqlConnection.query(`
            SELECT
                sp.studentId AS oldStudentIdFk,
                s.codeNumber AS uid
            FROM
                studentpaperlinkingstudentlist sp,
                studentpersonaldetails s
            WHERE
                sp.parent_id = ${oldBatchPaper.oldBatchPaperId}
                AND sp.studentId = s.id
            LIMIT ${BATCH_SIZE} 
            OFFSET ${offset};
        `) as [{ oldStudentIdFk: number, uid: string }[], any];

        console.log(`in student-association(), oldStudentBatchPaperAssociation: ${oldStudentBatchPaperAssociation.length}`);

        const tmpArr = await db
            .select()
            .from(academicIdentifierModel)
            .where(
                inArray(
                    academicIdentifierModel.uid,
                    oldStudentBatchPaperAssociation.map(ele => ele.uid.trim())
                )
            );

        if (tmpArr.length == 0) {
            console.log("No student exist... therefore continue");
            continue;
        }



        for (let s = 0; s < oldStudentBatchPaperAssociation.length; s++) {
            const foundStudent = await getMappedOldStudentByNewStudent(oldStudentBatchPaperAssociation[s].oldStudentIdFk);

            if (!foundStudent) {
                console.log("in student-association(), not found student... therfore continue...");
                continue;
            }

            let [foundStudentAssociation] = await db
                .select()
                .from(studentPaperModel)
                .where(
                    and(
                        eq(studentPaperModel.batchId, batchPaper.batchId!),
                        eq(studentPaperModel.batchPaperId, batchPaper.id!),
                        eq(studentPaperModel.studentId, foundStudent.id!),
                    )
                );

            if (!foundStudentAssociation) {
                const [newStudentAssociation] = await db
                    .insert(studentPaperModel)
                    .values({
                        batchId: batchPaper.batchId!,
                        batchPaperId: batchPaper.id!,
                        studentId: foundStudent.id!,
                    })
                    .returning();

                foundStudentAssociation = newStudentAssociation;

                console.log("Student paper association created!");
            }
            else {
                console.log("already exist student association");
            }

        }

        console.log(`totalEntries in student-association(): ${currentBatch}/${totalBatch}`)

    }

}

async function getMappedOldStudentByNewStudent(oldStudentId: number) {
    const [[oldStudent]] = await mysqlConnection.query(`
        SELECT *
        FROM studentpersonaldetails
        WHERE id = ${oldStudentId};
    `) as [OldStudent[], any];

    const [foundAcademicIdentifier] = await db
        .select()
        .from(academicIdentifierModel)
        .where(
            ilike(academicIdentifierModel.uid, oldStudent.codeNumber.trim())
        );

    const [foundStudent] = await db
        .select()
        .from(studentModel)
        .where(
            eq(studentModel.id, foundAcademicIdentifier.studentId)
        );

    return foundStudent ?? null;
}

async function processOldBatchPapers(oldBatchPapers: { oldBatchIdFk: number, oldBatchPaperId: number }[], subjectMetadata: SubjectMetadata) {
    for (let j = 0; j < oldBatchPapers.length; j++) {
        // console.log(`
        //     SELECT COUNT(*) AS totalRows
        //     FROM ${oldBatchTable}
        //     WHERE 
        //         id = ${oldBatchPapers[j].oldBatchIdFk}
        //         AND (
        //             SELECT COUNT(ID)
        //             FROM ${oldStudentPaperTable}
        //             WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
        //         ) > 0;
        // `)
        const [rows] = await mysqlConnection.query(`
            SELECT COUNT(*) AS totalRows
            FROM ${oldBatchTable}
            WHERE 
                id = ${oldBatchPapers[j].oldBatchIdFk}
                AND (
                    SELECT COUNT(ID)
                    FROM ${oldStudentPaperTable}
                    WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
                ) > 0;
        `);


        console.log("rows:", rows, "oldBatchPapers:", j + 1, " / ", oldBatchPapers.length);
        const { totalRows } = (rows as { totalRows: number }[])[0];

        const totalBatch = Math.ceil(totalRows / BATCH_SIZE);

        console.log("in processEachBatchPaperAssociation(), totalRows:", totalRows);
        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number
            const [oldBatches] = await mysqlConnection.query(`
                    SELECT *
                    FROM ${oldBatchTable}
                    WHERE
                        id = ${oldBatchPapers[j].oldBatchIdFk}
                        AND (
                            SELECT COUNT(ID)
                            FROM ${oldStudentPaperTable}
                            WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
                        ) > 0
                    LIMIT ${BATCH_SIZE} 
                    OFFSET ${offset};
                `) as [OldBatch[], any];
            console.log("in processOldBatchPapers(), old-batches:", oldBatches.length);

            for (let k = 0; k < oldBatches.length; k++) {
                const oldBatch = oldBatches[k];
                const batch = await processBatch(oldBatch);

                let [foundBatchPaper] = await db
                    .select()
                    .from(batchPaperModel)
                    .where(
                        and(
                            eq(batchPaperModel.batchId, batch.id!),
                            eq(batchPaperModel.subjectMetadataId, subjectMetadata.id!)
                        )
                    );

                if (!foundBatchPaper) {
                    const [newBatchPaper] = await db
                        .insert(batchPaperModel)
                        .values({
                            batchId: batch.id!,
                            subjectMetadataId: subjectMetadata.id!,
                        })
                        .returning();

                    foundBatchPaper = newBatchPaper;

                    console.log("New Batch Paper created...")
                } else {
                    console.log(`Batch Paper (irpName, ${subjectMetadata.irpName}) exist...`);
                }

                console.log("going to processEachBatchPaperAssociation()...");
                await processEachBatchPaperAssociation(oldBatchPapers[j], foundBatchPaper);
            }

            console.log(`done batch in processOldBatchPapers() - ${currentBatch} / ${totalBatch}`)
        }













    }



}

export async function loadBatchPapers() {
    const subjectMetadatas = await db
        .select()
        .from(subjectMetadataModel);

    for (let i = 0; i < subjectMetadatas.length; i++) {
        let oldSubject: OldSubject | null = null;
        let oldSubjectType: OldSubjectType | null = null;
        const tmpObj = await getOlderSubjectMappedByNew(subjectMetadatas[i]);

        if (!tmpObj) {
            console.log("Not found subject metadata for: ", subjectMetadatas[i].irpName);
            continue
        };
        oldSubject = tmpObj.oldSubject;
        oldSubjectType = tmpObj.oldSubjectType;

        const [oldBatchPapers] = await mysqlConnection.query(`
            SELECT
                bp.parent_id AS oldBatchIdFk,
                bp.ID AS oldBatchPaperId
            FROM
                ${oldBatchPaperTable} bp
            WHERE
                bp.subjectId = ${oldSubject.id} 
                AND bp.subjectTypeId = ${oldSubjectType.id}
                AND (
                    SELECT COUNT(ID)
                    FROM ${oldStudentPaperTable}
                    WHERE parent_id = bp.ID
                ) > 0
            ORDER BY parent_id ASC;
        `) as [{ oldBatchIdFk: number, oldBatchPaperId: number }[], any];


        console.log("in loadBatchPapers(), oldBatchPapers:", oldBatchPapers)
        await processOldBatchPapers(oldBatchPapers, subjectMetadatas[i]);







    }


























    // const [batchPapers] = await mysqlConnection.query(`
    //     SELECT *
    //     FROM ${oldBatchPaperTable}
    //     WHERE parent_id = ${oldBatchId}
    // `) as [OldBatchPaper[], any];

    // if (!batchPapers || batchPapers.length === 0) {
    //     return;
    // }
    // console.log("batchPapers:", batchPapers.length);

    // for (let i = 0; i < batchPapers.length; i++) {
    //     const oldBatchPaper = batchPapers[i];

    //     // Fetch the subject metadata
    //     const subjectMetadata: SubjectMetadata | null = await getMappedSubjectMetadata({ subjectTypeId: oldBatchPaper.subjectTypeId!, subjectId: oldBatchPaper.subjectId! });
    //     if (!subjectMetadata) {
    //         console.log(`No subject metadata found for old subjectTypeId: ${oldBatchPaper.subjectTypeId}, old subjectId: ${oldBatchPaper.subjectId}`);
    //         continue;
    //     }

    //     // Insert the batch paper into the new database
    //     let [foundBatchPaper] = await db
    //         .select()
    //         .from(batchPaperModel)
    //         .where(
    //             and(
    //                 eq(batchPaperModel.batchId, updatedBatch.id as number),
    //                 eq(batchPaperModel.subjectMetadataId, subjectMetadata.id as number),
    //             )
    //         );

    //     if (!foundBatchPaper) {
    //         const [newBatchPaper] = await db.insert(batchPaperModel).values({
    //             batchId: updatedBatch.id as number,
    //             subjectMetadataId: subjectMetadata.id as number,
    //         }).returning();

    //         foundBatchPaper = newBatchPaper;
    //     }

    //     // Fetch the student's associated with this subject
    //     const [rows] = await mysqlConnection.query(`
    //         SELECT COUNT(*) AS totalRows 
    //         FROM ${oldStudentPaperTable} 
    //         WHERE parent_id = ${oldBatchPaper.parent_id}
    //     `);
    //     const { totalRows } = (rows as { totalRows: number }[])[0];

    //     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    //     console.log(`\nTotal rows to migrate for student's selected subjects: ${totalRows}`);

    //     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
    //         const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

    //         console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
    //         const [rows] = await mysqlConnection.query(`
    //             SELECT * 
    //             FROM ${oldStudentPaperTable}
    //             WHERE parent_id = ${oldBatchPaper.ID}
    //             LIMIT ${BATCH_SIZE} 
    //             OFFSET ${offset}
    //         `) as [OldStudentPaper[], any];
    //         const oldDataArr = rows as OldStudentPaper[];

    //         for (let s = 0; i < oldDataArr.length; s++) {
    //             const oldStudentPaper = oldDataArr[s];

    //             // Fetch the student based on old Id
    //             const [[oldStudent]] = await mysqlConnection.query(`
    //                 SELECT * 
    //                 FROM ${oldStudentTable}
    //                 WHERE id = ${oldStudentPaper.studentId}
    //             `) as [OldStudent[], any];

    //             if (!oldStudent) continue;

    //             const foundStudent = await processStudent(oldStudent);

    //             // Insert the student's paper association into the new database
    //             const [foundStudentPaper] = await db
    //                 .select()
    //                 .from(studentPaperModel)
    //                 .where(
    //                     and(
    //                         eq(studentPaperModel.studentId, foundStudent.id as number),
    //                         eq(studentPaperModel.batchPaperId, foundBatchPaper.id as number),
    //                     )
    //                 );

    //             if (!foundStudentPaper) {
    //                 await db.insert(studentPaperModel).values({
    //                     studentId: foundStudent.id as number,
    //                     batchPaperId: foundBatchPaper.id as number,
    //                     batchId: updatedBatch.id!,
    //                 }).returning();

    //                 console.log(`Inserted new student paper for student ID ${foundStudent.id} and batch paper ID ${foundBatchPaper.id}`);
    //             }


    //             console.log(`Batch for student's paper association: ${currentBatch}/${totalBatches} | Done: ${s + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);
    //         }
    //     }
    // }
};


async function getMappedSubjectMetadata({ subjectTypeId, subjectId }: { subjectTypeId: number, subjectId: number }) {
    const [oldSubjectType] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTypeTable} 
                    WHERE id = ${subjectTypeId}`
            ) as [OldSubjectType[], any]
    )[0];
    // console.log("in getMappedSubjectMetadata(), oldSubjectType:", oldSubjectType.subjectTypeName.trim().toUpperCase())
    const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.irpName, oldSubjectType.subjectTypeName.trim().toUpperCase()));

    if (!foundSubjectType) {
        console.log(`Not found subject type for irpName: ${oldSubjectType.subjectTypeName.trim().toUpperCase()}`)
        return null;
    }

    // console.log("foundSubjectType:", foundSubjectType.irpName, foundSubjectType.marksheetName);
    const [oldSubject] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTable} 
                    WHERE id = ${subjectId} AND subjectTypeId = ${subjectTypeId}`
            ) as [OldSubject[], any]
    )[0];

    // console.log("Old subject:", oldSubject);

    const whereConditions = [
        eq(subjectMetadataModel.subjectTypeId, foundSubjectType.id),
        // eq(subjectMetadataModel.irpCode, oldSubject.univcode),
    ];

    if (oldSubject.univcode) {
        whereConditions.push(
            eq(subjectMetadataModel.irpCode, oldSubject.univcode?.trim().toUpperCase())
        );
    }

    const [foundSubjectMetadata] =
        await db
            .select()
            .from(subjectMetadataModel)
            .where(and(...whereConditions));

    console.log('found subjectMetadata (in new db), irp:', foundSubjectMetadata?.irpName);
    return foundSubjectMetadata;
}