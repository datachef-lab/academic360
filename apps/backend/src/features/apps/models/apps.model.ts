import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appsModel = pgTable("apps", {
    id: serial().primaryKey(),
    name: varchar({ length: 700 }).notNull(),
    description: varchar({ length: 1000 }),
    icon: varchar({ length: 500 }),
    url: varchar({ length: 1000 }).notNull(),
    isActive: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAppsSchema = createInsertSchema(appsModel);

export type Apps = z.infer<typeof createAppsSchema>;