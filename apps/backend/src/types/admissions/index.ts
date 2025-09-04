import { AdmissionCourse } from "@/features/admissions/models/admission-course.model.js";
import { ApplicationForm } from "@/features/admissions/models/application-form.model.js";
import { AcademicSubject } from "@/features/admissions/models/academic-subject.model.js";
import { AdmissionAdditionalInfo } from "@/features/admissions/models/admisison-additional-info.model.js";
import { AdmissionAcademicInfo } from "@/features/admissions/models/admission-academic-info.model.js";
import { AdmissionCourseApplication } from "@/features/admissions/models/admission-course-application.model.js";
import { AdmissionGeneralInfo } from "@/features/admissions/models/admission-general-info.model.js";
import { Payment } from "@/features/payments/models/payment.model.js";
import { SportsInfo } from "@/features/admissions/models/sports-info.model.js";
import { StudentAcademicSubjects } from "@/features/admissions/models/student-academic-subject.model.js";
import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.js";
import { Admission } from "@/features/admissions/models/admission.model";
import { AcademicYear } from "@repo/db/schemas/models/academics";
// import { Admission } from "@/features/user/models/admission.model.js";

export interface AdmissionAcademicInfoDto extends AdmissionAcademicInfo {
    subjects: StudentAcademicSubjects[];
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


export interface Stats {
    admissionYearCount: number;
    totalApplications: number;
    totalPayments: number;
    totalDrafts: number;
}

export interface AdmissionSummary {
    id: number;
    admissionYear: number;
    isClosed: boolean;
    totalApplications: number;
    totalPayments: number;
    totalDrafts: number;
}


