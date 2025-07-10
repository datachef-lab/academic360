import { db } from "@/db/index.js";
import { AnyColumn, count, desc, eq, SQLWrapper, SQL } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { PaginatedResponse } from "./PaginatedResponse.js";
import { Marksheet } from "@/features/academics/models/marksheet.model.js";
// import { findMarksheetsByStudentId } from "@/features/academics/services/marksheet.service.js";
// import { Stream } from "@/features/academics/models/stream.model.js";
// import { MarksheetType } from "@/types/academics/marksheet.type.js";
// import { SubjectType } from "@/types/academics/subject.js";
// import { Subject } from "@/features/academics/models/subject.model.js";
// import { findSubjectMetdataById } from "@/features/academics/services/subjectMetadata.service.js";
import { Degree } from "@/features/resources/models/degree.model.js";
import {
  findSemesterNumberbyClassId,
  processClassBySemesterNumber,
} from "@/features/academics/services/class.service.js";
// import { StreamType } from "@/types/academics/stream.js";

export async function findAll<T>(
  model: PgTable,
  page: number = 1,
  pageSize: number = 10,
  orderByColumn: string = "id",
  whereCondition?: SQL,
): Promise<PaginatedResponse<T>> {
  const offset = (page - 1) * pageSize;

  let query = db.select().from(model);

  if (whereCondition) {
    query = (query as any).where(whereCondition);
  }

  const dataArr = await query
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(model[orderByColumn as keyof typeof model] as AnyColumn));

  const countQuery = db.select({ count: count() }).from(model);

  if (dataArr.length === 0) {
    return {
      content: [],
      page: page,
      pageSize,
      totalElements: 0,
      totalPages: 0,
    };
  }

  const [{ count: countRows }] = whereCondition
    ? await countQuery.where(whereCondition)
    : await countQuery;

  return {
    content: dataArr as T[],
    page: page,
    pageSize,
    totalElements: Number(countRows),
    totalPages: Math.ceil(Number(countRows) / pageSize),
  };
}

interface FindAllByFormattedProps<T, K> {
  model: PgTable;
  fn: (ele: T) => Promise<K | null>;
  page?: number;
  pageSize?: number;
  orderByColumn?: string;
}

export async function findAllByFormatted<T, K>({
  model,
  fn,
  page = 1,
  pageSize = 10,
  orderByColumn = "id",
}: FindAllByFormattedProps<T, K>): Promise<PaginatedResponse<K>> {
  const arrResponse = await findAll<T>(model, page, pageSize, orderByColumn);

  // Await Promise.all to resolve async operations
  const content = (await Promise.all(
    arrResponse.content.map(async (ele) => {
      return await fn(ele);
    }),
  )) as K[];

  return {
    content,
    page: arrResponse.page,
    pageSize: arrResponse.pageSize,
    totalElements: arrResponse.totalElements,
    totalPages: arrResponse.totalPages,
  };
}

// export async function getLetterGrade(subject: Subject) {
//   if (subject.totalMarks === null) {
//     return null;
//   }

//   const foundSubjectMetadata = await findSubjectMetdataById(
//     subject.subjectMetadataId as number,
//   );

//   if (!foundSubjectMetadata) {
//     return null;
//   }

//   if (
//     subject.internalMarks &&
//     foundSubjectMetadata.fullMarksInternal &&
//     calculatePercentage(
//       subject.internalMarks,
//       foundSubjectMetadata.fullMarksInternal,
//     ) < 30
//   ) {
//     return "F(IN)";
//   }
//   if (
//     subject.practicalMarks &&
//     foundSubjectMetadata.fullMarksPractical &&
//     calculatePercentage(
//       subject.practicalMarks,
//       foundSubjectMetadata.fullMarksPractical,
//     ) < 30
//   ) {
//     return "F(PR)";
//   }
//   if (
//     subject.theoryMarks &&
//     foundSubjectMetadata.fullMarksTheory &&
//     calculatePercentage(
//       subject.theoryMarks,
//       foundSubjectMetadata.fullMarksTheory,
//     ) < 30
//   ) {
//     return "F(TH)";
//   }
//   // if (subject.tutorialMarks && foundSubjectMetadata.fullMarksTutorial && calculatePercentage(subject.tutorialMarks, foundSubjectMetadata.fullMarksTutorial) < 30) {
//   //     return "F(TU)";
//   // }

//   const subjectPercent = calculatePercentage(
//     subject.totalMarks as number,
//     foundSubjectMetadata?.fullMarks as number,
//   );

//   if (subjectPercent >= 90 && subjectPercent <= 100) {
//     return "A++";
//   }
//   if (subjectPercent >= 80 && subjectPercent < 90) {
//     return "A+";
//   }
//   if (subjectPercent >= 70 && subjectPercent < 80) {
//     return "A";
//   }
//   if (subjectPercent >= 60 && subjectPercent < 70) {
//     return "B+";
//   }
//   if (subjectPercent >= 50 && subjectPercent < 60) {
//     return "B";
//   }
//   if (subjectPercent >= 40 && subjectPercent < 50) {
//     return "C+";
//   }
//   if (subjectPercent >= 30 && subjectPercent < 40) {
//     return "C";
//   }
//   if (subjectPercent >= 0 && subjectPercent < 30) {
//     return "F";
//   }
// }

// export async function getClassification(cgpa: number, studentId: number) {
//   const marksheetList: MarksheetType[] =
//     await findMarksheetsByStudentId(studentId);

//   let isClearedSemester = false;
//   for (let i = 0; i < 6; i++) {
//     const foundClassForSem = await processClassBySemesterNumber(i + 1);
//     const marksheetObj = marksheetList.find(
//       (marksheet) => marksheet.class.id == foundClassForSem.id,
//     );
//     if (!marksheetObj || !marksheetObj.sgpa) {
//       isClearedSemester = false;
//       break;
//     }
//     isClearedSemester = true;
//   }

//   if (!isClearedSemester) {
//     return "Previous Semester not cleared";
//   } else {
//     if (cgpa >= 9 && cgpa <= 10) {
//       return "Outstanding";
//     } else if (cgpa >= 8 && cgpa < 9) {
//       return "Excellent";
//     } else if (cgpa >= 7 && cgpa < 8) {
//       return "Very Good";
//     } else if (cgpa >= 6 && cgpa < 7) {
//       return "Good";
//     } else if (cgpa >= 5 && cgpa < 6) {
//       return "Average";
//     } else if (cgpa >= 4 && cgpa < 5) {
//       return "Fair";
//     } else if (cgpa >= 3 && cgpa < 4) {
//       return "Satisfactory";
//     } else if (cgpa >= 0 && cgpa < 3) {
//       return "Fail";
//     }
//   }
// }

// export function getRemarks(
//   marksheetPercent: number,
//   degree: Degree,
//   course: "HONOURS" | "GENERAL",
//   semester: number,
//   subjects: SubjectType[],
// ) {
//   // Firstly check if all the subjects are got cleared, if not then return "Semester not cleared."
//   for (let i = 0; i < subjects.length; i++) {
//     const subject = subjects[i];

//     const subjectMetadata = subjects[i].subjectMetadata;

//     if (
//       subject.internalMarks &&
//       subjectMetadata.fullMarksInternal &&
//       calculatePercentage(
//         subject.internalMarks,
//         subjectMetadata.fullMarksInternal,
//       ) < 30
//     ) {
//       return "Semester not cleared.";
//     }
//     if (
//       subject.practicalMarks &&
//       subjectMetadata.fullMarksPractical &&
//       calculatePercentage(
//         subject.practicalMarks,
//         subjectMetadata.fullMarksPractical,
//       ) < 30
//     ) {
//       return "Semester not cleared.";
//     }
//     if (
//       subject.theoryMarks &&
//       subjectMetadata.fullMarksTheory &&
//       calculatePercentage(
//         subject.theoryMarks,
//         subjectMetadata.fullMarksTheory,
//       ) < 30
//     ) {
//       return "Semester not cleared.";
//     }
//     // if (subject.tutorialMarks && subjectMetadata.fullMarksTutorial && calculatePercentage(subject.tutorialMarks, subjectMetadata.fullMarksTutorial) < 30) {
//     //     return "Semester not cleared.";
//     // }
//     if (subjects[i].totalMarks === null || subjects[i].totalMarks === -1) {
//       return "Semester not cleared.";
//     }

//     let percentMarks =
//       ((subjects[i].totalMarks as number) * 100) /
//       subjects[i].subjectMetadata.fullMarks;

//     if (percentMarks < 30) {
//       return "Semester not cleared.";
//     }
//   }

//   // Get the remarks by total_marks percentage
//   if (marksheetPercent < 30) {
//     // For failed marksheet
//     return "Semester not cleared.";
//   } else {
//     // For passed marksheet
//     if (semester != 6) {
//       // For semester: 1, 2, 3, 4, 5
//       return "Semester Cleared.";
//     } else {
//       // For semester: 6
//       if (degree.name.toUpperCase() !== "BCOM") {
//         // For BA & BSC
//         return "Qualified with Honours.";
//       } else {
//         // For BCOM
//         if (course.toUpperCase() === "HONOURS") {
//           // For honours
//           return "Semester cleared with honours.";
//         } else {
//           // For general
//           return "Semester cleared with general.";
//         }
//       }
//     }
//   }
// }

// export function calculatePercentage(totalMarks: number, fullMarks: number) {
//   return (totalMarks * 100) / fullMarks;
// }

// export function calculateSGPA(marksheet: MarksheetType) {
//   let totalMarksObtained = 0,
//     fullMarksSum = 0,
//     ngp_credit = 0,
//     creditSum = 0;
//   for (let i = 0; i < marksheet.subjects.length; i++) {
//     if (!marksheet.subjects[i].totalMarks) {
//       continue; // If totalMarks is not present, then continue to the next subject
//     }

//     const subject = marksheet.subjects[i];

//     const subjectMetadata = marksheet.subjects[i].subjectMetadata;

//     if (
//       subject.internalMarks &&
//       subjectMetadata.fullMarksInternal &&
//       calculatePercentage(
//         subject.internalMarks,
//         subjectMetadata.fullMarksInternal,
//       ) < 30
//     ) {
//       return null;
//     }
//     if (
//       subject.practicalMarks &&
//       subjectMetadata.fullMarksPractical &&
//       calculatePercentage(
//         subject.practicalMarks,
//         subjectMetadata.fullMarksPractical,
//       ) < 30
//     ) {
//       return null;
//     }
//     if (
//       subject.theoryMarks &&
//       subjectMetadata.fullMarksTheory &&
//       calculatePercentage(
//         subject.theoryMarks,
//         subjectMetadata.fullMarksTheory,
//       ) < 30
//     ) {
//       return null;
//     }
//     // if (subject.tutorialMarks && subjectMetadata.fullMarksTutorial && calculatePercentage(subject.tutorialMarks, subjectMetadata.fullMarksTutorial) < 30) {
//     //     return null;
//     // }

//     let subjectPercent =
//       ((subject.totalMarks as number) * 100) /
//       subject.subjectMetadata.fullMarks;

//     if (subjectPercent < 30) {
//       // console.log(`Subject Percentage: ${subjectPercent}`);
//       return null; // If any subject is failed, return null immediately
//     }

//     if (marksheet.subjects[i].totalMarks) {
//       totalMarksObtained += marksheet.subjects[i].totalMarks as number;
//     }
//     fullMarksSum += marksheet.subjects[i].subjectMetadata.fullMarks;

//     if (
//       !marksheet.subjects[i].subjectMetadata.credit ||
//       !marksheet.subjects[i].ngp
//     ) {
//       continue;
//     }
//     ngp_credit +=
//       Number(marksheet.subjects[i].ngp) *
//       (marksheet.subjects[i].subjectMetadata.credit as number);
//     creditSum += marksheet.subjects[i].subjectMetadata.credit as number;
//   }
//   const marksheetPercent = (totalMarksObtained * 100) / fullMarksSum;
//   if (marksheetPercent < 30) {
//     return null;
//   }
//   // console.log("Calculating SGPA...");
//   return (ngp_credit / creditSum).toFixed(3);
// }

// export async function calculateCGPA(studentId: number): Promise<number | null> {
//   const marksheetList = await findMarksheetsByStudentId(studentId);

//   const updatedMarksheetList: MarksheetType[] = [];

//   // Step 1: Select and update all the passed marksheets
//   for (let semester = 1; semester <= 6; semester++) {
//     // Filter marksheets for the current semester
//     const foundClassForSem = await processClassBySemesterNumber(semester);
//     const semesterWiseArr = marksheetList.filter(
//       (mks) => mks.class.id === foundClassForSem.id,
//     );

//     if (semesterWiseArr.length === 0) {
//       return null;
//     }

//     // Sort all the filtered marksheets by createdAt (assuming createdAt is a Date object)
//     semesterWiseArr.sort(
//       (a, b) =>
//         new Date(a.createdAt as Date).getTime() -
//         new Date(b.createdAt as Date).getTime(),
//     );

//     let updatedSemesterMarksheet: MarksheetType = semesterWiseArr[0];

//     for (let i = 0; i < semesterWiseArr.length; i++) {
//       if (semesterWiseArr[i].sgpa) {
//         // Student had cleared the semester
//         updatedSemesterMarksheet = semesterWiseArr[i];
//         continue;
//       }
//       // If student has not cleared the semester, then do go on updating the subjects upto recent status.
//       const { subjects } = semesterWiseArr[i];
//       for (let j = 0; j < subjects.length; j++) {
//         updatedSemesterMarksheet.subjects =
//           updatedSemesterMarksheet.subjects.map((sbj) => {
//             if (subjects[j].subjectMetadata.id === sbj.subjectMetadata.id) {
//               return subjects[j]; // Return the recent changes for the subject
//             }
//             return sbj; // Otherwise, return the existing state which are not changed
//           });
//       }
//     }

//     updatedMarksheetList.push(updatedSemesterMarksheet);
//   }

//   let sgpa_totalcredit = 0,
//     creditSumAllSem = 0;

//   for (let i = 1; i <= 6; i++) {
//     const foundClass = await processClassBySemesterNumber(i);
//     const marksheet = marksheetList.find((obj) => obj.class.id == foundClass.id);
//     if (!marksheet) {
//       return null;
//     }
//     const sgpa = formatMarks(marksheet.sgpa as string) as number;
//     const totalCredit = calculateTotalCredit(marksheet);
//     sgpa_totalcredit += sgpa * totalCredit;
//     creditSumAllSem += totalCredit;
//   }

//   // Return the cgpa
//   return parseFloat((sgpa_totalcredit / creditSumAllSem).toFixed(3));
// }

// export function formatMarks(marks: string | null): number | null {
//   // console.log(marks)
//   if (!marks) {
//     return null;
//   }

//   if (marks.toString().trim() === "") {
//     return null;
//   }

//   if (marks.toString().toUpperCase() === "AB") {
//     return -1;
//   }

//   const tmpMarks = Number(marks);
//   return isNaN(tmpMarks) ? null : tmpMarks;
// }

// export function calculateTotalCredit(marksheet: MarksheetType) {
//   let totalCredit = 0;
//   for (let i = 0; i < marksheet.subjects.length; i++) {
//     if (!marksheet.subjects[i].subjectMetadata.credit) {
//       continue;
//     }

//     totalCredit += marksheet.subjects[i].subjectMetadata.credit as number;
//   }

//   return totalCredit;
// }
