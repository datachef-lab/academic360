import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { applicationFormModel, eligibilityCriteriaModel, studentCategoryModel } from "@/schemas/models/admissions";
import { accommodationModel, emergencyContactModel, healthModel, personalDetailsModel, transportDetailsModel, userModel } from "../user";
import { bankBranchModel } from "../payments";
// import { staffModel } from "../user/staff.model";

export const admissionGeneralInfoModel = pgTable("admission_general_info", {
    id: serial("id").primaryKey(),
    legacyPersonalDetailsId: integer("legacy_personal_details_id"),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),

    email: varchar("email", { length: 255 }).notNull(),

    password: varchar("password", { length: 255 }).notNull(),

    eligibilityCriteriaId: integer("eligibility_criteria_id_fk").references(() => eligibilityCriteriaModel.id),

    studentCategoryId: integer("student_category_id_fk").references(() => studentCategoryModel.id),

    personalDetailsId: integer("personal_details_id_fk").references(() => personalDetailsModel.id),

    isMinority: boolean("is_minority").default(false),

    dtls: varchar("dtls", { length: 255 }),

    gujaratiClass: integer("gujarati_class"),

    clubAId: integer("club_a_id"),

    clubBId: integer("club_b_id"),

    tshirtSize: varchar("tshirt_size", { length: 255 }),

    spqtaApprovedBy: integer("spqta_approved_by_user_id_fk")
        .references(() => userModel.id),

    spqtaApprovedDate: date("spqta_approved_date"),

    separated: boolean("separated").default(false),

    chkFlats: varchar("chk_flats", { length: 255 }),

    backDoorFlag: integer("back_door_flag"),

    healthId: integer("health_id_fk").references(() => healthModel.id),

    accommodationId: integer("accommodation_id_fk").references(() => accommodationModel.id),

    emergencyContactId: integer("emergency_contact_id_fk").references(() => emergencyContactModel.id),

    residenceOfKolkata: boolean("residence_of_kolkata").notNull(),

    bankBranchId: integer("bank_branch_id_fk").references(() => bankBranchModel.id),

    transportDetailsId: integer("transport_details_id_fk").references(() => transportDetailsModel.id),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
export const createAdmissionGeneralInfoSchema = createInsertSchema(admissionGeneralInfoModel);

export type AdmissionGeneralInfo = z.infer<typeof createAdmissionGeneralInfoSchema>;

export type AdmissionGeneralInfoT = typeof createAdmissionGeneralInfoSchema._type;
