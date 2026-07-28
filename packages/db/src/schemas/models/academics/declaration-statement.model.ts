import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { declartionMasterStatementModel } from "./declaration-master-statement.model";
import { declartionModel } from "./declaration.model";

export const declartionStatementModel = pgTable('declaration_statements', {
    id: serial().primaryKey(),
    declarationMasterStatementId: integer("declaration_master_statement_id_fk")
        .references(() => declartionMasterStatementModel.id, { onDelete: "cascade" })
        .notNull(),
    declarationId: integer("declaration_id_fk")
        .references(() => declartionModel.id, { onDelete: "cascade" })
        .notNull(),
    isAgreed: boolean().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // One row per statement per declaration — re-submitting must not duplicate.
    uqDeclarationStatement: unique("uq_declaration_statement").on(
        t.declarationId,
        t.declarationMasterStatementId,
    ),
    declarationIdx: index("declaration_statements_declaration_id_idx").on(t.declarationId),
}));

export const createDeclartionStatementModel = createInsertSchema(declartionStatementModel);

export type DeclartionStatement = z.infer<typeof createDeclartionStatementModel>;

export type DeclartionStatementT = typeof createDeclartionStatementModel._type;