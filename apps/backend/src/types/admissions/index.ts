import { AdmissionCourse } from "@/features/admissions/models/admission-course.model.js";
import { ApplicationForm } from "@/features/admissions/models/application-form.model.js";
import { AcademicSubjects } from "@/features/payments/models/academic-subject.model.js";
import { AdmissionAdditionalInfo } from "@/features/payments/models/admisison-additional-info.model.js";
import { AdmissionAcademicInfo } from "@/features/payments/models/admission-academic-info.model.js";
import { AdmissionCourseApplication } from "@/features/payments/models/admission-course-application.model.js";
import { AdmissionGeneralInfo } from "@/features/payments/models/admission-general-info.model.js";
import { Payment } from "@/features/payments/models/payment.model.js";
import { SportsInfo } from "@/features/payments/models/sports-info.model.js";
import { StudentAcademicSubjects } from "@/features/payments/models/student-academic-subject.model.js";
import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.js";
import { Admission } from "@/features/user/models/admission.model.js";

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
    subjects: AcademicSubjects[];
    degreeName?: string;
}

export interface AdmissionDto extends Admission {
    courses: AdmissionCourse[];
}