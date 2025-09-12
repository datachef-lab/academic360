import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const bankModel = pgTable("banks", {
    id: serial("id").primaryKey(),
    legacyBankId: integer(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 100 }),
    address: varchar("address", { length: 500 }),
    ifscCode: varchar("ifsc_code", { length: 20 }),
    swiftCode: varchar("swift_code", { length: 20 }),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createBankSchema = createInsertSchema(bankModel);

export type Bank = z.infer<typeof createBankSchema>;

export type BankT = typeof createBankSchema._type;