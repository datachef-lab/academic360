import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, time, timestamp } from "drizzle-orm/pg-core";

import { weekdayEnum } from "@/schemas/enums";
import { departmentModel } from "@/schemas/models/administration/department.model";

export const departmentSlotWindowsModel = pgTable("department_slot_windows", {
    id: serial().primaryKey(),
    departmentId: integer("department_id_fk")
        .notNull()
        .references(() => departmentModel.id),
    weekday: weekdayEnum().notNull(),
    startTime: time().notNull(),
    endTime: time().notNull(),
    slotDurationMinutes: integer().notNull().default(60),
    capacityPerSlot: integer().notNull(),
    isActive: boolean().notNull().default(true),
    effectiveFrom: date(),
    effectiveTo: date(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDepartmentSlotWindowsSchema = createInsertSchema(departmentSlotWindowsModel);

export type DepartmentSlotWindows = z.infer<typeof createDepartmentSlotWindowsSchema>;

export type DepartmentSlotWindowsT = typeof departmentSlotWindowsModel.$inferSelect;
