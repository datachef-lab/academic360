import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "./user.model";
import { staffModel } from "./staff.model";
import { studentModel } from "./student.model";
import { promotionModel } from "../batches";
import { userStatusMasterModel } from "./user-status-master.model";
import { sessionModel } from "../academics";

export const userStatusMappingModel = pgTable("user_status_mapping", {
    id: serial().primaryKey(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    userStatusMasterId: integer("user_status_master_id_fk")
        .references(() => userStatusMasterModel.id)
        .notNull(),
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
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusMappingSchema = createInsertSchema(userStatusMappingModel);

export type UserStatusMapping = z.infer<typeof createUserStatusMappingSchema>;

export type UserStatusMappingT = typeof createUserStatusMappingSchema._type;
