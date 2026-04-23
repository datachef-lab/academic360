import { academicActivityAudienceEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const academicActivityModel = pgTable("academic_activities", {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 1000 }),
    audience: academicActivityAudienceEnum()
        .default("ALL")
        .notNull(),
    startDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp({ withTimezone: true }),
    remarks: varchar({ length: 1000 }),
    isEnabled: boolean()
        .default(false)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    lastUpdatedBy: integer("last_updated_by_user_id_fk")
        .references(() => userModel.id),
});

export const createAcademicActivitySchema = createInsertSchema(academicActivityModel);

export type AcademicActivity = z.infer<typeof createAcademicActivitySchema>

export type AcademicActivityT = typeof createAcademicActivitySchema._type