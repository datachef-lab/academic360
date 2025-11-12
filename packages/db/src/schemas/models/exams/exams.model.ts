// import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
// import { examTypeModel } from "./exam-type.model";
// import { classModel, sessionModel } from "../academics";
// import { examOrderTypeEnum } from "@/schemas/enums";
// import { paperModel } from "../course-design";

// export const examModel = pgTable("exams", {
//     id: serial().primaryKey(),
//     legacyExamAssginmentId: integer(),
//     name: varchar({ length: 500 }),
//     examTypeId: integer("exam_type_id_fk")
//         .references(() => examTypeModel.id)
//         .notNull(),
//     sessionId: integer("session_id_fk")
//         .references(() => sessionModel.id)
//         .notNull(),
//     classId: integer("class_id_fk")
//         .references(() => classModel.id)
//         .notNull(),
//     startTime: timestamp("start_time").notNull(),
//     endTime: timestamp("end_time").notNull(),
//     orderType: examOrderTypeEnum(),
//     paperId: integer("paper_id_fk")
//         .references(() => paperModel.id)
//         .notNull(),

//     sequence: integer().unique(),
//     isActive: boolean().default(true),
//     createdAt: timestamp().notNull().defaultNow(),
//     updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
// })