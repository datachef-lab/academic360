import { db, mysqlConnection } from "@/db/index.js";
import * as path from "path";
import bcrypt from "bcryptjs";

import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
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
    Specialization,
    Student,
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
    BoardUniversity,
    boardUniversityModel,
    degreeModel,
    BoardResultStatus,
    boardResultStatusModel,
    academicHistoryModel,
    academicIdentifierModel,
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
} from "@repo/db/schemas/models";
import { OldStudentCategory } from "@repo/db/legacy-system-types/admissions";
// interface OldStudentCategory {
//     id: number;
//     category: string;
//     courseid: number;
//     classid: number;
//     mainid?: number;
//     code: string;
//     docneeded: number;
//     flag: number;
// }
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { and, eq, ilike, or } from "drizzle-orm";
import { OldStudent } from "@/types/old-student";
import { formatAadhaarCardNumber } from "@/utils";
import { OldBoard } from "@/types/old-board";
import { OldBoardStatus } from "@/types/old-board-status";
import { CourseDetails, OldCvSubjectSelection, OldMeritList } from "@repo/db/legacy-system-types/admissions";
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
// import { findStreamByNameAndProgrammee } from "@/features/academics/services/stream.service.js";
// import { loadOlderBatches } from "@/features/academics/services/batch.service.js";
// import { loadPaperSubjects } from "@/features/academics/services/batchPaper.service.js";

const BATCH_SIZE = 500; // Number of rows per batch

type DbType = NodePgDatabase<Record<string, never>> & {
    $client: Pool;
}

export async function addOccupation(name: string, db: DbType, legacyOccupationId: number) {
    const [existingOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.name, name.trim().toUpperCase()));
    if (existingOccupation) {
        return existingOccupation;
    }
    const [newOccupation] = await db.insert(occupationModel).values({
        name: name.trim().toUpperCase(),
        legacyOccupationId: legacyOccupationId,

    }).returning();

    return newOccupation;
}

export async function addBloodGroup(type: string, db: DbType, legacyBloodGroupId: number) {
    const [existingBloodGroup] = await db.select().from(bloodGroupModel).where(eq(bloodGroupModel.type, type.trim().toUpperCase()));
    if (existingBloodGroup) {
        return existingBloodGroup;
    }
    const [newBloodGroup] = await db.insert(bloodGroupModel).values({ legacyBloodGroupId: legacyBloodGroupId, type: type.trim().toUpperCase() }).returning();

    return newBloodGroup;
}

export async function addNationality(name: string, code: number | undefined | null, db: DbType, legacyNationalityId?: number) {
    const [existingNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.name, name.trim().toUpperCase()));
    if (existingNationality) {
        return existingNationality;
    }
    const [newNationality] = await db.insert(nationalityModel).values({ legacyNationalityId: legacyNationalityId, name: name.trim().toUpperCase(), code }).returning();

    return newNationality;
}

export async function addCategory(name: string, code: string, documentRequired: boolean | undefined, db: DbType, legacyCategoryId: number) {
    // Check if category exists by name OR code
    const [existingCategory] = await db.select().from(categoryModel).where(
        or(
            eq(categoryModel.name, name.trim().toUpperCase()),
            eq(categoryModel.code, code)
        )
    );
    if (existingCategory) {
        return existingCategory;
    }
    const [newCategory] = await db.insert(categoryModel).values({ legacyCategoryId: legacyCategoryId, name: name.trim().toUpperCase(), code, documentRequired }).returning();

    return newCategory;
}

export async function addReligion(name: string, db: DbType, legacyReligionId: number) {
    const [existingReligion] = await db.select().from(religionModel).where(eq(religionModel.name, name.trim().toUpperCase()));
    if (existingReligion) {
        return existingReligion;
    }
    const [newReligion] = await db.insert(religionModel).values({ legacyReligionId: legacyReligionId, name: name.trim().toUpperCase() }).returning();

    return newReligion;
}

export async function addLanguageMedium(name: string, db: DbType, legacyLanguageMediumId: number) {
    const [existingLanguage] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.name, name.trim().toUpperCase()));
    if (existingLanguage) {
        return existingLanguage;
    }
    const [newLanguage] = await db.insert(languageMediumModel).values({ legacyLanguageMediumId: legacyLanguageMediumId, name: name.trim().toUpperCase() }).returning();

    return newLanguage;
}

export async function addSpecialization(name: string, db: DbType, legacySpecializationId: number) {
    const [existingSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.name, name.trim().toUpperCase()));
    if (existingSpecialization) {
        return existingSpecialization;
    }
    const [newSpecialization] = await db.insert(specializationModel).values({ legacySpecializationId: legacySpecializationId, name: name.trim().toUpperCase() }).returning();

    return newSpecialization;
}

export async function addUser(oldStudent: OldStudent, db: DbType) {
    const cleanString = (value: unknown): string | undefined => {
        if (typeof value === 'string') {
            return value.replace(/[\s\-\/]/g, '').trim();
        }
        return undefined; // Return undefined for non-string values
    };

    const email = `${cleanString(oldStudent.codeNumber)?.toUpperCase()}@thebges.edu.in`;
    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(oldStudent.codeNumber.trim()?.toUpperCase(), 10);

    // Return, if the email already exist
    const [existingUser] = await db.select().from(userModel).where(eq(userModel.email, email.trim().toLowerCase()));
    if (existingUser) {
        const [updatedUser] = await db.update(userModel).set({ password: hashedPassword }).where(eq(userModel.id, existingUser.id)).returning();
        return updatedUser;
    }

    // Create the new user
    const [newUser] = await db.insert(userModel).values({
        name: oldStudent.name?.trim()?.toUpperCase(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: oldStudent.contactNo?.trim()?.toUpperCase(),
        type: "STUDENT",
        whatsappNumber: oldStudent.whatsappno?.trim()?.toUpperCase(),
    }).returning();

    return newUser;
}

export async function addStudent(oldStudent: OldStudent, user: User, db: DbType) {
    const [existingStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, user.id as number));
    if (existingStudent) {
        return existingStudent;
    }

    let level: "UNDER_GRADUATE" | "POST_GRADUATE" | undefined;
    if (oldStudent.codeNumber.startsWith("11") || oldStudent.codeNumber.startsWith("14")) {
        level = "POST_GRADUATE";
    } else if (!oldStudent.codeNumber.startsWith("B")) {
        level = "UNDER_GRADUATE";
    }

    // Determine the active and alumni status based on oldStudent data
    let active: boolean | undefined = oldStudent.active;
    let alumni: boolean | undefined = oldStudent.alumni;

    if (oldStudent.leavingdate) {
        active = false; // If leaving date is present, student has left
        alumni = true;  // Mark as alumni
    } else if (!oldStudent.alumni && !oldStudent.active) {
        active = false; // Dropped off
    } else if (oldStudent.alumni && !oldStudent.active) {
        active = false; // Fully graduated and left
    } else if (!oldStudent.alumni && oldStudent.active) {
        active = true; // Regular student
    } else if (oldStudent.alumni && oldStudent.active) {
        active = true; // Graduated but has supplementary papers left
    }



    const [newStudent] = await db.insert(studentModel).values({
        userId: user.id as number,
        legacyStudentId: oldStudent.id,
        applicationId: null,
        community: (oldStudent.communityid === 0 || oldStudent.communityid === null) ? null : (oldStudent.communityid === 1 ? "GUJARATI" : "NON-GUJARATI"),
        handicapped: !!oldStudent.handicapped,
    }).returning();

    return newStudent;
}


export async function addAccommodation(oldStudent: OldStudent, student: Student) {
    const [existingAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, student.id as number));
    if (existingAccommodation) {
        return existingAccommodation;
    }
    let placeOfStay: "OWN" | "HOSTEL" | "RELATIVES" | "FAMILY_FRIENDS" | "PAYING_GUEST" | null;
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

    const [address] = await db.insert(addressModel).values({
        addressLine: oldStudent.placeofstayaddr?.toUpperCase()?.trim(),
        localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
        phone: oldStudent.placeofstaycontactno?.trim()?.toUpperCase()
    }).returning();

    const [newAccommodation] = await db.insert(accommodationModel).values({
        studentId: student.id as number,
        placeOfStay,
        addressId: address.id
    }).returning();

    return newAccommodation;
}

// export async function addAdmission(oldStudent: OldStudent, student: Student) {
// const [existingAdmission] = await db.select().from(admissionModel).where(eq(admissionModel.studentId, student.id as number));
// if (existingAdmission) {
//     return existingAdmission;
// }

// const [newAdmission] = await db.insert(admissionModel).values({
//     studentId: student.id as number,
//     admissionCode: oldStudent.admissioncodeno?.trim()?.toUpperCase(),
//     applicantSignature: oldStudent.applicantSignature?.trim()?.toUpperCase(),
//     yearOfAdmission: oldStudent.admissionYear,
//     admissionDate: oldStudent.admissiondate?.toISOString()
// }).returning();

// return newAdmission;
// }

async function categorizeIncome(income: string | null | undefined) {
    if (!income || income.trim() === "" || income === "0") {
        return undefined;
    }

    const getAnnualIncome = async (range: string) => {
        const [existingAnnualIncome] = await db.select().from(annualIncomeModel).where(eq(annualIncomeModel.range, range));
        if (existingAnnualIncome) {
            return existingAnnualIncome;
        }
        const [newAnnualIncome] = await db.insert(annualIncomeModel).values({ range }).returning();

        return newAnnualIncome;
    }

    const lowerIncome = income.toLowerCase();

    if (lowerIncome.includes("upto 1.2") || lowerIncome.includes("upto rs. 1.2") || lowerIncome.includes("1,20,000") || lowerIncome.includes("1.2 to 3")) {
        return await getAnnualIncome("Below ₹3 Lakh");
    }
    if (lowerIncome.includes("3 to 5") || lowerIncome.includes("1.2 lakh to 5") || lowerIncome.includes("1.2 lac to 5")) {
        return await getAnnualIncome("₹3 - ₹5 Lakh");
    }
    if (lowerIncome.includes("5 lakh and above") || lowerIncome.includes("5 lacs and above") || lowerIncome.includes("5 to 8") || lowerIncome.includes("rs. 5,00,000 & above")) {
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


export async function addFamily(oldStudent: OldStudent, student: Student) {
    const [existingFamily] = await db.select().from(familyModel).where(eq(familyModel.studentId, student.id as number));
    if (existingFamily) {
        return existingFamily;
    }

    let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
    if (oldStudent.issnglprnt) {
        if (oldStudent.issnglprnt.toLowerCase() === "bth") {
            parentType = "BOTH";
        }
        else if (oldStudent.issnglprnt.toLowerCase() === "sngl_fthr") {
            parentType = "FATHER_ONLY";
        }
        else if (oldStudent.issnglprnt.toLowerCase() === "sngl_mthr") {
            parentType = "MOTHER_ONLY";
        }
    }

    let fatherOccupation: Occupation | undefined;
    if (oldStudent.fatherOccupation) {
        const [fatherOccupationResult] = await mysqlConnection.query(`SELECT * FROM parentoccupation WHERE id = ${oldStudent.fatherOccupation}`) as [{ id: number, occupationName: string }[], any];
        if (fatherOccupationResult.length > 0) {
            fatherOccupation = await addOccupation(fatherOccupationResult[0].occupationName, db, oldStudent.fatherOccupation);
        }
    }

    const [father] = await db.insert(personModel).values({
        name: oldStudent.fatherName?.toUpperCase()?.trim(),
        email: oldStudent.fatherEmail?.trim().toLowerCase(),
        aadhaarCardNumber: formatAadhaarCardNumber(oldStudent.fatheraadharno),
        phone: oldStudent.fatherMobNo?.trim(),
        officePhone: oldStudent.fatherOffPhone?.trim(),
        image: oldStudent.fatherPic?.trim(),
        occupationId: fatherOccupation ? fatherOccupation.id : undefined
    }).returning();

    let motherOccupation: Occupation | undefined;
    if (oldStudent.motherOccupation) {
        const [motherOccupationResult] = await mysqlConnection.query(`SELECT * FROM parentoccupation WHERE id = ${oldStudent.motherOccupation}`) as [{ id: number, occupationName: string }[], any];
        if (motherOccupationResult.length > 0) {
            motherOccupation = await addOccupation(motherOccupationResult[0].occupationName, db, oldStudent.motherOccupation);
        }
    }

    const [mother] = await db.insert(personModel).values({
        name: oldStudent.motherName?.toUpperCase()?.trim(),
        email: oldStudent.motherEmail?.trim().toLowerCase(),
        aadhaarCardNumber: formatAadhaarCardNumber(oldStudent.motheraadharno),
        phone: oldStudent.motherMobNo?.trim(),
        officePhone: oldStudent.motherOffPhone?.trim(),
        image: oldStudent.motherPic?.trim(),
        occupationId: motherOccupation ? motherOccupation.id : undefined

    }).returning();

    let guardianOccupation: Occupation | undefined;
    if (oldStudent.guardianOccupation) {
        const [guardianOccupationResult] = await mysqlConnection.query(`SELECT * FROM parentoccupation WHERE id = ${oldStudent.fatherOccupation}`) as [{ id: number, occupationName: string }[], any];
        if (guardianOccupationResult.length > 0) {
            guardianOccupation = await addOccupation(guardianOccupationResult[0].occupationName, db, oldStudent.guardianOccupation);
        }
    }

    const [guardian] = await db.insert(personModel).values({
        name: oldStudent.guardianName?.toUpperCase()?.trim(),
        email: oldStudent.guardianEmail?.trim().toLowerCase(),
        aadhaarCardNumber: formatAadhaarCardNumber(oldStudent.gurdianaadharno),
        phone: oldStudent.guardianMobNo?.trim(),
        officePhone: oldStudent.guardianOffPhone?.trim(),
        image: oldStudent.guardianPic?.trim(),
        occupationId: guardianOccupation ? guardianOccupation.id : undefined
    }).returning();

    const annualIncome = await categorizeIncome(oldStudent.annualFamilyIncome);

    const [newFamily] = await db.insert(familyModel).values({
        studentId: student.id as number,
        annualIncomeId: annualIncome ? annualIncome.id : undefined,
        parentType,
        fatherDetailsId: father.id,
        motherDetailsId: mother.id,
        guardianDetailsId: guardian.id,
    }).returning();

    return newFamily;
}

export async function addHealth(oldStudent: OldStudent, student: Student) {
    const [existingHealth] = await db.select().from(healthModel).where(eq(healthModel.studentId, student.id as number));
    if (existingHealth) {
        return existingHealth;
    }

    let bloodGroup: BloodGroup | undefined;
    if (oldStudent.bloodGroup) {
        const [bloodGroupResult] = await mysqlConnection.query(`SELECT * FROM bloodgroup WHERE id = ${oldStudent.bloodGroup}`) as [{ id: number, name: string }[], any];
        if (bloodGroupResult.length > 0) {
            bloodGroup = await addBloodGroup(bloodGroupResult[0].name, db, oldStudent.bloodGroup);
        }
    }

    const [newHealth] = await db.insert(healthModel).values({
        studentId: student.id as number,
        bloodGroupId: bloodGroup ? bloodGroup.id : undefined,
        eyePowerLeft: oldStudent.eyePowerLeft?.trim()?.toUpperCase(),
        eyePowerRight: oldStudent.eyePowerRight?.trim()?.toUpperCase(),
    } as Health).returning();

    return newHealth;
}

export async function addEmergencyContact(oldStudent: OldStudent, student: Student) {
    const [existingEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.studentId, student.id as number));
    if (existingEmergencyContact) {
        return existingEmergencyContact;
    }

    const [newEmergencyContact] = await db.insert(emergencyContactModel).values({
        studentId: student.id as number,
        personName: oldStudent.emercontactpersonnm?.trim()?.toUpperCase(),
        phone: oldStudent.emercontactpersonmob?.trim(),
        residentialPhone: oldStudent.emrgnResidentPhNo?.trim(),
        relationToStudent: oldStudent.emerpersreltostud?.trim()?.toUpperCase(),
        officePhone: oldStudent.emrgnOfficePhNo?.trim(),
    }).returning();

    return newEmergencyContact;
}

export async function addPersonalDetails(oldStudent: OldStudent, student: Student) {
    const [existingPersonalDetails] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.studentId, student.id as number));
    if (existingPersonalDetails) {
        return existingPersonalDetails;
    }

    let mailingAddress: Address | undefined;
    if (oldStudent.mailingAddress || oldStudent.mailingPinNo) {
        const [address] = await db.insert(addressModel).values({
            addressLine: oldStudent.mailingAddress?.trim()?.toUpperCase(),
            localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
            pincode: oldStudent.mailingPinNo?.trim()?.toUpperCase()
        }).returning();
        mailingAddress = address;
    }

    let residentialAddress: Address | undefined;
    if (oldStudent.mailingAddress || oldStudent.mailingPinNo) {
        const [address] = await db.insert(addressModel).values({
            addressLine: oldStudent.residentialAddress?.trim()?.toUpperCase(),
            phone: oldStudent.resiPhoneMobileNo?.trim()?.toUpperCase(),
            localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
            pincode: oldStudent.resiPinNo?.trim()?.toUpperCase()
        }).returning();
        residentialAddress = address;
    }

    let nationality: Nationality | undefined;
    if (oldStudent.nationalityId) {
        const [nationalityResult] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldStudent.nationalityId}`) as [{ id: number, nationalityName: string, code: number }[], any];
        if (nationalityResult.length > 0) {
            nationality = await addNationality(nationalityResult[0].nationalityName, nationalityResult[0].code, db, oldStudent.nationalityId);
        }
    }
    let otherNationality: Nationality | undefined;
    if (oldStudent.othernationality) {
        const [otherNationalityResult] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldStudent.othernationality}`) as [{ id: number, nationalityName: string, code: number }[], any];
        if (otherNationalityResult.length > 0) {
            otherNationality = await addNationality(otherNationalityResult[0].nationalityName, otherNationalityResult[0].code, db);
        }
    }
    let category: Category | undefined;
    if (oldStudent.studentCategoryId) {
        const [categoryResult] = await mysqlConnection.query(`SELECT * FROM category WHERE id = ${oldStudent.studentCategoryId}`) as [{ id: number, category: string, code: string, docneeded: boolean | undefined }[], any];
        if (categoryResult.length > 0) {
            category = await addCategory(categoryResult[0].category, categoryResult[0].code, categoryResult[0].docneeded, db, oldStudent.studentCategoryId);
        }
    }
    let religion: Religion | undefined;
    if (oldStudent.religionId) {
        const [religionResult] = await mysqlConnection.query(`SELECT * FROM religion WHERE id = ${oldStudent.religionId}`) as [{ id: number, religionName: string }[], any];
        if (religionResult.length > 0) {
            religion = await addReligion(religionResult[0].religionName, db, oldStudent.religionId);
        }
    }
    let motherTongue: LanguageMedium | undefined;
    if (oldStudent.motherTongueId) {
        const [motherTongueResult] = await mysqlConnection.query(`SELECT * FROM mothertongue WHERE id = ${oldStudent.motherTongueId}`) as [{ id: number, mothertongueName: string }[], any];
        if (motherTongueResult.length > 0) {
            motherTongue = await addLanguageMedium(motherTongueResult[0].mothertongueName, db, oldStudent.motherTongueId);
        }
    }

    const [newPersonalDetails] = await db.insert(personalDetailsModel).values({
        studentId: student.id as number,
        dateOfBirth: oldStudent.dateOfBirth ? oldStudent.dateOfBirth.toISOString() : undefined,
        gender: oldStudent.sexId === 0 ? undefined : (oldStudent.sexId === 1 ? "MALE" : "FEMALE"),
        nationalityId: nationality ? nationality.id : undefined,
        otherNationalityId: otherNationality ? otherNationality.id : undefined,
        categoryId: category ? category.id : undefined,
        religionId: religion ? religion.id : undefined,
        aadhaarCardNumber: formatAadhaarCardNumber(oldStudent.aadharcardno),
        alternativeEmail: oldStudent.alternativeemail?.trim().toLowerCase(),
        email: oldStudent.email?.trim().toLowerCase(),
        mailingAddressId: mailingAddress ? mailingAddress.id as number : undefined,
        residentialAddressId: residentialAddress ? residentialAddress.id as number : undefined,
        motherTongueId: motherTongue ? motherTongue.id : undefined,
        // disability: oldStudent.disabilitycode

    }).returning();

    return newPersonalDetails;
}

export async function addBoardUnversity(oldStudent: OldStudent, db: DbType): Promise<BoardUniversity | undefined> {
    const [rows] = await mysqlConnection.query(`SELECT * FROM board WHERE id = ${oldStudent.lastBoardUniversity}`) as [OldBoard[], any];

    const [oldBoardUniversity] = rows;

    if (!oldBoardUniversity) {
        return undefined;
    }

    const [existingBoardUniversity] = await db.select().from(boardUniversityModel).where(eq(boardUniversityModel.name, oldBoardUniversity.boardName.trim().toUpperCase()));

    if (existingBoardUniversity) {
        return existingBoardUniversity;
    }

    let degree: Degree | undefined;
    const [degreeRows] = await mysqlConnection.query(`SELECT * FROM degree WHERE id = ${oldBoardUniversity.degreeid}`) as [OldDegree[], any];
    const [oldDegree] = degreeRows;
    if (oldDegree) {
        const [existingDegree] = await db.select().from(degreeModel).where(eq(degreeModel.name, oldDegree.degreeName.trim().toUpperCase()));
        if (existingDegree) {
            degree = existingDegree;
        }
        else {
            const [newDegree] = await db.insert(degreeModel).values({ name: oldDegree.degreeName.trim().toUpperCase() }).returning();
            degree = newDegree;
        }
    }

    const [newBoardUniversity] = await db.insert(boardUniversityModel).values({
        name: oldBoardUniversity.boardName.trim().toUpperCase(),
        degreeId: degree ? degree.id : undefined,
        passingMarks: oldBoardUniversity.passmrks,
        code: oldBoardUniversity.code,
    }).returning();

    return newBoardUniversity;
}

export async function addBoardResultStatus(oldStudent: OldStudent, db: DbType): Promise<BoardResultStatus | null> {
    const [boardResultRows] = await mysqlConnection.query(`SELECT * FROM boardresultstatus WHERE id = ${oldStudent.boardresultid}`) as [OldBoardStatus[], any];

    const [oldBoardResultStatus] = boardResultRows as OldBoardStatus[];

    if (!oldBoardResultStatus) {
        return null;
    }

    const [existingBoardResultStatus] = await db.select().from(boardResultStatusModel).where(eq(boardResultStatusModel.name, oldBoardResultStatus.name.trim().toUpperCase()));

    if (existingBoardResultStatus) {
        return existingBoardResultStatus;
    }

    let result;
    if (oldBoardResultStatus.flag?.trim().toUpperCase() === "FAIL") {
        result = "FAIL";
    }
    else if (oldBoardResultStatus.flag?.trim().toUpperCase() === "PASS") {
        result = "PASS";
    }

    const [newBoardResultStatus] = await db.insert(boardResultStatusModel).values({
        name: oldBoardResultStatus.name.trim().toUpperCase(),
        spclType: oldBoardResultStatus.spcltype?.trim().toUpperCase(),
        result: result as "FAIL" | "PASS" | undefined,
    }).returning();

    return newBoardResultStatus;
}

export async function addAcademicHistory(oldStudent: OldStudent, student: Student) {
    const [existingAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.studentId, student.id as number));
    if (existingAcademicHistory) {
        return existingAcademicHistory;
    }

    let lastBoardUniversity: BoardUniversity | undefined;
    if (oldStudent.lastBoardUniversity) {
        lastBoardUniversity = await addBoardUnversity(oldStudent, db);
    }

    let boardResultStatus: BoardResultStatus | null | undefined;
    if (oldStudent.boardresultid) {
        boardResultStatus = await addBoardResultStatus(oldStudent, db);
    }

    const [newAcdemicHistory] = await db.insert(academicHistoryModel).values({
        studentId: student.id as number,
        lastBoardUniversityId: lastBoardUniversity ? lastBoardUniversity.id : undefined,
        // lastInstitutionId: // TODO
        lastResultId: boardResultStatus ? boardResultStatus.id : undefined,
        // specialization: // TODO
        // remarks: 
        // studiedUpToClass
    }).returning();

    return newAcdemicHistory;
}

export async function addAcademicIdentifier(oldStudent: OldStudent, student: Student) {
    const cleanString = (value: unknown): string | undefined => {
        if (typeof value === "string") {
            return value.replace(/[\s\-\/]/g, "").trim()?.toUpperCase();
        }
        return undefined; // Return undefined for non-string values
    };

    const addHyphen = (value: unknown, type: "reg_no" | "roll_no"): string | undefined => {
        const cleanedValue = cleanString(value);
        if (!cleanedValue || isNaN(Number(cleanedValue))) return undefined; // Ensure it's numeric

        if (type === "reg_no" && cleanedValue.length === 13) {
            return cleanedValue.replace(/^(\d{3})(\d{4})(\d{4})(\d{2})$/, "$1-$2-$3-$4");
        }

        if (type === "roll_no") {
            if (cleanedValue.length === 10) {
                return cleanedValue.replace(/^(\d{4})(\d{2})(\d{4})$/, "$1-$2-$3");
            }
            if (cleanedValue.length === 12) {
                return cleanedValue.replace(/^(\d{6})(\d{2})(\d{4})$/, "$1-$2-$3");
            }
            if (cleanedValue.length === 13 && cleanedValue.includes("BBA")) {
                return cleanedValue.replace(/^(\d{3})(\d{6})(\d{4})$/, "$1-$2-$3");
            }
            if (cleanedValue.startsWith("B") || cleanedValue.startsWith("N")) {
                return cleanedValue;
            }
        }

        return undefined; // Return undefined if length is incorrect
    };

    const [existingAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, student.id as number));

    let framework: "CCF" | "CBCS" | undefined;
    if (oldStudent.coursetype && oldStudent.coursetype?.toUpperCase().trim() === "CBCS" || oldStudent.coursetype?.toUpperCase().trim() === "CCF") {
        framework = oldStudent.coursetype?.toUpperCase().trim() === "CBCS" ? "CBCS" : "CCF";
    }

    if (existingAcademicIdentifier) {
        const updatedValues: Record<string, any> = {};

        const registrationNumber = oldStudent.univregno
            ? addHyphen(oldStudent.univregno, "reg_no")
            : oldStudent.universityRegNo
                ? addHyphen(oldStudent.universityRegNo, "reg_no")
                : null;

        const rollNumber = oldStudent.univlstexmrollno ? addHyphen(oldStudent.univlstexmrollno, "roll_no") : undefined;

        if (registrationNumber !== null) updatedValues.registrationNumber = registrationNumber;
        if (rollNumber !== undefined) updatedValues.rollNumber = rollNumber;

        // Ensure there is at least one field to update
        if (Object.keys(updatedValues).length === 0) {
            console.warn("No values to update for academicIdentifierModel");
            return existingAcademicIdentifier;
        }

        console.log(updatedValues);

        const [updatedAcademicIdentifier] = await db
            .update(academicIdentifierModel)
            .set({
                registrationNumber: updatedValues?.registrationNumber ? updatedValues?.registrationNumber : null,
                rollNumber: updatedValues?.rollNumber ? updatedValues?.rollNumber : null,
            })
            .where(eq(academicIdentifierModel.id, existingAcademicIdentifier.id))
            .returning();

        return updatedAcademicIdentifier;
    }

    const [newAcademicIdentifier] = await db.insert(academicIdentifierModel).values({
        studentId: student.id as number,
        // streamId
        // course
        programCourseId: null,
        abcId: cleanString(oldStudent.abcid)?.toUpperCase(),
        apprid: cleanString(oldStudent.apprid)?.toUpperCase(),
        checkRepeat: typeof oldStudent.chkrepeat === 'undefined' ? undefined : oldStudent.chkrepeat,
        // apaarId
        classRollNumber: oldStudent.rollNumber ? oldStudent.rollNumber?.toString()?.trim()?.toUpperCase() : null,
        cuFormNumber: cleanString(oldStudent.cuformno)?.toUpperCase(),
        // frameworkType

        // framework,
        oldUid: cleanString(oldStudent.oldcodeNumber)?.toUpperCase(),
        uid: cleanString(oldStudent.codeNumber)?.toUpperCase(),
        registrationNumber: oldStudent.univregno ? addHyphen(oldStudent.univregno, "reg_no") : (oldStudent.universityRegNo ? addHyphen(oldStudent.universityRegNo, "reg_no") : null),
        rollNumber: addHyphen(oldStudent.univlstexmrollno, "roll_no"),
        rfid: cleanString(oldStudent.rfidno)?.toUpperCase(),
    }).returning();

    return newAcademicIdentifier;
}

export async function addTransportDetails(oldStudent: OldStudent, student: Student) {
    const [existingTransportDetails] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.studentId, student.id as number));
    if (existingTransportDetails) {
        return existingTransportDetails;
    }

    const [newTransportDetail] = await db.insert(transportDetailsModel).values({
        studentId: student.id as number,
        // transportId
        // pickupPointId
    }).returning();

    return newTransportDetail;
}


export async function processStudent(oldStudent: OldStudent, courseDetails: CourseDetails) {
    // Step 1: Check for the user
    const user = await addUser(oldStudent, db);

    // Step 2: Check for the student
    const student = await addStudent(oldStudent, user, db);

    // Step 3: Check for the accomodation
    await addAccommodation(oldStudent, student);

    // Step 4: Check for the admission
    // await addAdmission(oldStudent, student);

    // Step 5: Check for the Familys
    await addFamily(oldStudent, student);

    // Step 6: Check for the health
    await addHealth(oldStudent, student);

    // Step 7: Check for the emergency-contact
    await addEmergencyContact(oldStudent, student);

    // Step 8: Check for the personal-details
    await addPersonalDetails(oldStudent, student);

    // Step 9: Check for the academic-history
    await addAcademicHistory(oldStudent, student);

    // Step 10: Check for the academic-identifier
    await addAcademicIdentifier(oldStudent, student);

    // Step 11: Check for the transport-details
    await addTransportDetails(oldStudent, student);

    // Step 12: Course Details
    await processCourseDetails(oldStudent, student, courseDetails);

    return student;
}

async function processCourseDetails(oldStudent: OldStudent, student: Student, courseDetails: CourseDetails) {
    const [[oldCourse]] = await mysqlConnection.query(`
        SELECT * FROM course WHERE id = ${courseDetails.courseid}`) as [OldCourse[], any];

    const [existingAdmCourseDetails] = await db
        .select()
        .from(admissionCourseDetailsModel)
        .where(eq(admissionCourseDetailsModel.studentId, student.id as number))

    if (existingAdmCourseDetails) return existingAdmCourseDetails;

    const course = await addCourse(courseDetails.courseid);

    const classData = await addClass(courseDetails.classid);

    const eligibilityCriteria = await addEligibilityCriteria(courseDetails.eligibilityCriteriaId);

    const studenrCategory = await addStudentCategory(courseDetails.studentCategoryId);

    const shift = await addShift(courseDetails.shiftid);

    const meritList = await addMeritList(courseDetails.meritlistid);

    const bank = await addBank(courseDetails.feespaymentbankid);

    const bankBranch = await addBankBranch(courseDetails.feespaymentbrnchid);

    const bankBranchOther = courseDetails.feespaymentbrnchothr;
    const bankOther = courseDetails.feespaidtype;

    let stream: Stream | undefined;
    console.log("course?.name", course?.name);

    // Remove dots and normalize the course name for comparison
    const normalizedCourseName = course?.name.toLowerCase().replace(/\./g, '').trim();

    if (normalizedCourseName?.includes("bsc")) {
        stream = await addStream({
            name: "Science & Technology",
            code: "Sci.",
            shortName: "Sci.",
            disabled: false,
        });
    }
    else if (normalizedCourseName?.includes("ba")) {
        stream = await addStream({
            name: "Arts & Humanities",
            code: "Arts",
            shortName: "Arts",
            disabled: false,
        });
    }
    else if (
        ((
            normalizedCourseName?.includes("(h)") || normalizedCourseName?.includes("(g)")) &&
            normalizedCourseName?.includes('bcom')
        ) ||
        normalizedCourseName?.includes('bba')
    ) {
        stream = await addStream({
            name: "Commerce & Management",
            code: "Com.",
            shortName: "Com.",
        });
    }

    // Default stream for courses that don't match the above patterns
    if (!stream) {
        throw new Error("Stream not found...!");
    }


    let courseType: CourseType | undefined;
    if (oldCourse.courseName.toLowerCase().trim().includes("(h)")) {
        courseType = (await db
            .select()
            .from(courseTypeModel)
            .where(
                and(
                    ilike(courseTypeModel.name, "Honours"),
                )
            )
        )[0];
        if (!courseType) {
            throw new Error("Course Type not found...!");
        }
    }
    else if (oldCourse.courseName.toLowerCase().trim().includes("(g)")) {
        courseType = (await db
            .select()
            .from(courseTypeModel)
            .where(
                and(
                    ilike(courseTypeModel.name, "General"),
                )
            )
        )[0];
        if (!courseType) {
            throw new Error("Course Type not found...!");
        }
    }

    // Default course type for courses that don't have (H) or (G)
    if (!courseType) {
        courseType = (await db
            .select()
            .from(courseTypeModel)
            .where(
                and(
                    ilike(courseTypeModel.name, "Regular"),
                )
            )
        )[0];
        if (!courseType) {
            throw new Error("Course Type 'Regular' not found...!");
        }
    }


    const programCourse = await addProgramCourse(stream, courseDetails, course!, courseType!);

    const [newAdmissionCourseDetails] = await db
        .insert(admissionCourseDetailsModel)
        .values({
            studentId: student.id as number,
            legacyCourseDetailsId: courseDetails.id,
            streamId: stream?.id, // TODO: Add proper stream mapping
            programCourseId: programCourse.id!, // TODO: Add proper program course mapping
            classId: classData?.id!,
            shiftId: shift?.id,
            studentCategoryId: studenrCategory?.id,
            rollNumber: courseDetails.rollNumber || '',
            appNumber: courseDetails.appno || '',
            challanNumber: courseDetails.chllno || '',
            amount: courseDetails.amt || 0,
            paymentTimestamp: courseDetails.paymentDate,
            paymentType: courseDetails.paymentType,
            applicationTimestamp: courseDetails.applicationdt || new Date(),
            isSmsSent: !!courseDetails.smssent,
            smsSentAt: courseDetails.smssenton,
            isVerified: !!courseDetails.verified,
            verifiedAt: courseDetails.verifydt,
            verifiedBy: courseDetails.verifiedby,
            verifiedOn: courseDetails.verifiedon,
            freeshipDate: courseDetails.freeshipdate,
            freeshipPercentage: courseDetails.freeshipperc || 0,
            isFreeshipApplied: !!courseDetails.freeshipapplied,
            isFreeshipApproved: !!courseDetails.freeshipapproved,
            isFeesChallanGenerated: !!courseDetails.feeschallangenerated,
            feesChallanNumber: courseDetails.feeschallanno?.toString(),
            feesChallanDate: courseDetails.feeschallandate,
            isFeesPaid: !!courseDetails.feespaymententrydate,
            feesPaidType: courseDetails.feespaidtype,
            feesPaidAt: courseDetails.feespaymentdate,
            feesPaymentBankBranchId: bankBranch?.id,
            feesPaymentBankId: bank?.id,
            feesDraftNumber: courseDetails.feesdraftno,
            feesDratdtDate: courseDetails.feesdraftdt,
            feesDraftDrawnOn: courseDetails.feesdraftdrawnon,
            feesDraftAmount: courseDetails.feesdraftamt || 0,
            meritListId: meritList?.id,

        } as AdmissionCourseDetails)
        .returning();

    // Add the selected subject
    await getSubjectRelatedFields(courseDetails, programCourse, newAdmissionCourseDetails)
    console.log("newAdmissionCourseDetails", newAdmissionCourseDetails);
    return newAdmissionCourseDetails;
}

async function getSubjectRelatedFields(courseDetails: CourseDetails, programCourse: ProgramCourse, newAdmissionCourseDetails: AdmissionCourseDetails) {
    const [foundAffiliation] = await db
        .select()
        .from(affiliationModel)
        .where(
            ilike(affiliationModel.shortName, "CU"),
        )

    if (!foundAffiliation) {
        throw new Error("Affiliation not found...!");
    }

    // Try to find semester 1 class, if not found create it
    let [foundClass] = await db
        .select()
        .from(classModel)
        .where(
            ilike(classModel.name, "semester 1"),
        );

    if (!foundClass) {
        // Create semester 1 class if it doesn't exist
        [foundClass] = await db
            .insert(classModel)
            .values({
                name: "SEMESTER 1",
                type: "SEMESTER",
            })
            .returning();
    }

    const [foundRegulationType] = await db
        .select()
        .from(regulationTypeModel)
        .where(
            ilike(regulationTypeModel.shortName, "ccf"),
        )

    if (!foundRegulationType) {
        throw new Error("Regulation Type not found...!");
    }

    const [foundAcademicYear] = await db
        .select()
        .from(academicYearModel)
        .where(
            eq(academicYearModel.year, "2025-26"),
        )

    if (!foundAcademicYear) {
        throw new Error("Academic Year not found...!");
    }

    const [oldCvSubjectSelections] = await mysqlConnection.query(`
        SELECT * FROM cvsubjectselection WHERE parent_id = ${courseDetails.id}
    `) as [OldCvSubjectSelection[], any];

    // if (oldCvSubjectSelections.length === 0) {
    //     throw new Error("CV Subject Selection not found...!");
    // }

    for (let i = 0; i < oldCvSubjectSelections.length; i++) {
        const oldCvSubjectSelection = oldCvSubjectSelections[i];
        const [[oldSubject]] = await mysqlConnection.query(`SELECT * FROM subject WHERE id = ${oldCvSubjectSelection.subjectid}`) as [OldSubject[], any];
        let [[oldSubjectType]] = await mysqlConnection.query(`SELECT * FROM subjecttype WHERE id = ${oldCvSubjectSelection.subjecttypeid}`) as [OldSubjectType[], any];
        let [foundSubject] = await db
            .select()
            .from(subjectModel)
            .where(
                ilike(subjectModel.name, oldSubject.subjectName.trim().toUpperCase()),
            )
        if (!foundSubject) {
            const newSubject = await db
                .insert(subjectModel)
                .values({
                    name: oldSubject.subjectName.trim().toUpperCase(),
                    code: oldSubject.univcode?.trim().toUpperCase(),
                })
                .returning();
            foundSubject = newSubject[0];
        }

        let [foundSubjectType] = await db
            .select()
            .from(subjectTypeModel)
            .where(
                ilike(subjectTypeModel.name, oldSubjectType.subjectTypeName.trim().toUpperCase()),
            )
        if (!foundSubjectType) {
            const newSubjectType = await db
                .insert(subjectTypeModel)
                .values({
                    name: oldSubjectType.subjectTypeName.trim().toUpperCase(),
                })
                .returning();
            foundSubjectType = newSubjectType[0];
        }

        let [foundPaper] = await db
            .select()
            .from(paperModel)
            .where(
                and(
                    eq(paperModel.subjectId, foundSubject.id!),
                    eq(paperModel.affiliationId, foundAffiliation.id!),
                    eq(paperModel.regulationTypeId, foundRegulationType.id!),
                    eq(paperModel.academicYearId, foundAcademicYear.id!),
                    eq(paperModel.subjectTypeId, foundSubjectType.id!),
                    eq(paperModel.programCourseId, programCourse.id!),
                    eq(paperModel.classId, foundClass.id!),
                )
            )
        if (!foundPaper) {
            const newPaper = await db
                .insert(paperModel)
                .values({
                    name: '',
                    code: '',
                    affiliationId: foundAffiliation.id!,
                    regulationTypeId: foundRegulationType.id!,
                    subjectId: foundSubject.id!,
                    subjectTypeId: foundSubjectType.id!,
                    programCourseId: programCourse.id!,
                    classId: foundClass.id!,
                    isOptional: false,
                    academicYearId: foundAcademicYear.id!,
                })
                .returning();
            foundPaper = newPaper[0];
        }

        await addAdmSubjectPaperSelection(oldCvSubjectSelection, newAdmissionCourseDetails.studentId!, newAdmissionCourseDetails.id!, foundPaper.id);



    }


}

async function addProgramCourse(stream: Stream | undefined, courseDetails: CourseDetails, course: Course, courseType: CourseType) {
    if (!stream || !course || !courseType) {
        throw new Error("Stream, Course or Course Type not found...!");
    }

    const [foundCourseLevel] = await db
        .select()
        .from(courseLevelModel)
        .where(
            eq(courseLevelModel.name, "Undergraduate"),
        )
    if (!foundCourseLevel) {
        throw new Error("Course Level not found...!");
    }

    const [foundAffiliation] = await db
        .select()
        .from(affiliationModel)
        .where(
            ilike(affiliationModel.shortName, "CU"),
        )

    if (!foundAffiliation) {
        throw new Error("Affiliation not found...!");
    }

    const [foundRegulationType] = await db
        .select()
        .from(regulationTypeModel)
        .where(
            ilike(regulationTypeModel.shortName, "ccf"),
        )

    if (!foundRegulationType) {
        throw new Error("Regulation Type not found...!");
    }


    const [foundProgramCourse] = await db
        .select()
        .from(programCourseModel)
        .where(
            and(
                eq(programCourseModel.streamId, stream.id!),
                eq(programCourseModel.courseId, course.id!),
                eq(programCourseModel.courseTypeId, courseType.id!),
                eq(programCourseModel.courseLevelId, foundCourseLevel.id!),
                eq(programCourseModel.affiliationId, foundAffiliation.id!),
                eq(programCourseModel.regulationTypeId, foundRegulationType.id!),
            )
        );

    if (foundProgramCourse) return foundProgramCourse;

    const newProgramCourse = await db
        .insert(programCourseModel)
        .values({
            streamId: stream.id!,
            courseId: course.id!,
            courseTypeId: courseType.id!,
            courseLevelId: foundCourseLevel.id!,
            affiliationId: foundAffiliation.id!,
            regulationTypeId: foundRegulationType.id!,
            duration: 4,
            totalSemesters: 8,
        })
        .returning();


    return newProgramCourse[0];
}

async function addStudentCategory(oldStudentCategoryId: number | null) {
    if (!oldStudentCategoryId) return null;

    const [[studentCategoryRow]] = await mysqlConnection.query(`SELECT * FROM studentcatagory WHERE id = ${oldStudentCategoryId}`) as [OldStudentCategory[], any];

    if (!studentCategoryRow) return null;

    const [foundStudentCategory] = await db
        .select()
        .from(studentCategoryModel)
        .where(
            eq(studentCategoryModel.name, studentCategoryRow.studentCName.trim().toUpperCase()),
        )

    if (foundStudentCategory) return foundStudentCategory;

    const course = await addCourse(studentCategoryRow.courseId);
    const classSem = await addClass(studentCategoryRow.classId);

    return (await db
        .insert(studentCategoryModel)
        .values({
            legacyStudentCategoryId: oldStudentCategoryId,
            name: studentCategoryRow.studentCName.trim().toUpperCase(),
            courseId: course?.id || 0,
            classId: classSem?.id || 0,
            documentRequired: !!studentCategoryRow.document,
        })
        .returning()
    )[0];
}

async function addClass(oldClassId: number | null) {
    if (!oldClassId) return null;

    const [[classRow]] = await mysqlConnection.query(`SELECT * FROM classes WHERE id = ${oldClassId}`) as [OldClass[], any];

    if (!classRow) return null;

    const [foundClass] = await db
        .select()
        .from(classModel)
        .where(
            ilike(classModel.name, classRow.classname.trim().toUpperCase()),
        )


    if (foundClass) return foundClass;

    return (await db
        .insert(classModel)
        .values({
            name: classRow.classname.trim().toUpperCase(),
            type: classRow.type === "year" ? "YEAR" : "SEMESTER",
        })
        .returning()
    )[0];
}


async function addStream(stream: Stream) {
    const [foundStream] = await db
        .select()
        .from(streamModel)
        .where(
            ilike(streamModel.name, stream.name.trim().toUpperCase()),
        )

    if (foundStream) return foundStream;

    return (await db
        .insert(streamModel)
        .values(stream)
        .returning()
    )[0];
}

async function addCourse(oldCourseId: number | null) {
    if (!oldCourseId) return null;
    const [[courseRow]] = await mysqlConnection.query(`SELECT * FROM course WHERE id = ${oldCourseId}`) as [OldCourse[], any];

    if (!courseRow) return null;

    const [foundCourse] = await db
        .select()
        .from(courseModel)
        .where(
            ilike(courseModel.name, courseRow.courseName.trim().toUpperCase()),
        )

    if (foundCourse) return foundCourse;

    // Get the next available sequence number by finding the max sequence
    const existingCourses = await db
        .select({ sequence: courseModel.sequence })
        .from(courseModel)
        .orderBy(courseModel.sequence);

    // Find the highest sequence number and add 1
    const maxSequence = existingCourses.length > 0
        ? Math.max(...existingCourses.map(c => c.sequence || 0))
        : 0;
    const nextSequence = maxSequence + 1;

    return (await db
        .insert(courseModel)
        .values({
            name: courseRow.courseName.trim().toUpperCase(),
            shortName: courseRow.courseSName?.trim().toUpperCase(),
            legacyCourseId: oldCourseId,
            sequence: nextSequence,
        })
        .returning()
    )[0];
}

async function addEligibilityCriteria(oldEligibilityId: number | null) {
    if (!oldEligibilityId) return null;
    const [[eligibilityRow]] = await mysqlConnection.query(`SELECT * FROM eligibilitycriteria WHERE id = ${oldEligibilityId}`) as [OldEligibilityCriteria[], any];

    if (!eligibilityRow) return null;

    const [foundEligibilityCriteria] = await db
        .select()
        .from(eligibilityCriteriaModel)
        .where(
            and(
                eq(eligibilityCriteriaModel.courseId, eligibilityRow.courseId),
                eq(eligibilityCriteriaModel.classId, eligibilityRow.classId),
                eq(eligibilityCriteriaModel.categoryId, eligibilityRow.categoryId),
            )
        )

    if (foundEligibilityCriteria) return foundEligibilityCriteria;

    return (await db
        .insert(eligibilityCriteriaModel)
        .values({
            legacyEligibilityCriteriaId: oldEligibilityId,
            courseId: eligibilityRow.courseId,
            classId: eligibilityRow.classId,
            categoryId: eligibilityRow.categoryId,
            description: eligibilityRow.description?.trim().toUpperCase(),
            generalInstruction: eligibilityRow.generalInstruction?.trim().toUpperCase(),

        })
        .returning()
    )[0];
}

async function addShift(oldShiftId: number | null) {
    if (!oldShiftId) return null;

    const [[shiftRow]] = await mysqlConnection.query(`SELECT * FROM shift WHERE id = ${oldShiftId}`) as [OldShift[], any];

    if (!shiftRow) return null;

    const [foundShift] = await db
        .select()
        .from(shiftModel)
        .where(
            eq(shiftModel.name, shiftRow.shiftName.trim().toUpperCase()),
        )

    if (foundShift) return foundShift;

    return (await db
        .insert(shiftModel)
        .values({
            legacyShiftId: oldShiftId,
            name: shiftRow.shiftName.trim().toUpperCase(),
            codePrefix: shiftRow.codeprefix?.trim().toUpperCase(),
        })
        .returning()
    )[0];
}

async function addMeritList(oldMeritListId: number | null) {
    if (!oldMeritListId) return null;

    const [[meritListRow]] = await mysqlConnection.query(`SELECT * FROM meritlist WHERE id = ${oldMeritListId}`) as [OldMeritList[], any];

    if (!meritListRow) return null;

    const [foundMeritList] = await db
        .select()
        .from(meritListModel)
        .where(
            eq(meritListModel.name, meritListRow.name.trim().toUpperCase()),
        )

    if (foundMeritList) return foundMeritList;

    return (await db
        .insert(meritListModel)
        .values({
            legacyMeritListId: oldMeritListId,
            name: meritListRow.name.trim().toUpperCase(),
            description: meritListRow.description.trim(),
            checkAuto: meritListRow.checkauto === 1, // Convert 0 or 1 to boolean
        })
        .returning()
    )[0];
}



async function addBank(oldBankId: number | null) {
    if (!oldBankId) return null;

    const [[bankRow]] = await mysqlConnection.query(`SELECT * FROM adminbank WHERE id = ${oldBankId}`) as [OldBank[], any];

    if (!bankRow) return null;

    const [foundBank] = await db
        .select()
        .from(bankModel)
        .where(
            eq(bankModel.name, bankRow.bankName.trim().toUpperCase()),
        )

    if (foundBank) return foundBank;

    return (await db
        .insert(foundBank)
        .values({
            legacyBankId: oldBankId,
            name: bankRow.bankName.trim().toUpperCase(),
        })
        .returning()
    )[0];
}


async function addBankBranch(oldBankBranchId: number | null) {
    if (!oldBankBranchId) return null;

    const [[bankBranchRow]] = await mysqlConnection.query(`SELECT * FROM bankbranch WHERE id = ${oldBankBranchId}`) as [OldBankBranch[], any];

    const bank = await addBank(bankBranchRow?.bankid ?? null);

    if (!bank || !bankBranchRow) return null;

    const [foundBankBranch] = await db
        .select()
        .from(bankBranchModel)
        .where(
            and(
                eq(bankBranchModel.bankId, bank.id!),
                eq(bankBranchModel.name, bankBranchRow.name.trim().toUpperCase()),
            )
        )

    if (foundBankBranch) return foundBankBranch;

    return (await db
        .insert(bankBranchModel)
        .values({
            legacyBankBranchId: oldBankBranchId,
            name: bankBranchRow.name.trim().toUpperCase(),
            bankId: bank.id!,
        })
        .returning()
    )[0];
}

async function addAdmSubjectPaperSelection(cvSubjectSelectionRow: OldCvSubjectSelection, studentId: number, admissionCourseDetailsId: number, paperId: number) {


    if (!cvSubjectSelectionRow) return null;

    const [foundAdmSbjPprSelection] = await db
        .select()
        .from(admSubjectPaperSelectionModel)
        .where(
            and(
                eq(admSubjectPaperSelectionModel.legacyCVSubjectSelectionId, cvSubjectSelectionRow.id),
                eq(admSubjectPaperSelectionModel.studentId, studentId),
                eq(admSubjectPaperSelectionModel.studentId, admissionCourseDetailsId),
                eq(admSubjectPaperSelectionModel.paperId, paperId),
            )
        );

    if (foundAdmSbjPprSelection) return foundAdmSbjPprSelection;

    return (await db
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


async function addSubjectType(oldSubjectTypeId: number | null) {
    if (!oldSubjectTypeId) return null;

    const [[subjectTypeRow]] = await mysqlConnection.query(`
        SELECT * FROM subjecttype WHERE id = ${oldSubjectTypeId}
    `) as [OldSubjectType[], any];

    if (!subjectTypeRow) return null;

    const [foundSubjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(
            eq(subjectTypeModel.name, subjectTypeRow.subjectTypeName.trim().toUpperCase()),
        );

    if (foundSubjectType) return foundSubjectType;

    return (await db
        .insert(subjectTypeModel)
        .values({
            legacySubjectTypeId: oldSubjectTypeId,
            name: subjectTypeRow.subjectTypeName.trim().toUpperCase(),
            code: subjectTypeRow.shortname?.trim().toUpperCase(),
        })
        .returning()
    )[0];
}

async function addSubject(oldSubjectId: number | null) {
    if (!oldSubjectId) return null;

    const [[subjectRow]] = await mysqlConnection.query(`
        SELECT * FROM subject WHERE id = ${oldSubjectId}
    `) as [OldSubject[], any];

    if (!subjectRow) return null;

    const [foundSubject] = await db
        .select()
        .from(subjectModel)
        .where(
            eq(subjectModel.name, subjectRow.subjectName.trim().toUpperCase()),
        );

    if (foundSubject) return foundSubject;

    return (await db
        .insert(subjectModel)
        .values({
            legacySubjectId: oldSubjectId,
            name: subjectRow.subjectName.trim().toUpperCase(),
            code: subjectRow.univcode?.trim().toUpperCase(),
        })
        .returning()
    )[0];
}


export const createOldStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // STEP 1: Load all the batches
        // await loadOlderBatches();
        // STEP 2: Count the total numbers of students
        await loadStudentsV2();

        // await loadPaperSubjects();

        res.status(201).json(new ApiResponse(201, "SUCCESS", true, "Student added successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}


export async function loadStudentsV2() {
    // STEP 1: Count the total numbers of students
    console.log('\n\nCounting rows from table \`coursedetails\`...');
    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows
        FROM coursedetails
        WHERE uid IS NOT NULL AND shiftid = 2;
    `);
    const { totalRows } = (rows as { totalRows: number }[])[0];
    // STEP 2: Calculate the number of batches
    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches
    console.log(`\nTotal rows to migrate: ${totalRows}`);
    // STEP 3: Loop over the batches
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        // console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        // const [rows] = await mysqlConnection.query(`
        //     SELECT * 
        //     FROM studentpersonaldetails
        //     WHERE academicyearid = 17 OR academicyearid = 18
        //     LIMIT ${BATCH_SIZE} 
        //     OFFSET ${offset};
        // `) as [OldStudent[], any];

        console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        const [rows] = await mysqlConnection.query(`
            SELECT * 
            FROM coursedetails
            WHERE uid IS NOT NULL AND shiftid = 2
            LIMIT ${BATCH_SIZE}
            OFFSET ${offset};
        `) as [CourseDetails[], any];

        const oldDataArr = rows as CourseDetails[];

        for (let i = 0; i < oldDataArr.length; i++) {
            // Fetch the related studentpersonalDetail
            const [studentPersonalDetailRows] = await mysqlConnection.query(`
                SELECT * 
                FROM studentpersonaldetails
                WHERE admissionid = ${oldDataArr[i].id};
            `) as [OldStudent[], any];
            try {
                if (studentPersonalDetailRows.length === 0) {
                    console.log(`No studentpersonaldetails found for admissionid: ${oldDataArr[i].id}`);
                    continue; // Skip to the next iteration if no related record is found
                }
                await processStudent(studentPersonalDetailRows[0], oldDataArr[i]);
            } catch (error) {
                console.log(error)
            }
            console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${studentPersonalDetailRows[0]?.name}`);

        }
    }
}
