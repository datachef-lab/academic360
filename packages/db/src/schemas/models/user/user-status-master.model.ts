import { userStatusMasterTypeEnum } from "@/schemas/enums";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userStatusMasterModel = pgTable('user_statuses_master', {
    id: serial().primaryKey(),
    status: userStatusMasterTypeEnum().notNull(),
    tag: varchar({length: 255}).notNull().unique(),
    description: varchar({length: 2000}).notNull(),
    remarks: varchar({length: 255}),
    coexistence: varchar({length: 2000}),
    enrollmentStatus: varchar({length: 255}).notNull().unique(),
    isAcademicRecordsAccessible: boolean().notNull().default(false),
    hasFeePaymentEligibility: boolean().notNull().default(false),
    isFormFillupInclusive: boolean().notNull().default(false),
    isExamInclusive: boolean().notNull().default(false),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusMasterSchema = createInsertSchema(userStatusMasterModel);

export type UserStatusMaster = z.infer<typeof createUserStatusMasterSchema>;

export type UserStatusMasterT = typeof createUserStatusMasterSchema._type;