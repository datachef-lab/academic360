import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { db, mysqlConnection } from "@/db/index.js";

import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  occupationModel,
  bloodGroupModel,
  nationalityModel,
  categoryModel,
  religionModel,
  languageMediumModel,
  specializationModel,
  userModel,
  studentModel,
  accommodationModel,
  addressModel,
  familyModel,
  personModel,
  annualIncomeModel,
  academicYearModel,
  User,
  Occupation,
  healthModel,
  BloodGroup,
  Health,
  emergencyContactModel,
  personalDetailsModel,
  Address,
  Nationality,
  Category,
  Religion,
  LanguageMedium,
  Board,
  boardModel,
  degreeModel,
  BoardResultStatus,
  boardResultStatusModel,
  transportDetailsModel,
  admissionCourseDetailsModel,
  Stream,
  CourseType,
  courseTypeModel,
  AdmissionCourseDetails,
  affiliationModel,
  regulationTypeModel,
  subjectModel,
  subjectTypeModel,
  paperModel,
  Degree,
  ProgramCourse,
  admSubjectPaperSelectionModel,
  shiftModel,
  streamModel,
  courseModel,
  programCourseModel,
  courseLevelModel,
  Course,
  Student,
  PersonalDetails,
  admissionModel,
  sessionModel,
  admissionProgramCourseModel,
  promotionStatusModel,
  promotionModel,
  PromotionInsertSchema,
  ApplicationForm,
} from "@repo/db/schemas/models";
import {
  OldAdmStudentPersonalDetail,
  OldBoardResultStatus,
  OldCourseDetails,
  OldStudentCategory,
} from "@repo/db/legacy-system-types/admissions";

import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { and, eq, ilike, or } from "drizzle-orm";

import { formatAadhaarCardNumber } from "@/utils";
import { OldBoard } from "@/types/old-board";
import { OldBoardStatus } from "@/types/old-board-status";
import {
  OldCvSubjectSelection,
  OldMeritList,
} from "@repo/db/legacy-system-types/admissions";
import { OldCourse } from "@/types/old-data/old-course";
import { OldDegree } from "@/types/old-degree";
import { OldSubject } from "@/types/old-data/old-subject";
import { OldSubjectType } from "@/types/old-data/old-subject-type";
import { bankBranchModel } from "@repo/db/schemas/models/payments/bank-branch.model";
import { bankModel } from "@repo/db/schemas/models/payments/bank.model";
import { meritListModel } from "@repo/db/schemas/models/admissions/merit-list.model";
import { OldBank, OldBankBranch } from "@repo/db/legacy-system-types/payment";
import { OldShift } from "@/types/old-data/old-shift";
import { eligibilityCriteriaModel } from "@repo/db/schemas/models/admissions/eligibility-criteria.model";
import { studentCategoryModel } from "@repo/db/schemas/models/admissions/adm-student-category.model";
import { OldClass } from "@/types/old-data/old-class";
import { OldEligibilityCriteria } from "@repo/db/legacy-system-types/course-design";
import { userTypeEnum } from "@repo/db/schemas";
import { staffModel } from "@repo/db/schemas/models/user/staff.model";
import * as oldAdmPersonalDetailsHelper from "./old-student.service";

// Normalize any date-like value to YYYY-MM-DD (date-only, TZ-safe)
function toISODateOnly(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateOnly.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return undefined;
    return new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    )
      .toISOString()
      .slice(0, 10);
  }
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
    )
      .toISOString()
      .slice(0, 10);
  }
  return undefined;
}
import {
  OldHistoricalRecord,
  OldStaff,
  OldStudent,
} from "@repo/db/legacy-system-types/users";
import {
  addCity,
  addCountry,
  addDistrict,
  addState,
  loadOldBoards,
} from "./old-student.service";
import { OldCountry } from "@repo/db/legacy-system-types/resources";
import { OldPromotionStatus } from "@repo/db/legacy-system-types/batches";

const BATCH_SIZE = 500; // Number of rows per batch

type DbType = NodePgDatabase<Record<string, never>> & {
  $client: Pool;
};

// Safely convert unknown values to Date when valid
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value as any);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function addOccupation(
  name: string,
  db: DbType,
  legacyOccupationId: number,
) {
  const [existingOccupation] = await db
    .select()
    .from(occupationModel)
    .where(ilike(occupationModel.name, name.trim()));
  if (existingOccupation) {
    return existingOccupation;
  }
  const [newOccupation] = await db
    .insert(occupationModel)
    .values({
      name: name.trim(),
      legacyOccupationId: legacyOccupationId,
    })
    .returning();

  return newOccupation;
}

export async function addBloodGroup(
  type: string,
  db: DbType,
  legacyBloodGroupId: number,
) {
  const [existingBloodGroup] = await db
    .select()
    .from(bloodGroupModel)
    .where(ilike(bloodGroupModel.type, type.trim().toUpperCase()));
  if (existingBloodGroup) {
    return existingBloodGroup;
  }
  const [newBloodGroup] = await db
    .insert(bloodGroupModel)
    .values({
      legacyBloodGroupId: legacyBloodGroupId,
      type: type.trim().toUpperCase(),
    })
    .returning();

  return newBloodGroup;
}

export async function addNationality(
  name: string,
  code: number | undefined | null,
  db: DbType,
  legacyNationalityId?: number,
) {
  const [existingNationality] = await db
    .select()
    .from(nationalityModel)
    .where(ilike(nationalityModel.name, name.trim()));
  if (existingNationality) {
    return existingNationality;
  }
  const [newNationality] = await db
    .insert(nationalityModel)
    .values({
      legacyNationalityId: legacyNationalityId,
      name: name.trim(),
      code,
    })
    .returning();

  return newNationality;
}

export async function addCategory(
  name: string,
  code: string,
  documentRequired: boolean | undefined,
  db: DbType,
  legacyCategoryId: number,
) {
  // Check if category exists by name OR code
  const [existingCategory] = await db
    .select()
    .from(categoryModel)
    .where(
      or(
        ilike(categoryModel.name, name.trim().toUpperCase()),
        ilike(categoryModel.code, code),
      ),
    );
  if (existingCategory) {
    return existingCategory;
  }
  const [newCategory] = await db
    .insert(categoryModel)
    .values({
      legacyCategoryId: legacyCategoryId,
      name: name.trim().toUpperCase(),
      code,
      documentRequired,
    })
    .returning();

  return newCategory;
}

export async function addReligion(
  name: string,
  db: DbType,
  legacyReligionId: number,
) {
  const [existingReligion] = await db
    .select()
    .from(religionModel)
    .where(ilike(religionModel.name, name.trim().toUpperCase()));
  if (existingReligion) {
    return existingReligion;
  }
  const [newReligion] = await db
    .insert(religionModel)
    .values({ legacyReligionId: legacyReligionId, name: name.trim() })
    .returning();

  return newReligion;
}

export async function addLanguageMedium(
  name: string,
  db: DbType,
  legacyLanguageMediumId: number,
) {
  const [existingLanguage] = await db
    .select()
    .from(languageMediumModel)
    .where(ilike(languageMediumModel.name, name.trim()));
  if (existingLanguage) {
    return existingLanguage;
  }
  const [newLanguage] = await db
    .insert(languageMediumModel)
    .values({
      legacyLanguageMediumId: legacyLanguageMediumId,
      name: name.trim(),
    })
    .returning();

  return newLanguage;
}

export async function addSpecialization(
  name: string,
  db: DbType,
  legacySpecializationId: number,
) {
  const [existingSpecialization] = await db
    .select()
    .from(specializationModel)
    .where(ilike(specializationModel.name, name.trim()));
  if (existingSpecialization) {
    return existingSpecialization;
  }
  const [newSpecialization] = await db
    .insert(specializationModel)
    .values({
      legacySpecializationId: legacySpecializationId,
      name: name.trim(),
    })
    .returning();

  return newSpecialization;
}

export async function addUserForStudent(
  oldStudent: OldStudent,
  db: DbType,
  type: "STUDENT",
) {
  const cleanString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      return value.replace(/[\s\-\/]/g, "").trim();
    }
    return undefined; // Return undefined for non-string values
  };

  const email = `${cleanString(oldStudent.codeNumber)?.toUpperCase()}@thebges.edu.in`;
  // Hash the password before storing it in the database
  const hashedPassword = await bcrypt.hash(
    oldStudent.codeNumber.trim()?.toUpperCase(),
    10,
  );

  // Return, if the email already exist
  const [existingUser] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.email, email.trim().toLowerCase()));
  if (existingUser) {
    // const [updatedUser] = await db.update(userModel).set({ password: hashedPassword }).where(eq(userModel.id, existingUser.id)).returning();
    return existingUser;
  }

  // Create the new user
  const [newUser] = await db
    .insert(userModel)
    .values({
      name: oldStudent.name?.trim()?.toUpperCase() ?? "",
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: oldStudent.contactNo?.trim()?.toUpperCase(),
      type,
      whatsappNumber: oldStudent.whatsappno?.trim()?.toUpperCase(),
    })
    .returning();

  return newUser;
}

// export async function addStaff(oldStaffId: number, user: User) {
//     const [existingStaff] = await db
//         .select()
//         .from(staffModel)
//         .where(eq(staffModel.userId, user.id as number));
//     if (existingStaff) {
//         return existingStaff;
//     }

//     const [[oldStaff]] = (await mysqlConnection.query(`
//           SELECT *
//           FROM staffpersonaldetails
//           WHERE id = ${oldStaffId}
//           `)) as [OldStaff[], any];

//     if (!oldStaff) {
//         return null;
//     }

//     const shift = await addShift(oldStaff.empShiftId);

//     const personalDetails = await addPersonalDetails(oldStaff);

//     const familyDetails = await addFamily(oldStaff);

//     const studentCategory = await addStudentCategory(oldStaff.studentCategoryId);

//     const health = await addHealth(oldStaff);

//     const emergencyContact = await addEmergencyContact({
//         personName: oldStaff.emergencyname ?? undefined,
//         havingRelationAs: oldStaff.emergencyrelationship ?? undefined,
//         email: undefined,
//         phone: oldStaff.emergencytelmobile ?? undefined,
//         officePhone: oldStaff.emergencytellandno ?? undefined,
//         residentialPhone: undefined,
//     } as EmergencyContact);

//     // Previous employer address if present
//     let previousEmployeeAddressId: number | undefined = undefined;
//     if (oldStaff.privempaddrs) {
//         const [addr] = await db
//             .insert(addressModel)
//             .values({
//                 addressLine: oldStaff.privempaddrs.trim(),
//                 localityType: null,
//             } as any)
//             .returning();
//         previousEmployeeAddressId = addr.id as number;
//     }

//     const bank = await addBank(oldStaff.bankid);
//     let board: Board | undefined = undefined;
//     if (oldStaff.board) {
//         const [existingBoard] = await db
//             .select()
//             .from(boardModel)
//             .where(eq(boardModel.name, oldStaff.board.trim()));
//         if (!existingBoard) {
//             const [newBoard] = await db
//                 .insert(boardModel)
//                 .values({
//                     name: oldStaff.board.trim(),
//                 })
//                 .returning();
//             board = newBoard;
//         } else {
//             board = existingBoard;
//         }
//     }

//     const [newStaff] = await db
//         .insert(staffModel)
//         .values({
//             userId: user.id as number,
//             boardId: board?.id ?? undefined,
//             attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
//             uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
//             codeNumber: oldStaff.codeNumber ?? undefined,
//             shiftId: shift?.id ?? undefined,
//             gratuityNumber: oldStaff.gratuityno ?? undefined,
//             personalDetailsId: personalDetails?.id ?? undefined,
//             familyDetailsId: familyDetails?.id ?? undefined,
//             studentCategoryId: studentCategory?.id ?? undefined,
//             healthId: health?.id ?? undefined,
//             emergencyContactId: emergencyContact?.id ?? undefined,
//             computerOperationKnown: !!oldStaff.computeroperationknown,
//             bankBranchId: undefined,
//             // Optional academic links not resolvable from legacy staff payload
//             bankAccountNumber: oldStaff.bankAccNo ?? undefined,
//             banlIfscCode: oldStaff.bankifsccode ?? undefined,
//             bankAccountType: oldStaff.bankacctype
//                 ? (((t) =>
//                     t === "SAVINGS" ||
//                         t === "CURRENT" ||
//                         t === "FIXED_DEPOSIT" ||
//                         t === "RECURRING_DEPOSIT" ||
//                         t === "OTHER"
//                         ? t
//                         : "OTHER")(String(oldStaff.bankacctype).trim()) as any)
//                 : undefined,
//             providentFundAccountNumber: oldStaff.providentFundAccNo ?? undefined,
//             panNumber: oldStaff.panNo ?? undefined,
//             esiNumber: oldStaff.esiNo ?? undefined,
//             impNumber: oldStaff.impNo ?? undefined,
//             clinicAddress: oldStaff.clinicAddress ?? undefined,
//             hasPfNomination: !!oldStaff.pfnomination,
//             childrens: oldStaff.childrens ?? undefined,
//             majorChildName: oldStaff.majorChildName ?? undefined,
//             majorChildPhone: oldStaff.majorChildContactNo ?? undefined,
//             previousEmployeeName: oldStaff.privempnm ?? undefined,
//             previousEmployeePhone: undefined,
//             previousEmployeeAddressId: previousEmployeeAddressId,
//             gratuityNominationDate: oldStaff.gratuitynominationdt
//                 ? new Date(oldStaff.gratuitynominationdt as any)
//                 : undefined,
//             univAccountNumber: oldStaff.univAccNo ?? undefined,
//             dateOfConfirmation: oldStaff.dateofconfirmation
//                 ? new Date(oldStaff.dateofconfirmation)
//                 : undefined,
//             dateOfProbation: oldStaff.dateofprobation
//                 ? new Date(oldStaff.dateofprobation)
//                 : undefined,
//         })
//         .returning();

//     let name = oldStaff.name ?? "";
//     if (personalDetails?.middleName) {
//         name += `${personalDetails?.middleName}`;
//     }
//     if (personalDetails?.lastName) {
//         name += ` ${personalDetails?.lastName}`;
//     }

//     await db
//         .update(userModel)
//         .set({
//             name,
//         })
//         .where(eq(userModel.id, user.id as number));

//     return newStaff;
// }

export async function upsertStudent(oldStudent: OldStudent, user: User) {
  let [existingStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.userId, user.id as number));

  const [[oldCourse]] = (await mysqlConnection.query(`
        SELECT crs.*
        FROM course crs
        JOIN coursedetails cd ON cd.courseid = crs.id
        WHERE cd.id = ${oldStudent.admissionid}
    `)) as [OldCourse[], any];

  if (!oldCourse) {
    throw new Error(`Course not found for student ${oldStudent.codeNumber}`);
  }

  const [foundProgramCourse] = await db
    .select()
    .from(programCourseModel)
    .where(ilike(programCourseModel.name, oldCourse.courseName.trim()));

  if (!foundProgramCourse) {
    throw new Error(
      `Program course not found for course ${oldCourse.courseName}`,
    );
  }

  if (existingStudent) {
    const [updatedStudent] = await db
      .update(studentModel)
      .set({
        uid: oldStudent.codeNumber.trim()?.toUpperCase(),
        applicationId: null, // TODO: Add applicationId
        programCourseId: foundProgramCourse.id,
        community:
          oldStudent.communityid === 0 || oldStudent.communityid === null
            ? null
            : oldStudent.communityid === 1
              ? "GUJARATI"
              : "NON-GUJARATI",
        handicapped: !!oldStudent.handicapped,
        abcId: oldStudent.abcid ? String(oldStudent.abcid) : undefined,
        apprid: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
        apaarId: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
        rfidNumber: oldStudent.rfidno ? String(oldStudent.rfidno) : undefined,
        registrationNumber: oldStudent.univregno
          ? String(oldStudent.univregno)
          : undefined,
        rollNumber: oldStudent.univlstexmrollno
          ? String(oldStudent.univlstexmrollno)
          : undefined,
        cuFormNumber: oldStudent.cuformno
          ? String(oldStudent.cuformno)
          : undefined,
        classRollNumber: oldStudent.rollNumber
          ? String(oldStudent.rollNumber)
          : undefined,
        lastPassedYear: oldStudent.lspassedyr ?? undefined,
        notes: oldStudent.notes ?? undefined,
        active: !!oldStudent.active,
        alumni: !!oldStudent.alumni,
        leavingDate: oldStudent.leavingdate
          ? new Date(oldStudent.leavingdate)
          : undefined,
        leavingReason: oldStudent.leavingreason ?? undefined,
        checkRepeat: !!oldStudent.chkrepeat,
      })
      .where(eq(studentModel.id, existingStudent.id))
      .returning();

    existingStudent = updatedStudent;
  } else {
    const [newStudent] = await db
      .insert(studentModel)
      .values({
        userId: user.id as number,
        legacyStudentId: oldStudent.id,
        uid: oldStudent.codeNumber.trim()?.toUpperCase(),
        applicationId: null, // TODO: Add applicationId
        programCourseId: foundProgramCourse.id,
        community:
          oldStudent.communityid === 0 || oldStudent.communityid === null
            ? null
            : oldStudent.communityid === 1
              ? "GUJARATI"
              : "NON-GUJARATI",
        handicapped: !!oldStudent.handicapped,
        abcId: oldStudent.abcid ? String(oldStudent.abcid) : undefined,
        apprid: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
        apaarId: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
        rfidNumber: oldStudent.rfidno ? String(oldStudent.rfidno) : undefined,
        registrationNumber: oldStudent.univregno
          ? String(oldStudent.univregno)
          : undefined,
        rollNumber: oldStudent.univlstexmrollno
          ? String(oldStudent.univlstexmrollno)
          : undefined,
        cuFormNumber: oldStudent.cuformno
          ? String(oldStudent.cuformno)
          : undefined,
        classRollNumber: oldStudent.rollNumber
          ? String(oldStudent.rollNumber)
          : undefined,
        lastPassedYear: oldStudent.lspassedyr ?? undefined,
        notes: oldStudent.notes ?? undefined,
        active: !!oldStudent.active,
        alumni: !!oldStudent.alumni,
        leavingDate: oldStudent.leavingdate
          ? new Date(oldStudent.leavingdate)
          : undefined,
        leavingReason: oldStudent.leavingreason ?? undefined,
        checkRepeat: !!oldStudent.chkrepeat,
      })
      .returning();

    existingStudent = newStudent;
  }

  return existingStudent;
}

export async function upsertAccommodation(
  oldStudent: OldStudent,
  userId: number,
) {
  // If accommodationId is provided, perform update and return
  let [existingAccommodation] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.userId, userId));

  if (existingAccommodation) {
    let placeOfStay:
      | "OWN"
      | "HOSTEL"
      | "RELATIVES"
      | "FAMILY_FRIENDS"
      | "PAYING_GUEST"
      | null;
    switch (oldStudent.placeofstay) {
      case "Own":
        placeOfStay = "OWN";
        break;
      case "Hostel":
        placeOfStay = "HOSTEL";
        break;
      case "Relatives":
        placeOfStay = "RELATIVES";
        break;
      case "Family Friends":
        placeOfStay = "FAMILY_FRIENDS";
        break;
      case "Paying Guest":
        placeOfStay = "PAYING_GUEST";
        break;
      default:
        placeOfStay = null;
    }

    // Update accommodation
    const [updatedAccommodation] = await db
      .update(accommodationModel)
      .set({
        placeOfStay,
      })
      .where(eq(accommodationModel.id, existingAccommodation.id))
      .returning();

    // Update address if it exists
    await db
      .update(addressModel)
      .set({
        addressLine: oldStudent.placeofstayaddr?.toUpperCase()?.trim(),
        localityType:
          oldStudent.localitytyp?.toUpperCase() === "URBAN"
            ? "URBAN"
            : oldStudent.localitytyp?.toUpperCase() === "RURAL"
              ? "RURAL"
              : null,
        phone: oldStudent.placeofstaycontactno?.trim()?.toUpperCase(),
      })
      .where(eq(addressModel.accommodationId, existingAccommodation.id));

    return updatedAccommodation;
  }

  // Original creation logic when no ID is provided
  let placeOfStay:
    | "OWN"
    | "HOSTEL"
    | "RELATIVES"
    | "FAMILY_FRIENDS"
    | "PAYING_GUEST"
    | null;
  switch (oldStudent.placeofstay) {
    case "Own":
      placeOfStay = "OWN";
      break;
    case "Hostel":
      placeOfStay = "HOSTEL";
      break;
    case "Relatives":
      placeOfStay = "RELATIVES";
      break;
    case "Family Friends":
      placeOfStay = "FAMILY_FRIENDS";
      break;
    case "Paying Guest":
      placeOfStay = "PAYING_GUEST";
      break;
    default:
      placeOfStay = null;
  }

  // const state = await addState(oldStudent.rstateid);
  // const city = await addCity(oldStudent.placeofstaycity);
  // const district = await addDistrict(oldStudent.placeofstaydistrict);
  // const country = await addCountry(oldStudent.rcountryid);

  const [newAccommodation] = await db
    .insert(accommodationModel)
    .values({ placeOfStay, userId })
    .returning();

  const [address] = await db
    .insert(addressModel)
    .values({
      accommodationId: newAccommodation.id,
      type: "OTHER",
      addressLine: oldStudent.placeofstayaddr?.toUpperCase()?.trim(),
      localityType:
        oldStudent.localitytyp?.toUpperCase() === "URBAN"
          ? "URBAN"
          : oldStudent.localitytyp?.toUpperCase() === "RURAL"
            ? "RURAL"
            : null,
      phone: oldStudent.placeofstaycontactno?.trim()?.toUpperCase(),
    })
    .returning();

  return newAccommodation;
}

async function categorizeIncome(income: string | null | undefined) {
  if (!income || income.trim() === "" || income === "0") {
    return undefined;
  }

  const getAnnualIncome = async (range: string) => {
    const [existingAnnualIncome] = await db
      .select()
      .from(annualIncomeModel)
      .where(eq(annualIncomeModel.range, range));
    if (existingAnnualIncome) {
      return existingAnnualIncome;
    }
    const [newAnnualIncome] = await db
      .insert(annualIncomeModel)
      .values({ range })
      .returning();

    return newAnnualIncome;
  };

  const lowerIncome = income.toLowerCase();

  if (
    lowerIncome.includes("upto 1.2") ||
    lowerIncome.includes("upto rs. 1.2") ||
    lowerIncome.includes("1,20,000") ||
    lowerIncome.includes("1.2 to 3")
  ) {
    return await getAnnualIncome("Below ₹3 Lakh");
  }
  if (
    lowerIncome.includes("3 to 5") ||
    lowerIncome.includes("1.2 lakh to 5") ||
    lowerIncome.includes("1.2 lac to 5")
  ) {
    return await getAnnualIncome("₹3 - ₹5 Lakh");
  }
  if (
    lowerIncome.includes("5 lakh and above") ||
    lowerIncome.includes("5 lacs and above") ||
    lowerIncome.includes("5 to 8") ||
    lowerIncome.includes("rs. 5,00,000 & above")
  ) {
    return await getAnnualIncome("₹5 - ₹8 Lakh");
  }
  if (lowerIncome.includes("8 lakhs & above") || lowerIncome.includes("3-10")) {
    return await getAnnualIncome("₹8 - ₹10 Lakh");
  }
  if (lowerIncome.includes("10 lacs and above")) {
    return await getAnnualIncome("₹10 Lakh and Above");
  }

  return undefined; // Default to lowest category
}

// Upsert-only helper for family: create or update family row without touching related person rows
export async function upsertFamily(oldStudent: OldStudent, userId: number) {
  // Map legacy single-parent flag to enum
  let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
  if (oldStudent.issnglprnt) {
    const v = oldStudent.issnglprnt.toLowerCase();
    if (v === "bth") parentType = "BOTH";
    else if (v === "sngl_fthr") parentType = "FATHER_ONLY";
    else if (v === "sngl_mthr") parentType = "MOTHER_ONLY";
  }

  const annualIncome = await categorizeIncome(oldStudent.annualFamilyIncome);

  // Prepare insert payload; include id when provided to trigger conflict update
  const insertValues: Partial<typeof familyModel.$inferInsert> = {
    annualIncomeId: annualIncome ? annualIncome.id : undefined,
    parentType,
  };

  let [existingFamily] = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.userId, userId));

  if (existingFamily) {
    const [family] = await db
      .update(familyModel)
      .set(insertValues as any)
      .where(eq(familyModel.id, existingFamily.id))
      .returning();
    existingFamily = family;
  } else {
    const [family] = await db
      .insert(familyModel)
      .values(insertValues as any)
      .onConflictDoUpdate({
        target: familyModel.id,
        set: {
          annualIncomeId: insertValues.annualIncomeId,
          parentType: insertValues.parentType,
        },
      })
      .returning();
    existingFamily = family;
  }

  // Helper to resolve occupation by legacy id
  const resolveOccupation = async (
    legacyOccupationId: number | undefined | null,
  ) => {
    if (!legacyOccupationId) return undefined;
    const [occ] = (await mysqlConnection.query(
      `SELECT * FROM parentoccupation WHERE id = ${legacyOccupationId}`,
    )) as [{ id: number; occupationName: string }[], any];
    if (occ.length === 0) return undefined;
    return await addOccupation(occ[0].occupationName, db, legacyOccupationId);
  };

  // Generic upsert for a person by type under this family
  const upsertPerson = async (args: {
    type: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER_GUARDIAN" | "SPOUSE";
    name?: string | null;
    email?: string | null;
    aadhaar?: string | null;
    phone?: string | null;
    image?: string | null;
    legacyOccupationId?: number | null;
  }) => {
    const occupation = await resolveOccupation(
      args.legacyOccupationId ?? undefined,
    );
    const values: Partial<typeof personModel.$inferInsert> = {
      type: args.type,
      familyId: existingFamily.id,
      name: args.name?.toUpperCase()?.trim(),
      email: args.email?.trim()?.toLowerCase(),
      aadhaarCardNumber: formatAadhaarCardNumber(args.aadhaar || undefined),
      phone: args.phone?.trim() || undefined,
      image: args.image?.trim() || undefined,
      occupationId: occupation ? occupation.id : undefined,
    };

    // Check if any meaningful value exists; if nothing to save, skip
    const hasAny = Object.values(values).some(
      (v) => v !== undefined && v !== null,
    );
    if (!hasAny) return;

    const [existing] = await db
      .select()
      .from(personModel)
      .where(
        and(
          eq(personModel.familyId, existingFamily.id),
          eq(personModel.type, args.type),
        ),
      );

    if (existing) {
      await db
        .update(personModel)
        .set(values)
        .where(eq(personModel.id, existing.id));
      return;
    }

    await db.insert(personModel).values(values);
  };

  // Father details
  await upsertPerson({
    type: "FATHER",
    name: oldStudent.fatherName,
    email: oldStudent.fatherEmail,
    aadhaar: oldStudent.fatheraadharno,
    phone: oldStudent.fatherMobNo,
    image: oldStudent.fatherPic,
    legacyOccupationId: oldStudent.fatherOccupation as unknown as
      | number
      | undefined,
  });

  // Mother details
  await upsertPerson({
    type: "MOTHER",
    name: oldStudent.motherName,
    email: oldStudent.motherEmail,
    aadhaar: oldStudent.motheraadharno,
    phone: oldStudent.motherMobNo,
    image: oldStudent.motherPic,
    legacyOccupationId: oldStudent.motherOccupation as unknown as
      | number
      | undefined,
  });

  // Guardian details
  await upsertPerson({
    type: "GUARDIAN",
    name: oldStudent.guardianName,
    email: oldStudent.guardianEmail,
    aadhaar: oldStudent.gurdianaadharno,
    phone: oldStudent.guardianMobNo,
    image: oldStudent.guardianPic,
    legacyOccupationId: oldStudent.guardianOccupation as unknown as
      | number
      | undefined,
  });

  return existingFamily;
}

export async function upsertHealth(oldStudent: OldStudent, userId: number) {
  // If healthId is provided, perform update and return
  let [existingHealth] = await db
    .select()
    .from(healthModel)
    .where(eq(healthModel.userId, userId));

  if (existingHealth) {
    let bloodGroup: BloodGroup | undefined;
    if (oldStudent.bloodGroup) {
      const [bloodGroupResult] = (await mysqlConnection.query(
        `SELECT * FROM bloodgroup WHERE id = ${oldStudent.bloodGroup}`,
      )) as [{ id: number; name: string }[], any];
      if (bloodGroupResult.length > 0) {
        bloodGroup = await addBloodGroup(
          bloodGroupResult[0].name,
          db,
          oldStudent.bloodGroup,
        );
      }
    }

    const updateData: Partial<Health> = {};
    if (typeof bloodGroup?.id === "number") {
      updateData.bloodGroupId = bloodGroup.id;
    }
    const left = oldStudent.eyePowerLeft?.trim();
    if (left) {
      updateData.eyePowerLeft = left.toUpperCase();
    }
    const right = oldStudent.eyePowerRight?.trim();
    if (right) {
      updateData.eyePowerRight = right.toUpperCase();
    }

    // If nothing to update, return the existing row to avoid Drizzle "No values to set" error
    if (Object.keys(updateData).length === 0) {
      return existingHealth;
    }

    const [updatedHealth] = await db
      .update(healthModel)
      .set(updateData)
      .where(eq(healthModel.id, existingHealth.id))
      .returning();

    return updatedHealth;
  }

  // Original creation logic when no ID is provided
  // Note: health table doesn't have studentId field, it's referenced through other tables

  let bloodGroup: BloodGroup | undefined;
  if (oldStudent.bloodGroup) {
    const [bloodGroupResult] = (await mysqlConnection.query(
      `SELECT * FROM bloodgroup WHERE id = ${oldStudent.bloodGroup}`,
    )) as [{ id: number; name: string }[], any];
    if (bloodGroupResult.length > 0) {
      bloodGroup = await addBloodGroup(
        bloodGroupResult[0].name,
        db,
        oldStudent.bloodGroup,
      );
    }
  }

  const insertData: Partial<Health> = {
    userId,
  };
  if (typeof bloodGroup?.id === "number") {
    insertData.bloodGroupId = bloodGroup.id;
  }
  const left = oldStudent.eyePowerLeft?.trim();
  if (left) {
    insertData.eyePowerLeft = left.toUpperCase();
  }
  const right = oldStudent.eyePowerRight?.trim();
  if (right) {
    insertData.eyePowerRight = right.toUpperCase();
  }

  if (Object.keys(insertData).length === 0) {
    // Nothing to insert; skip creating an empty health record
    return null;
  }

  const [newHealth] = await db
    .insert(healthModel)
    .values(insertData as Health)
    .returning();

  return newHealth;
}

export async function upsertEmergencyContact(
  oldStudent: OldStudent,
  userId: number,
) {
  // If emergencyContactId is provided, perform update and return
  let [existingEmergencyContact] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.userId, userId));

  if (existingEmergencyContact) {
    const [updatedEmergencyContact] = await db
      .update(emergencyContactModel)
      .set({
        personName: oldStudent.emercontactpersonnm?.trim()?.toUpperCase(),
        phone: oldStudent.emercontactpersonmob?.trim(),
        residentialPhone: oldStudent.emrgnResidentPhNo?.trim(),
        havingRelationAs: oldStudent.emerpersreltostud?.trim()?.toUpperCase(),
        officePhone: oldStudent.emrgnOfficePhNo?.trim(),
      })
      .where(eq(emergencyContactModel.id, existingEmergencyContact.id))
      .returning();

    return updatedEmergencyContact;
  }

  // Original creation logic when no ID is provided
  // Note: emergency_contacts table doesn't have studentId field, it's referenced through other tables

  const [newEmergencyContact] = await db
    .insert(emergencyContactModel)
    .values({
      personName: oldStudent.emercontactpersonnm?.trim()?.toUpperCase(),
      phone: oldStudent.emercontactpersonmob?.trim(),
      residentialPhone: oldStudent.emrgnResidentPhNo?.trim(),
      havingRelationAs: oldStudent.emerpersreltostud?.trim()?.toUpperCase(),
      officePhone: oldStudent.emrgnOfficePhNo?.trim(),
      userId,
    })
    .returning();

  return newEmergencyContact;
}

export async function upsertStudentPersonalDetails(
  oldDetails: OldStudent,
  user: User,
) {
  // If personalDetailsId is provided, perform update and return
  let [existingPersonalDetails] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, user.id!));

  if (existingPersonalDetails) {
    // Handle different types of oldDetails

    let nationality: Nationality | undefined;
    if (oldDetails.nationalityId) {
      const [nationalityResult] = (await mysqlConnection.query(
        `SELECT * FROM nationality WHERE id = ${oldDetails.nationalityId}`,
      )) as [{ id: number; nationalityName: string; code: number }[], any];
      if (nationalityResult.length > 0) {
        nationality = await addNationality(
          nationalityResult[0].nationalityName,
          nationalityResult[0].code,
          db,
          oldDetails.nationalityId,
        );
      }
    }
    // let otherNationality: Nationality | undefined;
    // if ('othernationality' in oldDetails && oldDetails.othernationality) {
    //     const [otherNationalityResult] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldDetails.othernationality}`) as [{ id: number, nationalityName: string, code: number }[], any];
    //     if (otherNationalityResult.length > 0) {
    //         otherNationality = await addNationality(otherNationalityResult[0].nationalityName, otherNationalityResult[0].code, db);
    //     }
    // }
    let category: Category | undefined;
    if (oldDetails.studentCategoryId) {
      const [categoryResult] = (await mysqlConnection.query(
        `SELECT * FROM category WHERE id = ${oldDetails.studentCategoryId}`,
      )) as [
        {
          id: number;
          category: string;
          code: string;
          docneeded: boolean | undefined;
        }[],
        any,
      ];
      if (categoryResult.length > 0) {
        category = await addCategory(
          categoryResult[0].category,
          categoryResult[0].code,
          categoryResult[0].docneeded,
          db,
          oldDetails.studentCategoryId,
        );
      }
    }
    let religion: Religion | undefined;
    if (oldDetails.religionId) {
      const [religionResult] = (await mysqlConnection.query(
        `SELECT * FROM religion WHERE id = ${oldDetails.religionId}`,
      )) as [{ id: number; religionName: string }[], any];
      if (religionResult.length > 0) {
        religion = await addReligion(
          religionResult[0].religionName,
          db,
          oldDetails.religionId,
        );
      }
    }
    let motherTongue: LanguageMedium | undefined;
    if (oldDetails.motherTongueId) {
      const [motherTongueResult] = (await mysqlConnection.query(
        `SELECT * FROM mothertongue WHERE id = ${oldDetails.motherTongueId}`,
      )) as [{ id: number; mothertongueName: string }[], any];
      if (motherTongueResult.length > 0) {
        motherTongue = await addLanguageMedium(
          motherTongueResult[0].mothertongueName,
          db,
          oldDetails.motherTongueId,
        );
      }
    }
    // Helper to normalize any date-like value to YYYY-MM-DD (date-only, TZ-safe)
    const toISODateOnly = (value: unknown): string | undefined => {
      if (!value) return undefined;
      if (typeof value === "string") {
        const trimmed = value.trim();
        const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
        if (isoDateOnly.test(trimmed)) return trimmed;
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) return undefined;
        return new Date(
          Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
        )
          .toISOString()
          .slice(0, 10);
      }
      if (value instanceof Date) {
        return new Date(
          Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
        )
          .toISOString()
          .slice(0, 10);
      }
      return undefined;
    };

    // Update personal details
    const [updatedPersonalDetails] = await db
      .update(personalDetailsModel)
      .set({
        dateOfBirth: toISODateOnly(oldDetails.dateOfBirth ?? undefined),
        gender:
          oldDetails.sexId === 0
            ? undefined
            : oldDetails.sexId === 1
              ? "MALE"
              : "FEMALE",
        nationalityId: nationality ? nationality.id : undefined,
        otherNationality:
          "othernationality" in oldDetails && oldDetails.othernationality
            ? oldDetails.othernationality
            : undefined,
        categoryId: category ? category.id : undefined,
        religionId: religion ? religion.id : undefined,
        aadhaarCardNumber: formatAadhaarCardNumber(
          "aadharcardno" in oldDetails
            ? oldDetails.aadharcardno || undefined
            : undefined,
        ),
        // alternativeEmail: oldDetails.alternativeemail?.trim().toLowerCase(), // Field doesn't exist in schema
        // email: oldDetails.email?.trim().toLowerCase(), // Field doesn't exist in schema
        motherTongueId: motherTongue ? motherTongue.id : undefined,
      })
      .where(eq(personalDetailsModel.id, existingPersonalDetails.id))
      .returning();

    // Update addresses if they exist
    // Mailing address
    const [[oldCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.mcountryid}`,
    )) as [OldCountry[], any];
    const [[oldPreviousCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.lscountryid}`,
    )) as [OldCountry[], any];

    await db
      .update(addressModel)
      .set({
        address: oldDetails.mailingAddress,
        block: oldDetails.mailblock,
        countryId: oldCountry
          ? (await oldAdmPersonalDetailsHelper.addCountry(oldCountry)).id
          : null,
        previousCountryId: oldPreviousCountry
          ? (await oldAdmPersonalDetailsHelper.addCountry(oldPreviousCountry))
              .id
          : null,

        stateId: oldDetails.mstateid
          ? (await oldAdmPersonalDetailsHelper.addState(oldDetails.mstateid))
              ?.id
          : null,
        otherState: oldDetails.mothstate,
        previousStateId: oldDetails.lsstateid
          ? (await oldAdmPersonalDetailsHelper.addState(oldDetails.lsstateid))
              ?.id
          : null,

        cityId: oldDetails.mcityid
          ? (await oldAdmPersonalDetailsHelper.addCity(oldDetails.mcityid))?.id
          : null,
        otherCity: oldDetails.mothcity,
        previousCityId: oldDetails.lscityid
          ? (await oldAdmPersonalDetailsHelper.addCity(oldDetails.lscityid))?.id
          : null,

        districtId: oldDetails.mdistrictid
          ? (
              await oldAdmPersonalDetailsHelper.addDistrict(
                oldDetails.mdistrictid,
              )
            )?.id
          : null,
        otherDistrict: oldDetails.mothdistrict,

        otherPostoffice: oldDetails.mailpo,
        otherPoliceStation: oldDetails.mailps,

        addressLine: oldDetails.mailingAddress?.trim()?.toUpperCase(),
        localityType:
          "localitytyp" in oldDetails &&
          oldDetails.localitytyp?.toUpperCase() === "URBAN"
            ? "URBAN"
            : "localitytyp" in oldDetails &&
                oldDetails.localitytyp?.toUpperCase() === "RURAL"
              ? "RURAL"
              : null,
        pincode: oldDetails.mailingPinNo?.trim()?.toUpperCase(),
      })
      .where(
        and(
          eq(addressModel.type, "MAILING"),
          eq(addressModel.personalDetailsId, existingPersonalDetails.id),
        ),
      );

    // Residential address (enriched fields similar to mailing)
    const rCountryId = oldDetails.rcountryid ?? null;
    const [[oldRCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.rcountryid}`,
    )) as [OldCountry[], any];
    const [[oldRPreviousCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.lscountryid}`,
    )) as [OldCountry[], any];
    const rStateId = oldDetails.rstateid ?? null;
    const rCityId = oldDetails.rcityid ?? null;
    const rDistrictId = oldDetails.rdistrictid ?? null;

    await db
      .update(addressModel)
      .set({
        phone:
          oldDetails.resiPhoneMobileNo?.trim()?.toUpperCase() ||
          oldDetails.contactNo ||
          undefined,
        emergencyPhone: oldDetails.emrgnResidentPhNo || undefined,
        address: oldDetails.residentialAddress,
        block: oldDetails.resiblock,

        countryId: rCountryId
          ? (await oldAdmPersonalDetailsHelper.addCountry(oldRCountry)).id
          : null,
        previousCountryId: oldRPreviousCountry
          ? (await oldAdmPersonalDetailsHelper.addCountry(oldRPreviousCountry))
              .id
          : null,

        stateId: rStateId
          ? (await oldAdmPersonalDetailsHelper.addState(rStateId))?.id
          : null,
        otherState: oldDetails.rothstate,
        previousStateId: oldDetails.lsstateid
          ? (await oldAdmPersonalDetailsHelper.addState(oldDetails.lsstateid))
              ?.id
          : null,

        cityId: rCityId
          ? (await oldAdmPersonalDetailsHelper.addCity(rCityId))?.id
          : null,
        otherCity: oldDetails.rothcity,
        previousCityId: oldDetails.lscityid
          ? (await oldAdmPersonalDetailsHelper.addCity(oldDetails.lscityid))?.id
          : null,

        districtId: rDistrictId
          ? (await oldAdmPersonalDetailsHelper.addDistrict(rDistrictId))?.id
          : null,
        otherDistrict: oldDetails.rothdistrict,

        otherPostoffice: oldDetails.resipo,
        otherPoliceStation: oldDetails.resips,

        addressLine: oldDetails.residentialAddress?.trim()?.toUpperCase(),

        localityType:
          "localitytyp" in oldDetails &&
          oldDetails.localitytyp?.toUpperCase() === "URBAN"
            ? "URBAN"
            : "localitytyp" in oldDetails &&
                oldDetails.localitytyp?.toUpperCase() === "RURAL"
              ? "RURAL"
              : null,
        pincode: oldDetails.resiPinNo?.trim()?.toUpperCase(),
      })
      .where(
        and(
          eq(addressModel.type, "RESIDENTIAL"),
          eq(addressModel.personalDetailsId, existingPersonalDetails.id),
        ),
      );

    return updatedPersonalDetails;
  }

  // Original creation logic when no ID is provided

  let nationality: Nationality | undefined;
  if (oldDetails.nationalityId) {
    const [nationalityResult] = (await mysqlConnection.query(
      `SELECT * FROM nationality WHERE id = ${oldDetails.nationalityId}`,
    )) as [{ id: number; nationalityName: string; code: number }[], any];
    if (nationalityResult.length > 0) {
      nationality = await addNationality(
        nationalityResult[0].nationalityName,
        nationalityResult[0].code,
        db,
        oldDetails.nationalityId,
      );
    }
  }
  let otherNationality: Nationality | undefined;
  if ("othernationality" in oldDetails && oldDetails.othernationality) {
    const [otherNationalityResult] = (await mysqlConnection.query(
      `SELECT * FROM nationality WHERE id = ${oldDetails.othernationality}`,
    )) as [{ id: number; nationalityName: string; code: number }[], any];
    if (otherNationalityResult.length > 0) {
      otherNationality = await addNationality(
        otherNationalityResult[0].nationalityName,
        otherNationalityResult[0].code,
        db,
      );
    }
  }
  let category: Category | undefined;
  if (oldDetails.studentCategoryId) {
    const [categoryResult] = (await mysqlConnection.query(
      `SELECT * FROM category WHERE id = ${oldDetails.studentCategoryId}`,
    )) as [
      {
        id: number;
        category: string;
        code: string;
        docneeded: boolean | undefined;
      }[],
      any,
    ];
    if (categoryResult.length > 0) {
      category = await addCategory(
        categoryResult[0].category,
        categoryResult[0].code,
        categoryResult[0].docneeded,
        db,
        oldDetails.studentCategoryId,
      );
    }
  }
  let religion: Religion | undefined;
  if (oldDetails.religionId) {
    const [religionResult] = (await mysqlConnection.query(
      `SELECT * FROM religion WHERE id = ${oldDetails.religionId}`,
    )) as [{ id: number; religionName: string }[], any];
    if (religionResult.length > 0) {
      religion = await addReligion(
        religionResult[0].religionName,
        db,
        oldDetails.religionId,
      );
    }
  }
  let motherTongue: LanguageMedium | undefined;
  if (oldDetails.motherTongueId) {
    const [motherTongueResult] = (await mysqlConnection.query(
      `SELECT * FROM mothertongue WHERE id = ${oldDetails.motherTongueId}`,
    )) as [{ id: number; mothertongueName: string }[], any];
    if (motherTongueResult.length > 0) {
      motherTongue = await addLanguageMedium(
        motherTongueResult[0].mothertongueName,
        db,
        oldDetails.motherTongueId,
      );
    }
  }

  const [newPersonalDetails] = await db
    .insert(personalDetailsModel)
    .values({
      userId: user.id as number,
      firstName: oldDetails.name?.split(" ")[0] || "", // Required field
      lastName: oldDetails.name?.split(" ")[1] || "",
      middleName: oldDetails.name?.split(" ")[2] || "",
      mobileNumber: oldDetails.phoneMobileNo || oldDetails.contactNo || "", // Required field
      dateOfBirth: toISODateOnly(oldDetails.dateOfBirth ?? undefined),
      gender:
        oldDetails.sexId === 0
          ? undefined
          : oldDetails.sexId === 1
            ? "MALE"
            : "FEMALE",
      nationalityId: nationality ? nationality.id : undefined,
      otherNationalityId: otherNationality ? otherNationality.id : undefined,
      categoryId: category ? category.id : undefined,
      religionId: religion ? religion.id : undefined,
      aadhaarCardNumber: formatAadhaarCardNumber(
        "aadharcardno" in oldDetails
          ? oldDetails.aadharcardno || undefined
          : undefined,
      ),

      motherTongueId: motherTongue ? motherTongue.id : undefined,
      emergencyResidentialNumber: oldDetails.emrgnResidentPhNo,
    } as PersonalDetails)
    .returning();

  // Insert mailing address with enriched fields
  if (oldDetails.mailingAddress || oldDetails.mailingPinNo) {
    const [[insMailCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.mcountryid}`,
    )) as [OldCountry[], any];
    const [[insPrevMailCountry]] = (await mysqlConnection.query(
      `SELECT * FROM country WHERE id = ${oldDetails.lscountryid}`,
    )) as [OldCountry[], any];

    await db
      .insert(addressModel)
      .values({
        type: "MAILING",
        personalDetailsId: newPersonalDetails.id,
        address: oldDetails.mailingAddress,
        block: oldDetails.mailblock,

        countryId: insMailCountry
          ? (await oldAdmPersonalDetailsHelper.addCountry(insMailCountry)).id
          : null,
        previousCountryId: insPrevMailCountry
          ? (await oldAdmPersonalDetailsHelper.addCountry(insPrevMailCountry))
              .id
          : null,

        stateId: oldDetails.mstateid
          ? (await oldAdmPersonalDetailsHelper.addState(oldDetails.mstateid))
              ?.id
          : null,
        otherState: oldDetails.mothstate,
        previousStateId: oldDetails.lsstateid
          ? (await oldAdmPersonalDetailsHelper.addState(oldDetails.lsstateid))
              ?.id
          : null,

        cityId: oldDetails.mcityid
          ? (await oldAdmPersonalDetailsHelper.addCity(oldDetails.mcityid))?.id
          : null,
        otherCity: oldDetails.mothcity,
        previousCityId: oldDetails.lscityid
          ? (await oldAdmPersonalDetailsHelper.addCity(oldDetails.lscityid))?.id
          : null,

        districtId: oldDetails.mdistrictid
          ? (
              await oldAdmPersonalDetailsHelper.addDistrict(
                oldDetails.mdistrictid,
              )
            )?.id
          : null,
        otherDistrict: oldDetails.mothdistrict,

        otherPostoffice: oldDetails.mailpo,
        otherPoliceStation: oldDetails.mailps,

        addressLine: oldDetails.mailingAddress?.trim()?.toUpperCase(),
        localityType:
          "localitytyp" in oldDetails &&
          oldDetails.localitytyp?.toUpperCase() === "URBAN"
            ? "URBAN"
            : "localitytyp" in oldDetails &&
                oldDetails.localitytyp?.toUpperCase() === "RURAL"
              ? "RURAL"
              : null,
        pincode: oldDetails.mailingPinNo?.trim()?.toUpperCase(),
      })
      .returning();
  }

  // Insert residential address with enriched fields
  if (oldDetails.residentialAddress || oldDetails.resiPinNo) {
    const rCountryIdIns = oldDetails.rcountryid ?? undefined;
    const rStateIdIns =
      "resiStateId" in oldDetails ? oldDetails.resiStateId : undefined;
    const rCityIdIns = "cityId" in oldDetails ? oldDetails.cityId : undefined;
    const rDistrictIdIns =
      "resiDistrictId" in oldDetails ? oldDetails.resiDistrictId : undefined;
    const rPostOfficeIdIns =
      "resipostofficeid" in oldDetails
        ? oldDetails.resipostofficeid
        : undefined;
    const rPoliceStationIdIns =
      "resipolicestationid" in oldDetails
        ? oldDetails.resipolicestationid
        : undefined;

    await db
      .insert(addressModel)
      .values({
        type: "RESIDENTIAL",
        personalDetailsId: newPersonalDetails.id,

        phone:
          oldDetails.resiPhoneMobileNo?.trim()?.toUpperCase() ||
          oldDetails.contactNo ||
          undefined,
        emergencyPhone: oldDetails.emrgnResidentPhNo || undefined,
        block: oldDetails.resiblock,
        address: oldDetails.residentialAddress,

        countryId: rCountryIdIns
          ? (
              await oldAdmPersonalDetailsHelper.addCountry({
                id: rCountryIdIns as number,
                countryName: "",
              } as OldCountry)
            ).id
          : null,
        stateId: rStateIdIns
          ? (await oldAdmPersonalDetailsHelper.addState(rStateIdIns as number))
              ?.id
          : null,
        cityId: rCityIdIns
          ? (await oldAdmPersonalDetailsHelper.addCity(rCityIdIns as number))
              ?.id
          : null,
        districtId: rDistrictIdIns
          ? (
              await oldAdmPersonalDetailsHelper.addDistrict(
                rDistrictIdIns as number,
              )
            )?.id
          : null,
        postofficeId: rPostOfficeIdIns
          ? (
              await oldAdmPersonalDetailsHelper.addPostOffice(
                rPostOfficeIdIns as number,
              )
            )?.id
          : null,
        policeStationId: rPoliceStationIdIns
          ? (
              await oldAdmPersonalDetailsHelper.addPoliceStation(
                rPoliceStationIdIns as number,
              )
            )?.id
          : null,
        addressLine: oldDetails.residentialAddress?.trim()?.toUpperCase(),
        localityType:
          "localitytyp" in oldDetails &&
          oldDetails.localitytyp?.toUpperCase() === "URBAN"
            ? "URBAN"
            : "localitytyp" in oldDetails &&
                oldDetails.localitytyp?.toUpperCase() === "RURAL"
              ? "RURAL"
              : null,
        pincode: oldDetails.resiPinNo?.trim()?.toUpperCase(),
      })
      .returning();
  }

  return newPersonalDetails;
}

export async function addBoardResultStatus(
  oldStudent: OldStudent,
  db: DbType,
): Promise<BoardResultStatus | null> {
  const [boardResultRows] = (await mysqlConnection.query(
    `SELECT * FROM boardresultstatus WHERE id = ${oldStudent.boardresultid}`,
  )) as [OldBoardStatus[], any];

  const [oldBoardResultStatus] = boardResultRows as OldBoardStatus[];

  if (!oldBoardResultStatus) {
    return null;
  }

  const [existingBoardResultStatus] = await db
    .select()
    .from(boardResultStatusModel)
    .where(
      eq(
        boardResultStatusModel.name,
        oldBoardResultStatus.name.trim().toUpperCase(),
      ),
    );

  if (existingBoardResultStatus) {
    return existingBoardResultStatus;
  }

  let result;
  if (oldBoardResultStatus.flag?.trim().toUpperCase() === "FAIL") {
    result = "FAIL";
  } else if (oldBoardResultStatus.flag?.trim().toUpperCase() === "PASS") {
    result = "PASS";
  }

  const [newBoardResultStatus] = await db
    .insert(boardResultStatusModel)
    .values({
      name: oldBoardResultStatus.name.trim().toUpperCase(),
      spclType: oldBoardResultStatus.spcltype?.trim().toUpperCase(),
      result: result as "FAIL" | "PASS" | undefined,
    })
    .returning();

  return newBoardResultStatus;
}

export async function upsertTransportDetails(
  oldStudent: OldStudent,
  userId: number,
) {
  // If transportDetailsId is provided, perform update and return
  let [existingTransportDetails] = await db
    .select()
    .from(transportDetailsModel)
    .where(eq(transportDetailsModel.userId, userId));

  if (existingTransportDetails) {
    const [updatedTransportDetails] = await db
      .update(transportDetailsModel)
      .set({
        // Add any transport-related fields from oldStudent here
        // transportId: oldStudent.transportId,
        // pickupPointId: oldStudent.pickupPointId,
      })
      .where(eq(transportDetailsModel.id, existingTransportDetails.id))
      .returning();

    return updatedTransportDetails;
  }

  // Original creation logic when no ID is provided
  // Note: transport_details table doesn't have studentId field, it's referenced through other tables

  const [newTransportDetail] = await db
    .insert(transportDetailsModel)
    .values({
      // transportId
      // pickupPointId
      userId,
    })
    .returning();

  return newTransportDetail;
}

export async function processStudent(oldStudent: OldStudent, user: User) {
  // Step 1: Check for the student
  const student = await upsertStudent(oldStudent, user);

  // Step 2: Check for the accomodation
  await upsertAccommodation(oldStudent, user.id!);

  // Step 3: Check for the Familys
  await upsertFamily(oldStudent, user.id!);

  // Step 4: Check for the health
  await upsertHealth(oldStudent, user.id!);

  // Step 5: Check for the emergency-contact
  await upsertEmergencyContact(oldStudent, user.id!);

  // Step 6: Check for the personal-details
  await upsertStudentPersonalDetails(oldStudent, user);

  // Step 7: Check for the transport-details
  await upsertTransportDetails(oldStudent, user.id!);

  // Step 8: Application Form
  if (!student.applicationId) {
    const { applicationForm, transferredAdmCourseDetails } =
      await oldAdmPersonalDetailsHelper.processOldStudentApplicationForm(
        oldStudent,
        student,
      );
    await db
      .update(studentModel)
      .set({
        applicationId: applicationForm.id,
        admissionCourseDetailsId: transferredAdmCourseDetails.id!,
      })
      .where(eq(studentModel.id, student.id));
  }

  // Step 9: Promotion

  return student;
}

export async function addPromotion(
  studentId: number,
  applicationForm: ApplicationForm,
  oldStudentId: number,
  admissionCourseDetails: AdmissionCourseDetails,
) {
  const [foundAdmission] = await db
    .select()
    .from(admissionModel)
    .where(eq(admissionModel.id, applicationForm.admissionId!));

  const [[oldHistoricalRecord]] = (await mysqlConnection.query(`
        SELECT * FROM historicalrecord WHERE parent_id = ${oldStudentId}
    `)) as [OldHistoricalRecord[], any];

  const [foundSession] = await db
    .select()
    .from(sessionModel)
    .where(eq(sessionModel.id, foundAdmission?.sessionId!));

  const foundClass = await oldAdmPersonalDetailsHelper.addClass(
    oldHistoricalRecord?.classId!,
  );

  const [foundAdmissionProgramCourse] = await db
    .select()
    .from(admissionProgramCourseModel)
    .where(
      eq(
        admissionProgramCourseModel.id,
        admissionCourseDetails.admissionProgramCourseId,
      ),
    );

  const [foundProgramCourse] = await db
    .select()
    .from(programCourseModel)
    .where(
      eq(programCourseModel.id, foundAdmissionProgramCourse?.programCourseId!),
    );

  const [[oldPromotionStatus]] = (await mysqlConnection.query(`
        SELECT * FROM promotionstatus WHERE id = ${oldHistoricalRecord?.promotionstatus}
    `)) as [OldPromotionStatus[], any];

  let [foundPromotionStatus] = await db
    .select()
    .from(promotionStatusModel)
    .where(
      eq(promotionStatusModel.legacyPromotionStatusId, oldPromotionStatus?.id!),
    );

  if (!foundPromotionStatus) {
    foundPromotionStatus = (
      await db
        .insert(promotionStatusModel)
        .values({
          legacyPromotionStatusId: oldPromotionStatus?.id!,
          name: oldPromotionStatus?.name!,
          type: oldPromotionStatus?.spltype.toUpperCase().trim() as
            | "REGULAR"
            | "READMISSION"
            | "CASUAL",
        })
        .returning()
    )[0];
  }

  let foundBoardResultStatus: BoardResultStatus | undefined;
  if (oldHistoricalRecord?.boardresultid) {
    foundBoardResultStatus = (
      await db
        .select()
        .from(boardResultStatusModel)
        .where(
          eq(
            boardResultStatusModel.legacyBoardResultStatusId,
            oldHistoricalRecord?.boardresultid!,
          ),
        )
    )[0];

    if (!foundBoardResultStatus) {
      const [[oldBoardResultStatus]] = (await mysqlConnection.query(`
                SELECT * FROM boardresultstatus WHERE id = ${oldHistoricalRecord?.boardresultid}
            `)) as [OldBoardResultStatus[], any];
      foundBoardResultStatus = (
        await db
          .insert(boardResultStatusModel)
          .values({
            legacyBoardResultStatusId: oldBoardResultStatus?.id!,
            name: oldBoardResultStatus?.name!,
            spclType: oldBoardResultStatus?.spcltype,
          })
          .returning()
      )[0];
    }
  }

  const foundSection = await oldAdmPersonalDetailsHelper.addSection(
    oldHistoricalRecord?.sectionId!,
  );

  const shift = await oldAdmPersonalDetailsHelper.upsertShift(
    oldHistoricalRecord?.shiftId!,
  );

  const [existingPromotion] = await db
    .select()
    .from(promotionModel)
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        eq(promotionModel.sectionId, foundSection?.id!),
        eq(promotionModel.programCourseId, foundProgramCourse?.id!),
        eq(promotionModel.sessionId, foundSession?.id!),
        eq(promotionModel.shiftId, shift?.id!),
        eq(promotionModel.classId, foundClass?.id!),
        eq(
          promotionModel.classRollNumber,
          String(oldHistoricalRecord?.rollNo!),
        ),
        eq(promotionModel.promotionStatusId, foundPromotionStatus?.id!),
      ),
    );

  if (existingPromotion) {
    await db
      .update(promotionModel)
      .set({
        studentId: studentId,
        sectionId: foundSection?.id,
        legacyHistoricalRecordId: oldHistoricalRecord?.id!,
        programCourseId: foundProgramCourse?.id!,
        sessionId: foundSession?.id!,
        shiftId: shift?.id!,
        classId: foundClass?.id!,
        classRollNumber: String(oldHistoricalRecord?.rollNo!),
        dateOfJoining: toDate(oldHistoricalRecord?.dateofJoining),
        promotionStatusId: foundPromotionStatus?.id!,
        boardResultStatusId: foundBoardResultStatus?.id!,
        startDate: toDate(oldHistoricalRecord?.startDate) ?? null,
        endDate: toDate(oldHistoricalRecord?.endDate) ?? null,
        remarks: oldHistoricalRecord?.specialisation,
        rollNumber: oldHistoricalRecord?.univrollno,
        rollNumberSI: oldHistoricalRecord?.univrollnosi,
        examNumber: oldHistoricalRecord?.exmno,
        examSerialNumber: oldHistoricalRecord?.exmsrl,
      })
      .where(eq(promotionModel.id, existingPromotion.id));
  } else {
    await db.insert(promotionModel).values({
      studentId: studentId,
      sectionId: foundSection?.id,
      legacyHistoricalRecordId: oldHistoricalRecord?.id!,
      programCourseId: foundProgramCourse?.id!,
      sessionId: foundSession?.id!,
      shiftId: shift?.id!,
      classId: foundClass?.id!,
      classRollNumber: String(oldHistoricalRecord?.rollNo!),
      dateOfJoining: toDate(oldHistoricalRecord?.dateofJoining),
      promotionStatusId: foundPromotionStatus?.id!,
      boardResultStatusId: foundBoardResultStatus?.id!,
      startDate: toDate(oldHistoricalRecord?.startDate) ?? null,
      endDate: toDate(oldHistoricalRecord?.endDate) ?? null,
      remarks: oldHistoricalRecord?.specialisation,
      rollNumber: oldHistoricalRecord?.univrollno,
      rollNumberSI: oldHistoricalRecord?.univrollnosi,
      examNumber: oldHistoricalRecord?.exmno,
      examSerialNumber: oldHistoricalRecord?.exmsrl,
    } as PromotionInsertSchema);
  }
}

// async function addPersonalDetails(
//     oldDetails: OldAdmStudentPersonalDetail | OldStaff | OldStudent,
//     link: { admissionGeneralInfoId?: number; userId?: number },
// ) {
//     const isStaff = (d: OldAdmStudentPersonalDetail | OldStaff): d is OldStaff =>
//         "isTeacher" in d;
//     const isAdmStudent = (
//         d: OldAdmStudentPersonalDetail | OldStaff,
//     ): d is OldAdmStudentPersonalDetail => "applevel" in d;
//     const isOldStudent = (
//         d: OldAdmStudentPersonalDetail | OldStaff | OldStudent,
//     ): d is OldStudent => "admissionId" in d;

//     if (!isStaff(oldDetails) && !isAdmStudent(oldDetails) && !isOldStudent(oldDetails)) {
//         throw new Error("Invalid old details type");
//     }

//     // Prepare address inputs per type
//     const mailingAddressLine = isStaff(oldDetails)
//         ? oldDetails.mailingAddress
//         : oldDetails.mailingAddress;
//     const mailingPin = isStaff(oldDetails)
//         ? oldDetails.mailingPinNo
//         : oldDetails.mailingPinNo;
//     const mailingCountryLegacy = isStaff(oldDetails)
//         ? (oldDetails.mcountryid ?? null)
//         : (oldDetails.newcountryId ?? oldDetails.countryId ?? null);
//     const mailingStateLegacy = isStaff(oldDetails)
//         ? (oldDetails.mstateid ?? null)
//         : (oldDetails.newstateId ?? null);
//     const mailingCityLegacy = isStaff(oldDetails)
//         ? (oldDetails.mcityid ?? null)
//         : (oldDetails.newcityId ?? null);
//     const mailingDistrictLegacy = isStaff(oldDetails)
//         ? null
//         : (oldDetails.newDistrictId ?? null);
//     const mailingOtherState = isStaff(oldDetails)
//         ? (oldDetails.mothstate ?? null)
//         : (oldDetails.othernewState ?? oldDetails.otherState ?? null);
//     const mailingOtherCity = isStaff(oldDetails)
//         ? (oldDetails.mothcity ?? null)
//         : (oldDetails.othernewCity ?? oldDetails.otherCity ?? null);
//     const mailingPostOfficeId = isStaff(oldDetails)
//         ? null
//         : (oldDetails.newpostofficeid ?? null);
//     const mailingOtherPostOffice = isStaff(oldDetails)
//         ? null
//         : (oldDetails.othernewpostoffice ?? null);
//     const mailingPoliceStationId = isStaff(oldDetails)
//         ? null
//         : (oldDetails.newpolicestationid ?? null);
//     const mailingOtherPoliceStation = isStaff(oldDetails)
//         ? null
//         : (oldDetails.othernewpolicestation ?? null);

//     const residentialAddressLine = isStaff(oldDetails)
//         ? oldDetails.residentialAddress
//         : oldDetails.parmanentAddress;
//     const resiPin = isStaff(oldDetails)
//         ? oldDetails.resiPinNo
//         : oldDetails.resiPinNo;
//     const resiPhone = isStaff(oldDetails)
//         ? oldDetails.resiPhoneMobileNo
//         : oldDetails.studentPersonalContactNo ||
//         oldDetails.studentcontactNo ||
//         oldDetails.contactNo ||
//         null;
//     const resiCountryLegacy = isStaff(oldDetails)
//         ? (oldDetails.rcountryid ?? null)
//         : (oldDetails.countryId ?? null);
//     const resiStateLegacy = isStaff(oldDetails)
//         ? (oldDetails.rstateid ?? null)
//         : (oldDetails.resiStateId ?? null);
//     const resiCityLegacy = isStaff(oldDetails)
//         ? (oldDetails.rcityid ?? null)
//         : (oldDetails.cityId ?? null);
//     const resiDistrictLegacy = isStaff(oldDetails)
//         ? null
//         : (oldDetails.resiDistrictId ?? null);
//     const resiOtherState = isStaff(oldDetails)
//         ? (oldDetails.rothstate ?? null)
//         : (oldDetails.otherState ?? null);
//     const resiOtherCity = isStaff(oldDetails)
//         ? (oldDetails.rothcity ?? null)
//         : (oldDetails.otherCity ?? null);
//     const resiOtherDistrict = isStaff(oldDetails)
//         ? null
//         : (oldDetails.otherresiDistrict ?? null);
//     const resiPostOfficeId = isStaff(oldDetails)
//         ? null
//         : (oldDetails.resipostofficeid ?? null);
//     const resiOtherPostOffice = isStaff(oldDetails)
//         ? null
//         : (oldDetails.otherresipostoffice ?? null);
//     const resiPoliceStationId = isStaff(oldDetails)
//         ? null
//         : (oldDetails.resipolicestationid ?? null);
//     const resiOtherPoliceStation = isStaff(oldDetails)
//         ? null
//         : (oldDetails.otherresipolicestation ?? null);

//     // Validate linkage requirements
//     if (isAdmStudent(oldDetails)) {
//         if (!link.admissionGeneralInfoId) {
//             throw new Error("admissionGeneralInfoId is required for OldAdmStudentPersonalDetail");
//         }
//     } else {
//         if (!link.userId) {
//             throw new Error("userId is required for OldStaff or OldStudent");
//         }
//     }

//     let mailingAddress: Address | undefined;
//     if (
//         mailingAddressLine ||
//         mailingPin ||
//         mailingCountryLegacy ||
//         mailingStateLegacy ||
//         mailingCityLegacy ||
//         mailingDistrictLegacy
//     ) {
//         const stateResolved = mailingStateLegacy
//             ? await addState(mailingStateLegacy)
//             : null;
//         const cityResolved = mailingCityLegacy
//             ? await addCity(mailingCityLegacy)
//             : null;
//         const districtResolved = mailingDistrictLegacy
//             ? await addDistrict(mailingDistrictLegacy)
//             : null;
//         const [address] = await db
//             .insert(addressModel)
//             .values({
//                 countryId: mailingCountryLegacy || undefined,
//                 stateId: stateResolved?.id || undefined,
//                 cityId: cityResolved?.id || undefined,
//                 districtId: districtResolved?.id || undefined,
//                 otherState: mailingOtherState || undefined,
//                 otherCity: mailingOtherCity || undefined,
//                 otherDistrict: isAdmStudent(oldDetails)
//                     ? ((oldDetails.othernewDistrict || undefined) as string | undefined)
//                     : undefined,
//                 postofficeId: mailingPostOfficeId || undefined,
//                 otherPostoffice: mailingOtherPostOffice || undefined,
//                 policeStationId: mailingPoliceStationId || undefined,
//                 otherPoliceStation: mailingOtherPoliceStation || undefined,
//                 addressLine: mailingAddressLine?.trim(),
//                 pincode: mailingPin?.trim(),
//                 localityType: null,
//             })
//             .returning();
//         mailingAddress = address;
//     }

//     let residentialAddress: Address | undefined;
//     if (
//         residentialAddressLine ||
//         resiPin ||
//         resiPhone ||
//         resiCountryLegacy ||
//         resiStateLegacy ||
//         resiCityLegacy ||
//         resiDistrictLegacy
//     ) {
//         const stateResolved = resiStateLegacy
//             ? await addState(resiStateLegacy)
//             : null;
//         const cityResolved = resiCityLegacy ? await addCity(resiCityLegacy) : null;
//         const districtResolved = resiDistrictLegacy
//             ? await addDistrict(resiDistrictLegacy)
//             : null;
//         const [address] = await db
//             .insert(addressModel)
//             .values({
//                 countryId: resiCountryLegacy || undefined,
//                 stateId: stateResolved?.id || undefined,
//                 cityId: cityResolved?.id || undefined,
//                 districtId: districtResolved?.id || undefined,
//                 otherDistrict: isAdmStudent(oldDetails)
//                     ? ((oldDetails.otherresiDistrict || undefined) as string | undefined)
//                     : undefined,
//                 otherState: resiOtherState || undefined,
//                 otherCity: resiOtherCity || undefined,
//                 postofficeId: resiPostOfficeId || undefined,
//                 otherPostoffice: resiOtherPostOffice || undefined,
//                 policeStationId: resiPoliceStationId || undefined,
//                 otherPoliceStation: resiOtherPoliceStation || undefined,
//                 addressLine: residentialAddressLine?.trim(),
//                 phone: resiPhone?.trim() || undefined,
//                 pincode: resiPin?.trim(),
//                 localityType: null,
//             })
//             .returning();
//         residentialAddress = address;
//     }

//     // Core personal details
//     const fullName = isStaff(oldDetails)
//         ? oldDetails.name || ""
//         : (
//             (oldDetails.firstName || "") +
//             " " +
//             (oldDetails.middleName || "") +
//             " " +
//             (oldDetails.lastName || "")
//         ).trim();
//     const firstName = fullName.split(" ")[0] || "";

//     const mobileNumber = isStaff(oldDetails)
//         ? oldDetails.phoneMobileNo || oldDetails.contactNo || ""
//         : oldDetails.studentPersonalContactNo ||
//         oldDetails.studentcontactNo ||
//         oldDetails.contactNo ||
//         "";

//     // Normalize a value to a pure YYYY-MM-DD string to avoid timezone shifts
//     const toISODateOnly = (value: unknown): string | undefined => {
//         if (!value) return undefined;
//         if (typeof value === "string") {
//             const trimmed = value.trim();
//             // If already in YYYY-MM-DD, keep as-is
//             const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
//             if (isoDateOnly.test(trimmed)) return trimmed;
//             const parsed = new Date(trimmed);
//             if (isNaN(parsed.getTime())) return undefined;
//             // Build a UTC date to avoid local-TZ off-by-one
//             const utc = new Date(
//                 Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
//             )
//                 .toISOString()
//                 .slice(0, 10);
//             return utc;
//         }
//         if (value instanceof Date) {
//             const utc = new Date(
//                 Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
//             )
//                 .toISOString()
//                 .slice(0, 10);
//             return utc;
//         }
//         return undefined;
//     };

//     const dateOfBirthVal: Date | string | null | undefined = isStaff(oldDetails)
//         ? oldDetails.dateOfBirth
//         : oldDetails.dateOfBirth;
//     const dateOfBirthISO = toISODateOnly(dateOfBirthVal as any);
//     const sexId = isStaff(oldDetails) ? oldDetails.sexId : oldDetails.sexId;
//     const gender = sexId === 0 ? undefined : sexId === 1 ? "MALE" : "FEMALE";
//     const aadhaar = isStaff(oldDetails)
//         ? oldDetails.aadharNo
//         : oldDetails.adhaarcardno;
//     const placeOfBirth = isStaff(oldDetails)
//         ? undefined
//         : oldDetails.placeofBirth || undefined;
//     const whatsappNumber = isStaff(oldDetails)
//         ? undefined
//         : oldDetails.whatsappno || undefined;
//     const emergencyContactNumber = isStaff(oldDetails)
//         ? undefined
//         : oldDetails.emergencycontactno || undefined;
//     const isGujarati = isStaff(oldDetails)
//         ? false
//         : (oldDetails.community || "") === "GUJARATI";

//     // Additional personal details fields
//     const voterId = isStaff(oldDetails) ? oldDetails.voterIdNo : undefined;
//     const passportNumber = isStaff(oldDetails)
//         ? oldDetails.passportNo
//         : undefined;
//     const maritalStatus = isStaff(oldDetails)
//         ? oldDetails.maritalStatus === 1
//             ? "MARRIED"
//             : oldDetails.maritalStatus === 2
//                 ? "UNMARRIED"
//                 : oldDetails.maritalStatus === 3
//                     ? "DIVORCED"
//                     : oldDetails.maritalStatus === 4
//                         ? "WIDOWED"
//                         : undefined
//         : oldDetails.maritialStatus === "Married"
//             ? "MARRIED"
//             : oldDetails.maritialStatus === "Unmarried"
//                 ? "UNMARRIED"
//                 : oldDetails.maritialStatus === "Divorced"
//                     ? "DIVORCED"
//                     : oldDetails.maritialStatus === "Widowed"
//                         ? "WIDOWED"
//                         : undefined;

//     // Resolve personal detail foreign keys
//     let nationalityId: number | undefined;
//     if (
//         isStaff(oldDetails) ? oldDetails.nationalityId : oldDetails.nationalityId
//     ) {
//         const natId = isStaff(oldDetails)
//             ? oldDetails.nationalityId
//             : oldDetails.nationalityId;
//         const [rows] = (await mysqlConnection.query(
//             `SELECT * FROM nationality WHERE id = ${natId}`,
//         )) as [{ id: number; nationalityName: string; code: number }[], any];
//         if (rows.length > 0) {
//             const nat = await addNationality(rows[0].nationalityName, rows[0].code);
//             nationalityId = nat.id;
//         }
//     }
//     // let otherNationalityId: number | undefined;
//     // if (!isStaff(oldDetails) && oldDetails.othernationality) {
//     //     const [rows] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldDetails.othernationality}`) as [{ id: number, nationalityName: string, code: number }[], any];
//     //     if (rows.length > 0) {
//     //         const nat = await addNationality(rows[0].nationalityName, rows[0].code);
//     //         otherNationalityId = nat.id;
//     //     }
//     // }
//     let religionId: number | undefined;
//     if (isStaff(oldDetails) ? oldDetails.religionId : oldDetails.religionId) {
//         const relId = isStaff(oldDetails)
//             ? oldDetails.religionId
//             : oldDetails.religionId;
//         const [rows] = (await mysqlConnection.query(
//             `SELECT * FROM religion WHERE id = ${relId}`,
//         )) as [{ id: number; religionName: string }[], any];
//         if (rows.length > 0) {
//             const rel = await addReligion(rows[0].religionName, relId!);
//             religionId = rel.id;
//         }
//     }
//     let motherTongueId: number | undefined;
//     if (isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId) {
//         const mtId = Number(
//             isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId,
//         )!;
//         const [rows] = (await mysqlConnection.query(
//             `SELECT * FROM mothertongue WHERE id = ${mtId}`,
//         )) as [{ id: number; mothertongueName: string }[], any];
//         if (rows.length > 0) {
//             const mt = await addLanguageMedium(rows[0].mothertongueName, mtId);
//             motherTongueId = mt.id;
//         }
//     }
//     let categoryId: number | undefined;
//     if (
//         isStaff(oldDetails) ? oldDetails.studentCategoryId : oldDetails.categoryId
//     ) {
//         const catId = isStaff(oldDetails)
//             ? oldDetails.studentCategoryId!
//             : oldDetails.categoryId!;
//         const [rows] = (await mysqlConnection.query(
//             `SELECT * FROM category WHERE id = ${catId}`,
//         )) as [
//                 {
//                     id: number;
//                     category: string;
//                     code: string;
//                     docneeded: boolean | undefined;
//                 }[],
//                 any,
//             ];
//         if (rows.length > 0) {
//             const cat = await addCategory(
//                 rows[0].category,
//                 rows[0].code,
//                 rows[0].docneeded,
//                 catId,
//             );
//             categoryId = cat.id;
//         }
//     }

//     const [newPersonalDetails] = await db
//         .insert(personalDetailsModel)
//         .values({
//             admissionGeneralInfoId: isAdmStudent(oldDetails)
//                 ? (link.admissionGeneralInfoId as number)
//                 : undefined,
//             userId: !isAdmStudent(oldDetails)
//                 ? (link.userId as number)
//                 : undefined,
//             firstName,
//             middleName: isStaff(oldDetails)
//                 ? undefined
//                 : ((oldDetails.middleName || undefined) as string | undefined),
//             lastName: isStaff(oldDetails)
//                 ? undefined
//                 : ((oldDetails.lastName || undefined) as string | undefined),
//             mobileNumber: mobileNumber?.toString(),
//             whatsappNumber: whatsappNumber as string | undefined,
//             emergencyContactNumber: emergencyContactNumber as string | undefined,
//             // Store as YYYY-MM-DD string to prevent off-by-one due to timezone
//             dateOfBirth: dateOfBirthISO as unknown as string | null | undefined,
//             placeOfBirth: placeOfBirth as string | undefined,
//             gender: gender as any,
//             voterId: voterId as string | undefined,
//             passportNumber: passportNumber as string | undefined,
//             aadhaarCardNumber: aadhaar || undefined,
//             nationalityId,
//             otherNationality:
//                 "othernationality" in oldDetails && oldDetails.othernationality
//                     ? oldDetails.othernationality
//                     : undefined,
//             religionId,
//             categoryId,
//             motherTongueId,
//             maritalStatus: maritalStatus as any,
//             isGujarati: isGujarati || false,
//             mailingAddressId: mailingAddress
//                 ? (mailingAddress.id as number)
//                 : undefined,
//             residentialAddressId: residentialAddress
//                 ? (residentialAddress.id as number)
//                 : undefined,
//         })
//         .returning();

//     return newPersonalDetails;
// }

async function addStudentCategory(oldStudentCategoryId: number | null) {
  if (!oldStudentCategoryId) return null;

  const [[studentCategoryRow]] = (await mysqlConnection.query(
    `SELECT * FROM studentcatagory WHERE id = ${oldStudentCategoryId}`,
  )) as [OldStudentCategory[], any];

  if (!studentCategoryRow) return null;

  const [foundStudentCategory] = await db
    .select()
    .from(studentCategoryModel)
    .where(
      ilike(studentCategoryModel.name, studentCategoryRow.studentCName.trim()),
    );

  if (foundStudentCategory) return foundStudentCategory;

  const course = await addCourse(studentCategoryRow.courseId);
  const classSem = await addClass(studentCategoryRow.classId);

  if (!course || !classSem) {
    return null;
  }

  return (
    await db
      .insert(studentCategoryModel)
      .values({
        legacyStudentCategoryId: oldStudentCategoryId,
        name: studentCategoryRow.studentCName.trim(),
        courseId: course?.id,
        classId: classSem?.id,
        documentRequired: !!studentCategoryRow.document,
      })
      .returning()
  )[0];
}

async function addClass(oldClassId: number | null) {
  if (!oldClassId) return null;

  const [[classRow]] = (await mysqlConnection.query(
    `SELECT * FROM classes WHERE id = ${oldClassId}`,
  )) as [OldClass[], any];

  if (!classRow) return null;

  const [foundClass] = await db
    .select()
    .from(classModel)
    .where(ilike(classModel.name, classRow.classname!.trim()));

  if (foundClass) return foundClass;

  //   return (
  //     await db
  //       .insert(classModel)
  //       .values({
  //         name: classRow.classname!.trim(),
  //         type: classRow.type === "year" ? "YEAR" : "SEMESTER",
  //       })
  //       .returning()
  //   )[0];
}

async function addStream(stream: Stream) {
  const [foundStream] = await db
    .select()
    .from(streamModel)
    .where(ilike(streamModel.name, stream.name.trim()));

  if (foundStream) return foundStream;

  return (await db.insert(streamModel).values(stream).returning())[0];
}

async function addCourse(oldCourseId: number | null) {
  if (!oldCourseId) return null;
  const [[courseRow]] = (await mysqlConnection.query(
    `SELECT * FROM course WHERE id = ${oldCourseId}`,
  )) as [OldCourse[], any];

  if (!courseRow) return null;

  const [foundCourse] = await db
    .select()
    .from(courseModel)
    .where(ilike(courseModel.name, courseRow.courseName.trim()));

  if (foundCourse) return foundCourse;

  // Get the next available sequence number by finding the max sequence
  //   const existingCourses = await db
  //     .select({ sequence: courseModel.sequence })
  //     .from(courseModel)
  //     .orderBy(courseModel.sequence);

  //   // Find the highest sequence number and add 1
  //   const maxSequence =
  //     existingCourses.length > 0
  //       ? Math.max(...existingCourses.map((c) => c.sequence || 0))
  //       : 0;
  //   const nextSequence = maxSequence + 1;

  //   return (
  //     await db
  //       .insert(courseModel)
  //       .values({
  //         name: courseRow.courseName.trim(),
  //         shortName: courseRow.courseSName?.trim(),
  //         legacyCourseId: oldCourseId,
  //         sequence: nextSequence,
  //       })
  //       .returning()
  //   )[0];
}

async function addEligibilityCriteria(oldEligibilityId: number | null) {
  if (!oldEligibilityId) return null;
  const [[eligibilityRow]] = (await mysqlConnection.query(
    `SELECT * FROM eligibilitycriteria WHERE id = ${oldEligibilityId}`,
  )) as [OldEligibilityCriteria[], any];

  if (!eligibilityRow) return null;

  const [foundEligibilityCriteria] = await db
    .select()
    .from(eligibilityCriteriaModel)
    .where(
      and(
        eq(eligibilityCriteriaModel.courseId, eligibilityRow.courseId),
        eq(eligibilityCriteriaModel.classId, eligibilityRow.classId),
        eq(eligibilityCriteriaModel.categoryId, eligibilityRow.categoryId),
      ),
    );

  if (foundEligibilityCriteria) return foundEligibilityCriteria;

  return (
    await db
      .insert(eligibilityCriteriaModel)
      .values({
        legacyEligibilityCriteriaId: oldEligibilityId,
        courseId: eligibilityRow.courseId,
        classId: eligibilityRow.classId,
        categoryId: eligibilityRow.categoryId,
        description: eligibilityRow.description?.trim(),
        generalInstruction: eligibilityRow.generalInstruction?.trim(),
      })
      .returning()
  )[0];
}

async function addShift(oldShiftId: number | null) {
  if (!oldShiftId) return null;

  const [[shiftRow]] = (await mysqlConnection.query(
    `SELECT * FROM shift WHERE id = ${oldShiftId}`,
  )) as [OldShift[], any];

  if (!shiftRow) return null;

  const [foundShift] = await db
    .select()
    .from(shiftModel)
    .where(ilike(shiftModel.name, shiftRow.shiftName.trim()));

  if (foundShift) return foundShift;

  return (
    await db
      .insert(shiftModel)
      .values({
        legacyShiftId: oldShiftId,
        name: shiftRow.shiftName.trim(),
        codePrefix: shiftRow.codeprefix?.trim(),
      })
      .returning()
  )[0];
}

async function addMeritList(oldMeritListId: number | null) {
  if (!oldMeritListId) return null;

  const [[meritListRow]] = (await mysqlConnection.query(
    `SELECT * FROM meritlist WHERE id = ${oldMeritListId}`,
  )) as [OldMeritList[], any];

  if (!meritListRow) return null;

  const [foundMeritList] = await db
    .select()
    .from(meritListModel)
    .where(ilike(meritListModel.name, meritListRow.name.trim()));

  if (foundMeritList) return foundMeritList;

  return (
    await db
      .insert(meritListModel)
      .values({
        legacyMeritListId: oldMeritListId,
        name: meritListRow.name.trim(),
        description: meritListRow.description.trim(),
        checkAuto: meritListRow.checkauto === 1, // Convert 0 or 1 to boolean
      })
      .returning()
  )[0];
}

async function addBank(oldBankId: number | null) {
  if (!oldBankId) return null;

  const [[bankRow]] = (await mysqlConnection.query(
    `SELECT * FROM adminbank WHERE id = ${oldBankId}`,
  )) as [OldBank[], any];

  if (!bankRow) return null;

  const [foundBank] = await db
    .select()
    .from(bankModel)
    .where(ilike(bankModel.name, bankRow.bankName.trim()));

  if (foundBank) return foundBank;

  return (
    await db
      .insert(bankModel)
      .values({
        legacyBankId: oldBankId,

        name: bankRow.bankName.trim(),
      })
      .returning()
  )[0];
}

async function addBankBranch(oldBankBranchId: number | null) {
  if (!oldBankBranchId) return null;

  const [[bankBranchRow]] = (await mysqlConnection.query(
    `SELECT * FROM bankbranch WHERE id = ${oldBankBranchId}`,
  )) as [OldBankBranch[], any];

  const bank = await addBank(bankBranchRow?.bankid ?? null);

  if (!bank || !bankBranchRow) return null;

  const [foundBankBranch] = await db
    .select()
    .from(bankBranchModel)
    .where(
      and(
        eq(bankBranchModel.bankId, bank.id!),
        ilike(bankBranchModel.name, bankBranchRow.name.trim()),
      ),
    );

  if (foundBankBranch) return foundBankBranch;

  return (
    await db
      .insert(bankBranchModel)
      .values({
        legacyBankBranchId: oldBankBranchId,
        name: bankBranchRow.name.trim(),
        bankId: bank.id!,
      })
      .returning()
  )[0];
}

// This function is storing the minor subjects selected during admission-application form phas after merit list is generated.
async function addAdmSubjectPaperSelection(
  cvSubjectSelectionRow: OldCvSubjectSelection,
  studentId: number,
  admissionCourseDetailsId: number,
  paperId: number,
) {
  console.log("cvSubjectSelectionRow", cvSubjectSelectionRow);
  if (!cvSubjectSelectionRow) return null;

  const [foundAdmSbjPprSelection] = await db
    .select()
    .from(admSubjectPaperSelectionModel)
    .where(
      and(
        eq(
          admSubjectPaperSelectionModel.legacyCVSubjectSelectionId,
          cvSubjectSelectionRow.id,
        ),
        eq(admSubjectPaperSelectionModel.studentId, studentId),
        eq(
          admSubjectPaperSelectionModel.admissionCourseDetailsId,
          admissionCourseDetailsId,
        ),
        eq(admSubjectPaperSelectionModel.paperId, paperId),
      ),
    );

  if (foundAdmSbjPprSelection) return foundAdmSbjPprSelection;

  return (
    await db
      .insert(admSubjectPaperSelectionModel)
      .values({
        legacyCVSubjectSelectionId: cvSubjectSelectionRow.id,
        studentId,
        admissionCourseDetailsId,
        paperId,
      })
      .returning()
  )[0];
}
