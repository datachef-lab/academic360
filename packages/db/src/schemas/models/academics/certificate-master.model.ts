import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const certificateMasterModel = pgTable("certificate_master", {
    id: serial().primaryKey(),
    name: varchar({ length:500 }).notNull(),
    description: varchar({ length: 700 }).notNull(),
    color: varchar({ length: 255 }),
    bgColor: varchar({ length: 255 }),
    sequence: integer().notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCertificateMasterSchema = createInsertSchema(certificateMasterModel);

export type CertificateMaster = z.infer<typeof createCertificateMasterSchema>;

export type CertificateMasterT = typeof createCertificateMasterSchema._type;