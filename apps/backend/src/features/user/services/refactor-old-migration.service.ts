import { db, mysqlConnection } from "@/db";
import { OldStaff, OldStudent } from "@repo/db/legacy-system-types/users";
import { addressModel, Board, boardModel, EmergencyContact, shiftModel, Staff, staffModel, studentAcademicSubjectModel, studentModel, User, userModel, userTypeEnum } from "@repo/db/schemas";
import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import * as oldStudentPersonalDetailsHelper from "./old-student-helper";
import * as oldStudentAdmissionServices from "./old-student.service";
import bcrypt from "bcryptjs";
import { OldShift } from "@repo/db/legacy-system-types/academics";

const BATCH_SIZE = 500;

/*
 * This function is responsible for loading the students data from the old system to the new system
 *
 * This script will be start loading and thereby will maintain the auto sync between the old and new system
 */
export async function loadData() { // TODO
    const [[{ totalStudents }]] = (await mysqlConnection.query(`
        SELECT COUNT(spd.id) AS totalStudents
        FROM
            studentpersonaldetails spd,
            personaldetails pd,
            coursedetails cd
        WHERE
            spd.admissionId = cd.id
            AND pd.id = cd.parent_id
            AND pd.sessionId = 18
            AND cd.transferred = true
        ;
    `)) as [{ totalStudents: number }[], any];

    console.log(`Total students: ${totalStudents}`);

    const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);

    console.log(`Total batches: ${totalBatches}`);
    console.log(`Batch size: ${BATCH_SIZE}`);

    for (let i = 0; i < totalBatches; i++) {
        const offset = i * BATCH_SIZE;
        const limit = BATCH_SIZE;

        const [rows] = (await mysqlConnection.query(`
            SELECT spd.*
            FROM
                studentpersonaldetails spd,
                personaldetails pd,
                coursedetails cd
            WHERE
                spd.admissionId = cd.id
                AND pd.id = cd.parent_id
                AND pd.sessionId = 18
                AND cd.transferred = true
            ORDER BY spd.id
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [OldStudent[], any];

        for (let j = 0; j < rows.length; j++) {
            const oldStudent = rows[j];
            // await oldStudentPersonalDetailsHelper.processStudent(oldStudent);
        }

        console.log(`Done loading batch ${i + 1}/${totalBatches}: ${rows.length} students`);
    }
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

    let phone: string | undefined = oldData.contactNo?.trim() || oldData.phoneMobileNo?.trim();
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
        // Check only by legacyId and type
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

        const [updatedUser] = await db
            .update(userModel)
            .set({
                name: oldData.name ?? "",
                phone,
                type,
                whatsappNumber,
            })
            .where(eq(userModel.id, existingUser.id as number))
            .returning();

        return updatedUser;
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
            await upsertStaff(oldData.id, newUser);
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

export async function upsertStaff(oldStaffId: number, user: User) {
    const [[oldStaff]] = (await mysqlConnection.query(`
          SELECT *
          FROM staffpersonaldetails
          WHERE id = ${oldStaffId}
          `)) as [OldStaff[], any];

    if (!oldStaff) {
        return null;
    }

    const shift = await upsertShift(oldStaff.empShiftId);

    const personalDetails = await oldStudentAdmissionServices.upsertPersonalDetails(oldStaff, user.id as number);

    const familyDetails = await oldStudentAdmissionServices.upsertFamily(oldStaff, user.id as number);

    const studentCategory = await oldStudentAdmissionServices.addStudentCategory(oldStaff.studentCategoryId);

    const health = await oldStudentAdmissionServices.upsertHealth(oldStaff, user.id as number);

    const emergencyContact = await oldStudentAdmissionServices.upsertEmergencyContact({
        personName: oldStaff.emergencyname ?? undefined,
        havingRelationAs: oldStaff.emergencyrelationship ?? undefined,
        email: undefined,
        phone: oldStaff.emergencytelmobile ?? undefined,
        officePhone: oldStaff.emergencytellandno ?? undefined,
        residentialPhone: undefined,
    } as EmergencyContact, user.id as number);



    const bank = await oldStudentAdmissionServices.addBank(oldStaff.bankid);
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

    let existingStaff = (await db
        .select()
        .from(staffModel)
        .where(eq(staffModel.userId, user.id as number)))[0];

    if (existingStaff) {
        const [updatedStaff] = await db
            .update(staffModel)
            .set({
                boardId: board?.id ?? undefined,
                attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
                uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
                codeNumber: oldStaff.codeNumber ?? undefined,
                shiftId: shift?.id ?? undefined,
                gratuityNumber: oldStaff.gratuityno ?? undefined,
                // personalDetailsId: personalDetails?.id ?? undefined,
                // familyDetailsId: familyDetails?.id ?? undefined,
                studentCategoryId: studentCategory?.id ?? undefined,
                // healthId: health?.id ?? undefined,
                // emergencyContactId: emergencyContact?.id ?? undefined,
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
                // previousEmployeeAddressId: previousEmployeeAddressId,
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
            .where(eq(staffModel.id, existingStaff.id!))
            .returning();

        existingStaff = updatedStaff;
    }
    else {
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
                // personalDetailsId: personalDetails?.id ?? undefined,
                // familyDetailsId: familyDetails?.id ?? undefined,
                studentCategoryId: studentCategory?.id ?? undefined,
                // healthId: health?.id ?? undefined,
                // emergencyContactId: emergencyContact?.id ?? undefined,
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
                // previousEmployeeAddressId: previousEmployeeAddressId,
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
        existingStaff = newStaff;
    }

    // Previous employer address if present
    let previousEmployeeAddressId: number | undefined = undefined;
    if (oldStaff.privempaddrs) {
        const [addr] = await db
            .insert(addressModel)
            .values({
                staffId: existingStaff.id!,
                addressLine: oldStaff.privempaddrs.trim(),
                localityType: null,
            })
            .returning();
        previousEmployeeAddressId = addr.id as number;
    }

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

    return existingStaff;
}























// Gives the list of students who are missing from the new system
export async function brainstormOldMigration() {
    const [[{ totalStudents }]] = (await mysqlConnection.query(`
        SELECT COUNT(spd.id) AS totalStudents
        FROM
            studentpersonaldetails spd,
            personaldetails pd,
            coursedetails cd
        WHERE
            spd.admissionId = cd.id
            AND pd.id = cd.parent_id
            AND pd.sessionId = 18
            AND cd.transferred = true;
    `)) as [{ totalStudents: number }[], any];
    console.log(`Total students: ${totalStudents}`);

    const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);

    console.log(`Total batches: ${totalBatches}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    let grandMissingCount = 0;
    for (let i = 0; i < totalBatches; i++) {
        const offset = i * BATCH_SIZE;
        const limit = BATCH_SIZE;

        const [oldStudentIds] = (await mysqlConnection.query(`
            SELECT
                id AS legacyStudentId,
                codeNumber
            FROM studentpersonaldetails
            WHERE admissionId IN (
                SELECT cd.id
                FROM 
                    coursedetails cd,
                    personaldetails pd
                WHERE cd.parent_id = pd.id
                AND pd.sessionId = 18
                AND cd.transferred = true
            )
            ORDER BY id
            LIMIT ${limit} OFFSET ${offset};
        `)) as [{ legacyStudentId: number; codeNumber: string }[], any];

        if (oldStudentIds.length === 0) {
            console.log(`Batch ${i + 1}/${totalBatches}: no records`);
            continue;
        }

        const legacyIds = oldStudentIds.map((r) => r.legacyStudentId);
        const existing = await db
            .select({ legacyStudentId: studentModel.legacyStudentId })
            .from(studentModel)
            .where(inArray(studentModel.legacyStudentId, legacyIds));

        const existingSet = new Set(
            existing
                .map((r) => r.legacyStudentId)
                .filter((v): v is number => typeof v === "number"),
        );
        const missing = legacyIds.filter((id) => !existingSet.has(id));

        grandMissingCount += missing.length;
        if (missing.length > 0) {
            // Display the missing students code numbers
            console.log(
                `Batch ${i + 1}/${totalBatches}: missing ${missing.length} students`,
            );
            console.log(
                oldStudentIds
                    .filter((id) => missing.includes(id.legacyStudentId))
                    .map((id) => id.codeNumber)
                    .join("\n"),
            );
            //   console.log(missing.join(", "));
        } else {
            console.log(
                `Batch ${i + 1}/${totalBatches}: all ${legacyIds.length} present`,
            );
        }
    }
    console.log(`Total missing across all batches: ${grandMissingCount}`);
}
















export async function upsertShift(oldShiftId: number | null) {
    if (!oldShiftId) return null;

    const [[shiftRow]] = (await mysqlConnection.query(
        `SELECT * FROM shift WHERE id = ${oldShiftId}`,
    )) as [OldShift[], any];

    if (!shiftRow) return null;

    const [foundShift] = await db
        .select()
        .from(shiftModel)
        .where(ilike(shiftModel.name, shiftRow.shiftName.trim()));

    if (foundShift) {
        const [updatedShift] = await db
            .update(shiftModel)
            .set({
                name: shiftRow.shiftName.trim(),
                codePrefix: shiftRow.codeprefix?.trim(),
            })
            .where(eq(shiftModel.id, foundShift.id as number))
            .returning();

        return updatedShift;
    };

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