import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { foreignKey, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { declartionMasterStatementFieldModel } from "./declaration-master-statement-field.model";
import { declartionStatementModel } from "./declaration-statement.model";
import { declartionMasterStatementFieldOptionModel } from "./declaration-master-statement-field-option.model";

// FK constraints are named EXPLICITLY and short: drizzle's auto-generated names
// (table + column + referenced table) exceed Postgres' 63-byte identifier limit
// here, and `..._master_statement_field_id_fk...` / `..._master_statement_field_option_id_fk...`
// truncate to the SAME string — the second ADD CONSTRAINT then fails with
// "constraint ... already exists".
export const declartionStatementFieldModel = pgTable('declaration_statement_fields', {
    id: serial().primaryKey(),
    declarationMasterStatementFieldId: integer("declaration_master_statement_field_id_fk").notNull(),
    declarationStatementId: integer("declaration_statement_id_fk").notNull(),
    declarationMasterStatementFieldOptionId: integer("declaration_master_statement_field_option_id_fk"),
    value: text().default('').notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    masterFieldFk: foreignKey({
        columns: [t.declarationMasterStatementFieldId],
        foreignColumns: [declartionMasterStatementFieldModel.id],
        name: "decl_stmt_field_master_field_fk",
    }).onDelete("cascade"),
    statementFk: foreignKey({
        columns: [t.declarationStatementId],
        foreignColumns: [declartionStatementModel.id],
        name: "decl_stmt_field_statement_fk",
    }).onDelete("cascade"),
    optionFk: foreignKey({
        columns: [t.declarationMasterStatementFieldOptionId],
        foreignColumns: [declartionMasterStatementFieldOptionModel.id],
        name: "decl_stmt_field_option_fk",
    }).onDelete("cascade"),
    statementIdx: index("declaration_statement_fields_statement_id_idx").on(t.declarationStatementId),
}));

export const createDeclartionStatementFieldModel = createInsertSchema(declartionStatementFieldModel);

export type DeclartionStatementField = z.infer<typeof createDeclartionStatementFieldModel>;

export type DeclartionStatementFieldT = typeof createDeclartionStatementFieldModel._type;