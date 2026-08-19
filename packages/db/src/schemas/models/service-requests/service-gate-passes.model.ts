import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { AnyPgColumn, boolean, index, integer, jsonb, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { gatePassStatusEnum } from "@/schemas/enums";
import { userModel } from "@/schemas/models/user/user.model";
import { serviceTicketsModel } from "./service-tickets.model";
import { serviceSlotBookingsModel } from "./service-slot-bookings.model";

export const serviceGatePassesModel = pgTable("service_gate_passes", {
    id: serial().primaryKey(),
    ticketId: integer("ticket_id_fk")
        .notNull()
        .references(() => serviceTicketsModel.id),
    slotBookingId: integer("slot_booking_id_fk")
        .references(() => serviceSlotBookingsModel.id),
    nonce: varchar({ length: 512 }).notNull(),
    payload: jsonb(),
    status: gatePassStatusEnum().notNull().default("ACTIVE"),
    validFrom: timestamp({ withTimezone: true }).notNull(),
    validUntil: timestamp({ withTimezone: true }).notNull(),
    checkedInAt: timestamp({ withTimezone: true }),
    checkedInByUserId: integer("checked_in_by_user_id_fk")
        .references(() => userModel.id),
    isBypass: boolean().notNull().default(false),
    supersedesGatePassId: integer("supersedes_gate_pass_id_fk")
        .references((): AnyPgColumn => serviceGatePassesModel.id),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueNonce: uniqueIndex("service_gate_passes_nonce_unique").on(table.nonce),
    statusValidUntilIdx: index("idx_service_gate_passes_status_valid_until").on(table.status, table.validUntil),
}));

export const createServiceGatePassesSchema = createInsertSchema(serviceGatePassesModel);

export type ServiceGatePasses = z.infer<typeof createServiceGatePassesSchema>;

export type ServiceGatePassesT = typeof serviceGatePassesModel.$inferSelect;
