import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const cancelSourceModel = pgTable("cancel_sources", {
    id: serial().primaryKey(),
    legacyCancelSourceId: integer("legacy_cancel_source_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createCancelSourceSchema = createInsertSchema(cancelSourceModel);

export type CancelSource = z.infer<typeof createCancelSourceSchema>;        