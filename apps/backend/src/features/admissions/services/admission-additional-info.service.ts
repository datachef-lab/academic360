import { db } from "@/db/index.js";
import { admissionAdditionalInfoModel, AdmissionAdditionalInfo } from "../models/admisison-additional-info.model";
import { AdmissionAdditionalInfoDto } from "@/types/admissions";
import { and, eq } from "drizzle-orm";
import { createSportsInfo, getSportsInfoByAdditionalInfoId } from "./sports-info.service.js";

// CREATE
export async function createAdmissionAdditionalInfo(givenAdditionalInfo: AdmissionAdditionalInfoDto): Promise<AdmissionAdditionalInfoDto | null> {
    // Check if the additional info already exists for the application form
    const [existingEntry] = await db
        .select()
        .from(admissionAdditionalInfoModel)
        .where(
            and(
                eq(admissionAdditionalInfoModel.applicationFormId, givenAdditionalInfo.applicationFormId),
            )
        );

    if (existingEntry) {
        return await modelToDto(existingEntry);
    }

    // Extract sports info before inserting
    const { sportsInfo, ...additionalInfoData } = givenAdditionalInfo;

    // Insert new additional info
    const [newAdditionalInfo] = await db
        .insert(admissionAdditionalInfoModel)
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

    return await modelToDto(newAdditionalInfo);
}

// Read by ID
export async function findAdditionalInfoById(id: number): Promise<AdmissionAdditionalInfoDto | null> {
    const [info] = await db
        .select()
        .from(admissionAdditionalInfoModel)
        .where(eq(admissionAdditionalInfoModel.id, id));
    if (!info) return null;
    return await modelToDto(info);
}

// Read by Application Form ID
export async function findAdditionalInfoByApplicationFormId(applicationFormId: number): Promise<AdmissionAdditionalInfoDto | null> {
    const [info] = await db
        .select()
        .from(admissionAdditionalInfoModel)
        .where(eq(admissionAdditionalInfoModel.applicationFormId, applicationFormId));
    if (!info) return null;
    return await modelToDto(info);
}

// Update
export async function updateAdmissionAdditionalInfo(info: AdmissionAdditionalInfo): Promise<AdmissionAdditionalInfoDto | null> {
    if (!info.id) throw new Error("ID is required for update.");
    const [updated] = await db
        .update(admissionAdditionalInfoModel)
        .set(info)
        .where(eq(admissionAdditionalInfoModel.id, info.id))
        .returning();
    if (!updated) return null;
    return await modelToDto(updated);
}

// Delete
export async function deleteAdmissionAdditionalInfo(id: number): Promise<boolean> {
    const deleted = await db
        .delete(admissionAdditionalInfoModel)
        .where(eq(admissionAdditionalInfoModel.id, id))
        .returning();
    return deleted.length > 0;
}

export async function modelToDto(additionalInfo: AdmissionAdditionalInfo): Promise<AdmissionAdditionalInfoDto> {
    const sportsInfo = await getSportsInfoByAdditionalInfoId(additionalInfo.id!);
    return {
        ...additionalInfo,
        sportsInfo: sportsInfo ?? []
    };
}
