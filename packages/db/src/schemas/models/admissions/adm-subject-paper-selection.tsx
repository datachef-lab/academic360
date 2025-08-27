import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { studentModel } from "../user";
import { admissionCourseDetails } from "./adm-course-details.model";
import { paperModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const admSubjectPaperSelectionModel = pgTable("adm_subject_paper_selections", {
  id: serial().primaryKey(),
  legacyCVSubjectSelectionId: integer("legacy_cvsubject_selection_id"),
  studentId: integer("student_id_fk")
    .references(() => studentModel.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  admissionCourseDetailsId: integer("admission_course_details_id_fk")
    .references(() => admissionCourseDetails.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  paperId: integer("paper_id_fk")
    .references(() => paperModel.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createAdmSubjectPaperSelectionModel = createInsertSchema(admSubjectPaperSelectionModel);

export type AdmSubjectPaperSelection = z.infer<typeof createAdmSubjectPaperSelectionModel>;
