import { AcademicHistory, Address, City, Country, FamilyDetail,Occupation,Person,PersonalDetail, Qualification, State } from "@/db/schema";
import { BatchDto } from "../batches";

export interface AddressDto extends Omit<Address, "countryId" | "stateId" | "cityId"> {
    country: Country | null;
    state: State | null;
    city: City | null;
}

export interface PersonDto extends Omit<Person, "qualificationId" | "occupationId" | "officeAddresId"> {
    qualification: Qualification | null;
    occupation: Occupation | null;
    officeAddress: AddressDto | null;
}

export interface FamilyDetailDto extends Omit<FamilyDetail, "fatherDetailsPersonId" | "motherDetailsPersonId" | "guardianDetailsPersonId" | "annualIncomeId"> {
    father: PersonDto;
    mother: PersonDto;
    guardian: PersonDto;
}

export interface BasicInfo {
    recentBatch: BatchDto | null 
}

export interface ProfileInfo {
    personalDetails: PersonalDetail | null;
    familyDetails: FamilyDetailDto | null;
    lastAcademicInfo: AcademicHistory | null;
}