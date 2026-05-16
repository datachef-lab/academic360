import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { certificateFieldMasterModel } from "./certificate-field-master.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const certificateFieldOptionMasterModel = pgTable("certificate_field_option_master", {
    id: serial().primaryKey(),
    certificateFieldMasterId: integer("certificate_field_option_master_id_fk")
        .references(() => certificateFieldMasterModel.id)
        .notNull(),
    name: varchar({ length:500 }).notNull(),
    sequence: integer().notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCertificateFieldOptionMasterSchema =
  createInsertSchema(certificateFieldOptionMasterModel);

export type CertificateFieldOptionMaster = z.infer<typeof createCertificateFieldOptionMasterSchema>;

export type CertificateFieldOptionMasterT = typeof createCertificateFieldOptionMasterSchema._type;