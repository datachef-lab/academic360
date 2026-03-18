import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { sessionModel } from "../academics";
import { institutionalRoleModel } from "./institutional-role.model";
import { userStatusMasterModel } from "./user-status-master.model";


export const sessionRoleModel = pgTable("session_roles", {
    id: serial().primaryKey(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    institutionalRoleId: integer("institutional_role_id_fk")
        .references(() =>institutionalRoleModel.id)
        .notNull(),
    userStatusMasterId: integer("user_status_master_id_fk")
        .references(() => userStatusMasterModel.id)
        .notNull(),
    remarks: varchar({length: 500}),
    suspendedTillDate: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});