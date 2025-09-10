import bcrypt from "bcryptjs";
import { eq, count, desc, or, ilike, and } from "drizzle-orm";
import { db } from "@/db/index.js";

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
import { personModel, familyModel } from "@repo/db/schemas/models/user";
import {
  qualificationModel,
  occupationModel,
} from "@repo/db/schemas/models/resources";
import { annualIncomeModel } from "@repo/db/schemas/models/resources";
import { userModel as coreUserModel } from "@repo/db/schemas/models/user";
import * as studentService from "./student.service.js";
import * as staffService from "./staff.service.js";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions/board-subject-name.model.js";

export async function addUser(user: User) {
  // Hash the password before storing it in the database
  let hashedPassword = await bcrypt.hash(user.password, 10);

  user.password = hashedPassword;

  // Create a new user
  const [newUser] = await db.insert(userModel).values(user).returning();

  const formattedUser = await modelToDto(newUser);

  return formattedUser;
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
  const [updatedUser] = await db
    .update(userModel)
    .set({
      name: user.name,
      image: user.image,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
    })
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

  const [
    personalDetails,
    healthDetails,
    emergencyContactDetails,
    accommodationDetails,
  ] = await Promise.all([
    generalInfo?.personalDetailsId
      ? (
          await db
            .select()
            .from(personalDetailsModel)
            .where(eq(personalDetailsModel.id, generalInfo.personalDetailsId))
        )[0]
      : null,
    generalInfo?.healthId
      ? (
          await db
            .select()
            .from(healthModel)
            .where(eq(healthModel.id, generalInfo.healthId))
        )[0]
      : null,
    generalInfo?.emergencyContactId
      ? (
          await db
            .select()
            .from(emergencyContactModel)
            .where(eq(emergencyContactModel.id, generalInfo.emergencyContactId))
        )[0]
      : null,
    generalInfo?.accommodationId
      ? (
          await db
            .select()
            .from(accommodationModel)
            .where(eq(accommodationModel.id, generalInfo.accommodationId))
        )[0]
      : null,
  ]);

  // Academic/Additional/Course Applications
  const academicInfo = applicationForm?.id
    ? ((
        await db
          .select()
          .from(admissionAcademicInfoModel)
          .where(
            eq(
              admissionAcademicInfoModel.applicationFormId,
              applicationForm.id,
            ),
          )
      )[0] ?? null)
    : null;

  const additionalInfo = applicationForm?.id
    ? ((
        await db
          .select()
          .from(admissionAdditionalInfoModel)
          .where(
            eq(
              admissionAdditionalInfoModel.applicationFormId,
              applicationForm.id,
            ),
          )
      )[0] ?? null)
    : null;

  // Family details (via Additional Info)
  const family = additionalInfo?.familyDetailsId
    ? ((
        await db
          .select()
          .from(familyModel)
          .where(eq(familyModel.id, additionalInfo.familyDetailsId))
      )[0] ?? null)
    : null;

  const courseApplications = applicationForm?.id
    ? await db
        .select()
        .from(admissionCourseDetailsModel)
        .where(
          eq(admissionCourseDetailsModel.applicationFormId, applicationForm.id),
        )
    : [];

  const applicationFormDto: ApplicationFormDto | null | undefined =
    isStudent && applicationForm
      ? await mapApplicationFormToDto(applicationForm, {
          generalInfo,
          personalDetails: personalDetails
            ? await mapPersonalDetailsToDto(personalDetails)
            : null,
          health: healthDetails ? await mapHealthToDto(healthDetails) : null,
          emergencyContact: emergencyContactDetails ?? null,
          accommodation: accommodationDetails
            ? await mapAccommodationToDto(accommodationDetails)
            : null,
          academicInfo,
          additionalInfo,
          courseApplications,
        })
      : undefined;
  const personalDetailsDto: PersonalDetailsDto | null = personalDetails
    ? await mapPersonalDetailsToDto(personalDetails)
    : null;
  const healthDto: HealthDto | null = healthDetails
    ? await mapHealthToDto(healthDetails)
    : null;
  const accommodationDto: AccommodationDto | null = accommodationDetails
    ? await mapAccommodationToDto(accommodationDetails)
    : null;

  const result: ProfileInfo = {
    applicationFormDto,
    familyDetails: family ? await mapFamilyToDto(family) : null,
    personalDetails: personalDetailsDto,
    healthDetails: healthDto,
    emergencyContactDetails: emergencyContactDetails ?? null,
    transportDetails: null,
    accommodationDetails: accommodationDto,
  };

  return result;
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

  const [boardSubjectName] = await db
    .select()
    .from(boardSubjectNameModel)
    .where(eq(boardSubjectNameModel.id, boardSubject.boardSubjectNameId));
  //   const [subject] = await db
  //     .select()
  //     .from(subjectModel)
  //     .where(eq(subjectModel.id, boardSubject.boardSubjectNameId));

  return {
    ...s,
    boardSubject: {
      ...boardSubject,
      boardSubjectName,
    },
  } as StudentAcademicSubjectsDto;
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
    p.mailingAddressId ? fetchAddressDto(p.mailingAddressId) : null,
    p.residentialAddressId ? fetchAddressDto(p.residentialAddressId) : null,
  ]);

  return {
    ...p,
    nationality: nationality ?? undefined,
    religion: religion ?? undefined,
    category: category ?? undefined,
    motherTongue: motherTongue ?? undefined,
    mailingAddress: mailingAddress ?? undefined,
    residentialAddress: residentialAddress ?? undefined,
    disabilityCode: undefined,
  };
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
  const address = a.addressId ? await fetchAddressDto(a.addressId) : undefined;
  return {
    ...a,
    address,
  };
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
    p.officeAddressId ? fetchAddressDto(p.officeAddressId) : null,
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
  const [father, mother, guardian, annualIncome] = await Promise.all([
    mapPersonToDto(f.fatherDetailsId ?? null),
    mapPersonToDto(f.motherDetailsId ?? null),
    mapPersonToDto(f.guardianDetailsId ?? null),
    f.annualIncomeId
      ? db
          .select()
          .from(annualIncomeModel)
          .where(eq(annualIncomeModel.id, f.annualIncomeId))
          .then((r) => r[0] ?? null)
      : null,
  ]);

  return {
    ...f,
    father: father ?? undefined,
    mother: mother ?? undefined,
    guardian: guardian ?? undefined,
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
  return {
    ...addr,
    country: country ?? undefined,
    state: state ?? undefined,
    city: city ?? undefined,
  };
}
