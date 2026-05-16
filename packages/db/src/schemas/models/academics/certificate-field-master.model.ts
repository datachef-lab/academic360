import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { certificateMasterModel } from "./certificate-master.model";
import { certificateFieldMasterTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const certificateFieldMasterModel = pgTable("certificate_field_master", {
    id: serial().primaryKey(),
    certificateMasterId: integer("certificate_master_id_fk")
        .references(() => certificateMasterModel.id)
        .notNull(),
    name: varchar({ length:500 }).notNull(),
    type: certificateFieldMasterTypeEnum().default("TEXT").notNull(),
    isQuestion: boolean().default(false).notNull(),
    sequence: integer().notNull(),
    isRequired: boolean().default(false).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCertificateFieldMasterSchema = createInsertSchema(certificateFieldMasterModel);

export type CertificateFieldMaster = z.infer<typeof createCertificateFieldMasterSchema>;

export type CertificateFieldMasterT = typeof createCertificateFieldMasterSchema._type;