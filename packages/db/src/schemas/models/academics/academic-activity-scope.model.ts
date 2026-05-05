import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { academicActivityModel } from "./academic-activity.model";
import { streamModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { classModel } from "./class.model";

export const academicActivityScopeModel = pgTable("academic_activity_scopes", {
    id: serial().primaryKey(),
    academicActivityId: integer("academic_activity_id_fk")
        .references(() => academicActivityModel.id)
        .notNull(),
    streamId: integer("stream_id_fk")
        .references(() => streamModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    startDate: timestamp({ withTimezone: true }),
    endDate: timestamp({ withTimezone: true }),
    isEnabled: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAcademicActivityScopeSchema = createInsertSchema(academicActivityScopeModel);

export type AcademicActivityScope = z.infer<typeof createAcademicActivityScopeSchema>

export type AcademicActivityScopeT = typeof createAcademicActivityScopeSchema._type