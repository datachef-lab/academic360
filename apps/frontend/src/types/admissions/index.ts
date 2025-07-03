import { AdmissionFormStatus, AdmissionStep, BoardResultStatusType, Disability, Gender, Level, PaymentMode, PaymentStatus, PersonTitleType, SportsLevel, StreamType, SubjectResultStatusType } from "../enums"

export interface AdmissionAcademicInfo {
    readonly id?: number;
    applicationFormId: number;
    boardUniversityId: number;
    boardResultStatus: BoardResultStatusType;
    rollNumber: string;
    schoolNumber: number;
    centerNumber: string;
    admitCardId: string;
    instituteId: number;
    otherInstitute: string | null;
    languageMediumId: number | null;
    yearOfPassing: number;
    streamType: StreamType;
    isRegisteredForUGInCU: boolean;
    cuRegistrationNumber: string | null;
    previouslyRegisteredCourseId: number | null;
    otherPreviouslyRegisteredCourse: string | null;
    previousCollegeId: number | null;
    otherCollege: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    subjects: StudentAcademicSubjects[]
}

export interface StudentAcademicSubjects {
    readonly id?: number;
    admissionAcademicInfoId: number;
    academicSubjectId: number;
    fullMarks: number;
    totalMarks: number;
    resultStatus: SubjectResultStatusType;
    createdAt: Date;
    updatedAt: Date;
}

export interface AdmissionAdditionalInfo {
    readonly id: number;
    applicationFormId: number;
    alternateMobileNumber: string;
    bloodGroupId: number;
    religionId: number;
    categoryId: number;
    isPhysicallyChallenged: boolean
    disabilityType: Disability | null;
    isSingleParent: boolean,
    fatherTitle: PersonTitleType | null,
    fatherName: string | null,
    motherTitle: PersonTitleType | null,
    motherName: string | null,
    isEitherParentStaff: boolean,
    nameOfStaffParent: string | null,
    departmentOfStaffParent: number | null,
    hasSmartphone: boolean;
    hasLaptopOrDesktop: boolean;
    hasInternetAccess: boolean;
    annualIncomeId: number | null;
    applyUnderNCCCategory: boolean;
    applyUnderSportsCategory: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    sportsInfo: SportsInfo[];
}

export interface SportsInfo {
    readonly id?: number;
    additionalInfoId: number;
    sportsCategoryId: number
    level: SportsLevel;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AdmissionGeneralInfo {
    readonly id?: number;
    applicationFormId: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    dateOfBirth: Date;
    nationalityId: number | null;
    otherNationality: string | null;
    isGujarati: boolean;
    categoryId: number;
    religionId: number;
    gender: Gender;
    degreeLevel: Level;
    password: string;
    whatsappNumber: string;
    mobileNumber: string;
    email: string;
    residenceOfKolkata:boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Payment {
    readonly id?: string;
    applicationFormId: number;
    orderId: number | null;
    transactionId: string | null;
    amount: number | null;
    status: PaymentStatus | null;
    paymentMode: PaymentMode | null;
    bankTxnId: string | null;
    gatewayName: string | null;
    txnDate: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    remarks: string;
}

export interface AdmissionCourseApplication {
    readonly id?: number
    applicationFormId: number;
    admissionCourseId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ApplicationForm {
    readonly id?: number;
    admissionId: number;
    applicationNumber: string | null;
    formStatus: AdmissionFormStatus;
    admissionStep: AdmissionStep;
    createdAt?: Date;
    updatedAt?: Date;
    remarks: string | null;
    generalInfo: AdmissionGeneralInfo | null;
    academicInfo: AdmissionAcademicInfo | null;
    courseApplication: AdmissionCourseApplication[] | null;
    additionalInfo: AdmissionAdditionalInfo | null;
    paymentInfo: Payment | null;
    currentStep: number;
}

export interface BoardUniversity {
    readonly id: number;
    name: string;
    degreeId: number | null;
    passingMarks: number;
    code: string | null;
    addressId: number | null;
    sequene: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    subjects: AcademicSubject[];
    degreeName?: string;
}

export interface AcademicSubject {
    readonly id?: number;
    boardUniversityId: number;
    name: string
    passingMarks: number
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AdmissionAdmission {
    readonly id?: number;
    academicYearId: number;
    admissionCode: string | null;
    isClosed: boolean;
    startDate: Date;
    lastDate: Date;
    isArchived: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    remarks: string | null;

    courses: AdmissionCourse[];
}

export interface AdmissionCourse {
    readonly id?: number;
    admissionId: number;
    courseId: number;
    disabled: boolean;
    isClosed: boolean;
    createdAt?: Date
    updatedAt?: Date
    remarks: string | null;
}