
import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { nationalityModel } from "@/features/resources/models/nationality.model.ts";
import { studentModel } from "./student.model.ts";
import { date, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { religionModel } from "@/features/resources/models/religion.model.ts";
import { addressModel } from "./address.model.ts";
import { categoryModel } from "@/features/resources/models/category.model.ts";
import { languageMediumModel } from "@/features/resources/models/languageMedium.model.ts";

export const genderTypeEnum = pgEnum('gender_type', ["MALE", "FEMALE", "TRANSGENDER"]);

export const disabilityTypeEnum = pgEnum('disability_type', ["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]);

export const personalDetailsModel = pgTable("personal_details", {
    id: serial().primaryKey(),
    studentId: integer().notNull().references(() => studentModel.id),
    nationalityId: integer().references(() => nationalityModel.id),
    otherNationalityId: integer().references(() => nationalityModel.id),
    aadhaarCardNumber: varchar({ length: 16 }),
    religionId: integer().references(() => religionModel.id),
    categoryId: integer().references(() => categoryModel.id),
    motherTongueId: integer().references(() => languageMediumModel.id),
    dateOfBirth: date(),
    gender: genderTypeEnum(),
    email: varchar({ length: 255 }),
    alternativeEmail: varchar({ length: 255 }),
    mailingAddressId: integer().references(() => addressModel.id),
    residentialAddressId: integer().references(() => addressModel.id),
    disability: disabilityTypeEnum(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const personalDetailsRelations = relations(personalDetailsModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [personalDetailsModel.studentId],
        references: [studentModel.id]
    }),
    nationality: one(nationalityModel, {
        fields: [personalDetailsModel.nationalityId],
        references: [nationalityModel.id]
    }),
    otherNationality: one(nationalityModel, {
        fields: [personalDetailsModel.otherNationalityId],
        references: [nationalityModel.id]
    }),
    religion: one(religionModel, {
        fields: [personalDetailsModel.religionId],
        references: [religionModel.id]
    }),
    category: one(categoryModel, {
        fields: [personalDetailsModel.categoryId],
        references: [categoryModel.id]
    }),
    motherTongue: one(languageMediumModel, {
        fields: [personalDetailsModel.motherTongueId],
        references: [languageMediumModel.id]
    }),
    mailingAddress: one(addressModel, {
        fields: [personalDetailsModel.mailingAddressId],
        references: [addressModel.id]
    }),
    residentialAddress: one(addressModel, {
        fields: [personalDetailsModel.residentialAddressId],
        references: [addressModel.id]
    }),
}));

export const createPersonalDetailsSchema = createInsertSchema(personalDetailsModel);

export type PersonalDetails = z.infer<typeof createPersonalDetailsSchema>;