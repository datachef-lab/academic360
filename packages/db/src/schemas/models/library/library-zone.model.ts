import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { branchModel } from "./branch.model";

export const libraryZoneModel = pgTable("library_zones", {
    id: serial().primaryKey(),
    branchId: integer("branch_id_fk")
        .references(() => branchModel.id),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 100 }),
    description: varchar({ length: 1000 }),
    capacity: integer(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibraryZoneSchema = createInsertSchema(libraryZoneModel);

export type LibraryZone = z.infer<typeof createLibraryZoneSchema>;

export type LibraryZoneT = typeof createLibraryZoneSchema._type;
