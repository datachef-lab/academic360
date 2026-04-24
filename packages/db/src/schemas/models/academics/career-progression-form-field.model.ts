import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { certificateFieldMasterModel } from "./certificate-field-master.model";
import { certificateFieldOptionMasterModel } from "./certificate-field-option-master.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { careerProgressionFormCertificateModel } from "./career-progression-form-certificate.model";

export const careerProgressionFormFieldModel = pgTable("career_progression_form_fields", {
    id: serial().primaryKey(),
    careerProgressionFormCertificateId: integer("career_progression_form_certificate_id_fk")
        .references(() => careerProgressionFormCertificateModel.id)
        .notNull(),
    certificateFieldMasterId: integer("certificate_field_master_id_fk")
        .references(() => certificateFieldMasterModel.id)
        .notNull(),
    certificateFieldOptionMasterId: integer("certificate_field_option_master_id_fk")
        .references(() => certificateFieldOptionMasterModel.id),
    value: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createCareerProgressionFormFieldSchema = createInsertSchema(careerProgressionFormFieldModel);

export type CareerProgressionFormField = z.infer<typeof createCareerProgressionFormFieldSchema>;

export type CareerProgressionFormFieldT = typeof createCareerProgressionFormFieldSchema._type;