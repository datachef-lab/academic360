import { integer, numeric, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "@/features/user/models/student.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { userModel } from "@/features/user/models/user.model.js";
import { marksheetSourceEnum } from "@/features/user/models/helper.js";
import { classModel } from "./class.model.js";
import { batchStudentMappingModel } from "./batch-student-mapping.model.js";

export const marksheetModel = pgTable("marksheets", {
    id: serial().primaryKey(),
    batchStudentMappingId: integer("batch_student_mapping_id_fk")
        .notNull()
        .references(() => batchStudentMappingModel.id),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    sgpa: numeric(),
    cgpa: numeric(),
    classification: varchar({ length: 255 }),
    remarks: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createMarksheetModel = createInsertSchema(marksheetModel);

export type Marksheet = z.infer<typeof createMarksheetModel>;