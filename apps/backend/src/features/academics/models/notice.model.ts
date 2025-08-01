import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { academicYearModel } from "./academic-year.model.js";
import { noticeStatusEnum, noticeVariantEnum } from "@/features/user/models/helper.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const noticeModel = pgTable("notices", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    title: varchar({length: 600 }).notNull(),
    description: varchar({length: 2000 }).notNull(),
    status: noticeStatusEnum().default('ACTIVE').notNull(),
    variant: noticeVariantEnum().default('ALERT').notNull(),
    isPinned: boolean().notNull().default(false),
    forStudents: boolean().notNull(),
    forFaculty: boolean().notNull(),
    forStaff: boolean().notNull(),
    forAdmins: boolean().notNull(), 
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createNoticeSchema = createInsertSchema(noticeModel);

export type Notice = z.infer<typeof createNoticeSchema>;