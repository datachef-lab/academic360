import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sessionModel } from "./session.model.js";

export const academicYearModel = pgTable("academic_years", {
    id: serial().primaryKey(),
    startYear: varchar({ length: 4 }).notNull(),
    isCurrentYear: boolean("is_current_year").notNull().default(false),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAcademicYearSchema = createInsertSchema(academicYearModel);

export type AcademicYear = z.infer<typeof createAcademicYearSchema>;