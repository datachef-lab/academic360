import bcrypt from "bcryptjs";
import { eq, count, desc, or, ilike, and, isNull, is, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import crypto from "crypto";

import { User, userModel } from "@repo/db/schemas/models/user";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
// import { findStudentByUserId } from "./student.service.js";
import { findAll } from "@/utils/helper.js";
import { userTypeEnum } from "@repo/db/schemas/enums";
import { number } from "zod";
import { UserType } from "@/types/user/user.js";

import {
  ProfileInfo,
  StaffDto,
  StudentDto,
  UserDto,
  PersonalDetailsDto,
  HealthDto,
  AccommodationDto,
  AddressDto,
  PersonDto,
} from "@repo/db/index.js";
import {
  AdmissionCourseDetailsDto,
  AdmissionGeneralInfoDto,
  ApplicationFormDto,
  StudentAcademicSubjectsDto,
} from "@repo/db/dtos/admissions";
import {
  admissionGeneralInfoModel,
  admissionAcademicInfoModel,
  admissionAdditionalInfoModel,
  admissionCourseDetailsModel,
  applicationFormModel,
  accommodationModel,
  emergencyContactModel,
  healthModel,
  personalDetailsModel,
  nationalityModel,
  religionModel,
  categoryModel,
  languageMediumModel,
  addressModel,
  countryModel,
  stateModel,
  cityModel,
  bloodGroupModel,
  boardModel,
  ApplicationForm,
  PersonalDetails,
  Health,
  Accommodation,
  Address,
  AdmissionGeneralInfo,
  AdmissionAcademicInfo,
  AdmissionAdditionalInfo,
  AdmissionCourseDetails,
  studentAcademicSubjectModel,
  StudentAcademicSubjects,
  boardSubjectModel,
  subjectModel,
} from "@repo/db/schemas";
import {
  personModel,
  familyModel,
  transportDetailsModel,
} from "@repo/db/schemas/models/user";
import {
  qualificationModel,
  occupationModel,
  districtModel,
  pickupPointModel,
  transportModel,
} from "@repo/db/schemas/models/resources";
import { annualIncomeModel } from "@repo/db/schemas/models/resources";
import { userModel as coreUserModel } from "@repo/db/schemas/models/user";
import * as studentService from "./student.service.js";
import * as staffService from "./staff.service.js";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions/board-subject-name.model.js";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications";
import { verifyOtp } from "@/features/auth/services/otp.service.js";

// Password reset interfaces and storage
export interface PasswordResetData {
  token: string;
  email: string;
  expiresAt: Date;
}

// In-memory store for password reset tokens (in production, use Redis or database)
const passwordResetTokens = new Map<string, PasswordResetData>();

export async function addUser(user: User) {
  // Hash the password before storing it in the database
  let hashedPassword = await bcrypt.hash(user.password, 10);

  user.password = hashedPassword;

  // Create a new user
  const [newUser] = await db.insert(userModel).values(user).returning();

  const formattedUser = await modelToDto(newUser);

  return formattedUser;
}

// Fetch Family DTO by userId
export async function findFamilyByUserId(userId: number) {
  const [family] = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.userId, userId));
  if (!family) return null;
  return await mapFamilyToDto(family);
}

export async function findAllUsers(
  page: number = 1,
  pageSize: number = 10,
  isAdminCheck: boolean = false,
  type?: (typeof userTypeEnum.enumValues)[number],
): Promise<PaginatedResponse<UserType>> {
  // Use proper Drizzle eq condition
  const whereCondition = [];

  if (type) {
    whereCondition.push(eq(userModel.type, type));
  }

  if (isAdminCheck) {
    whereCondition.push(eq(userModel.type, "ADMIN"));
  }

  const usersResponse = await db
    .select()
    .from(userModel)
    .where(and(...whereCondition))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Await Promise.all to resolve async operations
  const content = (await Promise.all(
    usersResponse.map(async (user) => {
      return await modelToDto(user);
    }),
  )) as UserType[];

  // Count should use the same where condition
  // const countQuery = whereCondition
  //     ? db.select({ count: count() }).from(userModel).where(...whereCondition)
  //     : db.select({ count: count() }).from(userModel);
  // const [{ count: countRows }] = await countQuery;

  return {
    content,
    page,
    pageSize,
    totalElements: 0,
    totalPages: Math.ceil(Number(0) / pageSize),
  };
}

export async function findById(id: number) {
  const [foundUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, id));

  const formattedUser = await modelToDto(foundUser);

  return formattedUser;
}

export async function getUserStats() {
  const [adminCount] = await db
    .select({ count: count() })
    .from(userModel)
    .where(and(eq(userModel.type, "ADMIN"), eq(userModel.isActive, true)));

  const [staffCount] = await db
    .select({ count: count() })
    .from(userModel)
    .where(and(eq(userModel.type, "STAFF"), eq(userModel.isActive, true)));

  const [studentCount] = await db
    .select({ count: count() })
    .from(userModel)
    .where(and(eq(userModel.type, "STUDENT"), eq(userModel.isActive, true)));

  const [totalUsers] = await db
    .select({ count: count() })
    .from(userModel)
    .where(eq(userModel.isActive, true));

  return {
    adminCount: adminCount.count,
    staffCount: staffCount.count,
    studentCount: studentCount.count,
    totalUsers: totalUsers.count,
  };
}

export async function findByEmail(email: string) {
  const [foundUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.email, email));

  const formattedUser = await modelToDto(foundUser);

  return formattedUser;
}

export async function saveUser(id: number, user: User) {
  const [foundUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, id));
  if (!foundUser) {
    return null;
  }
  const updatePayload: Partial<typeof userModel.$inferInsert> = {
    name: user.name,
    image: user.image,
    phone: user.phone,
    whatsappNumber: user.whatsappNumber,
  };
  // Allow status fields to be updated when provided
  if (typeof (user as any).isActive === "boolean") {
    (updatePayload as any).isActive = (user as any).isActive;
  }
  if (typeof (user as any).isSuspended === "boolean") {
    (updatePayload as any).isSuspended = (user as any).isSuspended;
  }
  if ((user as any).suspendedReason !== undefined) {
    (updatePayload as any).suspendedReason =
      (user as any).suspendedReason ?? null;
  }
  if ((user as any).suspendedTillDate !== undefined) {
    // If it's already a formatted string (YYYY-MM-DD HH:mm:ss), use it directly
    // Otherwise, parse it as a date
    const suspendedTillValue = (user as any).suspendedTillDate;
    if (suspendedTillValue === null || suspendedTillValue === undefined) {
      (updatePayload as any).suspendedTillDate = null;
    } else if (
      typeof suspendedTillValue === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(suspendedTillValue)
    ) {
      // Already in PostgreSQL timestamp format (YYYY-MM-DD HH:mm:ss), treat as IST
      // Parse the IST string and create a Date object using UTC methods
      // Since PostgreSQL timestamp (without timezone) stores values as-is,
      // we create a Date object where the UTC time components match the IST time
      // This way, when Drizzle stores it, the time values (hours, minutes, seconds) are preserved
      const [datePart, timePart] = suspendedTillValue.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, seconds = 0] = timePart.split(":").map(Number);
      // Create Date object using UTC methods with the IST time values
      // This ensures the time components (22:46:00) are stored as-is in PostgreSQL
      (updatePayload as any).suspendedTillDate = new Date(
        Date.UTC(year, month - 1, day, hours, minutes, seconds),
      );
    } else {
      // Parse as date and format for PostgreSQL in IST
      const date = new Date(suspendedTillValue);
      if (!isNaN(date.getTime())) {
        // Format as YYYY-MM-DD HH:mm:ss in IST, then convert to Date object
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
        (updatePayload as any).suspendedTillDate = new Date(
          Date.UTC(y, m - 1, d, h, min, sec),
        );
      } else {
        (updatePayload as any).suspendedTillDate = null;
      }
    }
  }

  const [updatedUser] = await db
    .update(userModel)
    .set(updatePayload)
    .where(eq(userModel.id, foundUser.id))
    .returning();

  const formattedUser = await modelToDto(updatedUser);

  return formattedUser;
}

export async function toggleUser(id: number) {
  const [foundUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, id));
  if (!foundUser) {
    return null;
  }

  const [updatedUser] = await db
    .update(userModel)
    .set({
      isActive: !foundUser.isActive,
    })
    .where(eq(userModel.id, foundUser.id))
    .returning();

  const formattedUser = await modelToDto(updatedUser);

  return formattedUser;
}

export async function searchUser(
  searchText: string,
  page: number = 1,
  pageSize: number = 10,
) {
  // Trim spaces and convert searchText to lowercase
  searchText = searchText.trim().toLowerCase();

  // Query students based on student name, roll number, registration number, etc.
  const userQuery = db
    .select()
    .from(userModel)
    .where(
      or(
        ilike(userModel.name, `%${searchText}%`),
        ilike(userModel.email, `%${searchText}%`),
        ilike(userModel.phone, `%${searchText}%`),
        ilike(userModel.whatsappNumber, `%${searchText}%`),
      ),
    );

  // Get the paginated students
  const users = await userQuery.limit(pageSize).offset((page - 1) * pageSize);

  // Get the total count of students matching the filter
  const [{ count: countRows }] = await db
    .select({ count: count() })
    .from(userModel)
    .where(
      or(
        ilike(userModel.name, `%${searchText}%`),
        ilike(userModel.email, `%${searchText}%`),
        ilike(userModel.phone, `%${searchText}%`),
        ilike(userModel.whatsappNumber, `%${searchText}%`),
      ),
    );

  // Map the result to a properly formatted response
  const content = await Promise.all(
    users.map(async (userRecord) => {
      return await modelToDto(userRecord);
    }),
  );

  return {
    content,
    page,
    pageSize,
    totalElements: Number(countRows), // Now this count is correct!
    totalPages: Math.ceil(Number(countRows) / pageSize),
  };
}

export async function modelToDto(givenUser: User): Promise<UserDto | null> {
  if (!givenUser) return null;

  let payload: StudentDto | StaffDto | null = null;

  if (givenUser.type == "STUDENT") {
    payload = (await studentService.findByUserId(givenUser.id as number))!;
  } else {
    payload = (await staffService.findByUserId(givenUser.id as number))!;
  }

  return { ...givenUser, payload };
}

export async function findProfileInfo(
  userId: number,
): Promise<ProfileInfo | null> {
  // Determine user type first
  const [coreUser] = await db
    .select()
    .from(coreUserModel)
    .where(eq(coreUserModel.id, userId));
  if (!coreUser) return null;

  const isStudent = coreUser.type === "STUDENT";

  // Get student by userId to derive application form (only for student)
  const student = isStudent ? await studentService.findByUserId(userId) : null;

  // Application form
  const applicationFormId = student?.applicationFormAbstract?.id ?? null;
  const applicationForm = applicationFormId
    ? (
        await db
          .select()
          .from(applicationFormModel)
          .where(eq(applicationFormModel.id, applicationFormId))
      )[0]
    : null;

  // General info to resolve linked entities
  const generalInfo = applicationForm?.id
    ? (
        await db
          .select()
          .from(admissionGeneralInfoModel)
          .where(
            eq(admissionGeneralInfoModel.applicationFormId, applicationForm.id),
          )
      )[0]
    : null;

  // Resolve linked entities for profile composition by userId
  const [
    personalDetailsRaw,
    healthRaw,
    emergencyContactDetails,
    accommodationRaw,
    transportRaw,
  ] = await Promise.all([
    db
      .select()
      .from(personalDetailsModel)
      .where(eq(personalDetailsModel.userId, userId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(healthModel)
      .where(eq(healthModel.userId, userId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(emergencyContactModel)
      .where(eq(emergencyContactModel.userId, userId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(accommodationModel)
      .where(eq(accommodationModel.userId, userId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(transportDetailsModel)
      .where(eq(transportDetailsModel.userId, userId))
      .then((r) => r[0] ?? null),
  ]);

  const personalDetailsDto: PersonalDetailsDto | null = personalDetailsRaw
    ? await mapPersonalDetailsToDtoWithAddresses(personalDetailsRaw, student)
    : null;
  const healthDto: HealthDto | null = healthRaw
    ? await mapHealthToDto(healthRaw)
    : null;
  const accommodationDto: AccommodationDto | null = accommodationRaw
    ? await mapAccommodationToDto(accommodationRaw)
    : null;
  const transportDetailsDto = transportRaw
    ? await mapTransportDetailsToDto(transportRaw)
    : null;

  //   const [
  //     personalDetails,
  //     healthDetails,
  //     emergencyContactDetails,
  //     accommodationDetails,
  //   ] = await Promise.all([
  //     generalInfo?.personalDetailsId
  //       ? (
  //           await db
  //             .select()
  //             .from(personalDetailsModel)
  //             .where(eq(personalDetailsModel.id, generalInfo.personalDetailsId))
  //         )[0]
  //       : null,
  //     generalInfo?.healthId
  //       ? (
  //           await db
  //             .select()
  //             .from(healthModel)
  //             .where(eq(healthModel.id, generalInfo.healthId))
  //         )[0]
  //       : null,
  //     generalInfo?.emergencyContactId
  //       ? (
  //           await db
  //             .select()
  //             .from(emergencyContactModel)
  //             .where(eq(emergencyContactModel.id, generalInfo.emergencyContactId))
  //         )[0]
  //       : null,
  //     generalInfo?.accommodationId
  //       ? (
  //           await db
  //             .select()
  //             .from(accommodationModel)
  //             .where(eq(accommodationModel.id, generalInfo.accommodationId))
  //         )[0]
  //       : null,
  //   ]);

  // Academic/Additional/Course Applications
  //   const academicInfo = applicationForm?.id
  //     ? ((
  //         await db
  //           .select()
  //           .from(admissionAcademicInfoModel)
  //           .where(
  //             eq(
  //               admissionAcademicInfoModel.applicationFormId,
  //               applicationForm.id,
  //             ),
  //           )
  //       )[0] ?? null)
  //     : null;

  //   const additionalInfo = applicationForm?.id
  //     ? ((
  //         await db
  //           .select()
  //           .from(admissionAdditionalInfoModel)
  //           .where(
  //             eq(
  //               admissionAdditionalInfoModel.applicationFormId,
  //               applicationForm.id,
  //             ),
  //           )
  //       )[0] ?? null)
  //     : null;

  // Family details (via Additional Info or by userId)
  let family = null as typeof familyModel.$inferSelect | null;

  const courseApplications = applicationForm?.id
    ? await db
        .select()
        .from(admissionCourseDetailsModel)
        .where(
          eq(admissionCourseDetailsModel.applicationFormId, applicationForm.id),
        )
    : [];

  // Optionally fetch academic/additional info for application form dto
  const [academicInfo, additionalInfo] = applicationForm?.id
    ? await Promise.all([
        db
          .select()
          .from(admissionAcademicInfoModel)
          .where(
            eq(
              admissionAcademicInfoModel.applicationFormId,
              applicationForm.id,
            ),
          )
          .then((r) => r[0] ?? null),
        db
          .select()
          .from(admissionAdditionalInfoModel)
          .where(
            eq(
              admissionAdditionalInfoModel.applicationFormId,
              applicationForm.id,
            ),
          )
          .then((r) => r[0] ?? null),
      ])
    : [null, null];

  // Fetch student reference academic info (where applicationFormId is null and studentId is set)
  const studentAcademicInfo = isStudent
    ? await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(and(eq(admissionAcademicInfoModel.studentId, student?.id!)))
        .then((r) => r[0] ?? null)
    : null;

  const applicationFormDto: ApplicationFormDto | null | undefined =
    isStudent && applicationForm
      ? await mapApplicationFormToDto(applicationForm, {
          generalInfo,
          personalDetails: personalDetailsDto,
          health: healthDto,
          emergencyContact: emergencyContactDetails,
          accommodation: accommodationDto,
          academicInfo,
          additionalInfo,
          courseApplications,
        })
      : undefined;

  // Resolve family after additionalInfo is available

  let studentFamily =
    (
      await db
        .select()
        .from(familyModel)
        .where(eq(familyModel.userId, student?.userId!))
    )[0] ?? null;

  // Map course applications to DTOs (only for students)
  const admissionCourseDetailsDto: AdmissionCourseDetailsDto | null =
    isStudent && student?.admissionCourseDetailsId
      ? await db
          .select()
          .from(admissionCourseDetailsModel)
          .where(
            eq(
              admissionCourseDetailsModel.id,
              student.admissionCourseDetailsId,
            ),
          )
          .then((r) => (r[0] ? mapCourseDetailsToDto(r[0]) : null))
      : null;

  if (!personalDetailsDto) return null;

  console.log("[EWS DEBUG] personalDetailsDto:", personalDetailsDto);

  console.log(
    "[EWS DEBUG] Student belongsToEWS value:",
    student?.belongsToEWS,
    typeof student?.belongsToEWS,
  );
  personalDetailsDto!.ewsStatus = student?.belongsToEWS === true ? "Yes" : "No";
  personalDetailsDto!.isEWS = student?.belongsToEWS === true;
  console.log("[EWS DEBUG] Set EWS fields:", {
    ewsStatus: personalDetailsDto!.ewsStatus,
    isEWS: personalDetailsDto!.isEWS,
  });

  const result = {
    applicationFormDto,
    admissionCourseDetailsDto,
    // academicInfo can be null when the student hasn't provided information yet
    academicInfo: studentAcademicInfo
      ? await mapAcademicInfoToDto(studentAcademicInfo)
      : null,
    familyDetails: family ? await mapFamilyToDto(family) : null,
    studentFamily: studentFamily ? await mapFamilyToDto(studentFamily) : null,
    personalDetails: personalDetailsDto,
    healthDetails: healthDto,
    emergencyContactDetails: emergencyContactDetails ?? null,
    transportDetails: transportDetailsDto,
    accommodationDetails: accommodationDto,
  };

  return result as unknown as ProfileInfo;
}

// DTO mappers (keep simple, enrich later when relations needed)
async function mapApplicationFormToDto(
  app: ApplicationForm,
  rel: {
    generalInfo: AdmissionGeneralInfo | null;
    personalDetails: PersonalDetailsDto | null;
    health: HealthDto | null;
    emergencyContact: any; // EmergencyContactT present in schemas
    accommodation: AccommodationDto | null;
    academicInfo: AdmissionAcademicInfo | null;
    additionalInfo: AdmissionAdditionalInfo | null;
    courseApplications: AdmissionCourseDetails[];
  },
): Promise<ApplicationFormDto> {
  const [blockedBy, admApprovedBy] = await Promise.all([
    app.blockedBy
      ? db
          .select()
          .from(coreUserModel)
          .where(eq(coreUserModel.id, app.blockedBy))
          .then((r) => r[0] ?? null)
      : null,
    app.admApprovedBy
      ? db
          .select()
          .from(coreUserModel)
          .where(eq(coreUserModel.id, app.admApprovedBy))
          .then((r) => r[0] ?? null)
      : null,
  ]);

  return {
    ...app,
    blockedBy,
    admApprovedBy,
    generalInfo: rel.generalInfo
      ? await mapGeneralInfoToDto(rel.generalInfo, rel)
      : null,
    courseApplication:
      rel.courseApplications && rel.courseApplications.length
        ? await Promise.all(rel.courseApplications.map(mapCourseDetailsToDto))
        : [],
    academicInfo: rel.academicInfo
      ? await mapAcademicInfoToDto(rel.academicInfo)
      : null,
    additionalInfo: rel.additionalInfo
      ? await mapAdditionalInfoToDto(rel.additionalInfo)
      : null,
    paymentInfo: null,
  };
}

async function mapGeneralInfoToDto(
  g: AdmissionGeneralInfo,
  rel: {
    personalDetails: PersonalDetailsDto | null;
    health: HealthDto | null;
    emergencyContact: any;
    accommodation: AccommodationDto | null;
  },
): Promise<AdmissionGeneralInfoDto> {
  return {
    ...g,
    eligibilityCriteria: undefined,
    studentCategory: undefined,
    personalDetails: rel.personalDetails,
    spqtaApprovedBy: undefined,
    health: rel.health,
    accommodation: rel.accommodation,
    emergencyContact: rel.emergencyContact ?? undefined,
    bankBranch: undefined,
    transportDetails: undefined,
  } as any;
}

async function mapAcademicInfoToDto(
  a: AdmissionAcademicInfo,
): Promise<import("@repo/db/dtos/admissions").AdmissionAcademicInfoDto> {
  const [board, lastSchoolAddress] = await Promise.all([
    a.boardId
      ? db
          .select()
          .from(boardModel)
          .where(eq(boardModel.id, a.boardId))
          .then((r) => r[0] ?? null)
      : null,
    a.lastSchoolAddress ? fetchAddressDto(a.lastSchoolAddress) : null,
  ]);

  const foundSubjects = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(eq(studentAcademicSubjectModel.admissionAcademicInfoId, a.id!));

  const subjects: StudentAcademicSubjectsDto[] = [];
  for (const subject of foundSubjects) {
    subjects.push(await mapStudentAcademicSubjectToDto(subject));
  }
  return {
    ...a,
    applicationForm: null,
    board: board ?? undefined,
    lastSchoolAddress: lastSchoolAddress ?? undefined,
    subjects: subjects,
  } as any;
}

async function mapStudentAcademicSubjectToDto(
  s: StudentAcademicSubjects,
): Promise<StudentAcademicSubjectsDto> {
  const { boardSubjectId, ...rest } = s;

  const [boardSubject] = await db
    .select()
    .from(boardSubjectModel)
    .where(eq(boardSubjectModel.id, boardSubjectId));

  const [boardSubjectName, board] = await Promise.all([
    db
      .select()
      .from(boardSubjectNameModel)
      .where(eq(boardSubjectNameModel.id, boardSubject.boardSubjectNameId))
      .then((r) => r[0]),
    boardSubject.boardId
      ? db
          .select()
          .from(boardModel)
          .where(eq(boardModel.id, boardSubject.boardId))
          .then((r) => r[0])
      : null,
  ]);

  // Resolve nested degree and address for board if present
  // Resolve degree via degreeId; address is not directly on Board in schema, so keep null
  const [boardDegree] = await Promise.all([
    board?.degreeId
      ? db
          .select()
          .from(boardModel)
          .where(eq(boardModel.id, board.id))
          .then(() => null)
      : null,
  ]);
  const boardAddress = null;

  return {
    ...s,
    boardSubject: {
      ...boardSubject,
      boardSubjectName,
      board: board
        ? {
            ...board,
            degree: null,
            address: null,
          }
        : {
            id: 0,
            legacyBoardId: null,
            name: "",
            degree: null,
            passingMarks: null,
            code: null,
            address: null,
            sequence: null,
            isActive: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
    },
  };
}

async function mapAdditionalInfoToDto(
  ad: AdmissionAdditionalInfo,
): Promise<import("@repo/db/dtos/admissions").AdmissionAdditionalInfoDto> {
  return {
    ...ad,
    annualIncome: undefined,
    familyDetails: undefined,
  } as any;
}

async function mapCourseDetailsToDto(
  cd: AdmissionCourseDetails,
): Promise<import("@repo/db/dtos/admissions").AdmissionCourseDetailsDto> {
  return {
    ...cd,
    stream: undefined,
    programCourse: undefined,
    class: undefined,
    shift: undefined,
    eligibilityCriteria: undefined,
    studentCategory: undefined,
  } as any;
}

async function mapPersonalDetailsToDto(
  p: PersonalDetails,
): Promise<PersonalDetailsDto> {
  const [
    nationality,
    religion,
    category,
    motherTongue,
    mailingAddress,
    residentialAddress,
  ] = await Promise.all([
    p.nationalityId
      ? db
          .select()
          .from(nationalityModel)
          .where(eq(nationalityModel.id, p.nationalityId))
          .then((r) => r[0] ?? null)
      : null,
    p.religionId
      ? db
          .select()
          .from(religionModel)
          .where(eq(religionModel.id, p.religionId))
          .then((r) => r[0] ?? null)
      : null,
    p.categoryId
      ? db
          .select()
          .from(categoryModel)
          .where(eq(categoryModel.id, p.categoryId))
          .then((r) => r[0] ?? null)
      : null,
    p.motherTongueId
      ? db
          .select()
          .from(languageMediumModel)
          .where(eq(languageMediumModel.id, p.motherTongueId))
          .then((r) => r[0] ?? null)
      : null,
    (p as any).mailingAddressId
      ? fetchAddressDto((p as any).mailingAddressId)
      : null,
    (p as any).residentialAddressId
      ? fetchAddressDto((p as any).residentialAddressId)
      : null,
  ]);

  const address: AddressDto[] = [];
  if (mailingAddress) address.push(mailingAddress);
  if (residentialAddress) address.push(residentialAddress);
  return {
    ...p,
    nationality: nationality ?? undefined,
    religion: religion ?? undefined,
    category: category ?? undefined,
    motherTongue: motherTongue ?? undefined,
    address,
    disabilityCode: undefined,
  } as any;
}

// Same as mapPersonalDetailsToDto, but also loads addresses linked by personalDetailsId
async function mapPersonalDetailsToDtoWithAddresses(
  p: PersonalDetails,
  student?: any,
): Promise<PersonalDetailsDto> {
  const base = await mapPersonalDetailsToDto(p);
  const addresses = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.personalDetailsId, p.id!));
  const addressDtos: AddressDto[] = [];
  for (const a of addresses) {
    const dto = await fetchAddressDto(a.id!);
    if (dto) addressDtos.push(dto);
  }
  // Order addresses: [RESIDENTIAL, MAILING, ...others]
  const orderWeight = (a: any) =>
    a?.type === "RESIDENTIAL" ? 0 : a?.type === "MAILING" ? 1 : 2;
  const sorted = addresses
    .map((a, idx) => ({ a, dto: addressDtos[idx] }))
    .sort((x, y) => orderWeight(x.a) - orderWeight(y.a))
    .map((x) => x.dto!)
    .filter(Boolean);

  // Fetch user details if userId exists
  let userDetails = null;
  if (p.userId) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, p.userId));
    if (user) {
      userDetails = user;
    }
  }

  const result = { ...base, address: sorted, userDetails } as any;

  // Add EWS information from student table if available
  if (student) {
    console.log(
      "[EWS DEBUG] Profile service - Student belongsToEWS:",
      student.belongsToEWS,
      typeof student.belongsToEWS,
    );
    result.ewsStatus = student.belongsToEWS === true ? "Yes" : "No";
    result.isEWS = student.belongsToEWS === true;
    console.log("[EWS DEBUG] Profile service - Set EWS fields:", {
      ewsStatus: result.ewsStatus,
      isEWS: result.isEWS,
    });
  }

  return result;
}

async function mapHealthToDto(h: Health): Promise<HealthDto> {
  const blood = h.bloodGroupId
    ? await db
        .select()
        .from(bloodGroupModel)
        .where(eq(bloodGroupModel.id, h.bloodGroupId))
        .then((r) => r[0] ?? null)
    : null;
  return {
    ...h,
    bloodGroup: blood ?? undefined,
  };
}

async function mapAccommodationToDto(
  a: Accommodation,
): Promise<AccommodationDto> {
  const address = (a as any).addressId
    ? await fetchAddressDto((a as any).addressId)
    : undefined;
  return {
    ...a,
    address,
  };
}

async function mapTransportDetailsToDto(
  t: typeof transportDetailsModel.$inferSelect,
) {
  const [transportInfo, pickupPoint] = await Promise.all([
    t.transportId
      ? db
          .select()
          .from(transportModel)
          .where(eq(transportModel.id, t.transportId))
          .then((r) => r[0] ?? null)
      : null,
    t.pickupPointId
      ? db
          .select()
          .from(pickupPointModel)
          .where(eq(pickupPointModel.id, t.pickupPointId))
          .then((r) => r[0] ?? null)
      : null,
  ]);
  return {
    ...t,
    transportInfo,
    pickupPoint,
  } as any;
}

// Person and Family mappers
async function mapPersonToDto(
  personId: number | null | undefined,
): Promise<PersonDto | null> {
  if (!personId) return null;
  const [p] = await db
    .select()
    .from(personModel)
    .where(eq(personModel.id, personId));
  if (!p) return null;

  const [qualification, occupation, officeAddress] = await Promise.all([
    p.qualificationId
      ? db
          .select()
          .from(qualificationModel)
          .where(eq(qualificationModel.id, p.qualificationId))
          .then((r) => r[0] ?? null)
      : null,
    p.occupationId
      ? db
          .select()
          .from(occupationModel)
          .where(eq(occupationModel.id, p.occupationId))
          .then((r) => r[0] ?? null)
      : null,
    (p as any).officeAddressId
      ? fetchAddressDto((p as any).officeAddressId)
      : null,
  ]);

  return {
    ...p,
    qualification: qualification ?? undefined,
    occupation: occupation ?? undefined,
    officeAddress: officeAddress ?? undefined,
  } as PersonDto;
}

async function mapFamilyToDto(
  f: typeof familyModel.$inferSelect,
): Promise<ProfileInfo["familyDetails"]> {
  // FamilyDetailDto expects father/mother/guardian; persons link by person.familyId + person.type
  const [persons, annualIncome] = await Promise.all([
    db.select().from(personModel).where(eq(personModel.familyId, f.id!)),
    f.annualIncomeId
      ? db
          .select()
          .from(annualIncomeModel)
          .where(eq(annualIncomeModel.id, f.annualIncomeId))
          .then((r) => r[0] ?? null)
      : null,
  ]);

  const members: PersonDto[] = [];
  for (const p of persons) {
    const dto = await mapPersonToDto(p.id);
    if (dto) members.push(dto);
  }

  return {
    ...f,
    members,
    annualIncome: annualIncome ?? undefined,
  } as any;
}

async function fetchAddressDto(
  addressId: number,
): Promise<AddressDto | undefined> {
  const [addr] = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.id, addressId));
  if (!addr) return undefined;
  const [country, state, city] = await Promise.all([
    addr.countryId
      ? db
          .select()
          .from(countryModel)
          .where(eq(countryModel.id, addr.countryId))
          .then((r) => r[0] ?? null)
      : null,
    addr.stateId
      ? db
          .select()
          .from(stateModel)
          .where(eq(stateModel.id, addr.stateId))
          .then((r) => r[0] ?? null)
      : null,
    addr.cityId
      ? db
          .select()
          .from(cityModel)
          .where(eq(cityModel.id, addr.cityId))
          .then((r) => r[0] ?? null)
      : null,
  ]);
  const district = addr.districtId
    ? await db
        .select()
        .from(districtModel)
        .where(eq(districtModel.id, addr.districtId))
        .then((r) => r[0] ?? null)
    : null;
  const { countryId, stateId, cityId, ...rest } = addr;
  const shaped = {
    ...rest,
    country: country ?? null,
    state: state ?? null,
    city: city ?? null,
    district: district ?? null,
    previousCountry: null,
    previousState: null,
    previousCity: null,
    previousDistrict: null,
    postoffice: null,
    policeStation: null,
  } as AddressDto;
  return shaped;
}

// Password Reset Functions

/**
 * Request password reset - generates token and sends email
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[PASSWORD RESET] Requesting password reset for:", email);

    // Check if user exists
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email));

    if (!user) {
      console.log("[PASSWORD RESET] User not found:", email);
      return {
        success: false,
        message: "User not found with this email address",
      };
    }

    // Check if user is active
    if (!user.isActive || user.isSuspended) {
      console.log("[PASSWORD RESET] User account is disabled:", email);
      return {
        success: false,
        message: "Account is disabled. Please contact support.",
      };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in memory
    passwordResetTokens.set(token, {
      token,
      email,
      expiresAt,
    });

    console.log("[PASSWORD RESET] Token generated for:", email);

    // Send password reset email via notification system
    try {
      const backendBase =
        process.env.FRONTEND_MAIN_CONSOLE_BASE || "http://localhost:5173";
      const resetLink = `${backendBase}/reset-password?token=${token}`;

      // Resolve userId for notification association
      const [foundUser] = await db
        .select({ id: userModel.id, name: userModel.name })
        .from(userModel)
        .where(eq(userModel.email, email));

      const { enqueueNotification } = await import(
        "@/services/notificationClient.js"
      );

      await enqueueNotification({
        userId: foundUser?.id || 0,
        variant: "EMAIL",
        type: "OTP",
        // Use OTP master; template selects reset-password content
        notificationMasterId: undefined,
        message: `Password reset link issued for ${email}`,
        notificationEvent: {
          subject:
            "Reset your password - The Bhawanipur Education Society College",
          emailTemplate: "reset-password",
          templateData: {
            // Respect notification master fields convention: Name, Code
            Name: foundUser?.name || email,
            Code: token,
            // Also pass explicit keys used by template as fallbacks
            greetingName: foundUser?.name || email,
            resetLink,
            token,
          },
        } as any,
      } as any);
    } catch (notifyErr) {
      console.error(
        "[PASSWORD RESET] Failed to enqueue reset email:",
        notifyErr,
      );
      // Do not fail the request solely due to notification issues
    }

    console.log("[PASSWORD RESET] Email sent successfully to:", email);

    return {
      success: true,
      message: "Password reset instructions have been sent to your email",
    };
  } catch (error) {
    console.error("[PASSWORD RESET] Error requesting password reset:", error);
    return {
      success: false,
      message: "An error occurred while processing your request",
    };
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[PASSWORD RESET] Attempting to reset password with token");

    // Validate token
    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      console.log("[PASSWORD RESET] Invalid token");
      return {
        success: false,
        message: "Invalid or expired reset token",
      };
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      console.log("[PASSWORD RESET] Token expired");
      passwordResetTokens.delete(token);
      return {
        success: false,
        message: "Reset token has expired. Please request a new one",
      };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const [updatedUser] = await db
      .update(userModel)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(userModel.email, tokenData.email))
      .returning();

    if (!updatedUser) {
      console.log(
        "[PASSWORD RESET] Failed to update password for:",
        tokenData.email,
      );
      return {
        success: false,
        message: "Failed to update password. Please try again",
      };
    }

    // Remove used token
    passwordResetTokens.delete(token);

    console.log(
      "[PASSWORD RESET] Password updated successfully for:",
      tokenData.email,
    );

    try {
      // Send password change confirmation email (no sensitive data)
      const { enqueueNotification } = await import(
        "@/services/notificationClient.js"
      );
      const [userRow] = await db
        .select({ id: userModel.id, name: userModel.name })
        .from(userModel)
        .where(eq(userModel.email, tokenData.email));
      // Resolve notification master by template key
      const [emailMaster] = await db
        .select()
        .from(notificationMasterModel)
        .where(
          and(
            eq(notificationMasterModel.template, "password-confirmation"),
            eq(notificationMasterModel.variant, "EMAIL" as any),
          ),
        );
      await enqueueNotification({
        userId: userRow?.id || 0,
        variant: "EMAIL",
        type: "INFO",
        message: `Password changed for ${tokenData.email}`,
        notificationMasterId: emailMaster?.id,
        notificationEvent: {
          emailTemplate: "password-confirmation",
          subject:
            "Your password was changed - The Bhawanipur Education Society College",
          templateData: {
            Name: userRow?.name || tokenData.email,
          },
        } as any,
      } as any);
    } catch (e) {
      console.error(
        "[PASSWORD RESET] Failed to enqueue password confirmation:",
        e,
      );
    }

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("[PASSWORD RESET] Error resetting password:", error);
    return {
      success: false,
      message: "An error occurred while resetting your password",
    };
  }
}

/**
 * Validate reset token
 */
export async function validateResetToken(
  token: string,
): Promise<{ success: boolean; message: string; email?: string }> {
  try {
    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      return {
        success: false,
        message: "Invalid reset token",
      };
    }

    if (new Date() > tokenData.expiresAt) {
      passwordResetTokens.delete(token);
      return {
        success: false,
        message: "Reset token has expired",
      };
    }

    return {
      success: true,
      message: "Token is valid",
      email: tokenData.email,
    };
  } catch (error) {
    console.error("[PASSWORD RESET] Error validating token:", error);
    return {
      success: false,
      message: "An error occurred while validating the token",
    };
  }
}

/**
 * Clean up expired tokens (call this periodically)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of passwordResetTokens.entries()) {
    if (now > data.expiresAt) {
      passwordResetTokens.delete(token);
    }
  }
}

/**
 * Reset password using email + OTP (no link)
 */
export async function resetPasswordWithEmailOtp(
  email: string,
  otp: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify OTP for email channel
    const verify = await verifyOtp(email, otp, "FOR_EMAIL");
    if (!verify.success) {
      return {
        success: false,
        message: verify.message || "Invalid or expired OTP",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [updatedUser] = await db
      .update(userModel)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(userModel.email, email))
      .returning();

    if (!updatedUser) {
      return {
        success: false,
        message: "Failed to update password. Please try again",
      };
    }

    try {
      const { enqueueNotification } = await import(
        "@/services/notificationClient.js"
      );
      const [userRow] = await db
        .select({ id: userModel.id, name: userModel.name })
        .from(userModel)
        .where(eq(userModel.email, email));
      const [emailMaster] = await db
        .select()
        .from(notificationMasterModel)
        .where(
          and(
            eq(notificationMasterModel.template, "password-confirmation"),
            eq(notificationMasterModel.variant, "EMAIL" as any),
          ),
        );
      await enqueueNotification({
        userId: userRow?.id || 0,
        variant: "EMAIL",
        type: "INFO",
        message: `Password changed for ${email}`,
        notificationMasterId: emailMaster?.id,
        notificationEvent: {
          emailTemplate: "password-confirmation",
          subject:
            "Your password was changed - The Bhawanipur Education Society College",
          templateData: { Name: userRow?.name || email },
        } as any,
      } as any);
    } catch (e) {
      console.error(
        "[PASSWORD RESET] Failed to enqueue password confirmation:",
        e,
      );
    }

    return { success: true, message: "Password has been reset successfully" };
  } catch (e) {
    console.error("[PASSWORD RESET] resetPasswordWithEmailOtp error:", e);
    return {
      success: false,
      message: "An error occurred while resetting password",
    };
  }
}
