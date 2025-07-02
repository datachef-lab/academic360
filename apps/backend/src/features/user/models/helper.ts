import { pgEnum } from "drizzle-orm/pg-core";

export const frameworkTypeEnum = pgEnum("framework_type", [
    "CCF",
    "CBCS"
]);

export const placeOfStayTypeEnum = pgEnum('place_of_stay_type', [
    "OWN",
    "HOSTEL",
    "FAMILY_FRIENDS",
    "PAYING_GUEST",
    "RELATIVES",
]);

export const localityTypeEnum = pgEnum("locality_type", [
    "RURAL",
    "URBAN",
]);

export const programmeTypeEnum = pgEnum("programme_type", [
    "HONOURS",
    "GENERAL",
]);

export const degreeLevelTypeEnum = pgEnum('degree_level_type', [
    "SECONDARY",
    "HIGHER_SECONDARY",
    "UNDER_GRADUATE",
    "POST_GRADUATE",
]);

export const parentTypeEnum = pgEnum("parent_type", [
    "BOTH",
    "FATHER_ONLY",
    "MOTHER_ONLY"
]);

export const genderTypeEnum = pgEnum('gender_type', [
    "MALE",
    "FEMALE",
    "TRANSGENDER"
]);

export const disabilityTypeEnum = pgEnum('disability_type', [
    "VISUAL",
    "HEARING_IMPAIRMENT",
    "VISUAL_IMPAIRMENT",
    "ORTHOPEDIC",
    "OTHER",
]);

export const communityTypeEnum = pgEnum("community_type", [
    "GUJARATI",
    "NON-GUJARATI"
]);

export const userTypeEnum = pgEnum('user_type', [
    "ADMIN",
    "STUDENT",
    "TEACHER",
]);

export const subjectCategoryTypeEnum = pgEnum("subject_category_type", [
    "SPECIAL",
    "COMMON",
    "HONOURS",
    "GENERAL",
    "ELECTIVE",
]);

export const marksheetSourceEnum = pgEnum("marksheet_source", [
    "FILE_UPLOAD",
    "ADDED"
]);

export const classTypeEnum = pgEnum("class_type", [
    "YEAR",
    "SEMESTER",
]);

export const paperModeTypeEnum = pgEnum("paper_mode_type", [
    "THEORETICAL",
    "PRACTICAL",
    "VIVA",
    "ASSIGNMENT",
    "PROJECT",
    "MCQ",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
    "CANCELLED"
])

export const paymentModeEnum = pgEnum("payment_mode", [
    "CASH",
    "CHEQUE",
    "ONLINE",
]);

export const studentFeesMappingEnum = pgEnum("student_fees_mapping_type", [
    "FULL",
    "INSTALMENT"
]);


export const boardResultType = pgEnum("board_result_type", ['FAIL', 'PASS']);

export const admissionFormStatus = pgEnum("admission_form_status", [
    'DRAFT',
    'PAYMENT_DUE',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'WAITING_FOR_APPROVAL',
    'WAITING_FOR_PAYMENT',
    'WAITING_FOR_DOCUMENTS',
    'DOCUMENTS_VERIFIED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_REJECTED',
])

export const admissionSteps = pgEnum("admission_steps", [
    "GENERAL_INFORMATION",
    "ACADEMIC_INFORMATION",
    "COURSE_APPLICATION",
    "ADDITIONAL_INFORMATION",
    "DOCUMENTS",
    "PAYMENT",
    "REVIEW",
    "SUBMITTED",
]);

export const paymentStatus = pgEnum("payment_status", [
    "PENDING", "SUCCESS", "FAILED", "REFUNDED"
]);

export const personTitleType = pgEnum("person_title_type", [
    "MR", "MRS", "MS", "DR", "PROF", "REV", "OTHER"
]);

export const paymentMode = pgEnum("payment_mode", [
    "UPI", "WALLET", "NET_BANKING", "CREDIT_CARD", "DEBIT_CARD", "PAYTM_BALANCE"
]);

export const boardResultStatusType = pgEnum("board_result_status_type", [
    'PASS',
    'FAIL',
    "COMPARTMENTAL",
]);

export const subjectResultStatusType = pgEnum("board_result_status_type", [
    'PASS',
    'FAIL IN THEORY',
    'FAIL IN PRACTICAL',
    "FAIL",
]);

export const sportsLevelType = pgEnum("sports_level", [
    "NATIONAL",
    "STATE",
    "DISTRICT",
    "OTHERS",
]);

export const streamType = pgEnum("stream_type", [
    'SCIENCE',
    'COMMERCE',
    "HUMANITIES",
    "ARTS",
]);

export const otpType = pgEnum("otp_type", [
    'FOR_PHONE',
    'FOR_EMAIL',
]);
