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
} from "@repo/db/schemas/models";
import {
    OldAdmStudentPersonalDetail,
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
import { OldStaff, OldStudent } from "@repo/db/legacy-system-types/users";
import {
    addCity,
    addCountry,
    addDistrict,
    addState,
    loadData,
    loadOldBoards,
} from "./old-student.service";

const BATCH_SIZE = 500; // Number of rows per batch

type DbType = NodePgDatabase<Record<string, never>> & {
    $client: Pool;
};

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

export async function addStaff(oldStaffId: number, user: User) {
    const [existingStaff] = await db
        .select()
        .from(staffModel)
        .where(eq(staffModel.userId, user.id as number));
    if (existingStaff) {
        return existingStaff;
    }

    const [[oldStaff]] = (await mysqlConnection.query(`
          SELECT *
          FROM staffpersonaldetails
          WHERE id = ${oldStaffId}
          `)) as [OldStaff[], any];

    if (!oldStaff) {
        return null;
    }

    const shift = await addShift(oldStaff.empShiftId);

    const personalDetails = await addPersonalDetails(oldStaff);

    const familyDetails = await addFamily(oldStaff);

    const studentCategory = await addStudentCategory(oldStaff.studentCategoryId);

    const health = await addHealth(oldStaff);

    const emergencyContact = await addEmergencyContact({
        personName: oldStaff.emergencyname ?? undefined,
        havingRelationAs: oldStaff.emergencyrelationship ?? undefined,
        email: undefined,
        phone: oldStaff.emergencytelmobile ?? undefined,
        officePhone: oldStaff.emergencytellandno ?? undefined,
        residentialPhone: undefined,
    } as EmergencyContact);

    // Previous employer address if present
    let previousEmployeeAddressId: number | undefined = undefined;
    if (oldStaff.privempaddrs) {
        const [addr] = await db
            .insert(addressModel)
            .values({
                addressLine: oldStaff.privempaddrs.trim(),
                localityType: null,
            } as any)
            .returning();
        previousEmployeeAddressId = addr.id as number;
    }

    const bank = await addBank(oldStaff.bankid);
    let board: Board | undefined = undefined;
    if (oldStaff.board) {
        const [existingBoard] = await db
            .select()
            .from(boardModel)
            .where(eq(boardModel.name, oldStaff.board.trim()));
        if (!existingBoard) {
            const [newBoard] = await db
                .insert(boardModel)
                .values({
                    name: oldStaff.board.trim(),
                })
                .returning();
            board = newBoard;
        } else {
            board = existingBoard;
        }
    }

    const [newStaff] = await db
        .insert(staffModel)
        .values({
            userId: user.id as number,
            boardId: board?.id ?? undefined,
            attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
            uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
            codeNumber: oldStaff.codeNumber ?? undefined,
            shiftId: shift?.id ?? undefined,
            gratuityNumber: oldStaff.gratuityno ?? undefined,
            personalDetailsId: personalDetails?.id ?? undefined,
            familyDetailsId: familyDetails?.id ?? undefined,
            studentCategoryId: studentCategory?.id ?? undefined,
            healthId: health?.id ?? undefined,
            emergencyContactId: emergencyContact?.id ?? undefined,
            computerOperationKnown: !!oldStaff.computeroperationknown,
            bankBranchId: undefined,
            // Optional academic links not resolvable from legacy staff payload
            bankAccountNumber: oldStaff.bankAccNo ?? undefined,
            banlIfscCode: oldStaff.bankifsccode ?? undefined,
            bankAccountType: oldStaff.bankacctype
                ? (((t) =>
                    t === "SAVINGS" ||
                        t === "CURRENT" ||
                        t === "FIXED_DEPOSIT" ||
                        t === "RECURRING_DEPOSIT" ||
                        t === "OTHER"
                        ? t
                        : "OTHER")(String(oldStaff.bankacctype).trim()) as any)
                : undefined,
            providentFundAccountNumber: oldStaff.providentFundAccNo ?? undefined,
            panNumber: oldStaff.panNo ?? undefined,
            esiNumber: oldStaff.esiNo ?? undefined,
            impNumber: oldStaff.impNo ?? undefined,
            clinicAddress: oldStaff.clinicAddress ?? undefined,
            hasPfNomination: !!oldStaff.pfnomination,
            childrens: oldStaff.childrens ?? undefined,
            majorChildName: oldStaff.majorChildName ?? undefined,
            majorChildPhone: oldStaff.majorChildContactNo ?? undefined,
            previousEmployeeName: oldStaff.privempnm ?? undefined,
            previousEmployeePhone: undefined,
            previousEmployeeAddressId: previousEmployeeAddressId,
            gratuityNominationDate: oldStaff.gratuitynominationdt
                ? new Date(oldStaff.gratuitynominationdt as any)
                : undefined,
            univAccountNumber: oldStaff.univAccNo ?? undefined,
            dateOfConfirmation: oldStaff.dateofconfirmation
                ? new Date(oldStaff.dateofconfirmation)
                : undefined,
            dateOfProbation: oldStaff.dateofprobation
                ? new Date(oldStaff.dateofprobation)
                : undefined,
        })
        .returning();

    let name = oldStaff.name ?? "";
    if (personalDetails?.middleName) {
        name += `${personalDetails?.middleName}`;
    }
    if (personalDetails?.lastName) {
        name += ` ${personalDetails?.lastName}`;
    }

    await db
        .update(userModel)
        .set({
            name,
        })
        .where(eq(userModel.id, user.id as number));

    return newStaff;
}

export async function addStudent(
    oldStudent: OldStudent,
    user: User,
    db: DbType,
) {
    const [existingStudent] = await db
        .select()
        .from(studentModel)
        .where(eq(studentModel.userId, user.id as number));
    if (existingStudent) {
        return existingStudent;
    }

    let level: "UNDER_GRADUATE" | "POST_GRADUATE" | undefined;
    if (
        oldStudent.codeNumber.startsWith("11") ||
        oldStudent.codeNumber.startsWith("14")
    ) {
        level = "POST_GRADUATE";
    } else if (!oldStudent.codeNumber.startsWith("B")) {
        level = "UNDER_GRADUATE";
    }

    // Determine the active and alumni status based on oldStudent data
    // let active: boolean | undefined = oldStudent.active;
    // let alumni: boolean | undefined = oldStudent.alumni;

    // if (oldStudent.leavingdate) {
    //     active = false; // If leaving date is present, student has left
    //     alumni = true;  // Mark as alumni
    // } else if (!oldStudent.alumni && !oldStudent.active) {
    //     active = false; // Dropped off
    // } else if (oldStudent.alumni && !oldStudent.active) {
    //     active = false; // Fully graduated and left
    // } else if (!oldStudent.alumni && oldStudent.active) {
    //     active = true; // Regular student
    // } else if (oldStudent.alumni && oldStudent.active) {
    //     active = true; // Graduated but has supplementary papers left
    // }

    const [newStudent] = await db
        .insert(studentModel)
        .values({
            userId: user.id as number,
            legacyStudentId: oldStudent.id,
            uid: oldStudent.codeNumber.trim()?.toUpperCase(),
            applicationId: null,
            programCourseId: 1, // TODO: This should be set properly after course details are processed
            shiftId: 1, // TODO: This should be set properly after course details are processed
            community:
                oldStudent.communityid === 0 || oldStudent.communityid === null
                    ? null
                    : oldStudent.communityid === 1
                        ? "GUJARATI"
                        : "NON-GUJARATI",
            handicapped: !!oldStudent.handicapped,
        })
        .returning();

    return newStudent;
}

export async function addAccommodation(
    oldStudent: OldStudent,
    student: Student,
    accommodationId?: number,
) {
    // If accommodationId is provided, perform update and return
    if (accommodationId) {
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

        // Get existing accommodation to update its address
        const [existingAccommodation] = await db
            .select()
            .from(accommodationModel)
            .where(eq(accommodationModel.id, accommodationId));
        if (!existingAccommodation) {
            return null;
        }

        // Update address if it exists
        if (existingAccommodation.addressId) {
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
                .where(eq(addressModel.id, existingAccommodation.addressId));
        }

        // Update accommodation
        const [updatedAccommodation] = await db
            .update(accommodationModel)
            .set({
                placeOfStay,
            })
            .where(eq(accommodationModel.id, accommodationId))
            .returning();

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

    const [address] = await db
        .insert(addressModel)
        .values({
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

    const [newAccommodation] = await db
        .insert(accommodationModel)
        .values({
            placeOfStay,
            addressId: address.id,
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

export async function addFamily(
    oldStudent: OldStudent,
    student: Student,
    familyId?: number,
) {
    // If familyId is provided, perform update and return
    if (familyId) {
        const [existingFamily] = await db
            .select()
            .from(familyModel)
            .where(eq(familyModel.id, familyId));
        if (!existingFamily) {
            return null;
        }

        let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
        if (oldStudent.issnglprnt) {
            if (oldStudent.issnglprnt.toLowerCase() === "bth") {
                parentType = "BOTH";
            } else if (oldStudent.issnglprnt.toLowerCase() === "sngl_fthr") {
                parentType = "FATHER_ONLY";
            } else if (oldStudent.issnglprnt.toLowerCase() === "sngl_mthr") {
                parentType = "MOTHER_ONLY";
            }
        }

        // Update father details if exists
        if (existingFamily.fatherDetailsId) {
            let fatherOccupation: Occupation | undefined;
            if (oldStudent.fatherOccupation) {
                const [fatherOccupationResult] = (await mysqlConnection.query(
                    `SELECT * FROM parentoccupation WHERE id = ${oldStudent.fatherOccupation}`,
                )) as [{ id: number; occupationName: string }[], any];
                if (fatherOccupationResult.length > 0) {
                    fatherOccupation = await addOccupation(
                        fatherOccupationResult[0].occupationName,
                        db,
                        oldStudent.fatherOccupation,
                    );
                }
            }

            await db
                .update(personModel)
                .set({
                    name: oldStudent.fatherName?.toUpperCase()?.trim(),
                    email: oldStudent.fatherEmail?.trim().toLowerCase(),
                    aadhaarCardNumber: formatAadhaarCardNumber(
                        oldStudent.fatheraadharno || undefined,
                    ),
                    phone: oldStudent.fatherMobNo?.trim(),
                    // officePhone: oldStudent.fatherOffPhone?.trim(), // Field doesn't exist in schema
                    image: oldStudent.fatherPic?.trim(),
                    occupationId: fatherOccupation ? fatherOccupation.id : undefined,
                })
                .where(eq(personModel.id, existingFamily.fatherDetailsId));
        }

        // Update mother details if exists
        if (existingFamily.motherDetailsId) {
            let motherOccupation: Occupation | undefined;
            if (oldStudent.motherOccupation) {
                const [motherOccupationResult] = (await mysqlConnection.query(
                    `SELECT * FROM parentoccupation WHERE id = ${oldStudent.motherOccupation}`,
                )) as [{ id: number; occupationName: string }[], any];
                if (motherOccupationResult.length > 0) {
                    motherOccupation = await addOccupation(
                        motherOccupationResult[0].occupationName,
                        db,
                        oldStudent.motherOccupation,
                    );
                }
            }

            await db
                .update(personModel)
                .set({
                    name: oldStudent.motherName?.toUpperCase()?.trim(),
                    email: oldStudent.motherEmail?.trim().toLowerCase(),
                    aadhaarCardNumber: formatAadhaarCardNumber(
                        oldStudent.motheraadharno || undefined,
                    ),
                    phone: oldStudent.motherMobNo?.trim(),
                    // officePhone: oldStudent.motherOffPhone?.trim(), // Field doesn't exist in schema
                    image: oldStudent.motherPic?.trim(),
                    occupationId: motherOccupation ? motherOccupation.id : undefined,
                })
                .where(eq(personModel.id, existingFamily.motherDetailsId));
        }

        // Update guardian details if exists
        if (existingFamily.guardianDetailsId) {
            let guardianOccupation: Occupation | undefined;
            if (oldStudent.guardianOccupation) {
                const [guardianOccupationResult] = (await mysqlConnection.query(
                    `SELECT * FROM parentoccupation WHERE id = ${oldStudent.guardianOccupation}`,
                )) as [{ id: number; occupationName: string }[], any];
                if (guardianOccupationResult.length > 0) {
                    guardianOccupation = await addOccupation(
                        guardianOccupationResult[0].occupationName,
                        db,
                        oldStudent.guardianOccupation,
                    );
                }
            }

            await db
                .update(personModel)
                .set({
                    name: oldStudent.guardianName?.toUpperCase()?.trim(),
                    email: oldStudent.guardianEmail?.trim().toLowerCase(),
                    aadhaarCardNumber: formatAadhaarCardNumber(
                        oldStudent.gurdianaadharno || undefined,
                    ),
                    phone: oldStudent.guardianMobNo?.trim(),
                    // officePhone: oldStudent.guardianOffPhone?.trim(), // Field doesn't exist in schema
                    image: oldStudent.guardianPic?.trim(),
                    occupationId: guardianOccupation ? guardianOccupation.id : undefined,
                })
                .where(eq(personModel.id, existingFamily.guardianDetailsId));
        }

        const annualIncome = await categorizeIncome(oldStudent.annualFamilyIncome);

        // Update family record
        const [updatedFamily] = await db
            .update(familyModel)
            .set({
                annualIncomeId: annualIncome ? annualIncome.id : undefined,
                parentType,
            })
            .where(eq(familyModel.id, familyId))
            .returning();

        return updatedFamily;
    }

    // Original creation logic when no ID is provided
    // Note: family_details table doesn't have studentId field, it's referenced through other tables

    let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
    if (oldStudent.issnglprnt) {
        if (oldStudent.issnglprnt.toLowerCase() === "bth") {
            parentType = "BOTH";
        } else if (oldStudent.issnglprnt.toLowerCase() === "sngl_fthr") {
            parentType = "FATHER_ONLY";
        } else if (oldStudent.issnglprnt.toLowerCase() === "sngl_mthr") {
            parentType = "MOTHER_ONLY";
        }
    }

    let fatherOccupation: Occupation | undefined;
    if (oldStudent.fatherOccupation) {
        const [fatherOccupationResult] = (await mysqlConnection.query(
            `SELECT * FROM parentoccupation WHERE id = ${oldStudent.fatherOccupation}`,
        )) as [{ id: number; occupationName: string }[], any];
        if (fatherOccupationResult.length > 0) {
            fatherOccupation = await addOccupation(
                fatherOccupationResult[0].occupationName,
                db,
                oldStudent.fatherOccupation,
            );
        }
    }

    const [father] = await db
        .insert(personModel)
        .values({
            name: oldStudent.fatherName?.toUpperCase()?.trim(),
            email: oldStudent.fatherEmail?.trim().toLowerCase(),
            aadhaarCardNumber: formatAadhaarCardNumber(
                oldStudent.fatheraadharno || undefined,
            ),
            phone: oldStudent.fatherMobNo?.trim(),
            // officePhone: oldStudent.fatherOffPhone?.trim(), // Field doesn't exist in schema
            image: oldStudent.fatherPic?.trim(),
            occupationId: fatherOccupation ? fatherOccupation.id : undefined,
        })
        .returning();

    let motherOccupation: Occupation | undefined;
    if (oldStudent.motherOccupation) {
        const [motherOccupationResult] = (await mysqlConnection.query(
            `SELECT * FROM parentoccupation WHERE id = ${oldStudent.motherOccupation}`,
        )) as [{ id: number; occupationName: string }[], any];
        if (motherOccupationResult.length > 0) {
            motherOccupation = await addOccupation(
                motherOccupationResult[0].occupationName,
                db,
                oldStudent.motherOccupation,
            );
        }
    }

    const [mother] = await db
        .insert(personModel)
        .values({
            name: oldStudent.motherName?.toUpperCase()?.trim(),
            email: oldStudent.motherEmail?.trim().toLowerCase(),
            aadhaarCardNumber: formatAadhaarCardNumber(
                oldStudent.motheraadharno || undefined,
            ),
            phone: oldStudent.motherMobNo?.trim(),
            // officePhone: oldStudent.motherOffPhone?.trim(), // Field doesn't exist in schema
            image: oldStudent.motherPic?.trim(),
            occupationId: motherOccupation ? motherOccupation.id : undefined,
        })
        .returning();

    let guardianOccupation: Occupation | undefined;
    if (oldStudent.guardianOccupation) {
        const [guardianOccupationResult] = (await mysqlConnection.query(
            `SELECT * FROM parentoccupation WHERE id = ${oldStudent.guardianOccupation}`,
        )) as [{ id: number; occupationName: string }[], any];
        if (guardianOccupationResult.length > 0) {
            guardianOccupation = await addOccupation(
                guardianOccupationResult[0].occupationName,
                db,
                oldStudent.guardianOccupation,
            );
        }
    }

    const [guardian] = await db
        .insert(personModel)
        .values({
            name: oldStudent.guardianName?.toUpperCase()?.trim(),
            email: oldStudent.guardianEmail?.trim().toLowerCase(),
            aadhaarCardNumber: formatAadhaarCardNumber(
                oldStudent.gurdianaadharno || undefined,
            ),
            phone: oldStudent.guardianMobNo?.trim(),
            // officePhone: oldStudent.guardianOffPhone?.trim(), // Field doesn't exist in schema
            image: oldStudent.guardianPic?.trim(),
            occupationId: guardianOccupation ? guardianOccupation.id : undefined,
        })
        .returning();

    const annualIncome = await categorizeIncome(oldStudent.annualFamilyIncome);

    const [newFamily] = await db
        .insert(familyModel)
        .values({
            annualIncomeId: annualIncome ? annualIncome.id : undefined,
            parentType,
            fatherDetailsId: father.id,
            motherDetailsId: mother.id,
            guardianDetailsId: guardian.id,
        })
        .returning();

    return newFamily;
}

export async function addHealth(
    oldStudent: OldStudent,
    student: Student,
    healthId?: number,
) {
    // If healthId is provided, perform update and return
    if (healthId) {
        const [existingHealth] = await db
            .select()
            .from(healthModel)
            .where(eq(healthModel.id, healthId));
        if (!existingHealth) {
            return null;
        }

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
            .where(eq(healthModel.id, healthId))
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

    const insertData: Partial<Health> = {};
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

export async function addEmergencyContact(
    oldStudent: OldStudent,
    student: Student,
    emergencyContactId?: number,
) {
    // If emergencyContactId is provided, perform update and return
    if (emergencyContactId) {
        const [existingEmergencyContact] = await db
            .select()
            .from(emergencyContactModel)
            .where(eq(emergencyContactModel.id, emergencyContactId));
        if (!existingEmergencyContact) {
            return null;
        }

        const [updatedEmergencyContact] = await db
            .update(emergencyContactModel)
            .set({
                personName: oldStudent.emercontactpersonnm?.trim()?.toUpperCase(),
                phone: oldStudent.emercontactpersonmob?.trim(),
                residentialPhone: oldStudent.emrgnResidentPhNo?.trim(),
                // relationToStudent: oldStudent.emerpersreltostud?.trim()?.toUpperCase(), // Field doesn't exist in schema
                // officePhone: oldStudent.emrgnOfficePhNo?.trim(), // Field doesn't exist in schema
            })
            .where(eq(emergencyContactModel.id, emergencyContactId))
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
            // relationToStudent: oldStudent.emerpersreltostud?.trim()?.toUpperCase(), // Field doesn't exist in schema
            // officePhone: oldStudent.emrgnOfficePhNo?.trim(), // Field doesn't exist in schema
        })
        .returning();

    return newEmergencyContact;
}

export async function addStudentPersonalDetails(
    oldDetails: OldStudent,
    user: User,
    personalDetailsId?: number,
) {
    // If personalDetailsId is provided, perform update and return
    if (personalDetailsId) {
        const [existingPersonalDetails] = await db
            .select()
            .from(personalDetailsModel)
            .where(eq(personalDetailsModel.id, personalDetailsId));
        if (!existingPersonalDetails) {
            return null;
        }

        // Handle different types of oldDetails
        if ("studentCategoryId" in oldDetails) {
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

            // Update addresses if they exist
            if (existingPersonalDetails.mailingAddressId) {
                await db
                    .update(addressModel)
                    .set({
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
                    .where(eq(addressModel.id, existingPersonalDetails.mailingAddressId));
            }

            if (existingPersonalDetails.residentialAddressId) {
                await db
                    .update(addressModel)
                    .set({
                        addressLine: oldDetails.residentialAddress?.trim()?.toUpperCase(),
                        phone: oldDetails.resiPhoneMobileNo?.trim()?.toUpperCase(),
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
                        eq(addressModel.id, existingPersonalDetails.residentialAddressId),
                    );
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
                .where(eq(personalDetailsModel.id, personalDetailsId))
                .returning();

            return updatedPersonalDetails;
        } else if ("staffId" in oldDetails) {
            // Handle OldStaff case - implement similar logic for staff
            // For now, just return the existing record
            return existingPersonalDetails;
        } else {
            throw new Error("Invalid old details type");
        }
    }

    // Original creation logic when no ID is provided
    let mailingAddress: Address | undefined;
    if (oldDetails.mailingAddress || oldDetails.mailingPinNo) {
        const [address] = await db
            .insert(addressModel)
            .values({
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
        mailingAddress = address;
    }

    let residentialAddress: Address | undefined;
    if (oldDetails.residentialAddress || oldDetails.resiPinNo) {
        const [address] = await db
            .insert(addressModel)
            .values({
                addressLine: oldDetails.residentialAddress?.trim()?.toUpperCase(),
                phone: oldDetails.resiPhoneMobileNo?.trim()?.toUpperCase(),
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
        residentialAddress = address;
    }

    if ("studentCategoryId" in oldDetails) {
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
                mailingAddressId: mailingAddress
                    ? (mailingAddress.id as number)
                    : undefined,
                residentialAddressId: residentialAddress
                    ? (residentialAddress.id as number)
                    : undefined,
                motherTongueId: motherTongue ? motherTongue.id : undefined,
                emergencyResidentialNumber: oldDetails.emrgnResidentPhNo,

            } as PersonalDetails)
            .returning();

        return newPersonalDetails;
    } else if ("staffId" in oldDetails) {
        // Handle OldStaff case for creation
        // Implement similar logic for staff creation
        throw new Error("OldStaff creation not implemented yet");
    } else {
        throw new Error("Invalid old details type");
    }
}

// export async function addBoardUnversity(
//     oldStudent: OldStudent,
//     db: DbType,
//     boardUniversityId?: number,
// ): Promise<Board | undefined> {
//     const [rows] = (await mysqlConnection.query(
//         `SELECT * FROM board WHERE id = ${oldStudent.lastBoardUniversity}`,
//     )) as [OldBoard[], any];

//     const [oldBoardUniversity] = rows;

//     if (!oldBoardUniversity) {
//         return undefined;
//     }

//     const [existingBoardUniversity] = await db
//         .select()
//         .from(boardModel)
//         .where(
//             eq(boardModel.name, oldBoardUniversity.boardName.trim().toUpperCase()),
//         );

//     if (existingBoardUniversity) {
//         return existingBoardUniversity;
//     }

//     let degree: Degree | undefined;
//     const [degreeRows] = (await mysqlConnection.query(
//         `SELECT * FROM degree WHERE id = ${oldBoardUniversity.degreeid}`,
//     )) as [OldDegree[], any];
//     const [oldDegree] = degreeRows;
//     if (oldDegree) {
//         const [existingDegree] = await db
//             .select()
//             .from(degreeModel)
//             .where(eq(degreeModel.name, oldDegree.degreeName.trim().toUpperCase()));
//         if (existingDegree) {
//             degree = existingDegree;
//         } else {
//             const [newDegree] = await db
//                 .insert(degreeModel)
//                 .values({ name: oldDegree.degreeName.trim().toUpperCase() })
//                 .returning();
//             degree = newDegree;
//         }
//     }

//     const [newBoardUniversity] = await db
//         .insert(boardModel)
//         .values({
//             name: oldBoardUniversity.boardName.trim().toUpperCase(),
//             degreeId: degree ? degree.id : undefined,
//             passingMarks: oldBoardUniversity.passmrks,
//             code: oldBoardUniversity.code,
//         })
//         .returning();

//     return newBoardUniversity;
// }

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

export async function addTransportDetails(
    oldStudent: OldStudent,
    student: Student,
    transportDetailsId?: number,
) {
    // If transportDetailsId is provided, perform update and return
    if (transportDetailsId) {
        const [existingTransportDetails] = await db
            .select()
            .from(transportDetailsModel)
            .where(eq(transportDetailsModel.id, transportDetailsId));
        if (!existingTransportDetails) {
            throw new Error(
                `Transport details with id ${transportDetailsId} not found`,
            );
        }

        // Update transport details
        const [updatedTransportDetails] = await db
            .update(transportDetailsModel)
            .set({
                // Add any transport-related fields from oldStudent here
                // transportId: oldStudent.transportId,
                // pickupPointId: oldStudent.pickupPointId,
            })
            .where(eq(transportDetailsModel.id, transportDetailsId))
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
        })
        .returning();

    return newTransportDetail;
}



export async function upsertUser(oldData: OldStudent | OldStaff, type: (typeof userTypeEnum.enumValues)[number]) {
    if (!oldData) {
        return undefined;
    }

    if (type === "STUDENT" && (!(oldData as OldStudent).codeNumber || (oldData as OldStudent).codeNumber.trim() === "")) {
        throw new Error("UID is required for student");
    }

    if (type !== "STAFF" && type !== "STUDENT") {
        throw new Error("Invalid old details type");
    }

    let phone: string | undefined = oldData.contactNo?.trim() || oldData.phoneMobileNo?.trim() || ;
    let whatsappNumber: string | undefined = oldData.contactNo?.trim();

    const cleanString = (value: unknown): string | undefined => {
        if (typeof value === "string") {
            return value.replace(/[\s\-\/]/g, "").trim();
        }
        return undefined;
    };

    const hashedPassword = await bcrypt.hash("default", 10);

    // Check if user already exists by legacyId OR email
    let existingUser;
    const email =
        type === "STUDENT"
            ? `${cleanString((oldData as OldStudent).codeNumber)}@thebges.edu.in`
            : oldData.email?.trim();
    if (email) {
        // Check by both legacyId and email
        [existingUser] = await db
            .select()
            .from(userModel)
            .where(
                or(eq(userModel.legacyId, oldData.id!), eq(userModel.email, email)),
            );
    } else {
        // Check only by legacyId
        [existingUser] = await db
            .select()
            .from(userModel)
            .where(
                and(
                    eq(userModel.legacyId, oldData.id!),
                    eq(userModel.type, type),
                )
            );
    }

    if (existingUser) {
        console.log(
            `User with legacy ID ${oldData.id} or email ${oldData?.email} already exists, skipping creation`,
        );
        return existingUser;
    }

    // Create the new user
    let newUser: User | undefined;

    try {
        [newUser] = await db
            .insert(userModel)
            .values({
                name: oldData.name ?? "",
                legacyId: oldData.id!,
                email: email ?? "",
                password: hashedPassword,
                phone,
                type,
                whatsappNumber,
            })
            .returning();
    } catch (error: any) {
        // If there's a duplicate key error, try to find the existing user
        throw error;
    }

    if (!newUser) {
        throw new Error("Failed to create or find user");
    }

    if (type === "STAFF") {
        if (oldData.id) {
            await addStaff(oldData.id, newUser);
            await db
                .update(userModel)
                .set({
                    isActive: !!(oldData as OldStaff).active,
                })
                .where(eq(userModel.id, newUser.id as number));
        }
    }

    return newUser;
}










export async function processStudent(oldStudent: OldStudent) {
    // Step 1: Check for the user
    const user = await addUserForStudent(oldStudent, db, "STUDENT");

    // Step 2: Check for the student
    const student = await addStudent(oldStudent, user, db);

    // Step 3: Check for the accomodation
    await addAccommodation(oldStudent, student, accommodationId);

    // Step 4: Check for the admission
    // await addAdmission(oldStudent, student);

    // Step 5: Check for the Familys
    await addFamily(oldStudent, student, familyId);

    // Step 6: Check for the health
    await addHealth(oldStudent, student, healthId);

    // Step 7: Check for the emergency-contact
    await addEmergencyContact(oldStudent, student, emergencyContactId);

    // Step 8: Check for the personal-details
    await addStudentPersonalDetails(oldStudent, user, personalDetailsId);

    // Step 11: Check for the transport-details
    await addTransportDetails(oldStudent, student, transportDetailsId);

    // // Step 12: Course Details
    // await processCourseDetails(oldStudent, student, courseDetails);

    return student;
}

// async function processCourseDetails(
//     oldStudent: OldStudent,
//     student: Student,
//     courseDetails: OldCourseDetails,
// ) {
//     const [[oldCourse]] = (await mysqlConnection.query(`
//         SELECT * FROM course WHERE id = ${courseDetails.courseid}`)) as [
//             OldCourse[],
//             any,
//         ];

//     // Note: admission_course_details table doesn't have studentId field directly
//     // It's connected through other relationships, so we'll create new records

//     const course = await addCourse(courseDetails.courseid);

//     const classData = await addClass(courseDetails.classid);

//     const eligibilityCriteria = await addEligibilityCriteria(
//         courseDetails.eligibilityCriteriaId,
//     );

//     const studenrCategory = await addStudentCategory(
//         courseDetails.studentCategoryId,
//     );

//     const shift = await addShift(courseDetails.shiftid);

//     const meritList = await addMeritList(courseDetails.meritlistid);

//     const bank = await addBank(courseDetails.feespaymentbankid);

//     const bankBranch = await addBankBranch(courseDetails.feespaymentbrnchid);

//     const bankBranchOther = courseDetails.feespaymentbrnchothr;
//     const bankOther = courseDetails.feespaidtype;

//     let stream: Stream | undefined;
//     console.log("course?.name", course?.name);

//     // Remove dots and normalize the course name for comparison
//     const normalizedCourseName = course?.name
//         .toLowerCase()
//         .replace(/\./g, "")
//         .trim();

//     if (normalizedCourseName?.includes("bsc")) {
//         stream = await addStream({
//             name: "Science & Technology",
//             code: "Sci.",
//             shortName: "Sci.",
//             // disabled: false, // Field doesn't exist in schema
//         });
//     } else if (normalizedCourseName?.includes("ba")) {
//         stream = await addStream({
//             name: "Arts & Humanities",
//             code: "Arts",
//             shortName: "Arts",
//             // disabled: false, // Field doesn't exist in schema
//         });
//     } else if (
//         ((normalizedCourseName?.includes("(h)") ||
//             normalizedCourseName?.includes("(g)")) &&
//             normalizedCourseName?.includes("bcom")) ||
//         normalizedCourseName?.includes("bba")
//     ) {
//         stream = await addStream({
//             name: "Commerce & Management",
//             code: "Com.",
//             shortName: "Com.",
//         });
//     }

//     // Default stream for courses that don't match the above patterns
//     if (!stream) {
//         throw new Error("Stream not found...!");
//     }

//     let courseType: CourseType | undefined;
//     if (oldCourse.courseName.toLowerCase().trim().includes("(h)")) {
//         courseType = (
//             await db
//                 .select()
//                 .from(courseTypeModel)
//                 .where(and(ilike(courseTypeModel.name, "Honours")))
//         )[0];
//         if (!courseType) {
//             throw new Error("Course Type not found...!");
//         }
//     } else if (oldCourse.courseName.toLowerCase().trim().includes("(g)")) {
//         courseType = (
//             await db
//                 .select()
//                 .from(courseTypeModel)
//                 .where(and(ilike(courseTypeModel.name, "General")))
//         )[0];
//         if (!courseType) {
//             throw new Error("Course Type not found...!");
//         }
//     }

//     // Default course type for courses that don't have (H) or (G)
//     if (!courseType) {
//         courseType = (
//             await db
//                 .select()
//                 .from(courseTypeModel)
//                 .where(and(ilike(courseTypeModel.name, "Regular")))
//         )[0];
//         if (!courseType) {
//             throw new Error("Course Type 'Regular' not found...!");
//         }
//     }

//     const programCourse = await addProgramCourse(
//         stream,
//         courseDetails,
//         course!,
//         courseType!,
//     );

//     const [newAdmissionCourseDetails] = await db
//         .insert(admissionCourseDetailsModel)
//         .values({
//             legacyCourseDetailsId: courseDetails.id,
//             streamId: stream?.id || 1, // TODO: Add proper stream mapping
//             programCourseId: programCourse.id!, // TODO: Add proper program course mapping
//             classId: classData?.id!,
//             shiftId: shift?.id || 1,
//             studentCategoryId: studenrCategory?.id || 1,
//             classRollNumber: courseDetails.rollNumber || "",
//             applicationFormId: 1, // TODO: This should be set properly
//             admissionProgramCourseId: programCourse.id!,
//             appNumber: courseDetails.appno || "",
//             challanNumber: courseDetails.chllno || "",
//             amount: courseDetails.amt || 0,
//             paymentTimestamp: courseDetails.paymentDate,
//             paymentType: courseDetails.paymentType,
//             applicationTimestamp: courseDetails.applicationdt || new Date(),
//             isSmsSent: !!courseDetails.smssent,
//             smsSentAt: courseDetails.smssenton,
//             isVerified: !!courseDetails.verified,
//             verifiedAt: courseDetails.verifydt,
//             verifiedBy: courseDetails.verifiedby,
//             verifiedOn: courseDetails.verifiedon,
//             freeshipDate: courseDetails.freeshipdate,
//             freeshipPercentage: courseDetails.freeshipperc || 0,
//             isFreeshipApplied: !!courseDetails.freeshipapplied,
//             isFreeshipApproved: !!courseDetails.freeshipapproved,
//             isFeesChallanGenerated: !!courseDetails.feeschallangenerated,
//             feesChallanNumber: courseDetails.feeschallanno?.toString(),
//             feesChallanDate: courseDetails.feeschallandate,
//             isFeesPaid: !!courseDetails.feespaymententrydate,
//             feesPaidType: courseDetails.feespaidtype,
//             feesPaidAt: courseDetails.feespaymentdate,
//             feesPaymentBankBranchId: bankBranch?.id,
//             feesPaymentBankId: bank?.id,
//             feesDraftNumber: courseDetails.feesdraftno,
//             feesDratdtDate: courseDetails.feesdraftdt,
//             feesDraftDrawnOn: courseDetails.feesdraftdrawnon,
//             feesDraftAmount: courseDetails.feesdraftamt || 0,
//             meritListId: meritList?.id,
//         } as AdmissionCourseDetails)
//         .returning();

//     // Add the selected subject
//     await getSubjectRelatedFields(
//         courseDetails,
//         programCourse,
//         newAdmissionCourseDetails,
//         student,
//     );
//     console.log("newAdmissionCourseDetails", newAdmissionCourseDetails);
//     return newAdmissionCourseDetails;
// }


// async function addStudentCategory(oldStudentCategoryId: number | null) {
//     if (!oldStudentCategoryId) return null;

//     const [[studentCategoryRow]] = (await mysqlConnection.query(
//         `SELECT * FROM studentcatagory WHERE id = ${oldStudentCategoryId}`,
//     )) as [OldStudentCategory[], any];

//     if (!studentCategoryRow) return null;

//     const [foundStudentCategory] = await db
//         .select()
//         .from(studentCategoryModel)
//         .where(
//             ilike(studentCategoryModel.name, studentCategoryRow.studentCName.trim()),
//         );

//     if (foundStudentCategory) return foundStudentCategory;

//     const course = await addCourse(studentCategoryRow.courseId);
//     const classSem = await addClass(studentCategoryRow.classId);

//     return (
//         await db
//             .insert(studentCategoryModel)
//             .values({
//                 legacyStudentCategoryId: oldStudentCategoryId,
//                 name: studentCategoryRow.studentCName.trim(),
//                 courseId: course?.id || 0,
//                 classId: classSem?.id || 0,
//                 documentRequired: !!studentCategoryRow.document,
//             })
//             .returning()
//     )[0];
// }




// async function addEligibilityCriteria(oldEligibilityId: number | null) {
//     if (!oldEligibilityId) return null;
//     const [[eligibilityRow]] = (await mysqlConnection.query(
//         `SELECT * FROM eligibilitycriteria WHERE id = ${oldEligibilityId}`,
//     )) as [OldEligibilityCriteria[], any];

//     if (!eligibilityRow) return null;

//     const [foundEligibilityCriteria] = await db
//         .select()
//         .from(eligibilityCriteriaModel)
//         .where(
//             and(
//                 eq(eligibilityCriteriaModel.courseId, eligibilityRow.courseId),
//                 eq(eligibilityCriteriaModel.classId, eligibilityRow.classId),
//                 eq(eligibilityCriteriaModel.categoryId, eligibilityRow.categoryId),
//             ),
//         );

//     if (foundEligibilityCriteria) return foundEligibilityCriteria;

//     return (
//         await db
//             .insert(eligibilityCriteriaModel)
//             .values({
//                 legacyEligibilityCriteriaId: oldEligibilityId,
//                 courseId: eligibilityRow.courseId,
//                 classId: eligibilityRow.classId,
//                 categoryId: eligibilityRow.categoryId,
//                 description: eligibilityRow.description?.trim().toUpperCase(),
//                 generalInstruction: eligibilityRow.generalInstruction
//                     ?.trim()
//                     .toUpperCase(),
//             })
//             .returning()
//     )[0];
// }

// async function addShift(oldShiftId: number | null) {
//     if (!oldShiftId) return null;

//     const [[shiftRow]] = (await mysqlConnection.query(
//         `SELECT * FROM shift WHERE id = ${oldShiftId}`,
//     )) as [OldShift[], any];

//     if (!shiftRow) return null;

//     const [foundShift] = await db
//         .select()
//         .from(shiftModel)
//         .where(ilike(shiftModel.name, shiftRow.shiftName.trim()));

//     if (foundShift) return foundShift;

//     return (
//         await db
//             .insert(shiftModel)
//             .values({
//                 legacyShiftId: oldShiftId,
//                 name: shiftRow.shiftName.trim(),
//                 codePrefix: shiftRow.codeprefix?.trim(),
//             })
//             .returning()
//     )[0];
// }

// async function addMeritList(oldMeritListId: number | null) {
//     if (!oldMeritListId) return null;

//     const [[meritListRow]] = (await mysqlConnection.query(
//         `SELECT * FROM meritlist WHERE id = ${oldMeritListId}`,
//     )) as [OldMeritList[], any];

//     if (!meritListRow) return null;

//     const [foundMeritList] = await db
//         .select()
//         .from(meritListModel)
//         .where(ilike(meritListModel.name, meritListRow.name.trim().toUpperCase()));

//     if (foundMeritList) return foundMeritList;

//     return (
//         await db
//             .insert(meritListModel)
//             .values({
//                 legacyMeritListId: oldMeritListId,
//                 name: meritListRow.name.trim(),
//                 description: meritListRow.description.trim(),
//                 checkAuto: meritListRow.checkauto === 1, // Convert 0 or 1 to boolean
//             })
//             .returning()
//     )[0];
// }

// async function addBank(oldBankId: number | null) {
//     if (!oldBankId) return null;

//     const [[bankRow]] = (await mysqlConnection.query(
//         `SELECT * FROM adminbank WHERE id = ${oldBankId}`,
//     )) as [OldBank[], any];

//     if (!bankRow) return null;

//     const [foundBank] = await db
//         .select()
//         .from(bankModel)
//         .where(ilike(bankModel.name, bankRow.bankName.trim()));

//     if (foundBank) return foundBank;

//     return (
//         await db
//             .insert(foundBank)
//             .values({
//                 legacyBankId: oldBankId,
//                 name: bankRow.bankName.trim(),
//             })
//             .returning()
//     )[0];
// }

// async function addBankBranch(oldBankBranchId: number | null) {
//     if (!oldBankBranchId) return null;

//     const [[bankBranchRow]] = (await mysqlConnection.query(
//         `SELECT * FROM bankbranch WHERE id = ${oldBankBranchId}`,
//     )) as [OldBankBranch[], any];

//     const bank = await addBank(bankBranchRow?.bankid ?? null);

//     if (!bank || !bankBranchRow) return null;

//     const [foundBankBranch] = await db
//         .select()
//         .from(bankBranchModel)
//         .where(
//             and(
//                 eq(bankBranchModel.bankId, bank.id!),
//                 ilike(bankBranchModel.name, bankBranchRow.name.trim()),
//             ),
//         );

//     if (foundBankBranch) return foundBankBranch;

//     return (
//         await db
//             .insert(bankBranchModel)
//             .values({
//                 legacyBankBranchId: oldBankBranchId,
//                 name: bankBranchRow.name.trim(),
//                 bankId: bank.id!,
//             })
//             .returning()
//     )[0];
// }

// async function addAdmSubjectPaperSelection(
//     cvSubjectSelectionRow: OldCvSubjectSelection,
//     studentId: number,
//     admissionCourseDetailsId: number,
//     paperId: number,
// ) {
//     if (!cvSubjectSelectionRow) return null;

//     const [foundAdmSbjPprSelection] = await db
//         .select()
//         .from(admSubjectPaperSelectionModel)
//         .where(
//             and(
//                 eq(
//                     admSubjectPaperSelectionModel.legacyCVSubjectSelectionId,
//                     cvSubjectSelectionRow.id,
//                 ),
//                 eq(admSubjectPaperSelectionModel.studentId, studentId),
//                 eq(
//                     admSubjectPaperSelectionModel.admissionCourseDetailsId,
//                     admissionCourseDetailsId,
//                 ),
//                 eq(admSubjectPaperSelectionModel.paperId, paperId),
//             ),
//         );

//     if (foundAdmSbjPprSelection) return foundAdmSbjPprSelection;

//     return (
//         await db
//             .insert(admSubjectPaperSelectionModel)
//             .values({
//                 legacyCVSubjectSelectionId: cvSubjectSelectionRow.id,
//                 studentId,
//                 admissionCourseDetailsId,
//                 paperId,
//             })
//             .returning()
//     )[0];
// }

// async function addSubjectType(oldSubjectTypeId: number | null) {
//     if (!oldSubjectTypeId) return null;

//     const [[subjectTypeRow]] = (await mysqlConnection.query(`
//         SELECT * FROM subjecttype WHERE id = ${oldSubjectTypeId}
//     `)) as [OldSubjectType[], any];

//     if (!subjectTypeRow) return null;

//     const [foundSubjectType] = await db
//         .select()
//         .from(subjectTypeModel)
//         .where(
//             eq(
//                 subjectTypeModel.name,
//                 subjectTypeRow.subjectTypeName.trim().toUpperCase(),
//             ),
//         );

//     if (foundSubjectType) return foundSubjectType;

//     return (
//         await db
//             .insert(subjectTypeModel)
//             .values({
//                 legacySubjectTypeId: oldSubjectTypeId,
//                 name: subjectTypeRow.subjectTypeName.trim().toUpperCase(),
//                 code: subjectTypeRow.shortname?.trim().toUpperCase(),
//             })
//             .returning()
//     )[0];
// }

// async function addSubject(oldSubjectId: number | null) {
//     if (!oldSubjectId) return null;

//     const [[subjectRow]] = (await mysqlConnection.query(`
//         SELECT * FROM subject WHERE id = ${oldSubjectId}
//     `)) as [OldSubject[], any];

//     if (!subjectRow) return null;

//     const [foundSubject] = await db
//         .select()
//         .from(subjectModel)
//         .where(eq(subjectModel.name, subjectRow.subjectName.trim().toUpperCase()));

//     if (foundSubject) return foundSubject;

//     return (
//         await db
//             .insert(subjectModel)
//             .values({
//                 legacySubjectId: oldSubjectId,
//                 name: subjectRow.subjectName.trim().toUpperCase(),
//                 code: subjectRow.univcode?.trim().toUpperCase(),
//             })
//             .returning()
//     )[0];
// }

export const createOldStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // STEP 1: Load all the batches
        // await loadOlderBatches();
        // STEP 2: Count the total numbers of students
        // await loadStudentsV2();

        // await loadPaperSubjects();
        // await loadOldBoards();
        await loadData(true);
        // await loadData(false);

        res
            .status(201)
            .json(
                new ApiResponse(201, "SUCCESS", true, "Student added successfully!"),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// export async function loadStudentsV2() {
//     // STEP 1: Count the total numbers of students
//     console.log('\n\nCounting rows from table \`coursedetails\`...');
//     const [rows] = await mysqlConnection.query(`
//         SELECT COUNT(*) AS totalRows
//         FROM coursedetails
//         WHERE uid IS NOT NULL AND shiftid = 2;
//     `);
//     const { totalRows } = (rows as { totalRows: number }[])[0];
//     // STEP 2: Calculate the number of batches
//     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches
//     console.log(`\nTotal rows to migrate: ${totalRows}`);
//     // STEP 3: Loop over the batches
//     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//         const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//         // console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
//         // const [rows] = await mysqlConnection.query(`
//         //     SELECT *
//         //     FROM studentpersonaldetails
//         //     WHERE academicyearid = 17 OR academicyearid = 18
//         //     LIMIT ${BATCH_SIZE}
//         //     OFFSET ${offset};
//         // `) as [OldStudent[], any];

//         console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
//         const [rows] = await mysqlConnection.query(`
//             SELECT *
//             FROM coursedetails
//             WHERE uid IS NOT NULL AND shiftid = 2
//             LIMIT ${BATCH_SIZE}
//             OFFSET ${offset};
//         `) as [CourseDetails[], any];

//         const oldDataArr = rows as CourseDetails[];

//         for (let i = 0; i < oldDataArr.length; i++) {
//             // Fetch the related studentpersonalDetail
//             const [studentPersonalDetailRows] = await mysqlConnection.query(`
//                 SELECT *
//                 FROM studentpersonaldetails
//                 WHERE admissionid = ${oldDataArr[i].id};
//             `) as [OldStudent[], any];
//             try {
//                 if (studentPersonalDetailRows.length === 0) {
//                     console.log(`No studentpersonaldetails found for admissionid: ${oldDataArr[i].id}`);
//                     continue; // Skip to the next iteration if no related record is found
//                 }
//                 await processStudent(studentPersonalDetailRows[0], oldDataArr[i]);
//             } catch (error) {
//                 console.log(error)
//             }
//             console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${studentPersonalDetailRows[0]?.name}`);

//         }
//     }
// }






async function addPersonalDetails(
    oldDetails: OldAdmStudentPersonalDetail | OldStaff | OldStudent,
    link: { admissionGeneralInfoId?: number; userId?: number },
) {
    const isStaff = (d: OldAdmStudentPersonalDetail | OldStaff): d is OldStaff =>
        "isTeacher" in d;
    const isAdmStudent = (
        d: OldAdmStudentPersonalDetail | OldStaff,
    ): d is OldAdmStudentPersonalDetail => "applevel" in d;
    const isOldStudent = (
        d: OldAdmStudentPersonalDetail | OldStaff | OldStudent,
    ): d is OldStudent => "admissionId" in d;

    if (!isStaff(oldDetails) && !isAdmStudent(oldDetails) && !isOldStudent(oldDetails)) {
        throw new Error("Invalid old details type");
    }

    // Prepare address inputs per type
    const mailingAddressLine = isStaff(oldDetails)
        ? oldDetails.mailingAddress
        : oldDetails.mailingAddress;
    const mailingPin = isStaff(oldDetails)
        ? oldDetails.mailingPinNo
        : oldDetails.mailingPinNo;
    const mailingCountryLegacy = isStaff(oldDetails)
        ? (oldDetails.mcountryid ?? null)
        : (oldDetails.newcountryId ?? oldDetails.countryId ?? null);
    const mailingStateLegacy = isStaff(oldDetails)
        ? (oldDetails.mstateid ?? null)
        : (oldDetails.newstateId ?? null);
    const mailingCityLegacy = isStaff(oldDetails)
        ? (oldDetails.mcityid ?? null)
        : (oldDetails.newcityId ?? null);
    const mailingDistrictLegacy = isStaff(oldDetails)
        ? null
        : (oldDetails.newDistrictId ?? null);
    const mailingOtherState = isStaff(oldDetails)
        ? (oldDetails.mothstate ?? null)
        : (oldDetails.othernewState ?? oldDetails.otherState ?? null);
    const mailingOtherCity = isStaff(oldDetails)
        ? (oldDetails.mothcity ?? null)
        : (oldDetails.othernewCity ?? oldDetails.otherCity ?? null);
    const mailingPostOfficeId = isStaff(oldDetails)
        ? null
        : (oldDetails.newpostofficeid ?? null);
    const mailingOtherPostOffice = isStaff(oldDetails)
        ? null
        : (oldDetails.othernewpostoffice ?? null);
    const mailingPoliceStationId = isStaff(oldDetails)
        ? null
        : (oldDetails.newpolicestationid ?? null);
    const mailingOtherPoliceStation = isStaff(oldDetails)
        ? null
        : (oldDetails.othernewpolicestation ?? null);

    const residentialAddressLine = isStaff(oldDetails)
        ? oldDetails.residentialAddress
        : oldDetails.parmanentAddress;
    const resiPin = isStaff(oldDetails)
        ? oldDetails.resiPinNo
        : oldDetails.resiPinNo;
    const resiPhone = isStaff(oldDetails)
        ? oldDetails.resiPhoneMobileNo
        : oldDetails.studentPersonalContactNo ||
        oldDetails.studentcontactNo ||
        oldDetails.contactNo ||
        null;
    const resiCountryLegacy = isStaff(oldDetails)
        ? (oldDetails.rcountryid ?? null)
        : (oldDetails.countryId ?? null);
    const resiStateLegacy = isStaff(oldDetails)
        ? (oldDetails.rstateid ?? null)
        : (oldDetails.resiStateId ?? null);
    const resiCityLegacy = isStaff(oldDetails)
        ? (oldDetails.rcityid ?? null)
        : (oldDetails.cityId ?? null);
    const resiDistrictLegacy = isStaff(oldDetails)
        ? null
        : (oldDetails.resiDistrictId ?? null);
    const resiOtherState = isStaff(oldDetails)
        ? (oldDetails.rothstate ?? null)
        : (oldDetails.otherState ?? null);
    const resiOtherCity = isStaff(oldDetails)
        ? (oldDetails.rothcity ?? null)
        : (oldDetails.otherCity ?? null);
    const resiOtherDistrict = isStaff(oldDetails)
        ? null
        : (oldDetails.otherresiDistrict ?? null);
    const resiPostOfficeId = isStaff(oldDetails)
        ? null
        : (oldDetails.resipostofficeid ?? null);
    const resiOtherPostOffice = isStaff(oldDetails)
        ? null
        : (oldDetails.otherresipostoffice ?? null);
    const resiPoliceStationId = isStaff(oldDetails)
        ? null
        : (oldDetails.resipolicestationid ?? null);
    const resiOtherPoliceStation = isStaff(oldDetails)
        ? null
        : (oldDetails.otherresipolicestation ?? null);

    // Validate linkage requirements
    if (isAdmStudent(oldDetails)) {
        if (!link.admissionGeneralInfoId) {
            throw new Error("admissionGeneralInfoId is required for OldAdmStudentPersonalDetail");
        }
    } else {
        if (!link.userId) {
            throw new Error("userId is required for OldStaff or OldStudent");
        }
    }

    let mailingAddress: Address | undefined;
    if (
        mailingAddressLine ||
        mailingPin ||
        mailingCountryLegacy ||
        mailingStateLegacy ||
        mailingCityLegacy ||
        mailingDistrictLegacy
    ) {
        const stateResolved = mailingStateLegacy
            ? await addState(mailingStateLegacy)
            : null;
        const cityResolved = mailingCityLegacy
            ? await addCity(mailingCityLegacy)
            : null;
        const districtResolved = mailingDistrictLegacy
            ? await addDistrict(mailingDistrictLegacy)
            : null;
        const [address] = await db
            .insert(addressModel)
            .values({
                countryId: mailingCountryLegacy || undefined,
                stateId: stateResolved?.id || undefined,
                cityId: cityResolved?.id || undefined,
                districtId: districtResolved?.id || undefined,
                otherState: mailingOtherState || undefined,
                otherCity: mailingOtherCity || undefined,
                otherDistrict: isAdmStudent(oldDetails)
                    ? ((oldDetails.othernewDistrict || undefined) as string | undefined)
                    : undefined,
                postofficeId: mailingPostOfficeId || undefined,
                otherPostoffice: mailingOtherPostOffice || undefined,
                policeStationId: mailingPoliceStationId || undefined,
                otherPoliceStation: mailingOtherPoliceStation || undefined,
                addressLine: mailingAddressLine?.trim(),
                pincode: mailingPin?.trim(),
                localityType: null,
            })
            .returning();
        mailingAddress = address;
    }

    let residentialAddress: Address | undefined;
    if (
        residentialAddressLine ||
        resiPin ||
        resiPhone ||
        resiCountryLegacy ||
        resiStateLegacy ||
        resiCityLegacy ||
        resiDistrictLegacy
    ) {
        const stateResolved = resiStateLegacy
            ? await addState(resiStateLegacy)
            : null;
        const cityResolved = resiCityLegacy ? await addCity(resiCityLegacy) : null;
        const districtResolved = resiDistrictLegacy
            ? await addDistrict(resiDistrictLegacy)
            : null;
        const [address] = await db
            .insert(addressModel)
            .values({
                countryId: resiCountryLegacy || undefined,
                stateId: stateResolved?.id || undefined,
                cityId: cityResolved?.id || undefined,
                districtId: districtResolved?.id || undefined,
                otherDistrict: isAdmStudent(oldDetails)
                    ? ((oldDetails.otherresiDistrict || undefined) as string | undefined)
                    : undefined,
                otherState: resiOtherState || undefined,
                otherCity: resiOtherCity || undefined,
                postofficeId: resiPostOfficeId || undefined,
                otherPostoffice: resiOtherPostOffice || undefined,
                policeStationId: resiPoliceStationId || undefined,
                otherPoliceStation: resiOtherPoliceStation || undefined,
                addressLine: residentialAddressLine?.trim(),
                phone: resiPhone?.trim() || undefined,
                pincode: resiPin?.trim(),
                localityType: null,
            })
            .returning();
        residentialAddress = address;
    }

    // Core personal details
    const fullName = isStaff(oldDetails)
        ? oldDetails.name || ""
        : (
            (oldDetails.firstName || "") +
            " " +
            (oldDetails.middleName || "") +
            " " +
            (oldDetails.lastName || "")
        ).trim();
    const firstName = fullName.split(" ")[0] || "";

    const mobileNumber = isStaff(oldDetails)
        ? oldDetails.phoneMobileNo || oldDetails.contactNo || ""
        : oldDetails.studentPersonalContactNo ||
        oldDetails.studentcontactNo ||
        oldDetails.contactNo ||
        "";

    // Normalize a value to a pure YYYY-MM-DD string to avoid timezone shifts
    const toISODateOnly = (value: unknown): string | undefined => {
        if (!value) return undefined;
        if (typeof value === "string") {
            const trimmed = value.trim();
            // If already in YYYY-MM-DD, keep as-is
            const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
            if (isoDateOnly.test(trimmed)) return trimmed;
            const parsed = new Date(trimmed);
            if (isNaN(parsed.getTime())) return undefined;
            // Build a UTC date to avoid local-TZ off-by-one
            const utc = new Date(
                Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
            )
                .toISOString()
                .slice(0, 10);
            return utc;
        }
        if (value instanceof Date) {
            const utc = new Date(
                Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
            )
                .toISOString()
                .slice(0, 10);
            return utc;
        }
        return undefined;
    };

    const dateOfBirthVal: Date | string | null | undefined = isStaff(oldDetails)
        ? oldDetails.dateOfBirth
        : oldDetails.dateOfBirth;
    const dateOfBirthISO = toISODateOnly(dateOfBirthVal as any);
    const sexId = isStaff(oldDetails) ? oldDetails.sexId : oldDetails.sexId;
    const gender = sexId === 0 ? undefined : sexId === 1 ? "MALE" : "FEMALE";
    const aadhaar = isStaff(oldDetails)
        ? oldDetails.aadharNo
        : oldDetails.adhaarcardno;
    const placeOfBirth = isStaff(oldDetails)
        ? undefined
        : oldDetails.placeofBirth || undefined;
    const whatsappNumber = isStaff(oldDetails)
        ? undefined
        : oldDetails.whatsappno || undefined;
    const emergencyContactNumber = isStaff(oldDetails)
        ? undefined
        : oldDetails.emergencycontactno || undefined;
    const isGujarati = isStaff(oldDetails)
        ? false
        : (oldDetails.community || "") === "GUJARATI";

    // Additional personal details fields
    const voterId = isStaff(oldDetails) ? oldDetails.voterIdNo : undefined;
    const passportNumber = isStaff(oldDetails)
        ? oldDetails.passportNo
        : undefined;
    const maritalStatus = isStaff(oldDetails)
        ? oldDetails.maritalStatus === 1
            ? "MARRIED"
            : oldDetails.maritalStatus === 2
                ? "UNMARRIED"
                : oldDetails.maritalStatus === 3
                    ? "DIVORCED"
                    : oldDetails.maritalStatus === 4
                        ? "WIDOWED"
                        : undefined
        : oldDetails.maritialStatus === "Married"
            ? "MARRIED"
            : oldDetails.maritialStatus === "Unmarried"
                ? "UNMARRIED"
                : oldDetails.maritialStatus === "Divorced"
                    ? "DIVORCED"
                    : oldDetails.maritialStatus === "Widowed"
                        ? "WIDOWED"
                        : undefined;

    // Resolve personal detail foreign keys
    let nationalityId: number | undefined;
    if (
        isStaff(oldDetails) ? oldDetails.nationalityId : oldDetails.nationalityId
    ) {
        const natId = isStaff(oldDetails)
            ? oldDetails.nationalityId
            : oldDetails.nationalityId;
        const [rows] = (await mysqlConnection.query(
            `SELECT * FROM nationality WHERE id = ${natId}`,
        )) as [{ id: number; nationalityName: string; code: number }[], any];
        if (rows.length > 0) {
            const nat = await addNationality(rows[0].nationalityName, rows[0].code);
            nationalityId = nat.id;
        }
    }
    // let otherNationalityId: number | undefined;
    // if (!isStaff(oldDetails) && oldDetails.othernationality) {
    //     const [rows] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldDetails.othernationality}`) as [{ id: number, nationalityName: string, code: number }[], any];
    //     if (rows.length > 0) {
    //         const nat = await addNationality(rows[0].nationalityName, rows[0].code);
    //         otherNationalityId = nat.id;
    //     }
    // }
    let religionId: number | undefined;
    if (isStaff(oldDetails) ? oldDetails.religionId : oldDetails.religionId) {
        const relId = isStaff(oldDetails)
            ? oldDetails.religionId
            : oldDetails.religionId;
        const [rows] = (await mysqlConnection.query(
            `SELECT * FROM religion WHERE id = ${relId}`,
        )) as [{ id: number; religionName: string }[], any];
        if (rows.length > 0) {
            const rel = await addReligion(rows[0].religionName, relId!);
            religionId = rel.id;
        }
    }
    let motherTongueId: number | undefined;
    if (isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId) {
        const mtId = Number(
            isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId,
        )!;
        const [rows] = (await mysqlConnection.query(
            `SELECT * FROM mothertongue WHERE id = ${mtId}`,
        )) as [{ id: number; mothertongueName: string }[], any];
        if (rows.length > 0) {
            const mt = await addLanguageMedium(rows[0].mothertongueName, mtId);
            motherTongueId = mt.id;
        }
    }
    let categoryId: number | undefined;
    if (
        isStaff(oldDetails) ? oldDetails.studentCategoryId : oldDetails.categoryId
    ) {
        const catId = isStaff(oldDetails)
            ? oldDetails.studentCategoryId!
            : oldDetails.categoryId!;
        const [rows] = (await mysqlConnection.query(
            `SELECT * FROM category WHERE id = ${catId}`,
        )) as [
                {
                    id: number;
                    category: string;
                    code: string;
                    docneeded: boolean | undefined;
                }[],
                any,
            ];
        if (rows.length > 0) {
            const cat = await addCategory(
                rows[0].category,
                rows[0].code,
                rows[0].docneeded,
                catId,
            );
            categoryId = cat.id;
        }
    }

    const [newPersonalDetails] = await db
        .insert(personalDetailsModel)
        .values({
            admissionGeneralInfoId: isAdmStudent(oldDetails)
                ? (link.admissionGeneralInfoId as number)
                : undefined,
            userId: !isAdmStudent(oldDetails)
                ? (link.userId as number)
                : undefined,
            firstName,
            middleName: isStaff(oldDetails)
                ? undefined
                : ((oldDetails.middleName || undefined) as string | undefined),
            lastName: isStaff(oldDetails)
                ? undefined
                : ((oldDetails.lastName || undefined) as string | undefined),
            mobileNumber: mobileNumber?.toString(),
            whatsappNumber: whatsappNumber as string | undefined,
            emergencyContactNumber: emergencyContactNumber as string | undefined,
            // Store as YYYY-MM-DD string to prevent off-by-one due to timezone
            dateOfBirth: dateOfBirthISO as unknown as string | null | undefined,
            placeOfBirth: placeOfBirth as string | undefined,
            gender: gender as any,
            voterId: voterId as string | undefined,
            passportNumber: passportNumber as string | undefined,
            aadhaarCardNumber: aadhaar || undefined,
            nationalityId,
            otherNationality:
                "othernationality" in oldDetails && oldDetails.othernationality
                    ? oldDetails.othernationality
                    : undefined,
            religionId,
            categoryId,
            motherTongueId,
            maritalStatus: maritalStatus as any,
            isGujarati: isGujarati || false,
            mailingAddressId: mailingAddress
                ? (mailingAddress.id as number)
                : undefined,
            residentialAddressId: residentialAddress
                ? (residentialAddress.id as number)
                : undefined,
        })
        .returning();

    return newPersonalDetails;
}

















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