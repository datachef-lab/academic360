import { db, mysqlConnection } from "@/db/index.js";
import * as path from "path";
import bcrypt from "bcrypt";
import { OldStudent } from "@/types/old-data/old-student.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { User, userModel } from "../models/user.model.js";
import { and, eq, ne } from "drizzle-orm";
import { Student, studentModel } from "../models/student.model.js";
import { accommodationModel } from "../models/accommodation.model.js";
import { Address, addressModel } from "../models/address.model.js";
import { admissionModel } from "../models/admission.model.js";
import { familyModel } from "../models/family.model.js";
import { personModel } from "../models/person.model.js";
import { Health, healthModel } from "../models/health.model.js";
import { emergencyContactModel } from "../models/emergencyContact.model.js";
import { personalDetailsModel } from "../models/personalDetails.model.js";
import { academicHistoryModel } from "../models/academicHistory.model.js";
import { transportDetailsModel } from "../models/transportDetails.model.js";
import { academicIdentifierModel } from "../models/academicIdentifier.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { number } from "zod";
import { occupationModel, Occupation } from "@/features/resources/models/occupation.model.js";
import { BloodGroup, bloodGroupModel } from "@/features/resources/models/bloodGroup.model.js";
import { Nationality, nationalityModel } from "@/features/resources/models/nationality.model.js";
import { Category, categoryModel } from "@/features/resources/models/category.model.js";
import { Religion, religionModel } from "@/features/resources/models/religion.model.js";
import { LanguageMedium, languageMediumModel } from "@/features/resources/models/languageMedium.model.js";
import { formatAadhaarCardNumber } from "@/utils/formatAadhaarCardNumber.js";
import { OldBoard } from "@/types/old-data/old-board.js";
import { OldDegree } from "@/types/old-data/old-degree.js";
import { OldBoardStatus } from "@/types/old-data/old-board-status.js";
import { BoardUniversity, boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { Degree, degreeModel } from "@/features/resources/models/degree.model.js";
import { BoardResultStatus, boardResultStatusModel } from "@/features/resources/models/boardResultStatus.model.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { annualIncomeModel } from "../../resources/models/annualIncome.model.js";
import { Specialization, specializationModel } from "../models/specialization.model.js";
import { spec } from "node:test/reporters";
import { fileURLToPath } from "node:url";
import { readExcelFile } from "@/utils/readExcel.js";
import { streamModel } from "@/features/academics/models/stream.model.js";
import { SubjectMetadata, subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model.js";
import { SubjectRow } from "@/types/academics/subject-row.js";
import { SubjectTypeModel, subjectTypeModel } from "@/features/academics/models/subjectType.model.js";
import { findDegreeByName } from "@/features/resources/services/degree.service.js";
import { findStreamByNameAndProgrammee } from "@/features/academics/services/stream.service.js";
import { loadOlderBatches } from "@/features/academics/services/batch.service.js";
import { loadPaperSubjects } from "@/features/academics/services/batchPaper.service.js";

const BATCH_SIZE = 500; // Number of rows per batch

type DbType = NodePgDatabase<Record<string, never>> & {
    $client: Pool;
}

export async function addOccupation(name: string, db: DbType) {
    const [existingOccupation] = await db.select().from(occupationModel).where(eq(occupationModel.name, name.trim().toUpperCase()));
    if (existingOccupation) {
        return existingOccupation;
    }
    const [newOccupation] = await db.insert(occupationModel).values({ name: name.trim().toUpperCase() }).returning();

    return newOccupation;
}

export async function addBloodGroup(type: string, db: DbType) {
    const [existingBloodGroup] = await db.select().from(bloodGroupModel).where(eq(bloodGroupModel.type, type.trim().toUpperCase()));
    if (existingBloodGroup) {
        return existingBloodGroup;
    }
    const [newBloodGroup] = await db.insert(bloodGroupModel).values({ type: type.trim().toUpperCase() }).returning();

    return newBloodGroup;
}

export async function addNationality(name: string, code: number | undefined | null, db: DbType) {
    const [existingNationality] = await db.select().from(nationalityModel).where(eq(nationalityModel.name, name.trim().toUpperCase()));
    if (existingNationality) {
        return existingNationality;
    }
    const [newNationality] = await db.insert(nationalityModel).values({ name: name.trim().toUpperCase(), code }).returning();

    return newNationality;
}

export async function addCategory(name: string, code: string, documentRequired: boolean | undefined, db: DbType) {
    const [existingCategory] = await db.select().from(categoryModel).where(eq(categoryModel.name, name.trim().toUpperCase()));
    if (existingCategory) {
        return existingCategory;
    }
    const [newCategory] = await db.insert(categoryModel).values({ name: name.trim().toUpperCase(), code, documentRequired }).returning();

    return newCategory;
}

export async function addReligion(name: string, db: DbType) {
    const [existingReligion] = await db.select().from(religionModel).where(eq(religionModel.name, name.trim().toUpperCase()));
    if (existingReligion) {
        return existingReligion;
    }
    const [newReligion] = await db.insert(religionModel).values({ name: name.trim().toUpperCase() }).returning();

    return newReligion;
}

export async function addLanguageMedium(name: string, db: DbType) {
    const [existingLanguage] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.name, name.trim().toUpperCase()));
    if (existingLanguage) {
        return existingLanguage;
    }
    const [newLanguage] = await db.insert(languageMediumModel).values({ name: name.trim().toUpperCase() }).returning();

    return newLanguage;
}

export async function addSpecialization(name: string) {
    const [existingSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.name, name.trim().toUpperCase()));
    if (existingSpecialization) {
        return existingSpecialization;
    }
    const [newSpecialization] = await db.insert(specializationModel).values({ name: name.trim().toUpperCase() }).returning();

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

    let specialization: Specialization | undefined;
    if (oldStudent.specialisation && oldStudent.specialisation.trim() !== '') {
        specialization = await addSpecialization(oldStudent.specialisation);
    }

    const [newStudent] = await db.insert(studentModel).values({
        userId: user.id as number,
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

export async function addAdmission(oldStudent: OldStudent, student: Student) {
    const [existingAdmission] = await db.select().from(admissionModel).where(eq(admissionModel.studentId, student.id as number));
    if (existingAdmission) {
        return existingAdmission;
    }

    const [newAdmission] = await db.insert(admissionModel).values({
        studentId: student.id as number,
        admissionCode: oldStudent.admissioncodeno?.trim()?.toUpperCase(),
        applicantSignature: oldStudent.applicantSignature?.trim()?.toUpperCase(),
        yearOfAdmission: oldStudent.admissionYear,
        admissionDate: oldStudent.admissiondate?.toISOString()
    }).returning();

    return newAdmission;
}

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
            fatherOccupation = await addOccupation(fatherOccupationResult[0].occupationName, db);
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
            motherOccupation = await addOccupation(motherOccupationResult[0].occupationName, db);
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
            guardianOccupation = await addOccupation(guardianOccupationResult[0].occupationName, db);
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
            bloodGroup = await addBloodGroup(bloodGroupResult[0].name, db);
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
            nationality = await addNationality(nationalityResult[0].nationalityName, nationalityResult[0].code, db);
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
            category = await addCategory(categoryResult[0].category, categoryResult[0].code, categoryResult[0].docneeded, db);
        }
    }
    let religion: Religion | undefined;
    if (oldStudent.religionId) {
        const [religionResult] = await mysqlConnection.query(`SELECT * FROM religion WHERE id = ${oldStudent.religionId}`) as [{ id: number, religionName: string }[], any];
        if (religionResult.length > 0) {
            religion = await addReligion(religionResult[0].religionName, db);
        }
    }
    let motherTongue: LanguageMedium | undefined;
    if (oldStudent.motherTongueId) {
        const [motherTongueResult] = await mysqlConnection.query(`SELECT * FROM mothertongue WHERE id = ${oldStudent.motherTongueId}`) as [{ id: number, mothertongueName: string }[], any];
        if (motherTongueResult.length > 0) {
            motherTongue = await addLanguageMedium(motherTongueResult[0].mothertongueName, db);
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
                rollNumber: updatedValues?.rollNumber ? updatedValues?.rollNumber : null
            })
            .where(eq(academicIdentifierModel.id, existingAcademicIdentifier.id))
            .returning();

        return updatedAcademicIdentifier;
    }

    const [newAcademicIdentifier] = await db.insert(academicIdentifierModel).values({
        studentId: student.id as number,
        // streamId
        // course
        abcId: cleanString(oldStudent.abcid)?.toUpperCase(),
        apprid: cleanString(oldStudent.apprid)?.toUpperCase(),
        checkRepeat: typeof oldStudent.chkrepeat === 'undefined' ? undefined : oldStudent.chkrepeat,
        // apaarId
        classRollNumber: oldStudent.rollNumber ? oldStudent.rollNumber?.toString()?.trim()?.toUpperCase() : null,
        cuFormNumber: cleanString(oldStudent.cuformno)?.toUpperCase(),
        // frameworkType
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


export async function processStudent(oldStudent: OldStudent) {
    // Step 1: Check for the user
    const user = await addUser(oldStudent, db);

    // Step 2: Check for the student
    const student = await addStudent(oldStudent, user, db);

    // Step 3: Check for the accomodation
    await addAccommodation(oldStudent, student);

    // Step 4: Check for the admission
    await addAdmission(oldStudent, student);

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
}

export async function addStream(name: string, degreeProgramme: "HONOURS" | "GENERAL", framework: "CCF" | "CBCS") {
    name = name.trim();
    if (name.endsWith(" (H)") || name.endsWith(" (G)")) {
        name = name.split(' ')[0];
    }

    const existingStream = await findStreamByNameAndProgrammee(name, degreeProgramme);
    if (existingStream) {
        return existingStream;
    }

    let foundDegree = await findDegreeByName(name);
    if (!foundDegree) {
        const [newDegree] = await db.insert(degreeModel).values({ name }).returning();
        foundDegree = newDegree;
    }

    const [newStream] = await db.insert(streamModel).values({
        degreeId: foundDegree.id as number,
        degreeProgramme,
        framework,
        duration: 3,
        numberOfSemesters: 6,
    }).returning();

    return newStream;
}

// export async function addStreamsAndSubjects() {
//     const directoryName = path.dirname(fileURLToPath(import.meta.url));

//     const subjectArr = readExcelFile<SubjectRow>(path.resolve(directoryName, "../../../..", "public", "temp", "subjects.xlsx"));
//     console.log(subjectArr.length)
//     for (let i = 0; i < subjectArr.length; i++) {
//         const stream = await addStream(subjectArr[i].Stream, subjectArr[i].Course, subjectArr[i].Framework);

//         let specialization: Specialization | undefined;
//         if (subjectArr[i].Specialization) {
//             specialization = await addSpecialization(subjectArr[i].Specialization as string);
//         }

//         let subjectType: SubjectTypeModel | null = null;
//         if (subjectArr[i]["Subject Type"]) {
//             const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.name, subjectArr[i]["Subject Type"].toUpperCase().trim()));
//             if (!foundSubjectType) {
//                 const [newSubjectType] = await db.insert(subjectTypeModel).values({ name: subjectArr[i]["Subject Type"].toUpperCase().trim() }).returning();
//                 subjectType = newSubjectType;
//             }
//         }

//         await db.insert(subjectMetadataModel).values({
//             streamId: stream.id as number,
//             fullMarks: 100,
//             fullMarksInternal: subjectArr[i].IN,
//             fullMarksTheory: subjectArr[i].TH,
//             fullMarksTutorial: subjectArr[i].TU,
//             fullMarksPractical: subjectArr[i].PR,
//             fullMarksProject: subjectArr[i].PROJ,
//             fullMarksViva: subjectArr[i].VIVA,
//             isOptional: subjectArr[i].Optional ? true : false,
//             subjectTypeId: subjectType ? subjectType.id as number : null,
//             framework: "CBCS",
//             category: subjectArr[i].Category,
//             specializationId: specialization ? specialization.id as number : undefined,
//             name: subjectArr[i]["Subject Name"],
//             semester: subjectArr[i].Semester,
//             credit: subjectArr[i].Credit,
//             course: subjectArr[i].Course,
//         } as SubjectMetadata).returning();
//     }
// }

export const createOldStudent = async (req: Request, res: Response, next: NextFunction) => {
    // await addStreamsAndSubjects();
    try {
        await loadOlderBatches();
        console.log('\n\nCounting rows from table \`studentpersonaldetails\`...');
        const [rows] = await mysqlConnection.query('SELECT COUNT(*) AS totalRows FROM studentpersonaldetails');
        const { totalRows } = (rows as { totalRows: number }[])[0];

        const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

        console.log(`\nTotal rows to migrate: ${totalRows}`);

        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

            console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
            const [rows] = await mysqlConnection.query(`SELECT * FROM studentpersonaldetails LIMIT ${BATCH_SIZE} OFFSET ${offset}`) as [OldStudent[], any];
            const oldDataArr = rows as OldStudent[];
            // const filterData = oldDataArr.filter(ele => ele.communityid != null);
            for (let i = 0; i < oldDataArr.length; i++) {
                try {
                    await processStudent(oldDataArr[i]);
                } catch (error) {
                    console.log(error)
                }
                console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${oldDataArr[i]?.name}`);

            }
        }

        await loadPaperSubjects();

        res.status(201).json(new ApiResponse(201, "SUCCESS", true, "Student added successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

