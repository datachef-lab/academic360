import { db, mysqlConnection } from "@/db/index.ts";
import { OldStudent } from "@/types/old-student.ts";
import { handleError } from "@/utils/handleError.ts";
import { NextFunction, Request, Response } from "express";
import { User, userModel } from "../models/user.model.ts";
import { eq, ne } from "drizzle-orm";
import { Student, studentModel } from "../models/student.model.ts";
import { accommodationModel } from "../models/accommodation.model.ts";
import { Address, addressModel } from "../models/address.model.ts";
import { admissionModel } from "../models/admission.model.ts";
import { parentModel } from "../models/parent.model.ts";
import { personModel } from "../models/person.model.ts";
import { gaurdianModel, Guardian } from "../models/guardian.model.ts";
import { Health, healthModel } from "../models/health.model.ts";
import { emergencyContactModel } from "../models/emergencyContact.model.ts";
import { personalDetailsModel } from "../models/personalDetails.model.ts";
import { academicHistoryModel } from "../models/academicHistory.model.ts";
import { transportDetailsModel } from "../models/transportDetails.model.ts";
import { academicIdentifierModel } from "../models/academicIdentifier.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { number } from "zod";

const BATCH_SIZE = 500; // Number of rows per batch

export async function addUser(oldStudent: OldStudent) {
    const email = `${oldStudent.codeNumber.trim()}@thebges.edu.in`;
    // Return, if the email already exist
    const [existingUser] = await db.select().from(userModel).where(eq(userModel.email, email));
    if (existingUser) {
        return existingUser;
    }
    // Create the new user
    const [newUser] = await db.insert(userModel).values({
        name: oldStudent.name,
        email,
        password: oldStudent.codeNumber,
        phone: oldStudent.phoneMobileNo,
        type: "STUDENT",
        whatsappNumber: oldStudent.whatsappno,
    }).returning();

    return newUser;
}

export async function addStudent(oldStudent: OldStudent, user: User) {
    const [existingStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, user.id as number));
    if (existingStudent) {
        return existingStudent;
    }
    const [newStudent] = await db.insert(studentModel).values({
        userId: user.id as number,
        community: oldStudent.communityid === 0 ? null : (oldStudent.communityid === 1 ? "GUJARATI" : "NON-GUJARATI"),
        lastPassedYear: oldStudent.lspassedyr,
        notes: oldStudent.notes,
        active: oldStudent.active,
        alumni: oldStudent.alumni,
        leavingDate: oldStudent.leavingdate,
        leavingReason: oldStudent.leavingreason,
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
        addressLine: oldStudent.placeofstayaddr,
        localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
        phone: oldStudent.placeofstaycontactno
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
        admissionCode: oldStudent.admissioncodeno,
        applicantSignature: oldStudent.applicantSignature,
        yearOfAdmission: oldStudent.admissionYear,
        admissionDate: oldStudent.admissiondate?.toISOString()
    }).returning();

    return newAdmission;
}

export async function addParent(oldStudent: OldStudent, student: Student) {
    const [existingParent] = await db.select().from(parentModel).where(eq(parentModel.studentId, student.id as number));
    if (existingParent) {
        return existingParent;
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

    const [father] = await db.insert(personModel).values({
        name: oldStudent.fatherName,
        email: oldStudent.fatherEmail,
        aadhaarCardNumber: oldStudent.fatheraadharno,
        phone: oldStudent.fatherMobNo,
        officePhone: oldStudent.fatherOffPhone,
        image: oldStudent.fatherPic,
        // occupationId: // TODO

    }).returning();

    const [mother] = await db.insert(personModel).values({
        name: oldStudent.motherName,
        email: oldStudent.motherEmail,
        aadhaarCardNumber: oldStudent.motheraadharno,
        phone: oldStudent.motherMobNo,
        officePhone: oldStudent.motherOffPhone,
        image: oldStudent.motherPic,
        // occupationId: // TODO

    }).returning();

    const [newParent] = await db.insert(parentModel).values({
        studentId: student.id as number,
        annualIncome: oldStudent.annualFamilyIncome,
        parentType,
        fatherDetailsId: father.id,
        motherDetailsId: mother.id
    }).returning();

    return newParent;
}

export async function addGuardian(oldStudent: OldStudent, student: Student) {
    const [existingGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.studentId, student.id as number));
    if (existingGuardian) {
        return existingGuardian;
    }

    let guardianOfficeAddress: Address | undefined;
    if (oldStudent.guardianOffAddress) {
        const [address] = await db.insert(addressModel).values({
            addressLine: oldStudent.guardianOffAddress,
        }).returning();
        guardianOfficeAddress = address;
    }

    const [guardianPerson] = await db.insert(personModel).values({
        name: oldStudent.guardianName,
        email: oldStudent.guardianEmail,
        aadhaarCardNumber: oldStudent.gurdianaadharno,
        phone: oldStudent.guardianMobNo,
        image: oldStudent.guardianPic,
        // occupationId: // TODO
        officePhone: oldStudent.guardianOffPhone,
        officeAddressId: guardianOfficeAddress ? guardianOfficeAddress.id as number : undefined

    }).returning();

    const [newGuardian] = await db.insert(gaurdianModel).values({
        studentId: student.id as number,
        gaurdianDetailsId: guardianPerson.id as number
    }).returning();

    return newGuardian;
}

export async function addHealth(oldStudent: OldStudent, student: Student) {
    const [existingHealth] = await db.select().from(healthModel).where(eq(healthModel.studentId, student.id as number));
    if (existingHealth) {
        return existingHealth;
    }

    const [newHealth] = await db.insert(healthModel).values({
        studentId: student.id as number,
        // bloodGroupId: // TODO,
        eyePowerLeft: oldStudent.eyePowerLeft,
        eyePowerRight: oldStudent.eyePowerRight,
    } as Health).returning();
}

export async function addEmergencyContact(oldStudent: OldStudent, student: Student) {
    const [existingEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.studentId, student.id as number));
    if (existingEmergencyContact) {
        return existingEmergencyContact;
    }

    const [newEmergencyContact] = await db.insert(emergencyContactModel).values({
        studentId: student.id as number,
        personName: oldStudent.emercontactpersonnm,
        phone: oldStudent.emercontactpersonmob,
        residentialPhone: oldStudent.emrgnResidentPhNo,
        relationToStudent: oldStudent.emerpersreltostud,
        officePhone: oldStudent.emrgnOfficePhNo,
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
            addressLine: oldStudent.mailingAddress,
            localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
            pincode: oldStudent.mailingPinNo
        }).returning();
        mailingAddress = address;
    }

    let residentialAddress: Address | undefined;
    if (oldStudent.mailingAddress || oldStudent.mailingPinNo) {
        const [address] = await db.insert(addressModel).values({
            addressLine: oldStudent.residentialAddress,
            phone: oldStudent.resiPhoneMobileNo,
            localityType: oldStudent.localitytyp?.toUpperCase() === "URBAN" ? "URBAN" : (oldStudent.localitytyp?.toUpperCase() === "RURAL" ? "RURAL" : null),
            pincode: oldStudent.resiPinNo
        }).returning();
        residentialAddress = address;
    }

    const [newPersonalDetails] = await db.insert(personalDetailsModel).values({
        studentId: student.id as number,
        dateOfBirth: oldStudent.dateOfBirth?.toISOString() || "",
        gender: oldStudent.sexId === 0 ? undefined : (oldStudent.sexId === 1 ? "MALE" : "FEMALE"),
        // nationalityId
        // otherNationalityId
        // categoryId: // TODO,
        // religionId: 
        aadhaarCardNumber: oldStudent.aadharcardno,
        alternativeEmail: oldStudent.alternativeemail,
        email: oldStudent.email,
        mailingAddressId: mailingAddress ? mailingAddress.id as number : undefined,
        residentialAddressId: residentialAddress ? residentialAddress.id as number : undefined,
        // motherTongueId
        // disability: oldStudent.disabilitycode

    }).returning();

    return newPersonalDetails;
}

export async function addAcademicHistory(oldStudent: OldStudent, student: Student) {
    const [existingAcademicHistory] = await db.select().from(academicHistoryModel).where(eq(academicHistoryModel.studentId, student.id as number));
    if (existingAcademicHistory) {
        return existingAcademicHistory;
    }

    const [newAcdemicHistory] = await db.insert(academicHistoryModel).values({
        studentId: student.id as number,
        // lastBoardUniversityId
        // lastInstitutionId
        // lastResult
        // specialization
        // studiedUpToClass
    }).returning();

    return newAcdemicHistory;
}

export async function addAcademicIdentifier(oldStudent: OldStudent, student: Student) {
    const [existingAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, student.id as number));
    if (existingAcademicIdentifier) {
        return existingAcademicIdentifier;
    }

    const [newAcademicIdentifier] = await db.insert(academicIdentifierModel).values({
        studentId: student.id as number,
        // streamId
        // course
        abcId: oldStudent.abcid,
        apprid: oldStudent.apprid,
        checkRepeat: typeof oldStudent.chkrepeat === undefined ? undefined : oldStudent.chkrepeat,
        // apaarId
        classRollNumber: oldStudent.rollNumber,
        cuFormNumber: oldStudent.cuformno,
        // frameworkType
        oldUid: oldStudent.oldcodeNumber,
        uid: oldStudent.codeNumber,
        registrationNumber: oldStudent.univregno ? oldStudent.univregno : (oldStudent.universityRegNo ? oldStudent.universityRegNo : undefined),
        rollNumber: oldStudent.univlstexmrollno,
        rfid: oldStudent.rfidno,
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
    const user = await addUser(oldStudent);
    // Step 2: Check for the student
    const student = await addStudent(oldStudent, user);
    // Step 3: Check for the accomodation
    const accommodation = await addAccommodation(oldStudent, student);
    // Step 4: Check for the admission
    const admission = await addAdmission(oldStudent, student);
    // Step 5: Check for the parents
    const parent = await addParent(oldStudent, student);
    // Step 6: Check for the guardian
    const guardian = await addGuardian(oldStudent, student);
    // Step 7: Check for the health
    const health = await addHealth(oldStudent, student);
    // Step 8: Check for the emergency-contact
    const emergencyContact = await addEmergencyContact(oldStudent, student);
    // Step 9: Check for the personal-details
    const personalDetails = await addPersonalDetails(oldStudent, student);
    // Step 10: Check for the academic-history
    const academicHistory = await addAcademicHistory(oldStudent, student);
    // Step 11: Check for the academic-identifier
    await addAcademicIdentifier(oldStudent, student);
    // Step 12: Check for the transport-details
    await addTransportDetails(oldStudent, student);
}

export const createOldStudent = async (req: Request, res: Response, next: NextFunction) => {
    const oldStudent = req.body as OldStudent;
    try {
        console.log('\n\nCounting rows from table \`studentpersonaldetails\`...');
        const [rows] = await mysqlConnection.query('SELECT COUNT(*) AS totalRows FROM studentpersonaldetails');
        const { totalRows } = (rows as { totalRows: number }[])[0];
        console.log(`Total rows to migrate: ${totalRows}`);

        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            console.log(`Migrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
            const [rows] = await mysqlConnection.query(`SELECT * FROM studentpersonaldetails LIMIT ${BATCH_SIZE} OFFSET ${offset}`) as [OldStudent[], any];
            const oldDataArr = rows as OldStudent[];
            // const filterData = oldDataArr.filter(ele => ele.communityid != null);
            for (let i = 0; i < oldDataArr.length; i++) {
                console.log(`Length: ${oldDataArr.length}, Name: ${oldDataArr[i]?.name} Community: ${oldDataArr[i]?.communityid}`);

                
            }
        }


        // await processStudent(oldStudent)

        res.status(201).json(new ApiResponse(201, "SUCCESS", true, "Student added successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}