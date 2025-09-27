import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { admissionGeneralInfoModel } from "../admissions";
import { userModel } from "./user.model";

export const emergencyContactModel = pgTable("emergency_contacts", {
    id: serial().primaryKey(),
    admissionGeneralInfoId: integer("admission_general_info_id_fk")
        .references(() => admissionGeneralInfoModel.id),
    userId: integer("user_id_fk").references(() => userModel.id),
    personName: varchar({ length: 255 }),
    havingRelationAs: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    officePhone: varchar({ length: 255 }),
    residentialPhone: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createEmergencyContactSchema = createInsertSchema(emergencyContactModel);

export type EmergencyContact = z.infer<typeof createEmergencyContactSchema>;

export type EmergencyContactT = typeof createEmergencyContactSchema._type;