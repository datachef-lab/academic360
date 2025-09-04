// import { db } from "@/db/index.js";
// import { marksheetModel } from "@/features/academics/models/marksheet.model.js";
// import { eq, ilike, or, count, and, gt, lte } from "drizzle-orm";
// import { academicIdentifierModel } from "../models/academicIdentifier.model.js";
// import { userModel } from "../models/user.model.js";
// // import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model.js";
// // import { subjectModel } from "@/features/academics/models/subject.model.js";
// // import { streamModel } from "@/features/academics/models/stream.model.js";
// import { degreeModel } from "@/features/resources/models/degree.model.js";
// import { studentModel } from "../models/student.model.js";
// import { classModel } from "@/features/academics/models/class.model.js";
// import { processClassBySemesterNumber } from "@/features/academics/services/class.service.js";

type ReportQueryParams = {
  page: number;
  pageSize: number;
  searchText?: string;
  stream?: string;
  framework?: string;
  semester?: number;
  year?: number;
  showFailedOnly?: "PASS" | "FAIL" | undefined;
  export?: boolean;
};

export const getReports = async ({
  page,
  pageSize,
  stream,
  framework,
  semester,
  year,
  showFailedOnly,
  export: isExport
}: ReportQueryParams) => {
//   const filters = [
//     year !== undefined ? eq(marksheetModel.year, year) : undefined,
//     // framework
//     //   ? eq(streamModel.framework, framework as "CCF" | "CBCS")
//     //   : undefined,
//     stream ? eq(degreeModel.name, stream) : undefined,
//   ];

//   if (semester) {
//     const foundClass = await processClassBySemesterNumber(semester);
//     filters.push(eq(marksheetModel.classId, foundClass.id));
//   }

//   const query = db
//     .select({
//       id: marksheetModel.studentId,
//       rollNumber: academicIdentifierModel.rollNumber,
//       registrationNumber: academicIdentifierModel.registrationNumber,
//       uid: academicIdentifierModel.uid,
//       name: userModel.name,
//       stream: degreeModel.name,
//       framework: academicIdentifierModel.framework,
//       semester: classModel.name,
//       year: marksheetModel.year,
//       subjectName: subjectMetadataModel.name,
//       fullMarks: subjectMetadataModel.fullMarks,
//       obtainedMarks: subjectModel.totalMarks,
//       credit: subjectMetadataModel.credit,
//       sgpa: marksheetModel.sgpa,
//       cgpa: marksheetModel.cgpa,
//       letterGrade: subjectModel.letterGrade,
//       remarks: marksheetModel.remarks,
//     })
//     .from(marksheetModel)
//     .leftJoin(
//       academicIdentifierModel,
//       eq(marksheetModel.studentId, academicIdentifierModel.studentId),
//     )
//     .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
//     .leftJoin(userModel, eq(studentModel.userId, userModel.id))
//     // .leftJoin(streamModel, eq(academicIdentifierModel.framework, framework))
//     .leftJoin(classModel, eq(marksheetModel.classId, classModel.id))
//     .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
//     .leftJoin(
//       subjectMetadataModel,
//       eq(subjectModel.subjectMetadataId, subjectMetadataModel.id),
//     )
//     .where(and(...filters.filter(Boolean)));

//   const allReportResult = await query;
//   console.log("Query returned", allReportResult.length, "records");
return {
    content: [],
    page,
    pageSize,
    totalRecords: 0,
    totalPages: 0,
  };
//   if (!allReportResult || allReportResult.length === 0) {
//     return {
//       content: [],
//       page,
//       pageSize,
//       totalRecords: 0,
//       totalPages: 0,
//     };
//   }

  const studentData: Record<number, any> = {};

//   allReportResult.forEach((record) => {
//     if (record.id !== null && !studentData[record.id]) {
//       studentData[record.id] = {
//         id: record.id,
//         rollNumber: record.rollNumber,
//         registrationNumber: record.registrationNumber,
//         uid: record.uid,
//         name: record.name,
//         semester: record.semester,
//         stream: record.stream,
//         framework: record.framework,
//         year: record.year,
//         sgpa: record.sgpa ? Number(record.sgpa) : 0,
//         cgpa: record.cgpa ? Number(record.cgpa) : 0,
//         letterGrade: record.letterGrade,
//         remarks: record.remarks,
//         percentage: "0.00%",
//         subjects: [],
//       };
//     }
//   });

//   allReportResult.forEach((record) => {
//     if (!studentData[record.id].subjects) {
//       studentData[record.id].subjects = [];
//     }

//     const existingSubjectIndex = studentData[record.id].subjects.findIndex(
//       (s: any) => s.name === record.subjectName,
//     );

//     if (existingSubjectIndex === -1) {
//       studentData[record.id].subjects.push({
//         name: record.subjectName,
//         obtainedMarks: record.obtainedMarks,
//         fullMarks: record.fullMarks,
//         credit: record.credit,
//         status: record.remarks,
//         letterGrade: record.letterGrade,
//         examYear: record.year,
//       });
//     } else {
//       const existing = studentData[record.id].subjects[existingSubjectIndex];
//       if (
//         (record.obtainedMarks ?? 0) > (existing.obtainedMarks ?? 0) ||
//         record.year > existing.examYear
//       ) {
//         studentData[record.id].subjects[existingSubjectIndex] = {
//           ...record,
//           examYear: record.year,
//         };
//       }
//     }
//   });

  const allFormattedData = Object.values(studentData).map((student) => {
    student.totalFullMarks = student.subjects.reduce(
      (sum: number, sub: any) => sum + sub.fullMarks,
      0,
    );
    student.totalObtainedMarks = student.subjects.reduce(
      (sum: number, sub: any) => sum + (sub.obtainedMarks || 0),
      0,
    );
    student.totalCredit = student.subjects.reduce(
      (sum: number, sub: any) => sum + (sub.credit || 0),
      0,
    );

    const percentage =
      student.totalFullMarks > 0
        ? (student.totalObtainedMarks / student.totalFullMarks) * 100
        : 0;

    const hasFailedSubject = student.subjects.some(
      (sub: any) => sub.status === "FAIL",
    );
    const hasLowPercentage = percentage < 30;
    const isFailed = hasFailedSubject || hasLowPercentage;

    let status: string;
    if (hasFailedSubject && hasLowPercentage) {
      status = "FAIL (Subjects & Overall <30%)";
    } else if (hasFailedSubject) {
      status = "FAIL (Subjects)";
    } else if (hasLowPercentage) {
      status = "FAIL (Overall <30%)";
    } else {
      status = "PASS";
    }

    const subjectsWithHistory = student.subjects.map((sub: any) => {
      const baseSubject = {
        name: sub.name,
        obtained: sub.obtainedMarks,
        outOf: sub.fullMarks,
        status: sub.status,
        credit: sub.credit,
        letterGrade: sub.letterGrade,
      };

      if (sub.examYear > (year || student.year)) {
        return {
          ...baseSubject,
          remark: `Improved in ${sub.examYear} re-exam`,
        };
      }
      return baseSubject;
    });

    return {
      ...student,
      percentage: percentage.toFixed(2) + "%",
      isFailed,
      status,
      historicalStatus: year
        ? student.year <= year && isFailed
          ? "FAILED"
          : "PASSED"
        : isFailed
          ? "FAILED"
          : "PASSED",

      subjects: subjectsWithHistory,
    };
  });

  let filteredData 
  if(showFailedOnly == "FAIL"){
    filteredData=allFormattedData.filter((student) => student.status.include("FAIL"));
      }
  else if(showFailedOnly == "PASS"){
    filteredData= allFormattedData.filter((student) => student.status.include("PASS"));
  }
  else {
    filteredData=allFormattedData;
  }

  console.log("Export flag:", isExport);
  
  if(isExport){
    return {
      content: filteredData,
      page: 1,
      pageSize: filteredData.length,
      totalRecords: filteredData.length,
      totalPages: 1,
    };
  }
 
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return {
    content: paginatedData,
    page,
    pageSize,
    totalRecords: filteredData.length,
    paginatedRecords: paginatedData.length,
    totalPages: Math.ceil(filteredData.length / pageSize),
  };
};
