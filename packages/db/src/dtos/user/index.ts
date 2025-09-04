import {  Specialization, UserT, Shift, Section, BoardResultStatus, Accommodation, Person, Qualification, Occupation, Family, AnnualIncome, Health, PersonalDetails, Nationality, Religion, Category, LanguageMedium, Disability, TransportDetails, Transport, PickupPoint, AddressT, CountryT } from "../../schemas";
import { BloodGroupDto, BoardUniversityDto, InstitutionDto } from "../resources";
import { AdmissionCourseDetailsDto } from "../admissions";
import {  AccommodationT, AnnualIncomeT, BoardResultStatusT, CategoryT, City, CityT, FamilyT, HealthT, LanguageMediumT, NationalityT, OccupationT, PersonalDetailsT, PersonT, PickupPointT, QualificationT, ReligionT, SectionT, ShiftT, SpecializationT, State, StateT, TransportT } from "../../schemas/models";
import { createStudentSchema, DisabilityCodeT, TransportDetailsT, userModel, } from "../../schemas/models/user";
import { StudentT } from "../../schemas/models/user/student.model";

export type PayloadType = StudentDto | null;

export interface UserDto extends UserT {
    payload: PayloadType,
}

export interface StudentDto extends Omit<StudentT, "specializationId"> {
    name: string;
    specialization?: SpecializationT | null;
    
    personalDetails?: PersonalDetailsDto | null;
    admissionCourseDetails?: AdmissionCourseDetailsDto | null;
    familyDetails: FamilyDetailDto | null;

}

export interface AddressDto extends Omit<AddressT, "countryId" | "stateId" | "cityId"> {
    country?: CountryT | null;
    state?: StateT | null;
    city?: CityT | null;
}




export interface AccommodationDto extends Omit<AccommodationT, "addressId"> {
    address?: AddressDto | null;
}

export interface PersonDto extends Omit<PersonT, "qualificationId" | "occupationId" | "officeAddressId"> {
    qualification?: QualificationT | null;
    occupation?: OccupationT | null;
    officeAddress?: AddressDto | null;
}

export interface FamilyDto extends Omit<FamilyT, "fatherDetailsId" | "motherDetailsId" | "guardianDetailsId" | "annualIncomeId"> {
    fatherDetails?: PersonDto | null;
    motherDetails?: PersonDto | null;
    guardianDetails?: PersonDto | null;
    annualIncome?: AnnualIncomeT | null;
}

export interface HealthDto extends Omit<HealthT, "bloodGroupId"> {
    bloodGroup?: BloodGroupDto | null;
}

export interface PersonalDetailsDto extends Omit<PersonalDetailsT, "nationalityId" | "otherNationalityId" | "religionId" | "categoryId" | "motherTongueId" | "mailingAddressId" | "residentialAddressId" | "disabilityCodeId"> {
    nationality?: NationalityT | null;
    otherNationality?: NationalityT | null;
    religion?: ReligionT | null;
    category?: CategoryT | null;
    motherTongue?: LanguageMediumT | null;
    mailingAddress?: AddressDto | null;
    residentialAddress?: AddressDto | null;
    disabilityCode?: DisabilityCodeT | null;
}

export interface TransportDetailsDto extends Omit<TransportDetailsT, "transportId" | "pickupPointId"> {
    transportInfo: TransportT | null;
    pickupPoint: PickupPointT | null;
}




export interface FamilyDetailDto extends Omit<Family, "fatherDetailsPersonId" | "motherDetailsPersonId" | "guardianDetailsPersonId" | "annualIncomeId"> {
    father?: PersonDto;
    mother?: PersonDto;
    guardian?: PersonDto;
    annualIncome?: AnnualIncomeT | null;
}

// export interface BasicInfo {
//     recentBatch: BatchDto | null 
// }

export interface ProfileInfo {
    familyDetails: FamilyDetailDto | null;

}