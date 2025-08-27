import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const meritListModel = pgTable("merit_lists", {
    id: serial().primaryKey(),
    legacyMeritListId: integer("legacy_merit_list_id"),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }),
    checkAuto: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createMeritListSchema = createInsertSchema(meritListModel);

export type MeritList = z.infer<typeof createMeritListSchema>;