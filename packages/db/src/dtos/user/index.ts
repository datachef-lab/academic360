import { UserT, Family, AddressT, CountryT } from "../../schemas";
import { BloodGroupDto } from "../resources";
import { AccommodationT, AnnualIncomeT, ApplicationFormT, CategoryT, CityT, FamilyT, HealthT, LanguageMediumT, NationalityT, OccupationT, PersonalDetailsT, PersonT, PickupPointT, QualificationT, ReligionT, SectionT, ShiftT, SpecializationT, StateT, TransportT } from "../../schemas/models";
import { DisabilityCodeT, EmergencyContactT, StaffT, TransportDetailsT, } from "../../schemas/models/user";
import { StudentT } from "../../schemas/models/user/student.model";
import { ProgramCourseDto } from "../course-design";
import { BatchDto } from "../batches";
import { ApplicationFormDto } from "../admissions";

export interface StudentDto extends Omit<StudentT, "applicationId" | "programCourseId" | "specializationId" | "sectionId" | "shiftId"> {
    applicationFormAbstract: ApplicationFormT | null;
    programCourse: ProgramCourseDto;
    specialization: SpecializationT | null;
    section: SectionT | null;
    shift: ShiftT | null;
    currentBatch: BatchDto | null;
}

export interface StaffDto extends Omit<StaffT, "shiftId"> {
    shift: ShiftT | null;
}

export interface UserDto extends UserT {
    payload: StudentDto | StaffDto,
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

export interface PersonalDetailsDto extends Omit<PersonalDetailsT, "nationalityId" | "religionId" | "categoryId" | "motherTongueId" | "mailingAddressId" | "residentialAddressId" | "disabilityCodeId"> {
    nationality?: NationalityT | null;
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



export interface ProfileInfo {
    applicationFormDto?: ApplicationFormDto | null; // Only for student
    familyDetails: FamilyDetailDto | null;
    personalDetails: PersonalDetailsDto | null;
    healthDetails: HealthDto | null;
    emergencyContactDetails: EmergencyContactT | null;
    transportDetails: TransportDetailsDto | null;
    accommodationDetails: AccommodationDto | null;
}