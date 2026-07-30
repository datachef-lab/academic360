import { documentCategoryEnum, documentContextEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documentModel = pgTable("document_types", {
    id: serial().primaryKey(),
    context: documentContextEnum().notNull(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 255 }),
    category: documentCategoryEnum().notNull(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDocumentModel = createInsertSchema(documentModel);

export type Document = z.infer<typeof createDocumentModel>;

export type DocumentT = typeof createDocumentModel._type;