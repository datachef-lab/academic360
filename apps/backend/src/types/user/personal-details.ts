import { PersonalDetails } from "@/features/user/models/personalDetails.model.ts";
import { AddressType } from "./address.ts";


export interface PersonalDetailsType extends Omit<PersonalDetails, "nationalityId" | "otherNationalityId" | "religionId" | "categoryId" | "motherTongueId" | "mailingAddressId" | "residentialAddressId" | "disabilityCodeId"> {
    nationality: string | null;
    otherNationality: string | null;
    religion: string | null;
    category: string | null;
    motherTongue: string | null;
    mailingAddress: AddressType | null;
    residentialAddress: AddressType | null;
    disabilityCode: string | null;
}