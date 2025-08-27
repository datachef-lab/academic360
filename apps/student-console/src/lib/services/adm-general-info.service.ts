import {dbPostgres} from "@/db";
import { admissionGeneralInfo, AdmissionGeneralInfo, applicationForms } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import bcrypt from "bcrypt";
import { findAdmissionById } from "./admission.service";
import { findApplicationFormById } from "./application-form.service";
import { sendZeptoMail } from "@/lib/notifications/zepto-mailer";

export async function createGeneralInfo(generalInfo: Omit<AdmissionGeneralInfo, "id" | "createdAt" | "updatedAt">) {
    const applicationForm = await findApplicationFormById(generalInfo.applicationFormId);
    if (!applicationForm) {
        return { generalInfo: null, message: "Invalid application id" }
    }
    const admission = await findAdmissionById(applicationForm?.admissionId!);
    if (!admission) {
        return { generalInfo: null, message: "Invalid admision id" }
    }
    const existingEntry = await checkExistingEntry(admission.id!, generalInfo);
    if (existingEntry) {
        return { generalInfo: existingEntry, message: "General info already exists for this student." };
    }
    
    // Encrypt the password
    const hashedPassword = await bcrypt.hash(generalInfo.password, 10);

    const [newGeneralInfo] = await dbPostgres
        .insert(admissionGeneralInfo)
        .values({
            ...generalInfo,
            password: hashedPassword,
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

export async function findByLoginIdAndPassword(mobileNumber: string, password: string) {
    const users = await dbPostgres
        .select()
        .from(admissionGeneralInfo)
        .where(ilike(admissionGeneralInfo.mobileNumber, mobileNumber.trim()));

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

export async function findGeneralInfoById(id: number) {
    const [generalInfo] = await dbPostgres
        .select()
        .from(admissionGeneralInfo)
        .where(eq(admissionGeneralInfo.id, id));

    if (!generalInfo) {
        return null;
    }

    return generalInfo;
}

export async function findGeneralInfoByApplicationFormId(applicationFormId: number) {
    const [generalInfo] = await dbPostgres
        .select()
        .from(admissionGeneralInfo)
        .where(eq(admissionGeneralInfo.applicationFormId, applicationFormId));

    if (!generalInfo) {
        return null;
    }

    return generalInfo;
}

export async function updateGeneralInfo(generalInfo: Omit<AdmissionGeneralInfo, "password">) {
    const foundGeneralInfo = await findGeneralInfoById(generalInfo.id!);
    if (!foundGeneralInfo) {
        return null;
    }

    const [updatedGeneralInfo] = await dbPostgres
        .update(admissionGeneralInfo)
        .set(generalInfo)
        .where(eq(admissionGeneralInfo.id, generalInfo.id!))
        .returning();

    return updatedGeneralInfo;
}

export async function checkExistingEntry(admissionId: number, generalInfo: Partial<AdmissionGeneralInfo>) {
    const [existingEntry] = await dbPostgres
        .select()
        .from(admissionGeneralInfo)
        .innerJoin(applicationForms, eq(admissionGeneralInfo.applicationFormId, applicationForms.id))
        .where(
            and(
                eq(admissionGeneralInfo.mobileNumber, generalInfo.mobileNumber!),
                eq(applicationForms.admissionId, admissionId)
            )
        );

    return existingEntry ?? null;
}

export async function deleteGeneralInfo(id: number) {
    const foundGeneralInfo = await findGeneralInfoById(id);
    if (!foundGeneralInfo) {
        return null;
    }

    await dbPostgres
        .delete(admissionGeneralInfo)
        .where(eq(admissionGeneralInfo.id, id));

    return true;
}