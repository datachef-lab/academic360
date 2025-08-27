import {dbPostgres} from "@/db";
import { admissionAdditionalInfo, AdmissionAdditionalInfo } from "@/db/schema";
import { AdmissionAdditionalInfoDto } from "@/types/admissions";
import { and, eq } from "drizzle-orm";
import { createSportsInfo } from "./adm-sports-info.service";

export async function createAdmissionAdditionalInfo(givenAdditionalInfo: AdmissionAdditionalInfoDto) {
    // Check if the additional info already exists for the application form
    const [existingEntry] = await dbPostgres
        .select()
        .from(admissionAdditionalInfo)
        .where(
            and(
                eq(admissionAdditionalInfo.applicationFormId, givenAdditionalInfo.applicationFormId),
            )
        );

    if (existingEntry) {
        return { additionalInfo: existingEntry, message: "Additional info already exists for this application." };
    }

    // Extract sports info before inserting
    const { sportsInfo, ...additionalInfoData } = givenAdditionalInfo;

    // Insert new additional info
    const [newAdditionalInfo] = await dbPostgres
        .insert(admissionAdditionalInfo)
        .values(additionalInfoData)
        .returning();

    // Create sports info entries if any
    if (sportsInfo && sportsInfo.length > 0) {
        for (const sportInfo of sportsInfo) {
            await createSportsInfo({
                ...sportInfo,
                additionalInfoId: newAdditionalInfo.id!,
            });
        }
    }

    return {
        additionalInfo: newAdditionalInfo,
        message: "New Additional Info Created!"
    };
}

// Read by ID
export async function findAdditionalInfoById(id: number) {
    const [info] = await dbPostgres
        .select()
        .from(admissionAdditionalInfo)
        .where(eq(admissionAdditionalInfo.id, id));
    return info || null;
}

// Read by Application Form ID
export async function findAdditionalInfoByApplicationFormId(applicationFormId: number) {
    const [info] = await dbPostgres
        .select()
        .from(admissionAdditionalInfo)
        .where(eq(admissionAdditionalInfo.applicationFormId, applicationFormId));
    return info || null;
}

// Update
export async function updateAdmissionAdditionalInfo(info: AdmissionAdditionalInfo) {
    if (!info.id) throw new Error("ID is required for update.");
    const [updated] = await dbPostgres
        .update(admissionAdditionalInfo)
        .set(info)
        .where(eq(admissionAdditionalInfo.id, info.id))
        .returning();
    return updated;
}

// Delete
export async function deleteAdmissionAdditionalInfo(id: number) {
    const deleted = await dbPostgres
        .delete(admissionAdditionalInfo)
        .where(eq(admissionAdditionalInfo.id, id));
    return deleted.length > 0;
}