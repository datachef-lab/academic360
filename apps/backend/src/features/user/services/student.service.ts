import { desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  personalDetailsModel,
  Student,
  studentModel,
  addressModel,
  disabilityCodeModel,
} from "@repo/db/schemas/models/user";
import {
  categoryModel,
  nationalityModel,
  religionModel,
  languageMediumModel,
} from "@repo/db/schemas/models/resources";
import { countryModel } from "@repo/db/schemas/models/resources/country.model";
import { stateModel } from "@repo/db/schemas/models/resources/state.model";
import { cityModel } from "@repo/db/schemas/models/resources/city.model";
import { districtModel } from "@repo/db/schemas/models/resources/district.model";
import { StudentType } from "@/types/user/student.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { degreeModel } from "@repo/db/schemas/models/resources";
import { marksheetModel } from "@repo/db/schemas/models/academics";

import { processClassBySemesterNumber } from "@/features/academics/services/class.service.js";
import { StudentDto } from "@repo/db/dtos/user/index.js";
import {
  admissionGeneralInfoModel,
  applicationFormModel,
} from "@repo/db/schemas";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model";
import { boardResultStatusModel } from "@repo/db/schemas/models/resources";
import {
  sessionModel,
  classModel,
  sectionModel,
  shiftModel,
} from "@repo/db/schemas/models/academics";
import { programCourseModel } from "@repo/db/schemas/models/course-design";

import * as programCourseService from "@/features/course-design/services/program-course.service";
import * as specializationService from "@/features/resources/services/specialization.service";
import * as sectionService from "@/features/academics/services/section.service";
import * as shiftService from "@/features/academics/services/shift.service";

export async function addStudent(
  student: StudentType,
): Promise<StudentType | null> {
  // let { name, academicIdentifier, specialization, personalDetails, ...props } =
  //     student;

  // if (personalDetails) {
  //     personalDetails = await addPersonalDetails(personalDetails);
  // }

  // const [newStudent] = await db
  //     .insert(studentModel)
  //     .values({
  //         ...props,
  //         specializationId: specialization?.id,
  //     })
  //     .returning();

  // const formatedStudent = await studentResponseFormat(newStudent);

  return null;
}

export async function findAllStudent(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<StudentType>> {
  // const stXXXudentsResponse = await findAll<StudentType>(
  //     studentModel,
  //     page,
  //     pageSize,
  // );

  // const content = (await Promise.all(
  //     studentsResponse.content.map(async (student) => {
  //         return await studentResponseFormat(student);
  //     }),
  // )) as StudentType[];

  // const [{ count: countRows }] = await db
  //     .select({ count: count() })
  //     .from(studentModel);

  return {
    content: [],
    page,
    pageSize,
    totalElements: Number(0),
    totalPages: Math.ceil(Number(0) / pageSize),
  };
}

export async function findById(id: number): Promise<StudentDto | null> {
  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, id));

  return await modelToDto(foundStudent);
}

export async function findByUserId(userId: number): Promise<StudentDto | null> {
  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.userId, userId));

  console.log("Found student:", foundStudent);
  return await modelToDto(foundStudent);
}

export async function findByUid(uid: string): Promise<StudentDto | null> {
  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.uid, uid));

  console.log("Found student by UID:", foundStudent);
  return await modelToDto(foundStudent);
}

export async function saveStudent(
  id: number,
  student: StudentType,
): Promise<StudentType | null> {
  let { personalDetails, id: studentId, userId, ...props } = student;

  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, id));
  if (!foundStudent) {
    return null;
  }

  // const [updatedStudent] = await db
  //     .update(studentModel)
  //     .set({ ...props })
  //     .where(eq(studentModel.id, id))
  //     .returning();

  // if (academicIdentifier) {
  //     academicIdentifier = await saveAcademicIdentifier(
  //         academicIdentifier?.id as number,
  //         academicIdentifier,
  //     );
  // }

  // if (personalDetails) {
  //     personalDetails = await savePersonalDetails(
  //         personalDetails.id as number,
  //         personalDetails,
  //     );
  // }

  // const formattedPersonalDetails = await studentResponseFormat(updatedStudent);

  return null;
}

export async function removeStudent(id: number): Promise<boolean | null> {
  // Return if the student not exist.
  const foundStudent = await findById(id);
  if (!foundStudent) {
    return null;
  }
  // Delete the student: -
  // Step 1: Delete the academic-history
  // let isDeleted: boolean | null = false;
  // isDeleted = await removeAcademicHistory(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 2: Delete the academic-identifier
  // isDeleted = await removeAcademicIdentifier(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 3: Delete the accommodation
  // isDeleted = await removeAccommodationByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // // Step 4: Delete the admission
  // // isDeleted = await removeAdmissionByStudentId(id);
  // // if (isDeleted !== null && !isDeleted) return false;

  // // Step 5: Delete the parent-details
  // isDeleted = await removeFamilysByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 6: Delete the health
  // isDeleted = await removeHealthByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 7: Delete the emergency-contact
  // isDeleted = await removeEmergencyContactByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 8: Delete the transport-details
  // isDeleted = await removeTransportDetailsByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // // Step 9: Delete the personal-details
  // isDeleted = await removePersonalDetailsByStudentId(id);
  // if (isDeleted !== null && !isDeleted) return false;

  // //   // Step 10: Delete all the marksheets
  // //   isDeleted = await removeMarksheetByStudentId(id);
  // //   if (isDeleted !== null && !isDeleted) return false;

  // // Step 11: Delete the student
  // const [deletedStudent] = await db
  //     .delete(studentModel)
  //     .where(eq(studentModel.id, id))
  //     .returning();
  // if (!deletedStudent) {
  //     return false;
  // }

  return false;
}

export async function searchStudent(
  searchText: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const query = searchText.trim();
  const pattern = `%${query}%`;
  const rows = await db
    .select({ id: studentModel.id, uid: studentModel.uid })
    .from(studentModel)
    .where(ilike(studentModel.uid, pattern))
    .orderBy(desc(studentModel.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    content: rows as unknown as StudentType[],
    page,
    pageSize,
    totalElements: rows.length,
    totalPages: Math.ceil(rows.length / pageSize) || 1,
  };
}

// export async function searchStudentsByRollNumber(searchText: string, page: number = 1, pageSize: number = 10) {
//     // Trim spaces and convert searchText to lowercase
//     searchText = searchText.trim().toLowerCase();

//     // Query students based on student roll number
//     const studentsQuery = db
//         .select()
//         .from(studentModel)
//         .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
//         .where(
//             eq(
//                 sql`REGEXP_REPLACE(${academicIdentifierModel.rollNumber}, '[^a-zA-Z0-9]', '', 'g')`,
//                 searchText.replace(/[^a-zA-Z0-9]/g, '')
//             )
//         );

//     // Get the paginated students
//     const students = await studentsQuery
//         .limit(pageSize)
//         .offset((page - 1) * pageSize);

//     console.log(students);

//     // Get the total count of students matching the filter
//     const [{ count: countRows }] = await db
//         .select({ count: count() })
//         .from(studentModel)
//         .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id)) // Join with academic identifiers
//         .where(
//             or(
//                 ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`),
//                 ilike(academicIdentifierModel.rollNumber, `%${searchText}%`), // Search by roll number
//                 ilike(academicIdentifierModel.uid, `%${searchText}%`) // Search by UID
//             )
//         );

//     // Map the result to a properly formatted response
//     const content = await Promise.all(students.map(async (studentRecord) => {
//         const student = studentRecord.students; // Extract the student data
//         return await studentResponseFormat(student);
//     }));

//     return {
//         content,
//         page,
//         pageSize,
//         totalElements: Number(countRows), // Now this count is correct!
//         totalPages: Math.ceil(Number(countRows) / pageSize)
//     };
// }

export async function searchStudentsByRollNumber(
  searchText: string,
  page: number = 1,
  pageSize: number = 10,
) {
  // Trim spaces and convert searchText to lowercase
  searchText = searchText.trim().toLowerCase();

  // Query students based on student roll number (Partial match)
  // const studentsQuery = db
  //     .select()
  //     .from(studentModel)
  //     .leftJoin(
  //         academicIdentifierModel,
  //         eq(academicIdentifierModel.studentId, studentModel.id),
  //     ) // Join with academic identifiers
  //     .where(
  //         ilike(
  //             sql`REGEXP_REPLACE(${academicIdentifierModel.rollNumber}, '[^a-zA-Z0-9]', '', 'g')`,
  //             `%${searchText.replace(/[^a-zA-Z0-9]/g, "")}%`,
  //         ),
  //     );

  // // Get the paginated students
  // const students = await studentsQuery
  //     .limit(pageSize)
  //     .offset((page - 1) * pageSize);

  // console.log(students);

  // // Get the total count of students matching the filter
  // const [{ count: countRows }] = await db
  //     .select({ count: count() })
  //     .from(studentModel)

  //     .leftJoin(
  //         academicIdentifierModel,
  //         eq(academicIdentifierModel.studentId, studentModel.id),
  //     ) // Join with academic identifiers
  //     .where(
  //         or(
  //             ilike(
  //                 sql`REGEXP_REPLACE(${academicIdentifierModel.rollNumber}, '[^a-zA-Z0-9]', '', 'g')`,
  //                 `%${searchText.replace(/[^a-zA-Z0-9]/g, "")}%`,
  //             ),
  //         ),
  //     );

  // // Map the result to a properly formatted response
  // const content = await Promise.all(
  //     students.map(async (studentRecord) => {
  //         const student = studentRecord.students; // Extract the student data
  //         return await studentResponseFormat(student);
  //     }),
  // );

  return {
    content: [],
    page,
    pageSize,
    totalElements: Number(0), // Now this count is correct!
    totalPages: Math.ceil(Number(0) / pageSize),
  };
}

export async function findFilteredStudents({
  page = 1,
  pageSize = 10,
  stream,
  year,
  semester,
  framework,
  export: isExport,
}: {
  page?: number;
  pageSize?: number;
  stream?: string;
  year?: number;
  semester?: number;
  framework?: "CCF" | "CBCS";
  export?: boolean;
}): Promise<PaginatedResponse<StudentType>> {
  const filters = [
    stream ? eq(degreeModel.name, stream) : undefined,
    // year ? eq(marksheetModel.year, year) : undefined,
    // framework ? eq(streamModel.framework, framework) : undefined,
  ].filter(Boolean);
  if (semester) {
    const foundClass = await processClassBySemesterNumber(semester);
    filters.push(eq(marksheetModel.classId, foundClass.id));
  }

  // const query = db
  //     .select()
  //     .from(studentModel)
  //     .leftJoin(userModel, eq(studentModel.userId, userModel.id))
  //     .leftJoin(
  //         academicIdentifierModel,
  //         eq(studentModel.id, academicIdentifierModel.studentId),
  //     )
  //     // .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
  //     // .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
  //     // .leftJoin(marksheetModel, eq(studentModel.id, marksheetModel.studentId))
  //     .where(and(...filters));

  // const [{ count: countRows }] = await db
  //     .select({ count: count() })
  //     .from(studentModel)
  //     .leftJoin(
  //         academicIdentifierModel,
  //         eq(studentModel.id, academicIdentifierModel.studentId),
  //     )
  //     // .leftJoin(de, eq(academicIdentifierModel.de, streamModel.id))
  //     // .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
  //     // .leftJoin(marksheetModel, eq(studentModel.id, marksheetModel.studentId))
  //     .where(and(...filters));

  // let students;
  // console.log("Exporting all students1", isExport);
  // if (isExport) {
  //     console.log("Exporting all students2", isExport);

  //     students = await query;
  // } else {
  //     students = await query.limit(pageSize).offset((page - 1) * pageSize);
  // }
  // console.log("rows", Number(countRows));
  // if (students.length === 0) {
  //     return {
  //         content: [],
  //         page: isExport ? 1 : page,
  //         pageSize: isExport ? Number(countRows) : pageSize,
  //         totalElements: 0,
  //         totalPages: 0,
  //     };
  // }

  // const filteredData = (await Promise.all(
  //     students.map(async (studentRecord) => {
  //         return await studentResponseFormat(studentRecord.students);
  //     }),
  // )) as StudentType[];

  return {
    content: [],
    page: isExport ? 1 : page,
    pageSize: isExport ? Number(0) : pageSize,
    totalElements: Number(0),
    totalPages: isExport ? 1 : Math.ceil(Number(0) / pageSize),
  };
}

async function modelToDto(student: Student): Promise<StudentDto | null> {
  if (!student) {
    return null;
  }

  const {
    applicationId,
    programCourseId,
    specializationId,

    ...props
  } = student;

  // Fetch related data in parallel
  const [
    applicationForm,
    programCourse,
    specialization,
    section,
    // shift,
    // currentBatch,
  ] = await Promise.all([
    (async () => {
      if (!applicationId) return null;
      try {
        const rows = await db
          .select()
          .from(applicationFormModel)
          .where(eq(applicationFormModel.id, applicationId));
        return rows[0] ?? null;
      } catch (e) {
        console.error(
          "Failed to fetch application form for id:",
          applicationId,
          e,
        );
        return null;
      }
    })(),
    programCourseService.findById(programCourseId),
    specializationId ? specializationService.findById(specializationId) : null,
    // sectionId ? sectionService.findById(sectionId) : null,
    // shiftId ? shiftService.findById(shiftId) : null,
    // TODO: Implement findCurrentBatchByStudentId or similar
    null,
  ]);

  const [generalInfo] = await db
    .select()
    .from(admissionGeneralInfoModel)
    .where(
      eq(admissionGeneralInfoModel.applicationFormId, applicationForm?.id!),
    );

  // Fetch personal details with related data
  let personalDetails = null;
  //   if (generalInfo?.personalDetailsId) {
  //     const [pd] = await db
  //       .select()
  //       .from(personalDetailsModel)
  //       .where(eq(personalDetailsModel.id, generalInfo.personalDetailsId));

  //     if (pd) {
  //       // Fetch related data for personal details
  //       const [
  //         nationality,
  //         religion,
  //         category,
  //         motherTongue,
  //         rawMailingAddress,
  //         rawResidentialAddress,
  //         disabilityCode,
  //       ] = await Promise.all([
  //         pd.nationalityId
  //           ? db
  //               .select()
  //               .from(nationalityModel)
  //               .where(eq(nationalityModel.id, pd.nationalityId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.religionId
  //           ? db
  //               .select()
  //               .from(religionModel)
  //               .where(eq(religionModel.id, pd.religionId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.categoryId
  //           ? db
  //               .select()
  //               .from(categoryModel)
  //               .where(eq(categoryModel.id, pd.categoryId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.motherTongueId
  //           ? db
  //               .select()
  //               .from(languageMediumModel)
  //               .where(eq(languageMediumModel.id, pd.motherTongueId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.mailingAddressId
  //           ? db
  //               .select()
  //               .from(addressModel)
  //               .where(eq(addressModel.id, pd.mailingAddressId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.residentialAddressId
  //           ? db
  //               .select()
  //               .from(addressModel)
  //               .where(eq(addressModel.id, pd.residentialAddressId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //         pd.disabilityCodeId
  //           ? db
  //               .select()
  //               .from(disabilityCodeModel)
  //               .where(eq(disabilityCodeModel.id, pd.disabilityCodeId))
  //               .then((r) => r[0] ?? null)
  //           : null,
  //       ]);

  //       // Fetch related data for addresses
  //       let mailingAddress = null;
  //       let residentialAddress = null;

  //       if (rawMailingAddress) {
  //         const [country, state, city, district] = await Promise.all([
  //           rawMailingAddress.countryId
  //             ? db
  //                 .select({
  //                   id: countryModel.id,
  //                   legacyCountryId: countryModel.legacyCountryId,
  //                   name: countryModel.name,
  //                   sequence: countryModel.sequence,
  //                   createdAt: countryModel.createdAt,
  //                   updatedAt: countryModel.updatedAt,
  //                 })
  //                 .from(countryModel)
  //                 .where(eq(countryModel.id, rawMailingAddress.countryId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawMailingAddress.stateId
  //             ? db
  //                 .select({
  //                   id: stateModel.id,
  //                   name: stateModel.name,
  //                   createdAt: stateModel.createdAt,
  //                   updatedAt: stateModel.updatedAt,
  //                 })
  //                 .from(stateModel)
  //                 .where(eq(stateModel.id, rawMailingAddress.stateId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawMailingAddress.cityId
  //             ? db
  //                 .select({
  //                   id: cityModel.id,
  //                   name: cityModel.name,
  //                   createdAt: cityModel.createdAt,
  //                   updatedAt: cityModel.updatedAt,
  //                 })
  //                 .from(cityModel)
  //                 .where(eq(cityModel.id, rawMailingAddress.cityId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawMailingAddress.districtId
  //             ? db
  //                 .select({
  //                   id: districtModel.id,
  //                   name: districtModel.name,
  //                   createdAt: districtModel.createdAt,
  //                   updatedAt: districtModel.updatedAt,
  //                 })
  //                 .from(districtModel)
  //                 .where(eq(districtModel.id, rawMailingAddress.districtId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //         ]);

  //         mailingAddress = {
  //           ...rawMailingAddress,
  //           country,
  //           state,
  //           city,
  //           district,
  //         };
  //       }

  //       if (rawResidentialAddress) {
  //         const [resCountry, resState, resCity, resDistrict] = await Promise.all([
  //           rawResidentialAddress.countryId
  //             ? db
  //                 .select({
  //                   id: countryModel.id,
  //                   legacyCountryId: countryModel.legacyCountryId,
  //                   name: countryModel.name,
  //                   sequence: countryModel.sequence,
  //                   createdAt: countryModel.createdAt,
  //                   updatedAt: countryModel.updatedAt,
  //                 })
  //                 .from(countryModel)
  //                 .where(eq(countryModel.id, rawResidentialAddress.countryId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawResidentialAddress.stateId
  //             ? db
  //                 .select({
  //                   id: stateModel.id,
  //                   name: stateModel.name,
  //                   createdAt: stateModel.createdAt,
  //                   updatedAt: stateModel.updatedAt,
  //                 })
  //                 .from(stateModel)
  //                 .where(eq(stateModel.id, rawResidentialAddress.stateId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawResidentialAddress.cityId
  //             ? db
  //                 .select({
  //                   id: cityModel.id,
  //                   name: cityModel.name,
  //                   createdAt: cityModel.createdAt,
  //                   updatedAt: cityModel.updatedAt,
  //                 })
  //                 .from(cityModel)
  //                 .where(eq(cityModel.id, rawResidentialAddress.cityId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //           rawResidentialAddress.districtId
  //             ? db
  //                 .select({
  //                   id: districtModel.id,
  //                   name: districtModel.name,
  //                   createdAt: districtModel.createdAt,
  //                   updatedAt: districtModel.updatedAt,
  //                 })
  //                 .from(districtModel)
  //                 .where(eq(districtModel.id, rawResidentialAddress.districtId))
  //                 .then((r) => r[0] ?? null)
  //             : null,
  //         ]);

  //         residentialAddress = {
  //           ...rawResidentialAddress,
  //           country: resCountry,
  //           state: resState,
  //           city: resCity,
  //           district: resDistrict,
  //         };
  //       }

  //       personalDetails = {
  //         ...pd,
  //         nationality,
  //         religion,
  //         category,
  //         motherTongue,
  //         mailingAddress,
  //         residentialAddress,
  //         disabilityCode,
  //       } as unknown as any;
  //     }
  //   }

  // Fetch latest promotion for the student
  const [latestPromotion] = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, student.id as number))
    .orderBy(desc(promotionModel.startDate), desc(promotionModel.createdAt))
    .limit(1);

  let currentPromotion = null;
  if (latestPromotion) {
    const [promStatus, boardResStatus, sess, cls, sec, shf, progCourse] =
      await Promise.all([
        db
          .select()
          .from(promotionStatusModel)
          .where(eq(promotionStatusModel.id, latestPromotion.promotionStatusId))
          .then((r) => r[0] ?? null),
        latestPromotion.boardResultStatusId
          ? db
              .select()
              .from(boardResultStatusModel)
              .where(
                eq(
                  boardResultStatusModel.id,
                  latestPromotion.boardResultStatusId,
                ),
              )
              .then((r) => r[0] ?? null)
          : Promise.resolve(null),
        db
          .select()
          .from(sessionModel)
          .where(eq(sessionModel.id, latestPromotion.sessionId))
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(classModel)
          .where(eq(classModel.id, latestPromotion.classId))
          .then((r) => r[0] ?? null),
        latestPromotion.sectionId
          ? db
              .select()
              .from(sectionModel)
              .where(eq(sectionModel.id, latestPromotion.sectionId))
              .then((r) => r[0] ?? null)
          : Promise.resolve(null),
        db
          .select()
          .from(shiftModel)
          .where(eq(shiftModel.id, latestPromotion.shiftId))
          .then((r) => r[0] ?? null),
        // Use service for ProgramCourse to build ProgramCourseDto
        programCourseService.findById(latestPromotion.programCourseId),
      ]);

    if (promStatus && sess && cls && sec && shf && progCourse) {
      currentPromotion = {
        id: latestPromotion.id,
        legacyHistoricalRecordId:
          latestPromotion.legacyHistoricalRecordId ?? null,
        studentId: latestPromotion.studentId,
        programCourseId: latestPromotion.programCourseId,
        sessionId: latestPromotion.sessionId,
        shiftId: latestPromotion.shiftId,
        classId: latestPromotion.classId,
        sectionId: latestPromotion.sectionId,
        isAlumni: latestPromotion.isAlumni,
        dateOfJoining: latestPromotion.dateOfJoining,
        classRollNumber: latestPromotion.classRollNumber,
        rollNumber: latestPromotion.rollNumber ?? null,
        rollNumberSI: latestPromotion.rollNumberSI ?? null,
        examNumber: latestPromotion.examNumber ?? null,
        examSerialNumber: latestPromotion.examSerialNumber ?? null,
        promotionStatusId: latestPromotion.promotionStatusId,
        boardResultStatusId: latestPromotion.boardResultStatusId ?? null,
        startDate: latestPromotion.startDate ?? null,
        endDate: latestPromotion.endDate ?? null,
        remarks: latestPromotion.remarks ?? null,
        createdAt: latestPromotion.createdAt ?? new Date(),
        updatedAt: latestPromotion.updatedAt ?? new Date(),
        // Expanded relations per PromotionDto
        promotionStatus: promStatus,
        boardResultStatus: boardResStatus!,
        session: sess,
        class: cls,
        section: sec,
        shift: shf,
        programCourse: progCourse!,
      } as any; // will align to PromotionDto shape
    }
  }

  const [foundAdmGeneralInfo] = await db
    .select()
    .from(admissionGeneralInfoModel)
    .where(
      eq(admissionGeneralInfoModel.applicationFormId, applicationForm?.id!),
    );

  return {
    ...props,
    personalEmail: foundAdmGeneralInfo?.email ?? null,
    applicationFormAbstract: applicationForm,
    programCourse: programCourse!,
    specialization,
    currentBatch: null,
    currentPromotion,
    personalDetails,
  };
}
