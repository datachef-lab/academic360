import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { roomModel } from "./room.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examRoomModel = pgTable("exam_rooms", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    roomId: integer("room_id_fk")
        .references(() => roomModel.id)
        .notNull(),
    studentsPerBench: integer().notNull(),
    capacity: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamRoomSchema = createInsertSchema(examRoomModel);

export type ExamRoom = z.infer<typeof createExamRoomSchema>;

export type ExamRoomT = typeof examRoomModel.$inferSelect;