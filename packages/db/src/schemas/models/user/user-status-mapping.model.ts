import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "./user.model";
import { staffModel } from "./staff.model";
import { studentModel } from "./student.model";
import { promotionModel } from "../batches";

export const userStatusMappingModel = pgTable("user_status_mapping", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    staffId: integer("staff_id_fk")
        .references(() => staffModel.id),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id),
    suspendedReason: varchar({length: 255}),
    suspendedTillDate: timestamp({ withTimezone: true }),
    remarks: varchar({length: 255}),
    byUserId: integer("by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusSchema = createInsertSchema(userStatusMappingModel);

export type UserStatus = z.infer<typeof createUserStatusSchema>;

export type UserStatusT = typeof createUserStatusSchema._type;
