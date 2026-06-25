import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const admissionQuotaTypeModel = pgTable("admission_quota_types", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    shortName: varchar("short_name", { length: 255 }),
    printOnIdCard: boolean("print_on_id_card").default(false),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAdmissionQuotaTypeSchema = createInsertSchema(admissionQuotaTypeModel);

export type AdmissionQuotaType = z.infer<typeof createAdmissionQuotaTypeSchema>;

export type AdmissionQuotaTypeT = typeof createAdmissionQuotaTypeSchema._type;
