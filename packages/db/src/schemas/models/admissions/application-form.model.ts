import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { admissionModel } from "@/schemas/models/admissions";
import { admissionFormStatus, admissionSteps } from "@/schemas/enums";
import { degreeLevelTypeEnum } from "@/schemas/enums";
// import { staffModel } from "../user/staff.model";
import { userModel } from "../user";

export const applicationFormModel = pgTable("application_forms", {
    id: serial().primaryKey().notNull(),
    admissionId: integer("admission_id_fk")
        .references(() => admissionModel.id)
        .notNull(),
    level: degreeLevelTypeEnum().default("UNDER_GRADUATE").notNull(),
    applicationNumber: varchar({ length: 255 }).notNull(),
    changedApplicationNumber: varchar({ length: 255 }),
    formStatus: admissionFormStatus("form_status"),
    admissionStep: admissionSteps("admission_step"),

    isBlocked: boolean().default(false),
    blockRemarks: varchar({ length: 1000 }),
    blockedBy: integer("blocked_by_user_id_fk")
        .references(() => userModel.id),
    blockedDate: timestamp("blocked_date"),
    
    admApprovedBy: integer("adm_approved_by_user_id_fk")
        .references(() => userModel.id),
    admApprovedDate: timestamp("adm_approved_date"),
    verifyType: varchar({ length: 100 }),
    verifyRemarks: varchar({ length: 1000 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
}, (t) => ({
    // Reports join application_forms → admissions to reach the session/year.
    admissionIdx: index("application_forms_admission_id_idx").on(t.admissionId),
}));

export const createApplicationFormSchema = createInsertSchema(applicationFormModel);

export type ApplicationForm = z.infer<typeof createApplicationFormSchema>;

export type ApplicationFormT = typeof createApplicationFormSchema._type;