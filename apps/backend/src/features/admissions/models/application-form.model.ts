import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { admissionModel } from "./admission.model.js";
import { admissionFormStatus, admissionSteps } from "@/features/user/models/helper.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const applicationFormModel = pgTable("application_forms", {
    id: serial().primaryKey().notNull(),
    admissionId: integer("admission_id_fk")
        .references(() => admissionModel.id)
        .notNull(),
    formStatus: admissionFormStatus("form_status").notNull(),
    admissionStep: admissionSteps("admission_step").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createApplicationFormSchema = createInsertSchema(applicationFormModel);

export type ApplicationForm = z.infer<typeof createApplicationFormSchema>;