import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { studentModel } from "@/schemas/models/user";

/**
 * A student's one-time pending-fees declaration made on the exam screen
 * (student-console): they acknowledge the dues for the given semester(s) and
 * undertake to clear them by `undertakingClearDate` (picked, max +1 month).
 * Once a row exists for (student, semesterLabel) the declaration dialog is
 * never shown again for that dues context — required behaviour per the
 * "Important Alert - pop up" spec.
 */
export const studentFeeDueDeclarationModel = pgTable(
  "student_fee_due_declarations",
  {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
      .notNull()
      .references(() => studentModel.id),
    /** Semester(s) of the dues acknowledged, e.g. "SEMESTER II" or "SEMESTER I & SEMESTER II". */
    semesterLabel: varchar({ length: 255 }).notNull(),
    /** Date the student undertook to clear the dues by (<= 1 month out). */
    undertakingClearDate: date("undertaking_clear_date").notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    uqStudentSemester: unique("uq_fee_due_declaration_student_semester").on(
      t.studentId,
      t.semesterLabel,
    ),
  }),
);

export const createStudentFeeDueDeclarationSchema = createInsertSchema(
  studentFeeDueDeclarationModel,
);

export type StudentFeeDueDeclaration = z.infer<
  typeof createStudentFeeDueDeclarationSchema
>;

export type StudentFeeDueDeclarationT =
  typeof studentFeeDueDeclarationModel.$inferSelect;
