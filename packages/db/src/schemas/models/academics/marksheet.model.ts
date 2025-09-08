import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
    integer,
    numeric,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

import { marksheetSourceEnum } from "@/schemas/enums";
import { classModel } from "@/schemas/models/academics";
import { userModel, studentModel } from "@/schemas/models/user";

export const marksheetModel = pgTable("marksheets", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .notNull()
        .references(() => studentModel.id),
    classId: integer("class_id_fk")
        .notNull()
        .references(() => classModel.id),
    year: integer("year").notNull(),
    sgpa: numeric(),
    cgpa: numeric(),
    classification: varchar({ length: 255 }),
    remarks: varchar({ length: 255 }),
    source: marksheetSourceEnum("source"),
    file: varchar({ length: 700 }),
    createdByUserId: integer("created_by_user_id")
        .notNull()
        .references(() => userModel.id),
    updatedByUserId: integer("updated_by_user_id")
        .notNull()
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createMarksheetModel = createInsertSchema(marksheetModel) as z.ZodTypeAny;

export type Marksheet = z.infer<typeof createMarksheetModel>;

export type MarksheetT = typeof createMarksheetModel._type;