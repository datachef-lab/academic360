import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { admissionModel } from "@/schemas/models/admissions";
import { admissionFormStatus, admissionSteps, degreeLevelTypeEnum } from "@/schemas/enums";

export const applicationFormModel = pgTable("application_forms", {
    id: serial().primaryKey().notNull(),
    admissionId: integer("admission_id_fk")
        .references(() => admissionModel.id)
        .notNull(),
    degreeLevel: degreeLevelTypeEnum().default("UNDER_GRADUATE").notNull(),
    applicationNumber: varchar({ length: 255 }).notNull(),
    changedApplicationNumber: varchar({ length: 255 }),
    formStatus: admissionFormStatus("form_status").notNull(),
    admissionStep: admissionSteps("admission_step").notNull(),
    admApprovedBy: integer("adm_approved_by"),
    admApprovedDate: timestamp("adm_approved_date"),
    verifyType: varchar({ length: 100 }),
    verifyRemarks: varchar({ length: 1000 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createApplicationFormSchema = createInsertSchema(applicationFormModel);

export type ApplicationForm = z.infer<typeof createApplicationFormSchema>;

export type ApplicationFormT = typeof createApplicationFormSchema._type;