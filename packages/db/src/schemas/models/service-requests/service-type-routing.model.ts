import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { departmentModel } from "@/schemas/models/administration/department.model";

export const serviceTypeRoutingModel = pgTable("service_type_routing", {
    id: serial().primaryKey(),
    code: varchar({ length: 100 }).notNull().unique(),
    name: varchar({ length: 255 }).notNull(),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id),
    slaDays: integer().notNull(),
    requiresPhysicalPresenceDefault: boolean().notNull().default(false),
    requiresIdProof: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createServiceTypeRoutingSchema = createInsertSchema(serviceTypeRoutingModel);

export type ServiceTypeRouting = z.infer<typeof createServiceTypeRoutingSchema>;

export type ServiceTypeRoutingT = typeof serviceTypeRoutingModel.$inferSelect;
