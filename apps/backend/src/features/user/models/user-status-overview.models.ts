/**
 * Local Drizzle model for `user_status_mapping` (not in @repo/db).
 * `user_statuses_master` reads use {@link userStatusMasterModel} from @repo/db.
 */
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userStatusMappingOverview = pgTable("user_status_mapping", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id_fk").notNull(),
  userStatusMasterId: integer("user_status_master_id_fk").notNull(),
  userId: integer("user_id_fk").notNull(),
  staffId: integer("staff_id_fk"),
  studentId: integer("student_id_fk"),
  promotionId: integer("promotion_id_fk"),
  suspendedReason: varchar("suspended_reason", { length: 255 }),
  suspendedTillDate: timestamp("suspended_till_date", { withTimezone: true }),
  remarks: varchar("remarks", { length: 255 }),
  byUserId: integer("by_user_id_fk").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
