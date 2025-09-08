import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const appsModel = pgTable("apps", {
    id: serial().primaryKey(),
    name: varchar({ length: 700 }).notNull(),
    collegeName: varchar({ length: 700 }).notNull(),
    collegeShortName: varchar({length: 7}).notNull(),
    description: varchar({ length: 1000 }),
    logo: varchar({ length: 5000 }),
    url: varchar({ length: 1000 }).notNull(),
    isActive: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAppsSchema = createInsertSchema(appsModel) as z.ZodTypeAny;

export type Apps = z.infer<typeof createAppsSchema>;

export type AppsT = typeof createAppsSchema._type;   