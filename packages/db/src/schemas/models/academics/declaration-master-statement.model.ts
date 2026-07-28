import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { declartionMasterModel } from "./declaration-master.model";

export const declartionMasterStatementModel = pgTable('declaration_master_statements', {
    id: serial().primaryKey(),
    declarationMasterId: integer("declaration_master_id_fk")
        .references(() => declartionMasterModel.id, { onDelete: "cascade" })
        .notNull(),
    statement: text().notNull(),
    isRequired: boolean().default(true).notNull(),
    /** Display order of the statements (checkboxes) within a master. */
    sequence: integer().notNull().default(1),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    masterIdx: index("declaration_master_statements_master_id_idx").on(t.declarationMasterId),
}));

export const createdeclartionMasterStatementModel = createInsertSchema(declartionMasterStatementModel);

export type DeclartionMasterStatement = z.infer<typeof createdeclartionMasterStatementModel>;

export type DeclartionMasterStatementT = typeof createdeclartionMasterStatementModel._type;