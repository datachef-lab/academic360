import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const bankModel = pgTable("banks", {
    id: serial("id").primaryKey(),
    legacyBankId: varchar("legacy_bank_id", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    address: varchar("address", { length: 500 }),
    ifscCode: varchar("ifsc_code", { length: 20 }).notNull().unique(),
    swiftCode: varchar("swift_code", { length: 20 }).unique(),
    disabled: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createBankSchema = createInsertSchema(bankModel);

export type Bank = z.infer<typeof createBankSchema>;