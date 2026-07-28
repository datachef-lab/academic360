import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { certificateFieldMasterTypeEnum } from "@/schemas/enums";
import { declartionMasterStatementModel } from "./declaration-master-statement.model";

export const declartionMasterStatementFieldModel = pgTable('declaration_master_statement_fields', {
    id: serial().primaryKey(),
    declarationMasterStatementId: integer("declaration_master_statement_id_fk")
        .references(() => declartionMasterStatementModel.id, { onDelete: "cascade" })
        .notNull(),
    label: varchar({ length:500 }).notNull(),
    type: certificateFieldMasterTypeEnum().default("TEXT").notNull(),
    /** Render order of the inputs under a statement. */
    sequence: integer().notNull().default(1),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    statementIdx: index("declaration_master_statement_fields_statement_id_idx").on(
        t.declarationMasterStatementId,
    ),
}));

export const createDeclartionMasterStatementFieldModel = createInsertSchema(declartionMasterStatementFieldModel);

export type DeclartionMasterStatementField = z.infer<typeof createDeclartionMasterStatementFieldModel>;

export type DeclartionMasterStatementFieldT = typeof createDeclartionMasterStatementFieldModel._type;