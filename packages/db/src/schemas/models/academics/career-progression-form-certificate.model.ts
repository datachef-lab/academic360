import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { careerProgressionFormModel } from "./career-progression-form.model";
import { certificateMasterModel } from "./certificate-master.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const careerProgressionFormCertificateModel = pgTable("career_progression_form_certificates", {
    id: serial().primaryKey(),
    careerProgressionFormId: integer("career_progression_form_id_fk")
        .references(() => careerProgressionFormModel.id)
        .notNull(),
    certificateMasterId: integer("certificate_master_id_fk")
        .references(() => certificateMasterModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createCareerProgressionFormCertificateSchema = createInsertSchema(careerProgressionFormCertificateModel);

export type CareerProgressionFormCertificate = z.infer<typeof createCareerProgressionFormCertificateSchema>;

export type CareerProgressionFormCertificateT = typeof createCareerProgressionFormCertificateSchema._type;