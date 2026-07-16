import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const studentLibraryAnalyticsModel = pgTable("library_student_analytics", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    academicYear: varchar({ length: 50 }).notNull(),
    totalIssues: integer().notNull().default(0),
    totalReturns: integer().notNull().default(0),
    totalOverdue: integer().notNull().default(0),
    totalFinesPaid: doublePrecision().notNull().default(0),
    libraryVisits: integer().notNull().default(0),
    averageGrade: doublePrecision(),
    computedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStudentLibraryAnalyticsSchema = createInsertSchema(studentLibraryAnalyticsModel);

export type StudentLibraryAnalytics = z.infer<typeof createStudentLibraryAnalyticsSchema>;

export type StudentLibraryAnalyticsT = typeof createStudentLibraryAnalyticsSchema._type;
