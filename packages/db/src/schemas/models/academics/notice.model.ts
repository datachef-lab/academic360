import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { academicYearModel } from "@/schemas/models/academics";
import { noticeStatusEnum, noticeVariantEnum } from "@/schemas/enums";

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

export type NoticeT = typeof createNoticeSchema._type;