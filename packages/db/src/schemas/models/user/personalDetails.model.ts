import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { disabilityTypeEnum, genderTypeEnum, maritalStatusTypeEnum } from "@/schemas/enums";
import { disabilityCodeModel, userModel } from "@/schemas/models/user";
import { nationalityModel, religionModel, categoryModel, languageMediumModel } from "@/schemas/models/resources";
import { admissionGeneralInfoModel } from "../admissions";

export const personalDetailsModel = pgTable("personal_details", {
    id: serial().primaryKey(),
    admissionGeneralInfoId: integer("admission_general_info_id_fk")
        .references(() => admissionGeneralInfoModel.id),
    userId: integer("user_id_fk").references(() => userModel.id),

    firstName: varchar("first_name", { length: 255 }).notNull(),
    middleName: varchar("middle_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),

    email: varchar("email", { length: 255 }),
    alternativeEmail: varchar("alternative_email", { length: 255 }),

    whatsappNumber: varchar("whatsapp_number", { length: 15 }),
    mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
    emergencyResidentialNumber: varchar("emergency_residential_number", { length: 15 }),
    
    
    nationalityId: integer("nationality_id_fk").references(() => nationalityModel.id),
    otherNationality: varchar("other_nationality", { length: 255 }),
    
    voterId: varchar({ length: 255 }),
    passportNumber: varchar({ length: 255 }),
    aadhaarCardNumber: varchar({ length: 16 }),
    
    religionId: integer("religion_id_fk").references(() => religionModel.id),
    
    categoryId: integer("category_id_fk").references(() => categoryModel.id),
    
    motherTongueId: integer("mother_tongue_language_medium_id_fk").references(() => languageMediumModel.id),
    
    dateOfBirth: date(),
    placeOfBirth: varchar({ length: 7000 }),
    
    gender: genderTypeEnum(),

    isGujarati: boolean("is_gujarati").default(false),
    
    maritalStatus: maritalStatusTypeEnum("marital_status"),
    
    // mailingAddressId: integer("mailing_address_id_fk").references(() => addressModel.id),
    // residentialAddressId: integer("residential_address_id_fk").references(() => addressModel.id),
    
    disability: disabilityTypeEnum(),
    disabilityCodeId: integer("disablity_code_id_fk").references(() => disabilityCodeModel.id),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPersonalDetailsSchema = createInsertSchema(personalDetailsModel);

export type PersonalDetails = z.infer<typeof createPersonalDetailsSchema>;

export type PersonalDetailsT = typeof createPersonalDetailsSchema._type;