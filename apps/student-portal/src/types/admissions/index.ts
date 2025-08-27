import { AcademicSubject, AcademicYear, Admission, AdmissionAcademicInfo, AdmissionAdditionalInfo, AdmissionCourse, AdmissionCourseApplication, AdmissionGeneralInfo, ApplicationForm, BoardUniversity, Payment, SportsInfo, StudentAcademicSubject } from "@/db/schema";

export interface AdmissionAcademicInfoDto extends AdmissionAcademicInfo {
    subjects: StudentAcademicSubject[];
}


export interface AdmissionAdditionalInfoDto extends AdmissionAdditionalInfo {
    sportsInfo: SportsInfo[];
}

export interface ApplicationFormDto extends ApplicationForm {
    generalInfo: AdmissionGeneralInfo | null;
    academicInfo: AdmissionAcademicInfoDto | null;
    courseApplication: AdmissionCourseApplication[] | null;
    additionalInfo: AdmissionAdditionalInfoDto | null;
    paymentInfo: Payment | null;
    currentStep: number;
}

export interface BoardUniversityDto extends BoardUniversity {
    subjects: AcademicSubject[];
    degreeName?: string;
}

export interface AdmissionDto extends Admission {
    courses: AdmissionCourse[];
    academicYear: AcademicYear;
}