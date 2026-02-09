import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userStatusMasterModel } from "./user-status-master.model";
import { userStatusMasterFrequencyTypeEnum } from "@/schemas/enums";

export const userStatusMasterFrequencyModel = pgTable("user_status_master_frequency", {
    id: serial().primaryKey(),
    userStatusMasterId: integer("user_status_master_id_fk")
            .references(() => userStatusMasterModel.id)
            .notNull(),
    frequency: userStatusMasterFrequencyTypeEnum().notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusMasterFrequencySchema = createInsertSchema(userStatusMasterFrequencyModel);

export type UserStatusMasterFrequency = z.infer<typeof createUserStatusMasterFrequencySchema>;

export type UserStatusMasterFrequencyT = typeof createUserStatusMasterFrequencySchema._type;