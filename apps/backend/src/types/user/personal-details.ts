import { PersonalDetails } from "@/features/user/models/personalDetails.model.js";
import { AddressType } from "./address.js";
import { Nationality } from "@/features/resources/models/nationality.model.js";
import { Religion } from "@/features/resources/models/religion.model.js";
import { Category } from "@/features/resources/models/category.model.js";
import { LanguageMedium } from "@/features/resources/models/languageMedium.model.js";
import { Disability } from "@/features/user/models/disabilityCode.model.js";


export interface PersonalDetailsType extends Omit<PersonalDetails, "nationalityId" | "otherNationalityId" | "religionId" | "categoryId" | "motherTongueId" | "mailingAddressId" | "residentialAddressId" | "disabilityCodeId"> {
    nationality?: Nationality | null;
    otherNationality?: Nationality | null;
    religion?: Religion | null;
    category?: Category | null;
    motherTongue?: LanguageMedium | null;
    mailingAddress?: AddressType | null;
    residentialAddress?: AddressType | null;
    disabilityCode?: Disability | null;
}