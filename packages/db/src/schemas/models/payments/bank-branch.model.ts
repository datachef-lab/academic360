import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { bankModel } from "./bank.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const bankBranchModel = pgTable("bank_branches", {
    id: serial("id").primaryKey(),
    legacyBankBranchId: integer("legacy_bank_branch_id"),
    bankId: integer("bank_id_fk")
        .references(() => bankModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createBankBranchSchema = createInsertSchema(bankBranchModel);

export type BankBranch = z.infer<typeof createBankBranchSchema>;

export type BankBranchT = typeof createBankBranchSchema._type;