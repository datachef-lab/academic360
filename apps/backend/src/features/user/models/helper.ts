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

export const degreeProgrammeTypeEnum = pgEnum("degree_programme_type", [
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