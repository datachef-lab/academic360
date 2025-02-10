import { InstitutionType } from "@/types/resources/institution";
import { Institution, institutionModel } from "../models/institution.model";
import { findDegreeById } from "./degree.service";
import { findAddressById } from "@/features/user/services/address.service";
import { db } from "@/db/index";
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