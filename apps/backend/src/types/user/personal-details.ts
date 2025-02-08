import { PersonalDetails } from "@/features/user/models/personalDetails.model.js";
import { AddressType } from "./address.js";


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