import { count, desc, eq, ilike, or, and, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  personalDetailsModel,
  Student,
  studentModel,
  addressModel,
  disabilityCodeModel,
  familyModel,
  personModel,
  accommodationModel,
  healthModel,
  emergencyContactModel,
  transportDetailsModel,
} from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user/user.model";
import {
  categoryModel,
  nationalityModel,
  religionModel,
  languageMediumModel,
  occupationModel,
  qualificationModel,
  annualIncomeModel,
} from "@repo/db/schemas/models/resources";
import { countryModel } from "@repo/db/schemas/models/resources/country.model";
import { stateModel } from "@repo/db/schemas/models/resources/state.model";
import { cityModel } from "@repo/db/schemas/models/resources/city.model";
import { districtModel } from "@repo/db/schemas/models/resources/district.model";
import { postOfficeModel } from "@repo/db/schemas/models/user/post-office.model";
import { policeStationModel } from "@repo/db/schemas/models/user/police-station.model";
import { StudentType } from "@/types/user/student.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { degreeModel } from "@repo/db/schemas/models/resources";
import { marksheetModel } from "@repo/db/schemas/models/academics";

import { processClassBySemesterNumber } from "@/features/academics/services/class.service.js";
import { StudentDto } from "@repo/db/dtos/user/index.js";
import XLSX from "xlsx";

function generateAcademicSubjectColumns(academicSubjects: any[] | null) {
  const columns: any = {};

  if (!academicSubjects || academicSubjects.length === 0) {
    return columns;
  }

  academicSubjects.forEach((subject, index) => {
    const prefix = `academic_subject_${index + 1}_`;

    columns[`${prefix}theory_marks`] = subject?.theoryMarks || null;
    columns[`${prefix}practical_marks`] = subject?.practicalMarks || null;
    columns[`${prefix}total_marks`] = subject?.totalMarks || null;
    columns[`${prefix}result_status`] = subject?.resultStatus || null;
    columns[`${prefix}board_subject_name`] =
      subject?.boardSubject?.boardSubjectName?.name || null;
    columns[`${prefix}board_name`] = subject?.boardSubject?.board?.name || null;
  });

  return columns;
}

function generateStudentReferenceAcademicSubjectColumns(
  studentReferenceAcademicSubjects: any[] | null,
) {
  const columns: any = {};

  if (
    !studentReferenceAcademicSubjects ||
    studentReferenceAcademicSubjects.length === 0
  ) {
    return columns;
  }

  studentReferenceAcademicSubjects.forEach((subject, index) => {
    const prefix = `student_ref_academic_subject_${index + 1}_`;

    columns[`${prefix}theory_marks`] = subject?.theoryMarks || null;
    columns[`${prefix}practical_marks`] = subject?.practicalMarks || null;
    columns[`${prefix}total_marks`] = subject?.totalMarks || null;
    columns[`${prefix}result_status`] = subject?.resultStatus || null;
    columns[`${prefix}board_subject_name`] =
      subject?.boardSubject?.boardSubjectName?.name || null;
    columns[`${prefix}board_name`] = subject?.boardSubject?.board?.name || null;
  });

  return columns;
}

function generateAdmissionSubjectSelectionColumns(
  admissionSubjectSelections: any[] | null,
) {
  const columns: any = {};

  if (!admissionSubjectSelections || admissionSubjectSelections.length === 0) {
    return columns;
  }

  admissionSubjectSelections.forEach((selection, index) => {
    const prefix = `adm_subject_selection_${index + 1}_`;

    columns[`${prefix}subject_name`] = selection?.paper?.subject?.name || null;
    columns[`${prefix}subject_type_name`] =
      selection?.paper?.subjectType?.name || null;
  });

  return columns;
}

function generateAddressColumns(addressDetails: any) {
  const columns: any = {};

  if (!addressDetails) {
    return columns;
  }

  // Combine primary and additional addresses
  const allAddresses = [];
  if (addressDetails.primary) {
    allAddresses.push({ ...addressDetails.primary, isPrimary: true });
  }
  if (addressDetails.additional) {
    allAddresses.push(
      ...addressDetails.additional.map((addr: any) => ({
        ...addr,
        isPrimary: false,
      })),
    );
  }

  allAddresses.forEach((address, index) => {
    const prefix = `address_${index + 1}_`;

    // Basic address fields
    columns[`${prefix}id`] = address?.id || null;
    columns[`${prefix}is_primary`] = address?.isPrimary || false;
    columns[`${prefix}type`] = address?.type || null;
    columns[`${prefix}other_country`] = address?.otherCountry || null;
    columns[`${prefix}other_state`] = address?.otherState || null;
    columns[`${prefix}other_city`] = address?.otherCity || null;
    columns[`${prefix}other_district`] = address?.otherDistrict || null;
    columns[`${prefix}address`] = address?.address || null;
    columns[`${prefix}address_line`] = address?.addressLine || null;
    columns[`${prefix}landmark`] = address?.landmark || null;
    columns[`${prefix}locality_type`] = address?.localityType || null;
    columns[`${prefix}other_postoffice`] = address?.otherPostoffice || null;
    columns[`${prefix}other_police_station`] =
      address?.otherPoliceStation || null;
    columns[`${prefix}block`] = address?.block || null;
    columns[`${prefix}phone`] = address?.phone || null;
    columns[`${prefix}emergency_phone`] = address?.emergencyPhone || null;
    columns[`${prefix}pincode`] = address?.pincode || null;

    // Location names
    columns[`${prefix}country_name`] = address?.country?.name || null;
    columns[`${prefix}state_name`] = address?.state?.name || null;
    columns[`${prefix}city_name`] = address?.city?.name || null;
    columns[`${prefix}district_name`] = address?.district?.name || null;
    columns[`${prefix}post_office_name`] = address?.postoffice?.name || null;
    columns[`${prefix}police_station_name`] =
      address?.policeStation?.name || null;
  });

  return columns;
}
import {
  admissionGeneralInfoModel,
  applicationFormModel,
} from "@repo/db/schemas";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model";
import { boardResultStatusModel } from "@repo/db/schemas/models/resources";
import {
  studentAcademicSubjectModel,
  admSubjectPaperSelectionModel,
  boardSubjectModel,
  boardSubjectNameModel,
  gradeModel,
  admissionAcademicInfoModel,
  admissionCourseDetailsModel,
} from "@repo/db/schemas/models/admissions";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas/models/course-design";
import { boardModel } from "@repo/db/schemas/models/resources";
import {
  sessionModel,
  classModel,
  sectionModel,
  shiftModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import {
  programCourseModel,
  streamModel,
} from "@repo/db/schemas/models/course-design";

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

  // Search by UID, Roll Number, or User Name and return name for UI display
  const rows = await db
    .select({
      id: studentModel.id,
      uid: studentModel.uid,
      name: userModel.name,
    })
    .from(studentModel)
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(
      or(
        ilike(studentModel.uid, pattern),
        ilike(studentModel.rollNumber, pattern),
        ilike(userModel.name, pattern),
      ),
    )
    .orderBy(desc(studentModel.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    content: rows.map((r) => ({
      id: r.id,
      uid: r.uid,
      name: r.name,
    })) as unknown as StudentType[],
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

  // Fetch personal details by user id (fast minimal version)
  let personalDetails = null;
  try {
    const [pd] = await db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.userId, student.userId as number));
    if (pd) {
      // Load addresses for this personal details
      const addresses = await db
        .select()
        .from(addressModel)
        .where(eq(addressModel.personalDetailsId, pd.id as number));

      const addressDtos = await Promise.all(
        addresses.map(async (addr) => {
          const [country, state, city, district, postoffice, policeStation] =
            await Promise.all([
              addr.countryId
                ? db
                    .select({ id: countryModel.id, name: countryModel.name })
                    .from(countryModel)
                    .where(eq(countryModel.id, addr.countryId))
                    .then((r) => r[0] ?? null)
                : null,
              addr.stateId
                ? db
                    .select({ id: stateModel.id, name: stateModel.name })
                    .from(stateModel)
                    .where(eq(stateModel.id, addr.stateId))
                    .then((r) => r[0] ?? null)
                : null,
              addr.cityId
                ? db
                    .select({ id: cityModel.id, name: cityModel.name })
                    .from(cityModel)
                    .where(eq(cityModel.id, addr.cityId))
                    .then((r) => r[0] ?? null)
                : null,
              addr.districtId
                ? db
                    .select({ id: districtModel.id, name: districtModel.name })
                    .from(districtModel)
                    .where(eq(districtModel.id, addr.districtId))
                    .then((r) => r[0] ?? null)
                : null,
              addr.postofficeId
                ? db
                    .select({
                      id: postOfficeModel.id,
                      name: postOfficeModel.name,
                    })
                    .from(postOfficeModel)
                    .where(eq(postOfficeModel.id, addr.postofficeId))
                    .then((r) => r[0] ?? null)
                : null,
              addr.policeStationId
                ? db
                    .select({
                      id: policeStationModel.id,
                      name: policeStationModel.name,
                    })
                    .from(policeStationModel)
                    .where(eq(policeStationModel.id, addr.policeStationId))
                    .then((r) => r[0] ?? null)
                : null,
            ]);

          return {
            ...addr,
            country,
            state,
            city,
            district,
            postoffice,
            policeStation,
          } as unknown as any;
        }),
      );

      personalDetails = { ...pd, address: addressDtos } as unknown as any;
    }
  } catch (e) {
    console.error("Failed to fetch personal details by userId", e);
  }

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
          .then(async (r) => {
            const session = r[0] ?? null;
            if (session && session.academicYearId) {
              const [academicYear] = await db
                .select()
                .from(academicYearModel)
                .where(eq(academicYearModel.id, session.academicYearId));

              return {
                ...session,
                academicYear: academicYear || null,
              };
            }
            return session;
          }),
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

  const [foundUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, student.userId as number));

  return {
    ...props,
    personalEmail: foundAdmGeneralInfo?.email ?? null,
    applicationFormAbstract: applicationForm,
    programCourse: programCourse!,
    specialization,
    currentBatch: null,
    currentPromotion,
    name: foundUser?.name!,
    personalDetails,
  };
}

async function getUserFieldsByStudentId(studentId: number) {
  const [
    { createdAt, updatedAt, sendStagingNotifications, password, ...rest },
  ] = await db.select().from(userModel).where(eq(userModel.id, studentId));
  return { institutionalEmail: rest.email, ...rest };
}

async function getStudentFieldsByStudentId(studentId: number) {
  const [student] = await db
    .select({
      legacyStudentId: studentModel.legacyStudentId,
      uid: studentModel.uid,
      oldUid: studentModel.oldUid,
      stream: streamModel.name,
      programCourse: programCourseModel.name,
      rfidNumber: studentModel.rfidNumber,
      cuFormNumber: studentModel.cuFormNumber,
      registrationNumber: studentModel.registrationNumber,
      rollNumber: studentModel.rollNumber,
      classRollNumber: studentModel.classRollNumber,
      apaarId: studentModel.apaarId,
      abcId: studentModel.abcId,
      apprid: studentModel.apprid,
      checkRepeat: studentModel.checkRepeat,
      community: studentModel.community,
      handicapped: studentModel.handicapped,
      lastPassedYear: studentModel.lastPassedYear,
      notes: studentModel.notes,
      alumni: studentModel.alumni,
      leavingDate: studentModel.leavingDate,
      leavingReason: studentModel.leavingReason,
    })
    .from(studentModel)
    .leftJoin(
      programCourseModel,
      eq(studentModel.programCourseId, programCourseModel.id),
    )
    .leftJoin(streamModel, eq(programCourseModel.streamId, streamModel.id))
    .where(eq(studentModel.id, studentId));

  return student;
}

async function getPromotionFieldsByStudentId(studentId: number) {
  const [promotion] = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, studentId));

  if (!promotion) {
    return null;
  }

  // Fetch related names
  const [session, shift, section, classInfo, programCourse] = await Promise.all(
    [
      db
        .select()
        .from(sessionModel)
        .where(eq(sessionModel.id, promotion.sessionId))
        .then((r) => r[0]?.name || null),
      db
        .select()
        .from(shiftModel)
        .where(eq(shiftModel.id, promotion.shiftId))
        .then((r) => r[0]?.name || null),
      promotion.sectionId
        ? db
            .select()
            .from(sectionModel)
            .where(eq(sectionModel.id, promotion.sectionId))
            .then((r) => r[0]?.name || null)
        : Promise.resolve(null),
      db
        .select()
        .from(classModel)
        .where(eq(classModel.id, promotion.classId))
        .then((r) => r[0]?.name || null),
      db
        .select()
        .from(programCourseModel)
        .where(eq(programCourseModel.id, promotion.programCourseId))
        .then((r) => r[0]?.name || null),
    ],
  );

  return {
    ...promotion,
    sessionName: session,
    shiftName: shift,
    sectionName: section,
    className: classInfo,
    programCourseName: programCourse,
  };
}

export async function generateExport() {
  const BATCH_SIZE = 500;
  const [{ count: totalStudents }] = await db
    .select({ count: count() })
    .from(studentModel);
  const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);
  const exportData: any[] = [];

  console.log(
    `Starting export of ${totalStudents} students in ${totalBatches} batches`,
  );

  let processedStudents = 0;

  for (let offset = 0; offset < totalStudents; offset += BATCH_SIZE) {
    const currentBatch = Math.floor(offset / BATCH_SIZE) + 1;
    console.log(`Processing batch ${currentBatch}/${totalBatches}`);

    const students = await db
      .select()
      .from(studentModel)
      .limit(BATCH_SIZE)
      .offset(offset);

    for (const student of students) {
      try {
        const completeStudentData = await getCompleteStudentData(student);
        exportData.push(completeStudentData);
        processedStudents++;

        // Log progress every 50 students or at the end of each batch
        if (
          processedStudents % 50 === 0 ||
          processedStudents === students.length
        ) {
          const percentage = (
            (processedStudents / totalStudents) *
            100
          ).toFixed(1);
          console.log(
            `Processed ${processedStudents}/${totalStudents} students (${percentage}%)`,
          );
        }
      } catch (error) {
        console.error(`Error processing student ${student.id}:`, error);
        // Continue with next student even if one fails
      }
    }
  }

  console.log(`Export completed. Total records: ${exportData.length}`);

  // Generate Excel buffer
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  // Convert to buffer
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `student_export_${timestamp}.xlsx`;

  return {
    buffer: excelBuffer,
    fileName: fileName,
    totalRecords: exportData.length,
  };
}

async function getCompleteStudentData(student: any) {
  // Get basic user and student fields
  const [userFields, studentFields, promotionFields] = await Promise.all([
    getUserFieldsByStudentId(student.userId),
    getStudentFieldsByStudentId(student.id),
    getPromotionFieldsByStudentId(student.id),
  ]);

  // Get personal details and related data
  const personalDetails = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, student.userId))
    .then((r) => r[0] || null);

  // Get family details
  const familyDetails = await getFamilyDetailsForStudent(student.userId);

  // Get address details (multiple addresses possible)
  const addressDetails = personalDetails?.id
    ? await getAddressDetailsForStudent(personalDetails.id)
    : null;

  // Get accommodation details
  const accommodationDetails = await getAccommodationDetailsForStudent(
    student.userId,
  );

  // Get health details
  const healthDetails = await db
    .select()
    .from(healthModel)
    .where(eq(healthModel.userId, student.userId))
    .then((r) => r[0] || null);

  // Get emergency contact details
  const emergencyContactDetails = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.userId, student.userId))
    .then((r) => r[0] || null);

  // Get transport details
  const transportDetails = await db
    .select()
    .from(transportDetailsModel)
    .where(eq(transportDetailsModel.userId, student.userId))
    .then((r) => r[0] || null);

  // Get student academic subjects (via application form)
  const academicSubjects = student.applicationId
    ? await getStudentAcademicSubjects(student.applicationId)
    : null;

  // Get student reference academic subjects (where applicationFormId is null and studentId is set)
  const studentReferenceAcademicSubjects =
    await getStudentReferenceAcademicSubjects(student.id);

  // Get admission academic info
  const admissionAcademicInfo = student.applicationId
    ? await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(
          eq(
            admissionAcademicInfoModel.applicationFormId,
            student.applicationId,
          ),
        )
        .then((r) => r[0] || null)
    : null;

  // Get board name for admission academic info
  const boardName = admissionAcademicInfo?.boardId
    ? await db
        .select()
        .from(boardModel)
        .where(eq(boardModel.id, admissionAcademicInfo.boardId))
        .then((r) => r[0]?.name || null)
    : null;

  // Get admission subject selections
  const admissionSubjectSelections = await getAdmissionSubjectSelections(
    student.id,
  );

  // Flatten all data into a single object with ALL fields
  const flattenedData = {
    // ===== USER TABLE FIELDS =====
    user_id: userFields?.id || null,
    user_name: userFields?.name || null,
    user_email: userFields?.email || null,
    user_password: null, // Note: Password not exported for security
    user_phone: userFields?.phone || null,
    user_whatsapp_number: userFields?.whatsappNumber || null,
    user_image: userFields?.image || null,
    user_type: userFields?.type || null,
    user_is_suspended: userFields?.isSuspended || null,
    user_suspended_reason: userFields?.suspendedReason || null,
    user_suspended_till_date: userFields?.suspendedTillDate || null,
    user_is_active: userFields?.isActive || null,
    user_send_staging_notifications: null, // Field not available in current query

    // ===== STUDENT TABLE FIELDS =====
    student_id: student.id,
    student_legacy_student_id: student.legacyStudentId || null,
    student_uid: student.uid || null,
    student_old_uid: student.oldUid || null,
    student_rfid_number: student.rfidNumber || null,
    student_cu_form_number: student.cuFormNumber || null,
    student_registration_number: student.registrationNumber || null,
    student_roll_number: student.rollNumber || null,
    student_class_roll_number: student.classRollNumber || null,
    student_apaar_id: student.apaarId || null,
    student_abc_id: student.abcId || null,
    student_apprid: student.apprid || null,
    student_check_repeat: student.checkRepeat || null,
    student_community: student.community || null,
    student_handicapped: student.handicapped || null,
    student_last_passed_year: student.lastPassedYear || null,
    student_notes: student.notes || null,
    student_active: student.active || null,
    student_alumni: student.alumni || null,
    student_leaving_date: student.leavingDate || null,
    student_leaving_reason: student.leavingReason || null,

    // ===== PERSONAL DETAILS TABLE FIELDS =====
    personal_details_id: personalDetails?.id || null,
    personal_details_first_name: personalDetails?.firstName || null,
    personal_details_middle_name: personalDetails?.middleName || null,
    personal_details_last_name: personalDetails?.lastName || null,
    personal_details_whatsapp_number: personalDetails?.whatsappNumber || null,
    personal_details_mobile_number: personalDetails?.mobileNumber || null,
    personal_details_emergency_residential_number:
      personalDetails?.emergencyResidentialNumber || null,
    personal_details_other_nationality:
      personalDetails?.otherNationality || null,
    personal_details_voter_id: personalDetails?.voterId || null,
    personal_details_passport_number: personalDetails?.passportNumber || null,
    personal_details_aadhaar_card_number:
      personalDetails?.aadhaarCardNumber || null,
    personal_details_date_of_birth: personalDetails?.dateOfBirth || null,
    personal_details_place_of_birth: personalDetails?.placeOfBirth || null,
    personal_details_gender: personalDetails?.gender || null,
    personal_details_is_gujarati: personalDetails?.isGujarati || null,
    personal_details_marital_status: personalDetails?.maritalStatus || null,
    personal_details_disability: personalDetails?.disability || null,

    // ===== FAMILY DETAILS TABLE FIELDS =====
    family_details_id: familyDetails?.family?.id || null,
    family_details_parent_type: familyDetails?.family?.parentType || null,

    // ===== FATHER PERSON DETAILS =====
    father_person_id: familyDetails?.father?.id || null,
    father_person_type: familyDetails?.father?.type || null,
    father_person_title: familyDetails?.father?.title || null,
    father_person_name: familyDetails?.father?.name || null,
    father_person_email: familyDetails?.father?.email || null,
    father_person_phone: familyDetails?.father?.phone || null,
    father_person_aadhaar_card_number:
      familyDetails?.father?.aadhaarCardNumber || null,
    father_person_image: familyDetails?.father?.image || null,
    father_person_gender: familyDetails?.father?.gender || null,
    father_person_marital_status: familyDetails?.father?.maritalStatus || null,
    father_occupation_name: familyDetails?.father?.occupation?.name || null,
    father_qualification_name:
      familyDetails?.father?.qualification?.name || null,

    // ===== MOTHER PERSON DETAILS =====
    mother_person_id: familyDetails?.mother?.id || null,
    mother_person_type: familyDetails?.mother?.type || null,
    mother_person_title: familyDetails?.mother?.title || null,
    mother_person_name: familyDetails?.mother?.name || null,
    mother_person_email: familyDetails?.mother?.email || null,
    mother_person_phone: familyDetails?.mother?.phone || null,
    mother_person_aadhaar_card_number:
      familyDetails?.mother?.aadhaarCardNumber || null,
    mother_person_image: familyDetails?.mother?.image || null,
    mother_person_gender: familyDetails?.mother?.gender || null,
    mother_person_marital_status: familyDetails?.mother?.maritalStatus || null,
    mother_occupation_name: familyDetails?.mother?.occupation?.name || null,
    mother_qualification_name:
      familyDetails?.mother?.qualification?.name || null,

    // ===== GUARDIAN PERSON DETAILS =====
    guardian_person_id: familyDetails?.guardian?.id || null,
    guardian_person_type: familyDetails?.guardian?.type || null,
    guardian_person_title: familyDetails?.guardian?.title || null,
    guardian_person_name: familyDetails?.guardian?.name || null,
    guardian_person_email: familyDetails?.guardian?.email || null,
    guardian_person_phone: familyDetails?.guardian?.phone || null,
    guardian_person_aadhaar_card_number:
      familyDetails?.guardian?.aadhaarCardNumber || null,
    guardian_person_image: familyDetails?.guardian?.image || null,
    guardian_person_gender: familyDetails?.guardian?.gender || null,
    guardian_person_marital_status:
      familyDetails?.guardian?.maritalStatus || null,
    guardian_occupation_name: familyDetails?.guardian?.occupation?.name || null,
    guardian_qualification_name:
      familyDetails?.guardian?.qualification?.name || null,

    // ===== ANNUAL INCOME DETAILS =====
    annual_income_id: familyDetails?.annualIncome?.id || null,
    annual_income_range: familyDetails?.annualIncome?.range || null,

    // ===== ADDRESS DETAILS (DYNAMICALLY GENERATED) =====
    ...generateAddressColumns(addressDetails),

    // ===== ACCOMMODATION DETAILS =====
    accommodation_id: accommodationDetails?.id || null,
    accommodation_place_of_stay: accommodationDetails?.placeOfStay || null,
    accommodation_start_date: accommodationDetails?.startDate || null,
    accommodation_end_date: accommodationDetails?.endDate || null,

    // ===== HEALTH DETAILS =====
    health_id: healthDetails?.id || null,
    health_identification_mark: healthDetails?.identificationMark || null,
    health_height: healthDetails?.height || null,
    health_weight: healthDetails?.weight || null,
    health_has_spectacles: healthDetails?.hasSpectacles || null,
    health_spectacles_notes: healthDetails?.spectaclesNotes || null,
    health_eye_power_left: healthDetails?.eyePowerLeft || null,
    health_eye_power_right: healthDetails?.eyePowerRight || null,
    health_illness: healthDetails?.illness || null,
    health_illness_notes: healthDetails?.illnessNotes || null,
    health_allergy: healthDetails?.allergy || null,
    health_allergy_notes: healthDetails?.allergyNotes || null,
    health_surgery: healthDetails?.surgery || null,
    health_surgery_notes: healthDetails?.surgeryNotes || null,
    health_is_infected_covid19: healthDetails?.isInfectedCOVID19 || null,
    health_is_vaccinated_covid19: healthDetails?.isVaccinatedCOVID19 || null,
    health_vaccine_name: healthDetails?.vaccineName || null,
    health_other_vaccine_name: healthDetails?.otherVaccineName || null,
    health_has_donated_blood: healthDetails?.hasDonatedBlood || null,
    health_is_donating_blood: healthDetails?.isDonatingBlood || null,
    health_other_health_conditions:
      healthDetails?.otherHealthConditions || null,
    health_other_health_conditions_notes:
      healthDetails?.otherHealthConditionsNotes || null,
    health_past_medical_history: healthDetails?.pastMedicalHistory || null,
    health_past_surgical_history: healthDetails?.pastSurgicalHistory || null,
    health_drug_allergy: healthDetails?.drugAllergy || null,
    health_mediclaim_id: healthDetails?.mediclaimId || null,
    health_mediclaim_file: healthDetails?.mediclaimFile || null,
    health_mediclaim_provider: healthDetails?.mediclaimProvider || null,
    health_mediclaim_provider_number:
      healthDetails?.mediclaimProviderNumber || null,

    // ===== EMERGENCY CONTACT DETAILS =====
    emergency_contact_id: emergencyContactDetails?.id || null,
    emergency_contact_person_name: emergencyContactDetails?.personName || null,
    emergency_contact_having_relation_as:
      emergencyContactDetails?.havingRelationAs || null,
    emergency_contact_email: emergencyContactDetails?.email || null,
    emergency_contact_phone: emergencyContactDetails?.phone || null,
    emergency_contact_office_phone:
      emergencyContactDetails?.officePhone || null,
    emergency_contact_residential_phone:
      emergencyContactDetails?.residentialPhone || null,

    // ===== TRANSPORT DETAILS =====
    transport_details_id: transportDetails?.id || null,
    transport_details_seat_number: transportDetails?.seatNumber || null,
    transport_details_pickup_time: transportDetails?.pickupTime || null,
    transport_details_drop_off_time: transportDetails?.dropOffTime || null,

    // ===== PROMOTION DETAILS =====
    promotion_id: promotionFields?.id || null,
    promotion_legacy_historical_record_id:
      promotionFields?.legacyHistoricalRecordId || null,
    promotion_is_alumni: promotionFields?.isAlumni || null,
    promotion_date_of_joining: promotionFields?.dateOfJoining || null,
    promotion_class_roll_number: promotionFields?.classRollNumber || null,
    promotion_roll_number: promotionFields?.rollNumber || null,
    promotion_roll_number_si: promotionFields?.rollNumberSI || null,
    promotion_exam_number: promotionFields?.examNumber || null,
    promotion_exam_serial_number: promotionFields?.examSerialNumber || null,
    promotion_start_date: promotionFields?.startDate || null,
    promotion_end_date: promotionFields?.endDate || null,
    promotion_remarks: promotionFields?.remarks || null,

    // ===== PROMOTION RELATED NAMES =====
    promotion_session_name: promotionFields?.sessionName || null,
    promotion_shift_name: promotionFields?.shiftName || null,
    promotion_section_name: promotionFields?.sectionName || null,
    promotion_class_name: promotionFields?.className || null,
    promotion_program_course_name: promotionFields?.programCourseName || null,

    // ===== ADMISSION ACADEMIC INFO =====
    admission_academic_info_id: admissionAcademicInfo?.id || null,
    admission_academic_info_legacy_id:
      admissionAcademicInfo?.legacyAcademicDetailsId || null,
    admission_academic_info_board_name: boardName || null,
    admission_academic_info_other_board:
      admissionAcademicInfo?.otherBoard || null,
    admission_academic_info_board_result_status:
      admissionAcademicInfo?.boardResultStatus || null,
    admission_academic_info_percentage_of_marks:
      admissionAcademicInfo?.percentageOfMarks || null,
    admission_academic_info_division: admissionAcademicInfo?.division || null,
    admission_academic_info_rank: admissionAcademicInfo?.rank || null,
    admission_academic_info_total_points:
      admissionAcademicInfo?.totalPoints || null,
    admission_academic_info_aggregate: admissionAcademicInfo?.aggregate || null,
    admission_academic_info_subject_studied:
      admissionAcademicInfo?.subjectStudied || null,
    admission_academic_info_last_school_name:
      admissionAcademicInfo?.lastSchoolName || null,
    admission_academic_info_index_number_1:
      admissionAcademicInfo?.indexNumber1 || null,
    admission_academic_info_index_number_2:
      admissionAcademicInfo?.indexNumber2 || null,
    admission_academic_info_registration_number:
      admissionAcademicInfo?.registrationNumber || null,
    admission_academic_info_roll_number:
      admissionAcademicInfo?.rollNumber || null,
    admission_academic_info_school_number:
      admissionAcademicInfo?.schoolNumber || null,
    admission_academic_info_center_number:
      admissionAcademicInfo?.centerNumber || null,
    admission_academic_info_year_of_passing:
      admissionAcademicInfo?.yearOfPassing || null,
    admission_academic_info_studied_up_to_class:
      admissionAcademicInfo?.studiedUpToClass || null,
    admission_academic_info_best_of_four:
      admissionAcademicInfo?.bestOfFour || null,
    admission_academic_info_total_score:
      admissionAcademicInfo?.totalScore || null,
    admission_academic_info_old_best_of_four:
      admissionAcademicInfo?.oldBestOfFour || null,
    admission_academic_info_old_total_score:
      admissionAcademicInfo?.oldTotalScore || null,
    admission_academic_info_is_registered_for_ug_in_cu:
      admissionAcademicInfo?.isRegisteredForUGInCU || null,
    admission_academic_info_cu_registration_number:
      admissionAcademicInfo?.cuRegistrationNumber || null,
    admission_academic_info_other_previously_registered_program_course:
      admissionAcademicInfo?.otherPreviouslyRegisteredProgramCourse || null,
    admission_academic_info_other_previous_institute:
      admissionAcademicInfo?.otherPreviousInstitute || null,

    // ===== ACADEMIC SUBJECTS (DYNAMICALLY GENERATED) =====
    ...generateAcademicSubjectColumns(academicSubjects),

    // ===== STUDENT REFERENCE ACADEMIC SUBJECTS (DYNAMICALLY GENERATED) =====
    ...generateStudentReferenceAcademicSubjectColumns(
      studentReferenceAcademicSubjects,
    ),

    // ===== ADMISSION SUBJECT SELECTIONS (DYNAMICALLY GENERATED) =====
    ...generateAdmissionSubjectSelectionColumns(admissionSubjectSelections),
  };

  return flattenedData;
}

async function getFamilyDetailsForStudent(userId: number) {
  // Try to get family details via additional info first, then by userId
  const family = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.userId, userId))
    .then((r) => r[0] || null);

  if (!family) return null;

  // Get family members (father, mother, guardian)
  const familyMembers = await db
    .select()
    .from(personModel)
    .where(eq(personModel.familyId, family.id));

  const father = familyMembers.find((m) => m.type === "FATHER");
  const mother = familyMembers.find((m) => m.type === "MOTHER");
  const guardian = familyMembers.find((m) => m.type === "GUARDIAN");

  // Get occupation and qualification details for each member
  const [
    fatherOccupation,
    fatherQualification,
    motherOccupation,
    motherQualification,
    guardianOccupation,
    guardianQualification,
    annualIncome,
  ] = await Promise.all([
    father?.occupationId
      ? db
          .select()
          .from(occupationModel)
          .where(eq(occupationModel.id, father.occupationId))
          .then((r) => r[0] || null)
      : null,
    father?.qualificationId
      ? db
          .select()
          .from(qualificationModel)
          .where(eq(qualificationModel.id, father.qualificationId))
          .then((r) => r[0] || null)
      : null,
    mother?.occupationId
      ? db
          .select()
          .from(occupationModel)
          .where(eq(occupationModel.id, mother.occupationId))
          .then((r) => r[0] || null)
      : null,
    mother?.qualificationId
      ? db
          .select()
          .from(qualificationModel)
          .where(eq(qualificationModel.id, mother.qualificationId))
          .then((r) => r[0] || null)
      : null,
    guardian?.occupationId
      ? db
          .select()
          .from(occupationModel)
          .where(eq(occupationModel.id, guardian.occupationId))
          .then((r) => r[0] || null)
      : null,
    guardian?.qualificationId
      ? db
          .select()
          .from(qualificationModel)
          .where(eq(qualificationModel.id, guardian.qualificationId))
          .then((r) => r[0] || null)
      : null,
    family.annualIncomeId
      ? db
          .select()
          .from(annualIncomeModel)
          .where(eq(annualIncomeModel.id, family.annualIncomeId))
          .then((r) => r[0] || null)
      : null,
  ]);

  return {
    family: family,
    father: father
      ? {
          ...father,
          occupation: fatherOccupation,
          qualification: fatherQualification,
        }
      : null,
    mother: mother
      ? {
          ...mother,
          occupation: motherOccupation,
          qualification: motherQualification,
        }
      : null,
    guardian: guardian
      ? {
          ...guardian,
          occupation: guardianOccupation,
          qualification: guardianQualification,
        }
      : null,
    annualIncome,
  };
}

async function getAddressDetailsForStudent(personalDetailsId: number) {
  const addresses = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.personalDetailsId, personalDetailsId));

  if (addresses.length === 0) return null;

  // Get related location data for each address
  const enrichedAddresses = await Promise.all(
    addresses.map(async (addr) => {
      const [country, state, city, district, postoffice, policeStation] =
        await Promise.all([
          addr.countryId
            ? db
                .select()
                .from(countryModel)
                .where(eq(countryModel.id, addr.countryId))
                .then((r) => r[0] || null)
            : null,
          addr.stateId
            ? db
                .select()
                .from(stateModel)
                .where(eq(stateModel.id, addr.stateId))
                .then((r) => r[0] || null)
            : null,
          addr.cityId
            ? db
                .select()
                .from(cityModel)
                .where(eq(cityModel.id, addr.cityId))
                .then((r) => r[0] || null)
            : null,
          addr.districtId
            ? db
                .select()
                .from(districtModel)
                .where(eq(districtModel.id, addr.districtId))
                .then((r) => r[0] || null)
            : null,
          addr.postofficeId
            ? db
                .select()
                .from(postOfficeModel)
                .where(eq(postOfficeModel.id, addr.postofficeId))
                .then((r) => r[0] || null)
            : null,
          addr.policeStationId
            ? db
                .select()
                .from(policeStationModel)
                .where(eq(policeStationModel.id, addr.policeStationId))
                .then((r) => r[0] || null)
            : null,
        ]);

      return {
        ...addr,
        country,
        state,
        city,
        district,
        postoffice,
        policeStation,
      };
    }),
  );

  return {
    primary: enrichedAddresses[0] || null,
    additional: enrichedAddresses.slice(1),
  };
}

async function getAccommodationDetailsForStudent(userId: number) {
  const accommodation = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.userId, userId))
    .then((r) => r[0] || null);

  return accommodation;
}

async function getStudentAcademicSubjects(applicationFormId: number) {
  // First get the admission academic info for this application
  const admissionAcademicInfo = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(eq(admissionAcademicInfoModel.applicationFormId, applicationFormId))
    .then((r) => r[0] || null);

  if (!admissionAcademicInfo) return null;

  // Then get academic subjects for this admission academic info
  const academicSubjects = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(
      eq(
        studentAcademicSubjectModel.admissionAcademicInfoId,
        admissionAcademicInfo.id,
      ),
    );

  if (academicSubjects.length === 0) return null;

  // Get related data for each subject
  const enrichedSubjects = await Promise.all(
    academicSubjects.map(async (subject) => {
      const [boardSubject, grade] = await Promise.all([
        db
          .select()
          .from(boardSubjectModel)
          .where(eq(boardSubjectModel.id, subject.boardSubjectId))
          .then((r) => r[0] || null),
        subject.gradeId
          ? db
              .select()
              .from(gradeModel)
              .where(eq(gradeModel.id, subject.gradeId))
              .then((r) => r[0] || null)
          : null,
      ]);

      // Get board subject name
      const boardSubjectName = boardSubject
        ? await db
            .select()
            .from(boardSubjectNameModel)
            .where(
              eq(boardSubjectNameModel.id, boardSubject.boardSubjectNameId),
            )
            .then((r) => r[0] || null)
        : null;

      // Get board details
      const board = boardSubject
        ? await db
            .select()
            .from(boardModel)
            .where(eq(boardModel.id, boardSubject.boardId))
            .then((r) => r[0] || null)
        : null;

      return {
        ...subject,
        boardSubject: boardSubject
          ? {
              ...boardSubject,
              boardSubjectName,
              board,
            }
          : null,
        grade,
      };
    }),
  );

  return enrichedSubjects;
}

async function getStudentReferenceAcademicSubjects(studentId: number) {
  // First get the student reference academic info (where applicationFormId is null and studentId is set)
  const studentAcademicInfo = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(
      and(
        eq(admissionAcademicInfoModel.studentId, studentId),
        sql`${admissionAcademicInfoModel.applicationFormId} IS NULL`,
      ),
    )
    .then((r) => r[0] || null);

  if (!studentAcademicInfo) return null;

  // Then get academic subjects for this student reference academic info
  const academicSubjects = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(
      eq(
        studentAcademicSubjectModel.admissionAcademicInfoId,
        studentAcademicInfo.id,
      ),
    );

  if (academicSubjects.length === 0) return null;

  // Get related data for each subject
  const enrichedSubjects = await Promise.all(
    academicSubjects.map(async (subject) => {
      const [boardSubject, grade] = await Promise.all([
        db
          .select()
          .from(boardSubjectModel)
          .where(eq(boardSubjectModel.id, subject.boardSubjectId))
          .then((r) => r[0] || null),
        subject.gradeId
          ? db
              .select()
              .from(gradeModel)
              .where(eq(gradeModel.id, subject.gradeId))
              .then((r) => r[0] || null)
          : null,
      ]);

      // Get board subject name
      const boardSubjectName = boardSubject
        ? await db
            .select()
            .from(boardSubjectNameModel)
            .where(
              eq(boardSubjectNameModel.id, boardSubject.boardSubjectNameId),
            )
            .then((r) => r[0] || null)
        : null;

      // Get board details
      const board = boardSubject
        ? await db
            .select()
            .from(boardModel)
            .where(eq(boardModel.id, boardSubject.boardId))
            .then((r) => r[0] || null)
        : null;

      return {
        ...subject,
        boardSubject: boardSubject
          ? {
              ...boardSubject,
              boardSubjectName,
              board,
            }
          : null,
        grade,
      };
    }),
  );

  return enrichedSubjects;
}

async function getAdmissionSubjectSelections(studentId: number) {
  const subjectSelections = await db
    .select()
    .from(admSubjectPaperSelectionModel)
    .where(eq(admSubjectPaperSelectionModel.studentId, studentId));

  if (subjectSelections.length === 0) return null;

  // Get related data for each selection
  const enrichedSelections = await Promise.all(
    subjectSelections.map(async (selection) => {
      const [paper, admissionCourseDetails] = await Promise.all([
        db
          .select()
          .from(paperModel)
          .where(eq(paperModel.id, selection.paperId))
          .then((r) => r[0] || null),
        db
          .select()
          .from(admissionCourseDetailsModel)
          .where(
            eq(
              admissionCourseDetailsModel.id,
              selection.admissionCourseDetailsId,
            ),
          )
          .then((r) => r[0] || null),
      ]);

      // Get subject and subject type details
      const [subject, subjectType] = await Promise.all([
        paper
          ? db
              .select()
              .from(subjectModel)
              .where(eq(subjectModel.id, paper.subjectId))
              .then((r) => r[0] || null)
          : null,
        paper
          ? db
              .select()
              .from(subjectTypeModel)
              .where(eq(subjectTypeModel.id, paper.subjectTypeId))
              .then((r) => r[0] || null)
          : null,
      ]);

      return {
        ...selection,
        paper: paper
          ? {
              ...paper,
              subject,
              subjectType,
            }
          : null,
        admissionCourseDetails,
      };
    }),
  );

  return enrichedSelections;
}
