import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { declarationMasterContextEnum } from "@/schemas/enums";

export const declartionMasterModel = pgTable('declaration_masters', {
    id: serial().primaryKey(),
    /** Human label for the admin console, e.g. "Fee Due Declaration". */
    name: varchar({ length: 255 }).notNull().default(''),
    context: declarationMasterContextEnum().notNull(),
    template: varchar({ length: 255 }).notNull().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDeclartionMasterModel = createInsertSchema(declartionMasterModel);

export type DeclartionMaster = z.infer<typeof createDeclartionMasterModel>;

export type DeclartionMasterT = typeof createDeclartionMasterModel._type;