import { db } from "@/db/index.js";
import { admissionGeneralInfoModel, AdmissionGeneralInfo } from "../models/admission-general-info.model.js";
import { applicationFormModel } from "../models/application-form.model.js";
import { and, eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { findAdmissionById } from "./admission.service.js";
import { findApplicationFormById } from "./application-form.service.js";
import { sendZeptoMail } from "@/notifications/zepto-mailer.js";

// CREATE
export async function createGeneralInfo(generalInfo: Omit<AdmissionGeneralInfo, "id" | "createdAt" | "updatedAt">) {
    const applicationForm = await findApplicationFormById(Number(generalInfo.applicationFormId));
    if (!applicationForm) {
        return { generalInfo: null, message: "Invalid application id" }
    }
    const admission = await findAdmissionById(Number(applicationForm?.admissionId!));
    if (!admission) {
        return { generalInfo: null, message: "Invalid admision id" }
    }
    const existingEntry = await checkExistingEntry(Number(admission.id!), generalInfo);
    if (existingEntry) {
        return { generalInfo: existingEntry, message: "General info already exists for this student." };
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(generalInfo.password, 10);

    const [newGeneralInfo] = await db
        .insert(admissionGeneralInfoModel)
        .values({
            applicationFormId: Number(generalInfo.applicationFormId),
            firstName: generalInfo.firstName,
            middleName: generalInfo.middleName ?? undefined,
            lastName: generalInfo.lastName ?? undefined,
            dateOfBirth: generalInfo.dateOfBirth,
            nationalityId: generalInfo.nationalityId ?? undefined,
            otherNationality: generalInfo.otherNationality ?? undefined,
            isGujarati: !!generalInfo.isGujarati,
            categoryId: generalInfo.categoryId ?? undefined,
            religionId: generalInfo.religionId ?? undefined,
            gender: generalInfo.gender,
            degreeLevel: generalInfo.degreeLevel,
            password: hashedPassword,
            whatsappNumber: generalInfo.whatsappNumber ?? undefined,
            mobileNumber: generalInfo.mobileNumber,
            email: generalInfo.email,
            residenceOfKolkata: !!generalInfo.residenceOfKolkata
        })
        .returning();

    // Send login details email to the user
    if (newGeneralInfo && generalInfo.email && generalInfo.password) {
        const subject = "Your BESC Admission Login Details";
        const htmlBody = `
            <p>Dear Student,</p>
            <p>Your admission account has been created.</p>
            <p><b>Login ID (Mobile):</b> ${generalInfo.mobileNumber}</p>
            <p><b>Password:</b> ${generalInfo.password}</p>
            <p>Please keep this information safe.</p>
            <p>Regards,<br/>BESC Admissions</p>
        `;
        sendZeptoMail(generalInfo.email, subject, htmlBody, generalInfo.firstName + " " + (generalInfo.lastName || ""));
    }

    return {
        generalInfo: newGeneralInfo, message: "New General Info Created!"
    }
}

// LOGIN
export async function findByLoginIdAndPassword(mobileNumber: string, password: string) {
    const users = await db
        .select()
        .from(admissionGeneralInfoModel)
        .where(ilike(admissionGeneralInfoModel.mobileNumber, mobileNumber.trim()))

    if (users.length === 0) {
        return null;
    }

    for (const user of users) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            // Fetch the application-form entry
            const applicationForm = await findApplicationFormById(user.applicationFormId)

            return { generalInfo: user, applicationForm };
        }
    }

    return null; // If no matching password found
}

// READ by ID
export async function findGeneralInfoById(id: number) {
    const [generalInfo] = await db
        .select()
        .from(admissionGeneralInfoModel)
        .where(eq(admissionGeneralInfoModel.id, id));

    if (!generalInfo) {
        return null;
    }

    return generalInfo;
}

// READ by Application Form ID
export async function findGeneralInfoByApplicationFormId(applicationFormId: number) {
    const [generalInfo] = await db
        .select()
        .from(admissionGeneralInfoModel)
        .where(eq(admissionGeneralInfoModel.applicationFormId, Number(applicationFormId)));

    if (!generalInfo) {
        return null;
    }

    return generalInfo;
}

// UPDATE
export async function updateGeneralInfo(generalInfo: Omit<AdmissionGeneralInfo, "password">) {
    const foundGeneralInfo = await findGeneralInfoById(generalInfo.id!);
    if (!foundGeneralInfo) {
        return null;
    }

    const [updatedGeneralInfo] = await db
        .update(admissionGeneralInfoModel)
        .set(generalInfo)
        .where(eq(admissionGeneralInfoModel.id, generalInfo.id!))
        .returning();

    return updatedGeneralInfo;
}

// CHECK EXISTING
export async function checkExistingEntry(admissionId: number, generalInfo: Partial<AdmissionGeneralInfo>) {
    const [existingEntry] = await db
        .select()
        .from(admissionGeneralInfoModel)
        .innerJoin(applicationFormModel, eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id))
        .where(
            and(
                ilike(admissionGeneralInfoModel.mobileNumber, String(generalInfo.mobileNumber || '').trim()),
                eq(applicationFormModel.admissionId, Number(admissionId))
            )
        );

    return existingEntry ?? null;
}

// DELETE
export async function deleteGeneralInfo(id: number) {
    const foundGeneralInfo = await findGeneralInfoById(id);
    if (!foundGeneralInfo) {
        return null;
    }

    await db
        .delete(admissionGeneralInfoModel)
        .where(eq(admissionGeneralInfoModel.id, id));

    return true;
}
