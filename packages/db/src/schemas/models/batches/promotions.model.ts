import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { studentModel } from "../user";
import { programCourseModel } from "../course-design";
import { classModel, sectionModel, sessionModel, shiftModel } from "../academics";
import { boardResultStatusModel } from "../resources";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { examFormFillupModel } from "../exams";


export const promotionModel = pgTable("promotions", {
    id: serial().primaryKey(),
    legacyHistoricalRecordId: integer("legacy_historical_record_id"),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    shiftId: integer("shift_id_fk")
        .references(() => shiftModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    sectionId: integer("section_id_fk")
        .references(() => sectionModel.id),
    isAlumni: boolean("is_alumni")
        .notNull()
        .default(false),
    dateOfJoining: timestamp("date_of_joining"),
    classRollNumber: varchar("class_roll_number").notNull(),
    rollNumber: varchar("roll_number"),
    rollNumberSI: varchar("roll_number_si"),
    examNumber: varchar("exam_number"),
    examSerialNumber: varchar("exam_serial_number"),
    isExamFormSubmitted: boolean("is_exam_form_submitted").default(false),
    // promotionStatusId: integer("promotion_status_id_fk")
    //     .references(() => promotionStatusModel.id)
    //     .notNull(),
    examFormFillupId: integer("exam_form_fillup_id_fk")
        .references(() => examFormFillupModel.id),
    boardResultStatusId: integer("board_result_status_id_fk")
        .references(() => boardResultStatusModel.id),
    startDate: timestamp("start_date", {withTimezone: true}),
    endDate: timestamp("end_date", {withTimezone: true}),
    remarks: text("remarks"),
    isDeprecated: boolean("is_deprecated").default(false),
    examFormSubmissionTimeStamp: timestamp({withTimezone: true}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // The Real Time Tracker joins/filters this (large, previously index-less)
    // table heavily by these FKs. FK columns need explicit indexes in Postgres.
    programCourseIdx: index("promotions_program_course_id_idx").on(t.programCourseId),
    studentIdx: index("promotions_student_id_idx").on(t.studentId),
    sessionIdx: index("promotions_session_id_idx").on(t.sessionId),
    // Partial index matching the tracker's "active promotion" predicate
    // (ACTIVE_PROMOTION_SQL) so the affiliation aggregation scans only the
    // current, non-deprecated rows.
    activeIdx: index("promotions_active_idx")
        .on(t.programCourseId, t.studentId)
        .where(sql`${t.endDate} is null and coalesce(${t.isDeprecated}, false) = false`),
    // Roster reports join promotions → classes/sections/shifts per row.
    classIdx: index("promotions_class_id_idx").on(t.classId),
    sectionIdx: index("promotions_section_id_idx").on(t.sectionId),
    shiftIdx: index("promotions_shift_id_idx").on(t.shiftId),
}));

export const promotionInsertSchema = createInsertSchema(promotionModel);

export type PromotionInsertSchema = z.infer<typeof promotionInsertSchema>;

export type PromotionT = typeof promotionInsertSchema._type;



// export async function findPromotionByStudentIdAndClassId(studentId: number, classId: number) {
//   const [{promotions: promotion }] = await db
//     .select()
//     .from(promotionModel)
//     .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
//     .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
//     .where(
//       and(
//         eq(studentModel.id, studentId),
//         eq(classModel.id, classId),
//       )
//     );

//   return promotion;
// }


// export async function markExamFormSubmission(promotionId: number) {
//   const [updatedPromotion] = await db
//     .update(promotionModel)
//     .set({
//       isExamFormSubmitted: true
//     })
//     .where(
//       and(
//         eq(promotionModel.id, promotionId)
//       )
//     )
//     .returning();

//   return updatedPromotion;
// }

// export async function findPromotionByStudentIdAndClassId(studentId: number, classId: number) {
//   const [{promotions: promotion }] = await db
//     .select()
//     .from(promotionModel)
//     .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
//     .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
//     .where(
//       and(
//         eq(studentModel.id, studentId),
//         eq(classModel.id, classId),
//       )
//     );

//   return promotion;
// }


// export async function markExamFormSubmission(promotionId: number) {
//   const [updatedPromotion] = await db
//     .update(promotionModel)
//     .set({
//       isExamFormSubmitted: true
//     })
//     .where(
//       and(
//         eq(promotionModel.id, promotionId)
//       )
//     )
//     .returning();

//   return updatedPromotion;
// }