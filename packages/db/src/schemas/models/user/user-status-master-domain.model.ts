import { userTypeEnum } from "@/schemas/enums";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { userStatusMasterModel } from "./user-status-master.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userStatusMasterDomainModel = pgTable("user_statuses_master_domain", {
    id: serial().primaryKey(),
    userStatusMasterId: integer("user_status_master_id_fk")
        .references(() => userStatusMasterModel.id)
        .notNull(),
    domain: userTypeEnum().notNull(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createUserStatusMasterDomainSchema = createInsertSchema(userStatusMasterDomainModel);

export type UserStatusMasterDomain = z.infer<typeof createUserStatusMasterDomainSchema>;

export type UserStatusMasterDomainT = typeof createUserStatusMasterDomainSchema._type;
