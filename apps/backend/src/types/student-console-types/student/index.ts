// import { AcademicHistory, Address, City, Country, FamilyDetail,Occupation,Person,PersonalDetail, Qualification, State } from "@/db/schema";
import { Address } from "@repo/db/schemas/models/user";
import { BatchDto } from "../batches";
import { Country } from "@/features/resources/models/country.model";
import { State } from "@repo/db/schemas/models/resources";
import { City } from "@repo/db/schemas/models/resources";
import { Person } from "@repo/db/schemas/models/user";
import { Qualification } from "@repo/db/schemas/models/resources";
import { Occupation } from "@/features/resources/models/occupation.model";
import { Family } from "@repo/db/schemas/models/user";
import { PersonalDetails } from "@repo/db/schemas/models/user";
// import { AcademicHistory } from "@repo/db/schemas/models/user";

export interface AddressDto extends Omit<
  Address,
  "countryId" | "stateId" | "cityId"
> {
  country: Country | null;
  state: State | null;
  city: City | null;
}

export interface PersonDto extends Omit<
  Person,
  "qualificationId" | "occupationId" | "officeAddresId"
> {
  qualification: Qualification | null;
  occupation: Occupation | null;
  officeAddress: AddressDto | null;
}

export interface FamilyDetailDto extends Omit<
  Family,
  | "fatherDetailsPersonId"
  | "motherDetailsPersonId"
  | "guardianDetailsPersonId"
  | "annualIncomeId"
> {
  father: PersonDto;
  mother: PersonDto;
  guardian: PersonDto;
}

export interface BasicInfo {
  recentBatch: BatchDto | null;
}

export interface ProfileInfo {
  personalDetails: PersonalDetails | null;
  familyDetails: FamilyDetailDto | null;
}
