import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const academicYearModel = pgTable("academic_years", {
    id: serial().primaryKey(),
    year: varchar({ length: 255 }).notNull(),
    isCurrentYear: boolean("is_current_year").notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAcademicYearSchema = createInsertSchema(academicYearModel);

export type AcademicYear = z.infer<typeof createAcademicYearSchema>;

export type AcademicYearT = typeof createAcademicYearSchema._type;
