import { Institution } from "@/features/resources/models/institution.model.ts";

export interface InstitutionType extends Omit<Institution, "degreeId" | "addressId"> {
    degree: string | null;
    address: string | null;
}