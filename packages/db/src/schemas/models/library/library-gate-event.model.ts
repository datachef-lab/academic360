import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { branchModel } from "./branch.model";
import { copyDetailsModel } from "./copy-details.model";
import { libraryZoneModel } from "./library-zone.model";
import { userModel } from "../user";

export const libraryGateEventModel = pgTable("library_gate_events", {
    id: serial().primaryKey(),
    branchId: integer("branch_id_fk")
        .references(() => branchModel.id),
    zoneId: integer("zone_id_fk")
        .references(() => libraryZoneModel.id),
    gateIdentifier: varchar({ length: 255 }),
    eventType: varchar({ length: 100 }).notNull(),
    rfidNumber: varchar({ length: 255 }),
    copyDetailsId: integer("copy_details_id_fk")
        .references(() => copyDetailsModel.id),
    userId: integer("user_id_fk")
        .references(() => userModel.id),
    capturedImageUrl: varchar({ length: 1000 }),
    remarks: varchar({ length: 1000 }),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp().notNull().defaultNow(),
});

export const createLibraryGateEventSchema = createInsertSchema(libraryGateEventModel);

export type LibraryGateEvent = z.infer<typeof createLibraryGateEventSchema>;

export type LibraryGateEventT = typeof createLibraryGateEventSchema._type;
