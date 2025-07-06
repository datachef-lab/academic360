// import { AcademicHistory, Address, City, Country, FamilyDetail,Occupation,Person,PersonalDetail, Qualification, State } from "@/db/schema";
import { Address } from "@/features/user/models/address.model";
import { BatchDto } from "../batches";
import { Country } from "@/features/resources/models/country.model";
import { State } from "@/features/resources/models/state.model";
import { City } from "@/features/resources/models/city.model";
import { Person } from "@/features/user/models/person.model";
import { Qualification } from "@/features/resources/models/qualification.model";
import { Occupation } from "@/features/resources/models/occupation.model";
import { Family } from "@/features/user/models/family.model";
import { PersonalDetails } from "@/features/user/models/personalDetails.model";
import { AcademicHistory } from "@/features/user/models/academicHistory.model";

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

export interface FamilyDetailDto extends Omit<Family, "fatherDetailsPersonId" | "motherDetailsPersonId" | "guardianDetailsPersonId" | "annualIncomeId"> {
    father: PersonDto;
    mother: PersonDto;
    guardian: PersonDto;
}

export interface BasicInfo {
    recentBatch: BatchDto | null 
}

export interface ProfileInfo {
    personalDetails: PersonalDetails | null;
    familyDetails: FamilyDetailDto | null;
    lastAcademicInfo: AcademicHistory | null;
}