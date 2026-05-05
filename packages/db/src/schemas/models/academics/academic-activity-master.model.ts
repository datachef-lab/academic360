import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicActivityTypeEnum } from "@/schemas/enums";

export const academicActivityMasterModel = pgTable("academic_activity_master", {
    id: serial().primaryKey(),
    type: academicActivityTypeEnum().notNull(),
    name: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 1000 }),
    remarks: varchar({ length: 1000 }),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAcademicActivityMasterSchema = createInsertSchema(academicActivityMasterModel);

export type AcademicActivityMaster = z.infer<typeof createAcademicActivityMasterSchema>

export type AcademicActivityMasterT = typeof createAcademicActivityMasterSchema._type