import { Disability, Gender } from "../enums";
import { Address } from "../resources/address";
import { Category } from "../resources/category";
import { DisabilityCode } from "../resources/disability-code";
import { LanguageMedium } from "../resources/language-medium";
import { Nationality } from "../resources/nationality";
import { Religion } from "../resources/religion";

export interface PersonalDetails {
    readonly id?: number;
    studentId: number;
    aadhaarCardNumber: string | null;
    nationality?: Nationality | null;
    otherNationality?: Nationality | null;
    religion?: Religion | null;
    category?: Category | null;
    motherTongue?: LanguageMedium | null;
    mailingAddress?: Address | null;
    residentialAddress?: Address | null;
    disabilityCode?: DisabilityCode | null;
    dateOfBirth: Date | null;
    gender: Gender | null;
    email: string | null;
    alternativeEmail: string | null;
    disability: Disability;
    createdAt: Date;
    updatedAt: Date;

}