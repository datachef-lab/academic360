import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { departmentModel } from "@/schemas/models/administration/department.model";
import { departmentSlotWindowsModel } from "./department-slot-windows.model";

export const serviceSlotInstancesModel = pgTable("service_slot_instances", {
    id: serial().primaryKey(),
    departmentId: integer("department_id_fk")
        .notNull()
        .references(() => departmentModel.id),
    slotWindowId: integer("slot_window_id_fk")
        .notNull()
        .references(() => departmentSlotWindowsModel.id),
    slotDate: date().notNull(),
    startAt: timestamp({ withTimezone: true }).notNull(),
    endAt: timestamp({ withTimezone: true }).notNull(),
    capacity: integer().notNull(),
    bookedCount: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueDeptDateStart: uniqueIndex("service_slot_instances_dept_date_start_unique").on(
        table.departmentId,
        table.slotDate,
        table.startAt,
    ),
    bookedCountCheck: check(
        "service_slot_instances_booked_count_check",
        sql`${table.bookedCount} BETWEEN 0 AND ${table.capacity}`,
    ),
}));

export const createServiceSlotInstancesSchema = createInsertSchema(serviceSlotInstancesModel);

export type ServiceSlotInstances = z.infer<typeof createServiceSlotInstancesSchema>;

export type ServiceSlotInstancesT = typeof serviceSlotInstancesModel.$inferSelect;
