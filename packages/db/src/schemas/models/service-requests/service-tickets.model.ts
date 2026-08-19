import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { serviceRequestorTypeEnum, serviceTicketStatusEnum } from "@/schemas/enums";
import { userModel } from "@/schemas/models/user/user.model";
import { serviceTypeRoutingModel } from "./service-type-routing.model";
import { serviceAlumniIntakeModel } from "./service-alumni-intake.model";
import { departmentModel } from "@/schemas/models/administration/department.model";

export const serviceTicketsModel = pgTable("service_tickets", {
    id: serial().primaryKey(),
    referenceId: varchar("reference_id", { length: 50 }).notNull(),
    requestorType: serviceRequestorTypeEnum().notNull(),
    studentUserId: integer("student_user_id_fk")
        .references(() => userModel.id),
    alumniIntakeId: integer("alumni_intake_id_fk")
        .references(() => serviceAlumniIntakeModel.id),
    serviceTypeId: integer("service_type_id_fk")
        .notNull()
        .references(() => serviceTypeRoutingModel.id),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id),
    status: serviceTicketStatusEnum().notNull().default("DRAFT"),
    slaDueAt: timestamp({ withTimezone: true }),
    contactEmail: varchar({ length: 500 }),
    contactPhone: varchar({ length: 20 }),
    contactVerified: boolean().notNull().default(false),
    requiresPhysicalPresence: boolean(),
    details: jsonb(),
    routedAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    closedAt: timestamp({ withTimezone: true }),
    approvedByUserId: integer("approved_by_user_id_fk")
        .references(() => userModel.id),
    rejectionReason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueReferenceId: uniqueIndex("service_tickets_reference_id_unique").on(table.referenceId),
    deptStatusIdx: index("idx_service_tickets_dept_status").on(table.departmentId, table.status),
    slaDueAtIdx: index("idx_service_tickets_sla_due_at").on(table.slaDueAt),
}));

export const createServiceTicketsSchema = createInsertSchema(serviceTicketsModel);

export type ServiceTickets = z.infer<typeof createServiceTicketsSchema>;

export type ServiceTicketsT = typeof serviceTicketsModel.$inferSelect;
