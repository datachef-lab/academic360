import { InstitutionType } from "@/types/resources/institution.js";
import { Institution, institutionModel } from "@/features/resources/models/institution.model.js";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import { findAddressById } from "@/features/user/services/address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

export async function findInstitutionById(id: number): Promise<InstitutionType | null> {
    const [foundInstitution] = await db.select().from(institutionModel).where(eq(institutionModel.id, id));

    const formattedInstitution = await instituionResponseFormat(foundInstitution);

    return formattedInstitution;
}

export async function instituionResponseFormat(instituion: Institution): Promise<InstitutionType | null> {
    if (!instituion) {
        return null;
    }

    const { degreeId, addressId, ...props } = instituion;

    const formattedInstitution: InstitutionType = { ...props };

    if (degreeId) {
        formattedInstitution.degree = await findDegreeById(degreeId);
    }

    if (addressId) {
        formattedInstitution.address = await findAddressById(addressId);
    }

    return formattedInstitution;
}