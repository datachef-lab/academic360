import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const vendorModel = pgTable("vendors", {
    id: serial().primaryKey(),
    legacyVendorId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 500 }),
    email: varchar({ length: 500 }),
    phone: varchar({ length: 15 }),
    website: varchar({ length: 5000 }),
    personOfContact: varchar({ length: 1000 }),
    personOfContactEmail: varchar({ length: 500 }),
    personOfContactPhone: varchar({ length: 15 }),
    pan: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createVendorSchema = createInsertSchema(vendorModel);

export type Vendor = z.infer<typeof createVendorSchema>;

export type VendorT = typeof createVendorSchema._type;