import { z } from "zod";

import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { parentTypeEnum } from "@/schemas/enums";
import { annualIncomeModel, occupationModel } from "@/schemas/models/resources";
import {  userModel } from "@/schemas/models/user";
import { admissionAdditionalInfoModel } from "../admissions";

export const familyModel = pgTable("family_details", {
    id: serial().primaryKey(),
    admissionAdditionalInfoId: integer("admission_additional_info_id_fk")
        .references(() => admissionAdditionalInfoModel.id),
    userId: integer("user_id_fk").references(() => userModel.id),
    parentType: parentTypeEnum(),
    
    // fatherDetailsId: integer("father_details_person_id_fk").references(() => personModel.id),

    // motherDetailsId: integer("mother_details_person_id_fk").references(() => personModel.id),
    
    // guardianDetailsId: integer("guardian_details_person_id_fk").references(() => personModel.id),
    
    // otherGuardianDetailsId: integer("other_guardian_details_person_id_fk").references(() => personModel.id),

    // spouseDetailsId: integer("spouse_details_person_id_fk").references(() => personModel.id),

    familyOccupationId: integer("family_occupation_id_fk").references(() => occupationModel.id),
    
    annualIncomeId: integer("annual_income_id_fk").references(() => annualIncomeModel.id),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFamilySchema = createInsertSchema(familyModel);

export type Family = z.infer<typeof createFamilySchema>;

export type FamilyT = typeof createFamilySchema._type;