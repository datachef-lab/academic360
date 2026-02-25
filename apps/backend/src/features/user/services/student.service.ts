import {
  count,
  desc,
  eq,
  ilike,
  or,
  and,
  sql,
  isNotNull,
  inArray,
} from "drizzle-orm";
import pLimit from "p-limit";
import JSZip from "jszip";
import { db, mysqlConnection } from "@/db/index.js";
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
import ExcelJS from "exceljs";

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
  cuRegistrationCorrectionRequestModel,
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
import axios from "axios";
import { socketService } from "@/services/socketService";

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
    .where(
      or(ilike(studentModel.uid, uid), ilike(studentModel.rfidNumber, uid)),
    );

  console.log("Found student by UID:", foundStudent);
  return await modelToDto(foundStudent);
}

export async function updateStudentStatusById(
  id: number,
  data: {
    active?: boolean;
    leavingDate?: string | null;
    leavingReason?: string | null;
    statusOption?:
      | "DROPPED_OUT"
      | "COMPLETED_LEFT"
      | "REGULAR"
      | "GRADUATED_WITH_SUPP"
      | "TC"
      | "CANCELLED_ADMISSION"
      | "SUSPENDED";
    takenTransferCertificate?: boolean;
    hasCancelledAdmission?: boolean;
    cancelledAdmissionReason?: string | null;
    cancelledAdmissionAt?: string | null;
    cancelledAdmissionByUserId?: number | null;
    alumni?: boolean;
    rfidNumber?: string | null;
  },
) {
  const update: any = {};

  // If statusOption provided, map to fields per doc
  switch (data.statusOption) {
    case "DROPPED_OUT": {
      update.active = false;
      update.alumni = false;
      update.takenTransferCertificate = false;
      update.hasCancelledAdmission = false;
      break;
    }
    case "COMPLETED_LEFT": {
      update.alumni = true;
      update.active = false;
      update.takenTransferCertificate = false;
      update.hasCancelledAdmission = false;
      break;
    }
    case "REGULAR": {
      update.active = true;
      update.alumni = false;
      update.takenTransferCertificate = false;
      update.hasCancelledAdmission = false;
      update.leavingDate = null;
      update.leavingReason = null;
      break;
    }
    case "GRADUATED_WITH_SUPP": {
      update.active = true;
      update.alumni = true;
      update.takenTransferCertificate = false;
      update.hasCancelledAdmission = false;
      break;
    }
    case "TC": {
      update.takenTransferCertificate = true;
      // Clear leaving date when switching to TC (TC uses leavingReason but not leavingDate)
      update.leavingDate = null;
      // Clear cancelled admission fields
      update.hasCancelledAdmission = false;
      update.cancelledAdmissionReason = null;
      update.cancelledAdmissionAt = null;
      break;
    }
    case "CANCELLED_ADMISSION": {
      update.hasCancelledAdmission = true;
      if (data.cancelledAdmissionReason !== undefined)
        update.cancelledAdmissionReason = data.cancelledAdmissionReason;
      // Helper to get current IST time as Date object
      const getCurrentIST = (): Date => {
        const now = new Date();
        const istTime = now.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const [datePart, timePart] = istTime.split(", ");
        const [month, day, year] = datePart.split("/");
        const istString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`;
        // Parse IST string and create Date object using UTC methods
        // This preserves the IST time values (hours, minutes, seconds) when stored
        const [dateStr, timeStr] = istString.split(" ");
        const [y, m, d] = dateStr.split("-").map(Number);
        const [h, min, sec = 0] = timeStr.split(":").map(Number);
        // Create Date object using UTC methods with IST time values
        // PostgreSQL timestamp (without timezone) will store these values as-is
        return new Date(Date.UTC(y, m - 1, d, h, min, sec));
      };
      // Handle cancelledAdmissionAt - if it's already in IST format, use it; otherwise convert to IST
      if (data.cancelledAdmissionAt !== undefined) {
        if (
          data.cancelledAdmissionAt &&
          typeof data.cancelledAdmissionAt === "string" &&
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
            data.cancelledAdmissionAt,
          )
        ) {
          // Already in PostgreSQL format (YYYY-MM-DD HH:mm:ss), convert to Date object
          const [datePart, timePart] = data.cancelledAdmissionAt.split(" ");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart.split(":").map(Number);
          // Create Date object using UTC methods with IST time values
          // PostgreSQL timestamp (without timezone) will store these values as-is
          update.cancelledAdmissionAt = new Date(
            Date.UTC(year, month - 1, day, hours, minutes, seconds),
          );
        } else if (data.cancelledAdmissionAt) {
          // Convert to IST format and then to Date object
          const date = new Date(data.cancelledAdmissionAt);
          if (!isNaN(date.getTime())) {
            const istTime = date.toLocaleString("en-US", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
            const [datePart, timePart] = istTime.split(", ");
            const [month, day, year] = datePart.split("/");
            const istString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`;
            // Parse IST string and create Date object using UTC methods
            // This preserves the IST time values (hours, minutes, seconds) when stored
            const [dateStr, timeStr] = istString.split(" ");
            const [y, m, d] = dateStr.split("-").map(Number);
            const [h, min, sec = 0] = timeStr.split(":").map(Number);
            // Create Date object using UTC methods with IST time values
            // PostgreSQL timestamp (without timezone) will store these values as-is
            update.cancelledAdmissionAt = new Date(
              Date.UTC(y, m - 1, d, h, min, sec),
            );
          } else {
            update.cancelledAdmissionAt = getCurrentIST();
          }
        } else {
          update.cancelledAdmissionAt = getCurrentIST();
        }
      }
      // Handle cancelledAdmissionByUserId - set it if provided, otherwise it should be set by controller from req.user.id
      // Always set this field when status is CANCELLED_ADMISSION (even if null, to ensure it's updated)
      if (data.cancelledAdmissionByUserId !== undefined) {
        if (
          data.cancelledAdmissionByUserId !== null &&
          typeof data.cancelledAdmissionByUserId === "number"
        ) {
          update.cancelledAdmissionByUserId = data.cancelledAdmissionByUserId;
        } else {
          // Explicitly set to null if not provided or invalid
          update.cancelledAdmissionByUserId = null;
        }
      } else {
        // If not provided in data, but status is CANCELLED_ADMISSION, set to null
        // (Controller should have set it from req.user.id, but if not, we set null)
        update.cancelledAdmissionByUserId = null;
      }
      // Clear leaving fields and TC fields
      update.leavingDate = null;
      update.leavingReason = null;
      update.takenTransferCertificate = false;
      break;
    }
    case "SUSPENDED": {
      // Suspended students remain active in student table, but suspended status is handled in user table
      // Keep student active but don't modify other flags
      update.active = true;
      // Clear all status-specific fields for suspended status
      update.leavingDate = null;
      update.leavingReason = null;
      update.takenTransferCertificate = false;
      update.hasCancelledAdmission = false;
      update.cancelledAdmissionReason = null;
      update.cancelledAdmissionAt = null;
      break;
    }
  }

  // Allow direct overrides too (these take precedence over switch case logic)
  if (typeof data.active === "boolean") update.active = data.active;
  if (typeof data.alumni === "boolean") update.alumni = data.alumni;
  if (typeof data.takenTransferCertificate === "boolean")
    update.takenTransferCertificate = data.takenTransferCertificate;
  if (typeof data.hasCancelledAdmission === "boolean")
    update.hasCancelledAdmission = data.hasCancelledAdmission;
  // If RFID is provided (including empty string or null), update that column
  if (Object.prototype.hasOwnProperty.call(data, "rfidNumber")) {
    update.rfidNumber = data.rfidNumber ?? null;
  }
  // Helper to convert timestamp string to Date object representing IST time
  const convertToISTTimestamp = (
    value: string | null | undefined,
  ): Date | null => {
    if (!value) return null;
    // If it's already in PostgreSQL format (YYYY-MM-DD HH:mm:ss), parse it as IST
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ) {
      // Parse the IST string and create a Date object using UTC methods
      // Since PostgreSQL timestamp (without timezone) stores values as-is,
      // we create a Date object where the UTC time components match the IST time
      const [datePart, timePart] = value.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, seconds = 0] = timePart.split(":").map(Number);
      // Create Date object using UTC methods with IST time values
      // This preserves the time components (22:46:00) when stored in PostgreSQL
      return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    }
    // Otherwise, parse the value as a date and convert to IST, then create Date object
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const istTime = date.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const [datePart, timePart] = istTime.split(", ");
    const [month, day, year] = datePart.split("/");
    const istString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`;
    // Parse IST string and create Date object using UTC methods
    // This preserves the IST time values (hours, minutes, seconds) when stored
    const [dateStr, timeStr] = istString.split(" ");
    const [y, m, d] = dateStr.split("-").map(Number);
    const [h, min, sec = 0] = timeStr.split(":").map(Number);
    // Create Date object using UTC methods with IST time values
    // PostgreSQL timestamp (without timezone) will store these values as-is
    return new Date(Date.UTC(y, m - 1, d, h, min, sec));
  };

  if (data.leavingDate !== undefined)
    update.leavingDate = convertToISTTimestamp(data.leavingDate);
  if (data.leavingReason !== undefined)
    update.leavingReason = data.leavingReason;
  // Handle cancelled admission fields explicitly
  if (data.cancelledAdmissionReason !== undefined)
    update.cancelledAdmissionReason = data.cancelledAdmissionReason;
  if (data.cancelledAdmissionAt !== undefined)
    update.cancelledAdmissionAt = convertToISTTimestamp(
      data.cancelledAdmissionAt,
    );

  const [updated] = await db
    .update(studentModel)
    .set(update)
    .where(eq(studentModel.id, id))
    .returning();

  return updated ?? null;
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

// Helper function to convert camelCase/snake_case to sentence case
function toSentenceCase(str: string): string {
  let result = str
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Remove "Student" prefix from registration and roll number headers
  result = result.replace(
    /^Student Registration Number$/,
    "Registration Number",
  );
  result = result.replace(/^Student Roll Number$/, "Roll Number");

  return result;
}

// Helper function to transform data values for Excel export
function transformValueForExcel(value: any): any {
  // Convert null or undefined to empty string
  if (value === null || value === undefined) {
    return "";
  }

  // Convert boolean to Yes/No
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Return value as-is for other types
  return value;
}

// Helper function to transform a row object for Excel export
function transformRowForExcel(row: Record<string, any>): Record<string, any> {
  const transformedRow: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    transformedRow[key] = transformValueForExcel(value);
  }
  return transformedRow;
}

// Helper function to calculate column width based on header and data
function calculateColumnWidth(header: string, allData?: any[]): number {
  const headerLength = header.length;
  let maxDataLength = headerLength;

  // Check all data if provided to find maximum length
  if (allData && allData.length > 0) {
    const allLengths = allData.map((val) => {
      if (val === null || val === undefined) return 0;
      const str = String(val);
      // For very long strings, consider wrapping - but still use full length for width
      return str.length;
    });
    maxDataLength = Math.max(headerLength, ...allLengths);
  }

  // Add generous padding (5 characters) and ensure minimum width of 12
  // Remove max cap to allow columns to expand as needed
  const calculatedWidth = Math.max(maxDataLength + 5, 12);

  // Cap at 100 to prevent extremely wide columns, but allow more flexibility
  return Math.min(calculatedWidth, 100);
}

export async function exportStudentDetailedReport(academicYearId: number) {
  console.log(
    "[STUDENT-EXPORT] Generating detailed student report for academic year:",
    academicYearId,
  );

  const { rows } = await db.execute(
    sql`
      WITH addr AS (
        SELECT
          a.id,
          a.personal_details_id_fk,
          a.type,
          a.other_country,
          a.other_state,
          a.other_city,
          a.other_district,
          a.address,
          a.address_line,
          a.landmark,
          a.locality_type,
          a.postoffice_id_fk,
          a.other_postoffice,
          a.police_station_id_fk,
          a.other_police_station,
          a.block,
          a.phone,
          a.emergency_phone,
          a.pincode,
          co.name AS country_name,
          st.name AS state_name,
          ci.name AS city_name,
          di.name AS district_name,
          ROW_NUMBER() OVER (
            PARTITION BY a.personal_details_id_fk
            ORDER BY
              CASE a.type
                WHEN 'RESIDENTIAL' THEN 0
                WHEN 'MAILING' THEN 1
                ELSE 2
              END,
              a.id
          ) AS rn
        FROM address a
        LEFT JOIN countries co ON co.id = a.country_id_fk
        LEFT JOIN states st ON st.id = a.state_id_fk
        LEFT JOIN cities ci ON ci.id = a.city_id_fk
        LEFT JOIN districts di ON di.id = a.district_id_fk
      ),
      addr_pivot AS (
        SELECT
          personal_details_id_fk,
          MAX(CASE WHEN rn = 1 THEN type END) AS address_1_type,
          MAX(CASE WHEN rn = 1 THEN address END) AS address_1_address,
          MAX(CASE WHEN rn = 1 THEN address_line END) AS address_1_address_line,
          MAX(CASE WHEN rn = 1 THEN landmark END) AS address_1_landmark,
          MAX(CASE WHEN rn = 1 THEN locality_type END) AS address_1_locality_type,
          MAX(CASE WHEN rn = 1 THEN block END) AS address_1_block,
          MAX(CASE WHEN rn = 1 THEN phone END) AS address_1_phone,
          MAX(CASE WHEN rn = 1 THEN emergency_phone END) AS address_1_emergency_phone,
          MAX(CASE WHEN rn = 1 THEN pincode END) AS address_1_pincode,
          MAX(CASE WHEN rn = 1 THEN country_name END) AS address_1_country_name,
          MAX(CASE WHEN rn = 1 THEN state_name END) AS address_1_state_name,
          MAX(CASE WHEN rn = 1 THEN city_name END) AS address_1_city_name,
          MAX(CASE WHEN rn = 1 THEN district_name END) AS address_1_district_name,
          MAX(CASE WHEN rn = 1 THEN other_country END) AS address_1_other_country,
          MAX(CASE WHEN rn = 1 THEN other_state END) AS address_1_other_state,
          MAX(CASE WHEN rn = 1 THEN other_city END) AS address_1_other_city,
          MAX(CASE WHEN rn = 1 THEN other_district END) AS address_1_other_district,
          MAX(CASE WHEN rn = 1 THEN other_postoffice END) AS address_1_other_postoffice,
          MAX(CASE WHEN rn = 1 THEN other_police_station END) AS address_1_other_police_station,
          MAX(CASE WHEN rn = 2 THEN type END) AS address_2_type,
          MAX(CASE WHEN rn = 2 THEN address END) AS address_2_address,
          MAX(CASE WHEN rn = 2 THEN address_line END) AS address_2_address_line,
          MAX(CASE WHEN rn = 2 THEN landmark END) AS address_2_landmark,
          MAX(CASE WHEN rn = 2 THEN locality_type END) AS address_2_locality_type,
          MAX(CASE WHEN rn = 2 THEN block END) AS address_2_block,
          MAX(CASE WHEN rn = 2 THEN phone END) AS address_2_phone,
          MAX(CASE WHEN rn = 2 THEN emergency_phone END) AS address_2_emergency_phone,
          MAX(CASE WHEN rn = 2 THEN pincode END) AS address_2_pincode,
          MAX(CASE WHEN rn = 2 THEN country_name END) AS address_2_country_name,
          MAX(CASE WHEN rn = 2 THEN state_name END) AS address_2_state_name,
          MAX(CASE WHEN rn = 2 THEN city_name END) AS address_2_city_name,
          MAX(CASE WHEN rn = 2 THEN district_name END) AS address_2_district_name,
          MAX(CASE WHEN rn = 2 THEN other_country END) AS address_2_other_country,
          MAX(CASE WHEN rn = 2 THEN other_state END) AS address_2_other_state,
          MAX(CASE WHEN rn = 2 THEN other_city END) AS address_2_other_city,
          MAX(CASE WHEN rn = 2 THEN other_district END) AS address_2_other_district,
          MAX(CASE WHEN rn = 2 THEN other_postoffice END) AS address_2_other_postoffice,
          MAX(CASE WHEN rn = 2 THEN other_police_station END) AS address_2_other_police_station,
          MAX(CASE WHEN rn = 3 THEN type END) AS address_3_type,
          MAX(CASE WHEN rn = 3 THEN address END) AS address_3_address,
          MAX(CASE WHEN rn = 3 THEN address_line END) AS address_3_address_line,
          MAX(CASE WHEN rn = 3 THEN landmark END) AS address_3_landmark,
          MAX(CASE WHEN rn = 3 THEN locality_type END) AS address_3_locality_type,
          MAX(CASE WHEN rn = 3 THEN block END) AS address_3_block,
          MAX(CASE WHEN rn = 3 THEN phone END) AS address_3_phone,
          MAX(CASE WHEN rn = 3 THEN emergency_phone END) AS address_3_emergency_phone,
          MAX(CASE WHEN rn = 3 THEN pincode END) AS address_3_pincode,
          MAX(CASE WHEN rn = 3 THEN country_name END) AS address_3_country_name,
          MAX(CASE WHEN rn = 3 THEN state_name END) AS address_3_state_name,
          MAX(CASE WHEN rn = 3 THEN city_name END) AS address_3_city_name,
          MAX(CASE WHEN rn = 3 THEN district_name END) AS address_3_district_name,
          MAX(CASE WHEN rn = 3 THEN other_country END) AS address_3_other_country,
          MAX(CASE WHEN rn = 3 THEN other_state END) AS address_3_other_state,
          MAX(CASE WHEN rn = 3 THEN other_city END) AS address_3_other_city,
          MAX(CASE WHEN rn = 3 THEN other_district END) AS address_3_other_district,
          MAX(CASE WHEN rn = 3 THEN other_postoffice END) AS address_3_other_postoffice,
          MAX(CASE WHEN rn = 3 THEN other_police_station END) AS address_3_other_police_station
        FROM addr
        GROUP BY personal_details_id_fk
      )
      SELECT
        u.email AS user_institutional_email,
        u.name AS user_name,
        pd.email AS personal_email,
        u.phone AS user_phone,
        u.whatsapp_number AS user_whatsappnumber,
        u.is_active AS user_is_active,
        std.uid AS student_uid,
        std.old_uid AS student_old_uid,
        std.registration_number AS student_registration_number,
        std.roll_number AS student_roll_number,
        sh.name AS shift,
        sec.name AS section,
        std.rfid_number AS student_rfid_number,
        std.class_roll_number AS student_class_roll_number,
        pd.aadhaar_card_number AS personal_details_aadhaar_card_number,
        pd.date_of_birth AS personal_details_dateOfBirth,
        pd.gender AS personal_details_gender,
        father.name AS father_person_name,
        mother.name AS mother_person_name,
        pc.name AS promotion_program_course_name,
        rel.name AS personal_details_religion,
        nat.name AS personal_details_nationality,
        cat.name AS personal_details_category,
        ap.address_1_type,
        ap.address_1_address,
        ap.address_1_address_line,
        ap.address_1_landmark,
        ap.address_1_locality_type,
        ap.address_1_block,
        ap.address_1_phone,
        ap.address_1_emergency_phone,
        ap.address_1_pincode,
        ap.address_1_country_name,
        ap.address_1_state_name,
        ap.address_1_city_name,
        ap.address_1_district_name,
        ap.address_1_other_country,
        ap.address_1_other_state,
        ap.address_1_other_city,
        ap.address_1_other_district,
        ap.address_1_other_postoffice,
        ap.address_1_other_police_station,
        ap.address_2_type,
        ap.address_2_address,
        ap.address_2_address_line,
        ap.address_2_landmark,
        ap.address_2_locality_type,
        ap.address_2_block,
        ap.address_2_phone,
        ap.address_2_emergency_phone,
        ap.address_2_pincode,
        ap.address_2_country_name,
        ap.address_2_state_name,
        ap.address_2_city_name,
        ap.address_2_district_name,
        ap.address_2_other_country,
        ap.address_2_other_state,
        ap.address_2_other_city,
        ap.address_2_other_district,
        ap.address_2_other_postoffice,
        ap.address_2_other_police_station,
        ap.address_3_type,
        ap.address_3_address,
        ap.address_3_address_line,
        ap.address_3_landmark,
        ap.address_3_locality_type,
        ap.address_3_block,
        ap.address_3_phone,
        ap.address_3_emergency_phone,
        ap.address_3_pincode,
        ap.address_3_country_name,
        ap.address_3_state_name,
        ap.address_3_city_name,
        ap.address_3_district_name,
        ap.address_3_other_country,
        ap.address_3_other_state,
        ap.address_3_other_city,
        ap.address_3_other_district,
        ap.address_3_other_postoffice,
        ap.address_3_other_police_station
      FROM users u
      JOIN students std ON u.id = std.user_id_fk
      JOIN promotions pr ON pr.student_id_fk = std.id
      JOIN program_courses pc ON pr.program_course_id_fk = pc.id
      JOIN sessions sess ON pr.session_id_fk = sess.id
      JOIN personal_details pd ON pd.user_id_fk = u.id
      LEFT JOIN nationality nat ON nat.id = pd.nationality_id_fk
      LEFT JOIN religion rel ON rel.id = pd.religion_id_fk
      LEFT JOIN categories cat ON cat.id = pd.category_id_fk
      JOIN application_forms af ON af.id = std.application_form_id_fk
      JOIN family_details fd ON fd.user_id_fk = u.id
      LEFT JOIN sections sec ON sec.id = pr.section_id_fk
      LEFT JOIN shifts sh ON sh.id = pr.shift_id_fk
      LEFT JOIN person father ON father.family_id_fk = fd.id AND father.type = 'FATHER'
      LEFT JOIN person mother ON mother.family_id_fk = fd.id AND mother.type = 'MOTHER'
      LEFT JOIN addr_pivot ap ON ap.personal_details_id_fk = pd.id
      WHERE u.type = 'STUDENT'
        AND sess.academic_id_fk = ${academicYearId};
    `,
  );

  console.log(
    `[STUDENT-EXPORT] Retrieved ${rows.length} rows for detailed student report`,
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("student_data");

  if (rows.length > 0) {
    // Transform rows: convert booleans to Yes/No and nulls to empty strings
    const transformedRows = rows.map((row) => transformRowForExcel(row));

    // Define columns from first row keys with sentence case headers
    const headers = Object.keys(transformedRows[0]);

    // Calculate column widths based on header and transformed data
    sheet.columns = headers.map((header) => {
      const sentenceCaseHeader = toSentenceCase(header);
      // Get all transformed data for this column to find maximum length
      const allColumnData = transformedRows.map((row) => row[header]);
      const width = calculateColumnWidth(sentenceCaseHeader, allColumnData);

      return {
        header: sentenceCaseHeader,
        key: header,
        width,
      };
    });

    // Add transformed rows
    transformedRows.forEach((row) => {
      sheet.addRow(row);
    });

    // Recalculate column widths after adding all rows to ensure accuracy
    headers.forEach((header, colIndex) => {
      const sentenceCaseHeader = toSentenceCase(header);
      const allColumnData = transformedRows.map((row) => row[header]);
      const calculatedWidth = calculateColumnWidth(
        sentenceCaseHeader,
        allColumnData,
      );
      const column = sheet.getColumn(colIndex + 1);
      if (column) {
        column.width = calculatedWidth;
      }
    });

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }, // Grey background
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add borders to all cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
        });
      }
    });

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  } else {
    sheet.columns = [{ header: "message", key: "message", width: 20 }];
    sheet.addRow({ message: "No data available" });
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    buffer: Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer),
    fileName: `student_data_export_${timestamp}.xlsx`,
    totalRecords: rows.length,
  };
}

export async function exportStudentAcademicSubjectsReport(
  academicYearId: number,
) {
  console.log(
    "[STUDENT-EXPORT] Generating student academic subjects report for academic year:",
    academicYearId,
  );

  const { rows } = await db.execute(
    sql`
      SELECT
        DISTINCT std.uid AS student_uid,
        b.name AS student_academic_info_board_name,
        ai.other_board,
        ai.percentage_of_marks,
        ai.division,
        ai.rank,
        ai.index_number_1,
        ai.index_number_2,
        ai.registration_number,
        ai.roll_number,
        ai.school_number,
        ai.center_number,
        ai.admit_card_id,
        MAX(CASE WHEN subj_no = 1 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_1_board_subject_name,
        MAX(CASE WHEN subj_no = 1 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_1_total_marks,
        MAX(CASE WHEN subj_no = 1 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_1_result_status,
        MAX(CASE WHEN subj_no = 2 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_2_board_subject_name,
        MAX(CASE WHEN subj_no = 2 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_2_total_marks,
        MAX(CASE WHEN subj_no = 2 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_2_result_status,
        MAX(CASE WHEN subj_no = 3 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_3_board_subject_name,
        MAX(CASE WHEN subj_no = 3 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_3_total_marks,
        MAX(CASE WHEN subj_no = 3 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_3_result_status,
        MAX(CASE WHEN subj_no = 4 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_4_board_subject_name,
        MAX(CASE WHEN subj_no = 4 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_4_total_marks,
        MAX(CASE WHEN subj_no = 4 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_4_result_status,
        MAX(CASE WHEN subj_no = 5 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_5_board_subject_name,
        MAX(CASE WHEN subj_no = 5 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_5_total_marks,
        MAX(CASE WHEN subj_no = 5 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_5_result_status,
        MAX(CASE WHEN subj_no = 6 THEN bsn.name ELSE NULL END) AS student_ref_academic_subject_6_board_subject_name,
        MAX(CASE WHEN subj_no = 6 THEN sa.total_marks ELSE NULL END) AS student_ref_academic_subject_6_total_marks,
        MAX(CASE WHEN subj_no = 6 THEN sa.result_status ELSE NULL END) AS student_ref_academic_subject_6_result_status
      FROM (
        SELECT
          sa.*,
          ROW_NUMBER() OVER (
            PARTITION BY sa.admission_academic_info_id_fk
            ORDER BY sa.id
          ) AS subj_no
        FROM student_academic_subjects sa
      ) sa
      JOIN admission_academic_info ai ON ai.id = sa.admission_academic_info_id_fk
      JOIN application_forms af ON af.id = ai.application_form_id_fk
      JOIN admissions adm ON adm.id = af.admission_id_fk
      JOIN sessions sess ON sess.id = adm.session_id_fk
      JOIN students std ON std.application_form_id_fk = af.id
      JOIN users u ON u.id = std.user_id_fk
      JOIN board_subjects bs ON bs.id = sa.board_subject_id_fk
      JOIN board_subject_names bsn ON bsn.id = bs.board_subject_name_id_fk
      JOIN boards b ON b.id = bs.board_id_fk
      WHERE ai.student_id_fk IS NOT NULL
        AND u.is_active = true
        AND sess.academic_id_fk = ${academicYearId}
      GROUP BY
        std.uid,
        b.name,
        ai.other_board,
        ai.percentage_of_marks,
        ai.division,
        ai.rank,
        ai.index_number_1,
        ai.index_number_2,
        ai.registration_number,
        ai.roll_number,
        ai.school_number,
        ai.center_number,
        ai.admit_card_id;
    `,
  );

  console.log(
    `[STUDENT-EXPORT] Retrieved ${rows.length} rows for academic subjects report`,
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("student_academic_subjects");

  if (rows.length > 0) {
    // Transform rows: convert booleans to Yes/No and nulls to empty strings
    const transformedRows = rows.map((row) => transformRowForExcel(row));

    // Define columns from first row keys with sentence case headers
    const headers = Object.keys(transformedRows[0]);

    // Calculate column widths based on header and transformed data
    sheet.columns = headers.map((header) => {
      const sentenceCaseHeader = toSentenceCase(header);
      // Get all transformed data for this column to find maximum length
      const allColumnData = transformedRows.map((row) => row[header]);
      const width = calculateColumnWidth(sentenceCaseHeader, allColumnData);

      return {
        header: sentenceCaseHeader,
        key: header,
        width,
      };
    });

    // Add transformed rows
    transformedRows.forEach((row) => {
      sheet.addRow(row);
    });

    // Recalculate column widths after adding all rows to ensure accuracy
    headers.forEach((header, colIndex) => {
      const sentenceCaseHeader = toSentenceCase(header);
      const allColumnData = transformedRows.map((row) => row[header]);
      const calculatedWidth = calculateColumnWidth(
        sentenceCaseHeader,
        allColumnData,
      );
      const column = sheet.getColumn(colIndex + 1);
      if (column) {
        column.width = calculatedWidth;
      }
    });

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }, // Grey background
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add borders to all cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
        });
      }
    });

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  } else {
    sheet.columns = [{ header: "message", key: "message", width: 20 }];
    sheet.addRow({ message: "No data available" });
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    buffer: Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer),
    fileName: `student_academic_subjects_${timestamp}.xlsx`,
    totalRecords: rows.length,
  };
}

// Helper function to dynamically generate export fields from database objects
function generateExportFields(
  data: any,
  prefix: string,
  excludeFields: string[] = [],
): Record<string, any> {
  if (!data) return {};

  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip ID fields and excluded fields
    if (key.endsWith("Id") || key === "id" || excludeFields.includes(key)) {
      continue;
    }

    const fieldName = `${prefix}_${key}`;
    fields[fieldName] = value || null;
  }

  return fields;
}

// Helper function to generate export fields for nested objects
function generateNestedExportFields(
  data: any,
  prefix: string,
  excludeFields: string[] = [],
): Record<string, any> {
  if (!data) return {};

  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip ID fields and excluded fields
    if (key.endsWith("Id") || key === "id" || excludeFields.includes(key)) {
      continue;
    }

    // Handle nested objects
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      const nestedFields = generateExportFields(
        value,
        `${prefix}_${key}`,
        excludeFields,
      );
      Object.assign(fields, nestedFields);
    } else {
      const fieldName = `${prefix}_${key}`;
      fields[fieldName] = value || null;
    }
  }

  return fields;
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

  // Get student reference academic subjects (where applicationFormId is null and studentId is set)
  const studentReferenceAcademicSubjects =
    await getStudentReferenceAcademicSubjects(student.id);

  // Get student reference academic info (where applicationFormId is null and studentId is set)
  const studentReferenceAcademicInfo = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(
      and(
        eq(admissionAcademicInfoModel.studentId, student.id),
        sql`${admissionAcademicInfoModel.applicationFormId} IS NULL`,
      ),
    )
    .then((r) => r[0] || null);

  // Get board name for student reference academic info
  const boardName = studentReferenceAcademicInfo?.boardId
    ? await db
        .select()
        .from(boardModel)
        .where(eq(boardModel.id, studentReferenceAcademicInfo.boardId))
        .then((r) => r[0]?.name || null)
    : null;

  // Get admission subject selections
  const admissionSubjectSelections = await getAdmissionSubjectSelections(
    student.id,
  );

  // Dynamically generate export fields for each data source
  const flattenedData = {
    // ===== USER TABLE FIELDS =====
    ...generateExportFields(userFields, "user", ["password"]), // Exclude password for security

    // ===== STUDENT TABLE FIELDS =====
    ...generateExportFields(student, "student"),

    // ===== PERSONAL DETAILS TABLE FIELDS =====
    ...generateExportFields(personalDetails, "personal_details"),

    // ===== FAMILY DETAILS TABLE FIELDS =====
    ...generateNestedExportFields(familyDetails?.family, "family_details"),

    // ===== FATHER PERSON DETAILS =====
    ...generateNestedExportFields(familyDetails?.father, "father_person"),

    // ===== MOTHER PERSON DETAILS =====
    ...generateNestedExportFields(familyDetails?.mother, "mother_person"),

    // ===== GUARDIAN PERSON DETAILS =====
    ...generateNestedExportFields(familyDetails?.guardian, "guardian_person"),

    // ===== ANNUAL INCOME DETAILS =====
    ...generateNestedExportFields(familyDetails?.annualIncome, "annual_income"),

    // ===== ADDRESS DETAILS (DYNAMICALLY GENERATED) =====
    ...generateAddressColumns(addressDetails),

    // ===== ACCOMMODATION DETAILS =====
    ...generateExportFields(accommodationDetails, "accommodation"),

    // ===== HEALTH DETAILS =====
    ...generateExportFields(healthDetails, "health"),

    // ===== EMERGENCY CONTACT DETAILS =====
    ...generateExportFields(emergencyContactDetails, "emergency_contact"),

    // ===== PROMOTION DETAILS =====
    ...generateExportFields(promotionFields, "promotion"),

    // ===== STUDENT REFERENCE ACADEMIC INFO =====
    ...generateExportFields(
      studentReferenceAcademicInfo,
      "student_academic_info",
    ),
    // Add board name separately since it's a related field
    student_academic_info_board_name: boardName || null,

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

interface StudentApaarIdRow {
  "College UID": string;
  "Student Name": string;
  "APAAR ID": string;
}

interface StudentCuRollRegRow {
  rowNumber: number;
  uid: string;
  cuRollNumber: string | null;
  cuRegistrationNumber: string | null;
}

// Update APAAR IDs for students based on College UID
export async function updateStudentApaarIds(
  apaarIdRows: StudentApaarIdRow[],
): Promise<{
  success: boolean;
  updated: number;
  errors: Array<{ uid: string; error: string }>;
  notFound: string[];
}> {
  const errors: Array<{ uid: string; error: string }> = [];
  const notFound: string[] = [];
  let updated = 0;

  console.info(`[UPDATE APAAR IDS] Processing ${apaarIdRows.length} records`);

  for (const row of apaarIdRows) {
    const { "College UID": collegeUid, "APAAR ID": apaarId } = row;

    if (!collegeUid || !apaarId) {
      errors.push({
        uid: collegeUid || "unknown",
        error: "Missing College UID or APAAR ID",
      });
      continue;
    }

    try {
      // Find student by College UID
      const [student] = await db
        .select()
        .from(studentModel)
        .where(eq(studentModel.uid, collegeUid.trim()));

      if (!student) {
        notFound.push(collegeUid);
        console.warn(
          `[UPDATE APAAR IDS] Student not found for UID: ${collegeUid}`,
        );
        continue;
      }

      // Update APAAR ID - format as 3-3-3-3 (12 digits with dashes)
      const cleanApaarId = apaarId.trim().replace(/\D/g, "");
      const formattedApaarId =
        cleanApaarId.length === 12
          ? `${cleanApaarId.slice(0, 3)}-${cleanApaarId.slice(3, 6)}-${cleanApaarId.slice(6, 9)}-${cleanApaarId.slice(9, 12)}`
          : cleanApaarId; // Keep original if not 12 digits

      await db
        .update(studentModel)
        .set({ apaarId: formattedApaarId })
        .where(eq(studentModel.id, student.id));

      updated++;
      console.info(
        `[UPDATE APAAR IDS] Updated APAAR ID for student ${collegeUid}: ${apaarId} -> ${formattedApaarId}`,
      );
    } catch (error: any) {
      console.error(
        `[UPDATE APAAR IDS] Error updating student ${collegeUid}:`,
        error,
      );
      errors.push({
        uid: collegeUid,
        error: error.message || "Unknown error",
      });
    }
  }

  console.info(
    `[UPDATE APAAR IDS] Completed: ${updated} updated, ${errors.length} errors, ${notFound.length} not found`,
  );

  return {
    success: errors.length === 0,
    updated,
    errors,
    notFound,
  };
}

function normalizeUidForMatch(uid: string): string {
  return uid.trim().toLowerCase();
}

function normalizeUidForImportMatch(uid: string): string {
  // Match legacy importer cleaning: keep only alphanumeric chars and lower-case
  return normalizeUidForMatch(uid).replace(/[^a-z0-9]/gi, "");
}

export async function checkExistingStudentUids(
  uids: string[],
): Promise<{ existingUids: string[] }> {
  const normalizedToOriginals = new Map<string, Set<string>>();

  for (const raw of uids || []) {
    const norm = normalizeUidForImportMatch(String(raw ?? ""));
    if (!norm) continue;
    if (!normalizedToOriginals.has(norm))
      normalizedToOriginals.set(norm, new Set());
    normalizedToOriginals.get(norm)!.add(String(raw ?? "").trim());
  }

  const normalizedUids = Array.from(normalizedToOriginals.keys());
  if (normalizedUids.length === 0) return { existingUids: [] };

  // Postgres: regexp_replace supports global replace when passing 'g'
  const rows = await db
    .select({ uid: studentModel.uid })
    .from(studentModel)
    .where(
      inArray(
        sql`lower(regexp_replace(trim(${studentModel.uid}), '[^a-zA-Z0-9]', '', 'g'))`,
        normalizedUids,
      ),
    );

  const existingSet = new Set<string>();
  for (const r of rows) {
    const norm = normalizeUidForImportMatch(r.uid);
    const originals = normalizedToOriginals.get(norm);
    if (!originals) continue;
    originals.forEach((o) => existingSet.add(o));
  }

  return { existingUids: Array.from(existingSet) };
}

export async function updateStudentCuRollAndRegistration(
  rows: StudentCuRollRegRow[],
  progressUserId?: string,
): Promise<{
  totalRows: number;
  uniqueUids: number;
  updated: number;
  skipped: Array<{ uid: string; reason: string }>;
  notFound: string[];
  duplicates: Array<{ uid: string; rowNumbers: number[] }>;
  errors: Array<{ rowNumber: number; uid: string; error: string }>;
}> {
  const errors: Array<{ rowNumber: number; uid: string; error: string }> = [];
  const skipped: Array<{ uid: string; reason: string }> = [];
  const notFound: string[] = [];
  const duplicates: Array<{ uid: string; rowNumbers: number[] }> = [];
  let updated = 0;

  const emitProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
    meta?: Record<string, unknown>,
    errorMsg?: string,
  ) => {
    if (!progressUserId) return;
    const update = socketService.createExportProgressUpdate(
      progressUserId,
      message,
      progress,
      status,
      undefined,
      undefined,
      errorMsg,
      {
        operation: "student_cu_roll_reg_update",
        ...meta,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  try {
    emitProgress("Preparing CU Roll/Registration update…", 0, "started", {
      totalRows: rows.length,
    });

    const byUid = new Map<
      string,
      {
        uidOriginal: string;
        rowNumbers: number[];
        cuRollNumber: string | null;
        cuRegistrationNumber: string | null;
      }
    >();

    for (const row of rows) {
      const norm = normalizeUidForMatch(row.uid || "");
      if (!norm) {
        errors.push({
          rowNumber: row.rowNumber,
          uid: row.uid || "unknown",
          error: "Missing UID",
        });
        continue;
      }

      const existing = byUid.get(norm);
      if (!existing) {
        byUid.set(norm, {
          uidOriginal: row.uid,
          rowNumbers: [row.rowNumber],
          cuRollNumber: row.cuRollNumber,
          cuRegistrationNumber: row.cuRegistrationNumber,
        });
      } else {
        existing.rowNumbers.push(row.rowNumber);
        // last non-empty wins
        if (row.cuRollNumber && row.cuRollNumber.trim()) {
          existing.cuRollNumber = row.cuRollNumber;
        }
        if (row.cuRegistrationNumber && row.cuRegistrationNumber.trim()) {
          existing.cuRegistrationNumber = row.cuRegistrationNumber;
        }
      }
    }

    for (const [, data] of byUid.entries()) {
      if (data.rowNumbers.length > 1) {
        duplicates.push({ uid: data.uidOriginal, rowNumbers: data.rowNumbers });
      }
    }

    const normalizedUids = Array.from(byUid.keys());
    if (normalizedUids.length === 0) {
      emitProgress("No valid UID rows found.", 100, "completed", {
        totalRows: rows.length,
        uniqueUids: 0,
        updated,
      });
      return {
        totalRows: rows.length,
        uniqueUids: 0,
        updated,
        skipped,
        notFound,
        duplicates,
        errors,
      };
    }

    emitProgress("Matching UIDs with students…", 5, "in_progress", {
      totalRows: rows.length,
      uniqueUids: byUid.size,
    });

    // Fetch all matching students in one query (trim + case-insensitive)
    const students = await db
      .select({ id: studentModel.id, uid: studentModel.uid })
      .from(studentModel)
      .where(inArray(sql`lower(trim(${studentModel.uid}))`, normalizedUids));

    const studentByNormUid = new Map<string, { id: number; uid: string }>();
    for (const s of students) {
      studentByNormUid.set(normalizeUidForMatch(s.uid), {
        id: s.id,
        uid: s.uid,
      });
    }

    let processed = 0;
    const totalToProcess = byUid.size;

    for (const [norm, data] of byUid.entries()) {
      const student = studentByNormUid.get(norm);
      if (!student) {
        notFound.push(data.uidOriginal);
        processed++;
        if (processed % 25 === 0 || processed === totalToProcess) {
          emitProgress(
            `Processing… (${processed}/${totalToProcess})`,
            Math.min(99, Math.floor((processed / totalToProcess) * 100)),
            "in_progress",
            {
              processed,
              totalToProcess,
              updated,
              notFound: notFound.length,
              skipped: skipped.length,
              duplicates: duplicates.length,
              errors: errors.length,
            },
          );
        }
        continue;
      }

      const setObj: Partial<
        Pick<Student, "rollNumber" | "registrationNumber">
      > = {};

      if (data.cuRollNumber && data.cuRollNumber.trim()) {
        setObj.rollNumber = data.cuRollNumber.trim();
      }
      if (data.cuRegistrationNumber && data.cuRegistrationNumber.trim()) {
        setObj.registrationNumber = data.cuRegistrationNumber.trim();
      }

      if (Object.keys(setObj).length === 0) {
        skipped.push({
          uid: data.uidOriginal,
          reason: "No CU values provided",
        });
        processed++;
        if (processed % 25 === 0 || processed === totalToProcess) {
          emitProgress(
            `Processing… (${processed}/${totalToProcess})`,
            Math.min(99, Math.floor((processed / totalToProcess) * 100)),
            "in_progress",
            {
              processed,
              totalToProcess,
              updated,
              notFound: notFound.length,
              skipped: skipped.length,
              duplicates: duplicates.length,
              errors: errors.length,
            },
          );
        }
        continue;
      }

      try {
        await db
          .update(studentModel)
          .set(setObj)
          .where(eq(studentModel.id, student.id));
        updated++;
      } catch (e: any) {
        errors.push({
          rowNumber: data.rowNumbers[0] ?? 0,
          uid: data.uidOriginal,
          error: e?.message || "Unknown error",
        });
      }

      processed++;
      if (processed % 25 === 0 || processed === totalToProcess) {
        emitProgress(
          `Processing… (${processed}/${totalToProcess})`,
          Math.min(99, Math.floor((processed / totalToProcess) * 100)),
          "in_progress",
          {
            processed,
            totalToProcess,
            updated,
            notFound: notFound.length,
            skipped: skipped.length,
            duplicates: duplicates.length,
            errors: errors.length,
          },
        );
      }
    }

    emitProgress("CU Roll/Registration update completed.", 100, "completed", {
      totalRows: rows.length,
      uniqueUids: byUid.size,
      updated,
      notFound: notFound.length,
      skipped: skipped.length,
      duplicates: duplicates.length,
      errors: errors.length,
    });

    return {
      totalRows: rows.length,
      uniqueUids: byUid.size,
      updated,
      skipped,
      notFound,
      duplicates,
      errors,
    };
  } catch (e: any) {
    emitProgress(
      "CU Roll/Registration update failed.",
      100,
      "error",
      {
        totalRows: rows.length,
      },
      e?.message || "Unknown error",
    );
    throw e;
  }
}

// A function which accepts a excel file with the following columns, and updates the parent titles for the students
interface StudentParentTitleRow {
  UID: string;
  "Father Title": string;
  "Mother Title": string;
  "Guardian Title": string;
}

interface BulkUpdateFamilyTitlesResult {
  total: number;
  updated: number;
  errors: Array<{ uid: string; error: string }>;
  notFound: string[];
}

// Interface for updating family member titles
interface UpdateFamilyMemberTitlesData {
  fatherTitle?: string;
  motherTitle?: string;
  guardianTitle?: string;
}

interface UpdateFamilyMemberTitlesResult {
  success: boolean;
  error?: string;
  updatedMembers?: string[];
  updatedTitles?: {
    fatherTitle?: string;
    motherTitle?: string;
    guardianTitle?: string;
  };
}

// Update family member titles for a student by UID
export async function updateFamilyMemberTitles(
  studentUid: string,
  titlesData: UpdateFamilyMemberTitlesData,
): Promise<UpdateFamilyMemberTitlesResult> {
  try {
    console.info("[FAMILY-TITLE-UPDATE] Starting family member title update", {
      studentUid,
      titlesData,
    });

    // First, get the student by UID to get the userId
    const [student] = await db
      .select({
        id: studentModel.id,
        userId: studentModel.userId,
        uid: studentModel.uid,
      })
      .from(studentModel)
      .where(eq(studentModel.uid, studentUid))
      .limit(1);

    if (!student) {
      console.error("[FAMILY-TITLE-UPDATE] Student not found", { studentUid });
      return {
        success: false,
        error: `Student with UID '${studentUid}' not found`,
      };
    }

    console.info("[FAMILY-TITLE-UPDATE] Found student", {
      studentId: student.id,
      userId: student.userId,
      uid: student.uid,
    });

    // Get the family details for this user
    const [familyDetails] = await db
      .select({
        id: familyModel.id,
        userId: familyModel.userId,
      })
      .from(familyModel)
      .where(eq(familyModel.userId, student.userId))
      .limit(1);

    if (!familyDetails) {
      console.error("[FAMILY-TITLE-UPDATE] Family details not found", {
        studentUid,
        userId: student.userId,
      });
      return {
        success: false,
        error: `Family details not found for student '${studentUid}'`,
      };
    }

    console.info("[FAMILY-TITLE-UPDATE] Found family details", {
      familyId: familyDetails.id,
      userId: familyDetails.userId,
    });

    // Get existing family members (father, mother, guardian)
    const familyMembers = await db
      .select({
        id: personModel.id,
        type: personModel.type,
        title: personModel.title,
        name: personModel.name,
      })
      .from(personModel)
      .where(
        and(
          eq(personModel.familyId, familyDetails.id),
          or(
            eq(personModel.type, "FATHER"),
            eq(personModel.type, "MOTHER"),
            eq(personModel.type, "GUARDIAN"),
          ),
        ),
      );

    console.info("[FAMILY-TITLE-UPDATE] Found family members", {
      familyMembers: familyMembers.map((member) => ({
        id: member.id,
        type: member.type,
        currentTitle: member.title,
        name: member.name,
      })),
    });

    const updatedMembers: string[] = [];
    const updatedTitles: {
      fatherTitle?: string;
      motherTitle?: string;
      guardianTitle?: string;
    } = {};

    // Update titles for each family member type
    for (const member of familyMembers) {
      let shouldUpdate = false;
      let newTitle: string | undefined;

      switch (member.type) {
        case "FATHER":
          if (
            titlesData.fatherTitle &&
            titlesData.fatherTitle !== member.title
          ) {
            shouldUpdate = true;
            newTitle = titlesData.fatherTitle;
            updatedTitles.fatherTitle = newTitle;
          }
          break;
        case "MOTHER":
          if (
            titlesData.motherTitle &&
            titlesData.motherTitle !== member.title
          ) {
            shouldUpdate = true;
            newTitle = titlesData.motherTitle;
            updatedTitles.motherTitle = newTitle;
          }
          break;
        case "GUARDIAN":
          if (
            titlesData.guardianTitle &&
            titlesData.guardianTitle !== member.title
          ) {
            shouldUpdate = true;
            newTitle = titlesData.guardianTitle;
            updatedTitles.guardianTitle = newTitle;
          }
          break;
      }

      if (shouldUpdate && newTitle) {
        await db
          .update(personModel)
          .set({
            title: newTitle as any, // Cast to any to handle enum type
            updatedAt: new Date(),
          })
          .where(eq(personModel.id, member.id));

        updatedMembers.push(member.type as string);
        console.info("[FAMILY-TITLE-UPDATE] Updated family member title", {
          memberType: member.type,
          memberName: member.name,
          oldTitle: member.title,
          newTitle: newTitle,
        });
      }
    }

    // Check if any requested family member types don't exist
    const existingTypes = familyMembers.map((member) => member.type as string);
    const requestedTypes = Object.keys(titlesData).map((key) =>
      key.replace("Title", "").toUpperCase(),
    );

    const missingTypes = requestedTypes.filter(
      (type) => !existingTypes.includes(type),
    );
    if (missingTypes.length > 0) {
      console.warn(
        "[FAMILY-TITLE-UPDATE] Some family member types don't exist",
        {
          missingTypes,
          existingTypes,
        },
      );
    }

    console.info("[FAMILY-TITLE-UPDATE] Family member title update completed", {
      studentUid,
      updatedMembers,
      updatedTitles,
    });

    return {
      success: true,
      updatedMembers,
      updatedTitles:
        Object.keys(updatedTitles).length > 0 ? updatedTitles : undefined,
    };
  } catch (error) {
    console.error(
      "[FAMILY-TITLE-UPDATE] Error updating family member titles:",
      error,
    );
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Bulk update family member titles from Excel file
export async function bulkUpdateFamilyMemberTitles(
  rows: StudentParentTitleRow[],
): Promise<BulkUpdateFamilyTitlesResult> {
  const result: BulkUpdateFamilyTitlesResult = {
    total: rows.length,
    updated: 0,
    errors: [],
    notFound: [],
  };

  console.info("[FAMILY-TITLE-BULK-UPDATE] Starting bulk update", {
    totalRows: rows.length,
  });

  for (const row of rows) {
    try {
      const {
        UID: uid,
        "Father Title": fatherTitle,
        "Mother Title": motherTitle,
        "Guardian Title": guardianTitle,
      } = row;

      if (!uid) {
        result.errors.push({
          uid: uid || "Unknown",
          error: "UID is required",
        });
        continue;
      }

      // Call the single update function
      const updateResult = await updateFamilyMemberTitles(uid, {
        fatherTitle,
        motherTitle,
        guardianTitle,
      });

      if (updateResult.success) {
        result.updated++;
      } else {
        // Check if student was not found
        if (updateResult.error?.includes("not found")) {
          result.notFound.push(uid);
        } else {
          result.errors.push({
            uid,
            error: updateResult.error || "Unknown error",
          });
        }
      }
    } catch (error) {
      result.errors.push({
        uid: row.UID || "Unknown",
        error: (error as Error).message,
      });
    }
  }

  console.info("[FAMILY-TITLE-BULK-UPDATE] Completed", {
    total: result.total,
    updated: result.updated,
    errors: result.errors.length,
    notFound: result.notFound.length,
  });

  return result;
}

// export async function downloadStudentImages(academicYearId: number, userId: number) {
//     const BATCH_SIZE = 500;

//     socketService.sendProgressUpdate(userId.toString(), {
//         id: `download-${Date.now()}`,
//         userId: userId.toString(),
//         type: "export_progress",
//         message: `Downloading images for academic year ${academicYearId}`,
//         progress: 0,
//         status: "started",
//         createdAt: new Date(),
//     });

//     const [{ totalCount: idCardCount }] = await db
//         .select({ totalCount: count() })
//         .from(studentModel)
//         .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
//         .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
//         .leftJoin(academicYearModel, eq(sessionModel.academicYearId, academicYearModel.id))
//         .where(eq(academicYearModel.id, academicYearId));

//     const zip = new JSZip();

//     let processedCount = 0;

//     for (let offset = 0; offset < idCardCount; offset += BATCH_SIZE) {
//         const result = await db
//             .select({ id: studentModel.id, uid: studentModel.uid })
//             .from(studentModel)
//             .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
//             .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
//             .leftJoin(academicYearModel, eq(sessionModel.academicYearId, academicYearModel.id))
//             .where(eq(academicYearModel.id, academicYearId))
//             .limit(BATCH_SIZE)
//             .offset(offset);

//         for (const student of result) {
//             try {
//                 const response = await axios.get(
//                     `https://besc.academic360.app/id-card-generate/api/images?uid=${student.uid}&crop=true`,
//                     { responseType: "arraybuffer" }
//                 );

//                 if (response.status !== 200) {
//                     console.error(`Error fetching image for UID ${student.uid}`, response.data);
//                     continue;
//                 }

//                 // Add file to ZIP
//                 zip.file(`${student.uid}.jpg`, response.data);
//                 socketService.sendProgressUpdate(userId.toString(), {
//                     id: `download-${Date.now()}`,
//                     userId: userId.toString(),
//                     type: "export_progress",
//                     message: `Downloading image for UID ${student.uid} | ${++processedCount} / ${idCardCount}`,
//                     progress: Number(Math.floor((offset + 1) / idCardCount * 100).toFixed(2)),
//                     status: "in_progress",
//                     createdAt: new Date(),
//                     meta: {
//                         uid: student.uid,
//                     },
//                 });
//             } catch (error) {
//                 console.error(`Error fetching image for UID ${student.uid}`, error);
//             }
//         }
//     }

//     // Generate zip
//     const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

//     socketService.sendProgressUpdate(userId.toString(), {
//         id: `download-${Date.now()}`,
//         userId: userId.toString(),
//         type: "export_progress",
//         message: `Downloading images for academic year ${academicYearId}`,
//         progress: 100,
//         status: "completed",
//         createdAt: new Date(),
//     });
//     return zipBuffer; // Send from controller as ZIP file
// }

// import pLimit from "p-limit";
// import JSZip from "jszip";
// import axios from "axios";
// import pLimit from "p-limit";
// import JSZip from "jszip";
// import axios from "axios";
// import { and, count, eq, isNotNull } from "drizzle-orm";

export async function downloadStudentImages(
  academicYearId: number,
  userId: number,
) {
  const BATCH_SIZE = 500;
  const CONCURRENCY_LIMIT = BATCH_SIZE; // safe default
  const limit = pLimit(CONCURRENCY_LIMIT);
  const zip = new JSZip();

  // 1) Count only students that have a non-null cuRegistrationApplicationNumber
  const [{ totalCount: idCardCount }] = await db
    .select({ totalCount: count() })
    .from(studentModel)
    .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
    .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
    .leftJoin(
      academicYearModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    // -> use INNER JOIN to ensure only students with a matching correction request are counted
    .innerJoin(
      cuRegistrationCorrectionRequestModel,
      and(
        eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
        eq(
          cuRegistrationCorrectionRequestModel.academicYearId,
          academicYearModel.id,
        ),
        isNotNull(
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        ),
      ),
    )
    .where(eq(academicYearModel.id, academicYearId));

  if (!idCardCount || idCardCount === 0) {
    // nothing to do
    socketService.sendProgressUpdate(userId.toString(), {
      id: `download-${Date.now()}`,
      userId: userId.toString(),
      type: "export_progress",
      message: `No images found for academic year ${academicYearId}`,
      progress: 100,
      status: "completed",
      createdAt: new Date(),
    });
    return Buffer.from([]);
  }

  let processedCount = 0;
  const totalBatches = Math.ceil(idCardCount / BATCH_SIZE);

  // 2) Batch by batch — use batch index and compute offset = batch * BATCH_SIZE
  for (let batch = 0; batch < totalBatches; batch++) {
    const offset = batch * BATCH_SIZE;

    // select students + their application number in one query
    const students = await db
      .select({
        id: studentModel.id,
        uid: studentModel.uid,
        cuAppNo:
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
      })
      .from(studentModel)
      .leftJoin(promotionModel, eq(promotionModel.studentId, studentModel.id))
      .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
      .leftJoin(
        academicYearModel,
        eq(sessionModel.academicYearId, academicYearModel.id),
      )
      .innerJoin(
        cuRegistrationCorrectionRequestModel,
        and(
          eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
          eq(
            cuRegistrationCorrectionRequestModel.academicYearId,
            academicYearModel.id,
          ),
          isNotNull(
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          ),
        ),
      )
      .where(eq(academicYearModel.id, academicYearId))
      .limit(BATCH_SIZE)
      .offset(offset);

    // 3) Download concurrently with a limit
    await Promise.allSettled(
      students.map((student) =>
        limit(async () => {
          try {
            if (!student.cuAppNo) {
              // safety: skip if app no missing
              return;
            }

            const response = await axios.get(
              `https://besc.academic360.app/id-card-generate/api/images?uid=${student.uid}&crop=true`,
              { responseType: "arraybuffer", timeout: 0 },
            );

            if (response.status !== 200 || !response.data) {
              console.error(
                `Bad response for UID ${student.uid}`,
                response.status,
              );
              return;
            }

            // use application number as filename (prefix P as before)
            const fileName = `P${student.cuAppNo}.jpg`;
            zip.file(fileName, response.data);

            processedCount++;
            socketService.sendProgressUpdate(userId.toString(), {
              id: `download-${Date.now()}`,
              userId: userId.toString(),
              type: "export_progress",
              message: `Downloading image ${processedCount}/${idCardCount}`,
              progress: Math.floor((processedCount / idCardCount) * 100),
              status: "in_progress",
              createdAt: new Date(),
            });
          } catch (err) {
            console.error(`Error downloading ${student.uid}`, err);
          }
        }),
      ),
    );
  }

  // 4) Generate zip buffer and return
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  //   socketService.sendProgressUpdate(userId.toString(), {
  //     id: `download-${Date.now()}`,
  //     userId: userId.toString(),
  //     type: "export_progress",
  //     message: `Downloading images for academic year ${academicYearId}`,
  //     progress: 100,
  //     status: "completed",
  //     createdAt: new Date(),
  //   });

  return zipBuffer;
}
