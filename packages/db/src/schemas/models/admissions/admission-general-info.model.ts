import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { applicationFormModel } from "@/schemas/models/admissions";
import { degreeLevelTypeEnum, genderTypeEnum } from "@/schemas/enums";
import { categoryModel, nationalityModel, religionModel } from "@/schemas/models/resources";

export const admissionGeneralInfoModel = pgTable("admission_general_info", {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    middleName: varchar("middle_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    dateOfBirth: date("date_of_birth").notNull(),
    nationalityId: integer("nationality_id_fk").references(() => nationalityModel.id),
    otherNationality: varchar("other_nationality", { length: 255 }),
    isGujarati: boolean("is_gujarati").default(false),
    categoryId: integer("category_id_fk").references(() => categoryModel.id),
    religionId: integer("religion_id_fk").references(() => religionModel.id),
    gender: genderTypeEnum().default("MALE"),
    degreeLevel: degreeLevelTypeEnum().default("UNDER_GRADUATE").notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    whatsappNumber: varchar("whatsapp_number", { length: 15 }),
    mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    residenceOfKolkata: boolean("residence_of_kolkata").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
export const createAdmissionGeneralInfoSchema = createInsertSchema(admissionGeneralInfoModel);

export type AdmissionGeneralInfo = z.infer<typeof createAdmissionGeneralInfoSchema>;

export type AdmissionGeneralInfoT = typeof createAdmissionGeneralInfoSchema._type;