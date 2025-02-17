
import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { nationalityModel } from "@/features/resources/models/nationality.model.js";
import { studentModel } from "./student.model.js";
import { date, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { religionModel } from "@/features/resources/models/religion.model.js";
import { addressModel } from "./address.model.js";
import { categoryModel } from "@/features/resources/models/category.model.js";
import { languageMediumModel } from "@/features/resources/models/languageMedium.model.js";
import { disabilityCodeModel } from "./disabilityCode.model.js";
import { disabilityTypeEnum, genderTypeEnum } from "./helper.js";



export const personalDetailsModel = pgTable("personal_details", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().references(() => studentModel.id),
    nationalityId: integer("nationality_id_fk").references(() => nationalityModel.id),
    otherNationalityId: integer("other_nationality_id_fk").references(() => nationalityModel.id),
    aadhaarCardNumber: varchar({ length: 16 }),
    religionId: integer("religion_id_fk").references(() => religionModel.id),
    categoryId: integer("category_id_fk").references(() => categoryModel.id),
    motherTongueId: integer("mother_tongue_language_medium_id_fk").references(() => languageMediumModel.id),
    dateOfBirth: date(),
    gender: genderTypeEnum(),
    email: varchar({ length: 255 }),
    alternativeEmail: varchar({ length: 255 }),
    mailingAddressId: integer("mailing_address_id_fk").references(() => addressModel.id),
    residentialAddressId: integer("residential_address_id_fk").references(() => addressModel.id),
    disability: disabilityTypeEnum(),
    disabilityCodeId: integer("disablity_code_id_fk").references(() => disabilityCodeModel.id),
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
    disabilityCode: one(disabilityCodeModel, {
        fields: [personalDetailsModel.disabilityCodeId],
        references: [disabilityCodeModel.id]
    }),
}));

export const createPersonalDetailsSchema = createInsertSchema(personalDetailsModel);

export type PersonalDetails = z.infer<typeof createPersonalDetailsSchema>;