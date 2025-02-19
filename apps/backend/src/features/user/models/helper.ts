import { pgEnum } from "drizzle-orm/pg-core";

export const frameworkTypeEnum = pgEnum("framework_type", ["CCF", "CBCS"]);

export const placeOfStayTypeEnum = pgEnum('place_of_stay_type', ["OWN", "HOSTEL", "FAMILY_FRIENDS", "PAYING_GUEST", "RELATIVES"]);

export const localityTypeEnum = pgEnum("locality_type", ["RURAL", "URBAN"]);

export const courseTypeEnum = pgEnum("course_type", ["HONOURS", "GENERAL"]);

export const parentTypeEnum = pgEnum("parent_type", ["BOTH", "FATHER_ONLY", "MOTHER_ONLY"]);

export const genderTypeEnum = pgEnum('gender_type', ["MALE", "FEMALE", "TRANSGENDER"]);

export const disabilityTypeEnum = pgEnum('disability_type', ["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]);

export const communityTypeEnum = pgEnum("community_type", ["GUJARATI", "NON-GUJARATI"]);

export const shiftTypeEnum = pgEnum("shift_type", ["DAY", "MORNING", "AFTERNOON", "EVENING"]);

export const userTypeEnum = pgEnum('user_type', ["ADMIN", "STUDENT", "TEACHER"]);