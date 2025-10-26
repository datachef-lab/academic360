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
    "DOCTORATE",
]);

export const parentTypeEnum = pgEnum("parent_type", [
    "BOTH",
    "FATHER_ONLY",
    "MOTHER_ONLY"
]);

export const genderTypeEnum = pgEnum('gender_type', [
    "MALE",
    "FEMALE",
    "OTHER"
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
    "FACULTY",
    "STAFF",
    "PARENTS",
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
    "MERIT_LISTED",
    "WAITING_FOR_ADMISSION",
    "ADMITTED",

    "SUBJECT_PAPER_SELECTION",
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
    "MINOR_PAPER_SELECTION",
    "SEMESTER_WISE_SUBJECT_SELECTION",
]);

export const paymentStatus = pgEnum("payment_status", [
    "PENDING", "SUCCESS", "FAILED", "REFUNDED"
]);

export const personTitleType = pgEnum("person_title_type", [
    "MR.", "MRS.", "MS.", "DR.", "PROF.", "REV.", "OTHER.", "LATE"
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


export const attachmentTypeEnum = pgEnum("attachment_type", [
    "FILE",
    "LINK",
]);

export const studyMetaTypeEnum = pgEnum("study_meta_type", [
    "RESOURCE",
    "WORKSHEET",
    "ASSIGNMENT",
    "PROJECT",
]);

export const studyMaterialAvailabilityTypeEnum = pgEnum("study_material_availability_type", [
    "ALWAYS",
    "CURRENT_SESSION_ONLY",
    "COURSE_LEVEL",
    "BATCH_LEVEL",
]);

export const noticeStatusEnum = pgEnum("notice_status", [
    "ACTIVE",
    "EXPIRED",
    "SCHEDULED",
]);

export const noticeVariantEnum = pgEnum("notice_variant", [
    "EXAM",
    "ALERT",
    "FEE",
    "EVENT",
]);

export const settingsTypeInputEnum = pgEnum("settings_input_type", [
    "NUMBER",
    "TEXT",
    "FILE",
    "EMAIL",
]);

export const settingsVariantEnum = pgEnum("settings_variant_type", [
    "GENERAL",
    "API_CONFIG",
])

export const maritalStatusTypeEnum = pgEnum("marital_status_type", [
    "SINGLE",
    "MARRIED",
    "WIDOWED",
    "DIVORCED",
    "SEPARATED",
])

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
    "SAVINGS",
    "CURRENT",
    "FIXED_DEPOSIT",
    "RECURRING_DEPOSIT",
    "OTHER",
]);

export const promotionStatusTypeEnum = pgEnum("promotion_status_type", [
    "REGULAR",
    "READMISSION",
    "CASUAL",
]);

export const personTypeEnum = pgEnum("person_type", [
    "FATHER",
    "MOTHER",
    "GUARDIAN",
    "OTHER_GUARDIAN",
    "SPOUSE",
    "NOMINEE",
    "BROTHER",
    "SISTER",
    "SON",
    "DAUGHTER",
    "OTHER",
]);

export const addressTypeEnum = pgEnum("address_type", [
    "MAILING",
    "RESIDENTIAL",
    "OFFICE",
    "OTHER",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
    "UPLOAD",
    "EDIT",
    "UPDATE",
    "INFO",
    "FEE",
    "EVENT",
    "OTHER",
    "ADMISSION",
    "EXAM",
    "MINOR_PAPER_SELECTION",
    "SEMESTER_WISE_SUBJECT_SELECTION",
    "ALERT",
    "OTP",

]);

export const notificationQueueTypeEnum = pgEnum("notification_queue_type", [
    "EMAIL_QUEUE",
    "WHATSAPP_QUEUE",
    "SMS_QUEUE",
    "WEB_QUEUE",
    "IN_APP_QUEUE",
    "DEAD_LETTER_QUEUE",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
    "PENDING",
    "SENT",
    "FAILED",
]);

export const notificationVariantEnum = pgEnum("notification_variant", [
    "EMAIL",
    "WHATSAPP",
    "SMS",
    "WEB",
    "OTHER",
]);

export const cuRegistrationCorrectionRequestStatusEnum = pgEnum("cu_registration_correction_request_status", [
    "PENDING",
    "REQUEST_CORRECTION",
    "ONLINE_REGISTRATION_DONE",
    "PHYSICAL_REGISTRATION_DONE",
    "APPROVED",
    "REJECTED",
]);
