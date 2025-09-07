import { db } from "@/db/index.js";
import {
  admissionAdditionalInfoModel,
  AdmissionAdditionalInfo,
} from "../models/admisison-additional-info.model.js";
type AdditionalInfoInsert = typeof admissionAdditionalInfoModel.$inferInsert;
import { AdmissionAdditionalInfoDto } from "@/types/admissions/index.js";
import { and, eq } from "drizzle-orm";
import {
  createSportsInfo,
  getSportsInfoByAdditionalInfoId,
} from "./sports-info.service.js";

// CREATE
export async function createAdmissionAdditionalInfo(
  givenAdditionalInfo: AdmissionAdditionalInfoDto,
): Promise<AdmissionAdditionalInfoDto | null> {
  // Check if the additional info already exists for the application form
  const [existingEntry] = await db
    .select()
    .from(admissionAdditionalInfoModel)
    .where(
      and(
        eq(
          admissionAdditionalInfoModel.applicationFormId,
          givenAdditionalInfo.applicationFormId! as number,
        ),
      ),
    );

  if (existingEntry) {
    return await modelToDto(existingEntry);
  }

  // Extract sports info before inserting
  const { sportsInfo, ...rest } = givenAdditionalInfo as any;
  const additionalInfoData: AdditionalInfoInsert = {
    applicationFormId: Number(rest.applicationFormId),
    alternateMobileNumber: rest.alternateMobileNumber ?? undefined,
    bloodGroupId: Number(rest.bloodGroupId),
    religionId: Number(rest.religionId),
    categoryId: Number(rest.categoryId),
    isPhysicallyChallenged: !!rest.isPhysicallyChallenged,
    disabilityType: rest.disabilityType ?? undefined,
    isSingleParent: !!rest.isSingleParent,
    fatherTitle: rest.fatherTitle ?? undefined,
    fatherName: rest.fatherName ?? undefined,
    motherTitle: rest.motherTitle ?? undefined,
    motherName: rest.motherName ?? undefined,
    isEitherParentStaff: !!rest.isEitherParentStaff,
    nameOfStaffParent: rest.nameOfStaffParent ?? undefined,
    departmentOfStaffParent: rest.departmentOfStaffParent
      ? Number(rest.departmentOfStaffParent)
      : undefined,
    hasSmartphone: !!rest.hasSmartphone,
    hasLaptopOrDesktop: !!rest.hasLaptopOrDesktop,
    hasInternetAccess: !!rest.hasInternetAccess,
    annualIncomeId: Number(rest.annualIncomeId),
    applyUnderNCCCategory: !!rest.applyUnderNCCCategory,
    applyUnderSportsCategory: !!rest.applyUnderSportsCategory,
  };

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
        sportsCategoryId: sportInfo.sportsCategoryId! as number,
        additionalInfoId: newAdditionalInfo.id!,
      });
    }
  }

  return await modelToDto(newAdditionalInfo);
}

// Read by ID
export async function findAdditionalInfoById(
  id: number,
): Promise<AdmissionAdditionalInfoDto | null> {
  const [info] = await db
    .select()
    .from(admissionAdditionalInfoModel)
    .where(eq(admissionAdditionalInfoModel.id, id));
  if (!info) return null;
  return await modelToDto(info);
}

// Read by Application Form ID
export async function findAdditionalInfoByApplicationFormId(
  applicationFormId: number,
): Promise<AdmissionAdditionalInfoDto | null> {
  const [info] = await db
    .select()
    .from(admissionAdditionalInfoModel)
    .where(
      eq(admissionAdditionalInfoModel.applicationFormId, applicationFormId),
    );
  if (!info) return null;
  return await modelToDto(info);
}

// Update
export async function updateAdmissionAdditionalInfo(
  info: AdmissionAdditionalInfo,
): Promise<AdmissionAdditionalInfoDto | null> {
  if (!info.id) throw new Error("ID is required for update.");
  const [updated] = await db
    .update(admissionAdditionalInfoModel)
    .set(
      info as Omit<AdmissionAdditionalInfo, "id" | "createdAt" | "updatedAt">,
    )
    .where(eq(admissionAdditionalInfoModel.id, info.id! as number))
    .returning();
  if (!updated) return null;
  return await modelToDto(updated);
}

// Delete
export async function deleteAdmissionAdditionalInfo(
  id: number,
): Promise<boolean> {
  const deleted = await db
    .delete(admissionAdditionalInfoModel)
    .where(eq(admissionAdditionalInfoModel.id, id))
    .returning();
  return deleted.length > 0;
}

export async function modelToDto(
  additionalInfo: AdmissionAdditionalInfo,
): Promise<AdmissionAdditionalInfoDto> {
  const sportsInfo = await getSportsInfoByAdditionalInfoId(
    additionalInfo.id! as number,
  );
  return {
    ...additionalInfo,
    sportsInfo: sportsInfo ?? [],
  };
}
