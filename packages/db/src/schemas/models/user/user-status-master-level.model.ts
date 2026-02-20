import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { userStatusMasterModel } from "./user-status-master.model";
import { userStatusMasterLevelTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userStatusMasterLevelModel = pgTable("user_status_master_level", {
    id: serial().primaryKey(),
    userStatusMasterId: integer("user_status_master_id_fk")
            .references(() => userStatusMasterModel.id)
            .notNull(),
    level: userStatusMasterLevelTypeEnum().notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusMasterLevelSchema = createInsertSchema(userStatusMasterLevelModel);

export type UserStatusMasterLevel = z.infer<typeof createUserStatusMasterLevelSchema>;

export type UserStatusMasterLevelT = typeof createUserStatusMasterLevelSchema._type;