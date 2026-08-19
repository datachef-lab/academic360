import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { serviceTicketStatusEnum, ticketEventTypeEnum } from "@/schemas/enums";
import { userModel } from "@/schemas/models/user/user.model";
import { serviceTicketsModel } from "./service-tickets.model";

export const serviceTicketEventsModel = pgTable("service_ticket_events", {
    id: serial().primaryKey(),
    ticketId: integer("ticket_id_fk")
        .notNull()
        .references(() => serviceTicketsModel.id),
    eventType: ticketEventTypeEnum().notNull(),
    fromStatus: serviceTicketStatusEnum(),
    toStatus: serviceTicketStatusEnum(),
    actorUserId: integer("actor_user_id_fk")
        .references(() => userModel.id),
    metadata: jsonb(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const createServiceTicketEventsSchema = createInsertSchema(serviceTicketEventsModel);

export type ServiceTicketEvents = z.infer<typeof createServiceTicketEventsSchema>;

export type ServiceTicketEventsT = typeof serviceTicketEventsModel.$inferSelect;
