import { AccommodationT, AdmissionAcademicInfoT, AdmissionAdditionalInfoT, AdmissionCourseDetailsT, AdmissionGeneralInfoT, ApplicationFormT, BankBranchT, BoardSubjectT, BoardT, ClassT, EligibilityCriteriaT, EmergencyContactT, HealthT, PaymentT, PersonalDetailsT, ShiftT, Stream, StudentAcademicSubjectsT, StudentCategoryT, TransportDetailsT, UserT } from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { AddressDto } from "../user";
import { BoardSubjectNameT } from "@/schemas/models/admissions/board-subject-name.model";

export interface AdmissionCourseDetailsDto extends Omit<AdmissionCourseDetailsT, "streamId" | "programCourseId" | "classId" | "shiftId" | "eligibilityCriteriaId" | "studentCategoryId"> {
    stream: Stream | null;
    programCourse: ProgramCourseDto | null;
    class: ClassT | null;
    shift: ShiftT | null;
    eligibilityCriteria: EligibilityCriteriaT | null;
    studentCategory: StudentCategoryT | null;
}

export interface AdmissionGeneralInfoDto extends Omit<AdmissionGeneralInfoT, "eligibilityCriteriaId" | "studentCategoryId" | "personalDetailsId" | "spqtaApprovedBy" | "healthId" | "accommodationId" | "emergencyContactId" | "bankBranchId" | "transportDetailsId"> {
    eligibilityCriteria: EligibilityCriteriaT | null;
    studentCategory: StudentCategoryT | null;
    personalDetails: PersonalDetailsT | null;
    spqtaApprovedBy: UserT | null;
    health: HealthT | null;
    accommodation: AccommodationT | null;
    emergencyContact: EmergencyContactT | null;
    bankBranch: BankBranchT | null;
    transportDetails: TransportDetailsT | null;
}

export interface BoardSubjectDto extends Omit<BoardSubjectT, "boardSubjectNameId"> {
    boardSubjectName: BoardSubjectNameT;
}
export interface StudentAcademicSubjectsDto extends Omit<StudentAcademicSubjectsT, "boardSubjectId"> {
    boardSubject: BoardSubjectDto;
}
export interface AdmissionAcademicInfoDto extends Omit<AdmissionAcademicInfoT, "boardId" | "lastSchoolAddress"> {
    applicationForm: ApplicationFormDto | null;
    board: BoardT | null;
    lastSchoolAddress: AddressDto | null;
    subjects: StudentAcademicSubjectsDto[] | null;
}

export interface AdmissionCourseDetailsDto extends Omit<AdmissionCourseDetailsT, "streamId" | "programCourseId" | "classId" | "shiftId" | "eligibilityCriteriaId" | "studentCategoryId"> {
    stream: Stream | null;
    programCourse: ProgramCourseDto | null;
    class: ClassT | null;
    shift: ShiftT | null;
    eligibilityCriteria: EligibilityCriteriaT | null;
    studentCategory: StudentCategoryT | null;
}

export interface ApplicationFormDto extends Omit<ApplicationFormT, "admissionId" | "blockedBy" | "admApprovedBy"> {
    blockedBy: UserT | null;
    admApprovedBy: UserT | null;
    generalInfo: AdmissionGeneralInfoDto | null;
    courseApplication: AdmissionCourseDetailsDto[] | null;
    academicInfo: AdmissionAcademicInfoDto | null;
    additionalInfo: AdmissionAdditionalInfoDto | null;
    paymentInfo: PaymentT | null;
}

export interface AdmissionAdditionalInfoDto extends Omit<AdmissionAdditionalInfoT, "annualIncomeId" | "familyDetailsId"> {
    annualIncome: unknown | null;
    familyDetails: unknown | null;
}