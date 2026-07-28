import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { declartionMasterStatementFieldModel } from "./declaration-master-statement-field.model";

export const declartionMasterStatementFieldOptionModel = pgTable("declaration_master_statement_field_options", {
    id: serial().primaryKey(),
    declarationMasterStatementFieldId: integer("declaration_master_statement_field_id_fk")
        .references(() => declartionMasterStatementFieldModel.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length:500 }).notNull(),
    sequence: integer().notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDeclartionMasterStatementFieldOptionSchema = createInsertSchema(declartionMasterStatementFieldOptionModel);

export type DeclartionMasterStatementFieldOption = z.infer<typeof createDeclartionMasterStatementFieldOptionSchema>;

export type DeclartionMasterStatementFieldOptionT = typeof createDeclartionMasterStatementFieldOptionSchema._type;