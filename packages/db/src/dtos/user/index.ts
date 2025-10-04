import { UserT, Family, AddressT, CountryT } from "../../schemas";
import { BloodGroupDto } from "../resources";
import { AccommodationT, AnnualIncomeT, ApplicationFormT, BoardResultStatusT, CategoryT, CityT, ClassT, districtT, FamilyT, HealthT, LanguageMediumT, NationalityT, OccupationT, PersonalDetailsT, PersonT, PickupPointT, PromotionStatusT, PromotionT, QualificationT, ReligionT, SectionT, SessionT, ShiftT, SpecializationT, StateT, TransportT } from "../../schemas/models";
import { DisabilityCodeT, EmergencyContactT, StaffT, TransportDetailsT, } from "../../schemas/models/user";
import { StudentT } from "../../schemas/models/user/student.model";
import { ProgramCourseDto } from "../course-design";
import { BatchDto } from "../batches";
import { AdmissionAcademicInfoDto, ApplicationFormDto } from "../admissions";
import { PoliceStationT } from "@/schemas/models/user/police-station.model";
import { PostOfficeT } from "@/schemas/models/user/post-office.model";

export interface PromotionDto extends Omit<PromotionT, "promotionStatusId" | "boardResultStatusId" | "sessionId" | "classId" | "sectionId" | "shiftId" | "programCourseId"> {
    promotionStatus: PromotionStatusT;
    boardResultStatus: BoardResultStatusT;
    session: SessionT;
    class: ClassT;
    section: SectionT;
    shift: ShiftT;
    programCourse: ProgramCourseDto;
}

export interface StudentDto extends Omit<StudentT, "applicationId" | "programCourseId" | "specializationId"> {
    applicationFormAbstract: ApplicationFormT | null;
    personalEmail: string | null;
    programCourse: ProgramCourseDto;
    personalDetails: PersonalDetailsDto | null;
    specialization: SpecializationT | null;
    // section: SectionT | null;
    // shift: ShiftT | null;
    currentPromotion: PromotionDto | null;
    currentBatch: BatchDto | null;
    name: string;
}

export interface StaffDto extends Omit<StaffT, "shiftId"> {
    shift: ShiftT | null;
}

export interface UserDto extends UserT {
    payload: StudentDto | StaffDto,
}

export interface AddressDto extends Omit<AddressT, "countryId" | "stateId" | "cityId" | "districtId" | "previousCountryId" | "previousStateId" | "previousCityId" | "previousDistrictId" | "postofficeId" | "policeStationId"> {
    country: CountryT | null;
    previousCountry: CountryT | null;

    state: StateT | null;
    previousState: StateT | null;

    city: CityT | null;
    previousCity: CityT | null;

    district: districtT | null;
    previousDistrict: districtT | null;

    postoffice: PostOfficeT | null;
    policeStation: PoliceStationT | null;
}

export interface AccommodationDto extends Omit<AccommodationT, "addressId"> {
    address?: AddressDto | null;
}

export interface PersonDto extends Omit<PersonT, "qualificationId" | "occupationId" | "officeAddressId"> {
    qualification: QualificationT | null;
    occupation: OccupationT | null;
    officeAddress: AddressDto | null;
}

export interface FamilyDto extends Omit<FamilyT, "annualIncomeId"> {
    members: PersonDto[];
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
    address: AddressDto[];
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
    academicInfo: AdmissionAcademicInfoDto;
    familyDetails: FamilyDto | null;
    personalDetails: PersonalDetailsDto | null;
    healthDetails: HealthDto | null;
    emergencyContactDetails: EmergencyContactT | null;
    transportDetails: TransportDetailsDto | null;
    accommodationDetails: AccommodationDto | null;
}