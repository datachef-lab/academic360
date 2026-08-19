import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { slotBookingStatusEnum } from "@/schemas/enums";
import { serviceTicketsModel } from "./service-tickets.model";
import { serviceSlotInstancesModel } from "./service-slot-instances.model";

export const serviceSlotBookingsModel = pgTable("service_slot_bookings", {
    id: serial().primaryKey(),
    ticketId: integer("ticket_id_fk")
        .notNull()
        .references(() => serviceTicketsModel.id),
    slotInstanceId: integer("slot_instance_id_fk")
        .notNull()
        .references(() => serviceSlotInstancesModel.id),
    status: slotBookingStatusEnum().notNull().default("BOOKED"),
    bookedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    uniqueActiveBookingPerTicket: uniqueIndex("service_slot_bookings_ticket_active_unique")
        .on(table.ticketId)
        .where(sql`${table.status} IN ('BOOKED', 'CHECKED_IN')`),
}));

export const createServiceSlotBookingsSchema = createInsertSchema(serviceSlotBookingsModel);

export type ServiceSlotBookings = z.infer<typeof createServiceSlotBookingsSchema>;

export type ServiceSlotBookingsT = typeof serviceSlotBookingsModel.$inferSelect;
