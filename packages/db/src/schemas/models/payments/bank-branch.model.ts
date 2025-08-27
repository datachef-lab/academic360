import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { bankModel } from "./bank.model";

export const bankBranchModel = pgTable("bank_branches", {
    id: serial("id").primaryKey(),
    legacyBankBranchId: integer("legacy_bank_branch_id"),
    bankId: integer("bank_id_fk")
        .references(() => bankModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    name: integer("name").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});