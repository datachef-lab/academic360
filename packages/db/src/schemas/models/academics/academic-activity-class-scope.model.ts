import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { academicActivityModel } from "./academic-activity.model";

import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { classModel } from "./class.model";

export const academicActivityClassScopeModel = pgTable("academic_activity_class_scopes", {
    id: serial().primaryKey(),
    academicActivityId: integer("academic_activity_id_fk")
        .references(() => academicActivityModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAcademicActivityClassScopeSchema = createInsertSchema(academicActivityClassScopeModel);

export type AcademicActivityClassScope = z.infer<typeof createAcademicActivityClassScopeSchema>

export type AcademicActivityClassScopeT = typeof createAcademicActivityClassScopeSchema._type