import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documentModel = pgTable("documents", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 255 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDocumentModel = createInsertSchema(documentModel);

export type Document = z.infer<typeof createDocumentModel>;

export type DocumentT = typeof createDocumentModel._type;