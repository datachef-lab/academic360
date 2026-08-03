import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const vendorModel = pgTable("vendors", {
    id: serial().primaryKey(),
    legacyVendorId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 500 }),
    email: varchar({ length: 500 }),
    // Widened from 15: IRP stores multiple comma-separated numbers in this
    // single field (e.g. "033-2249-0933, 033-2249-3102, 033-2252-0698"), so a
    // 15-char cap failed every library-load row that resolved back through a
    // vendor with more than one number. Same for personOfContactPhone below.
    phone: varchar({ length: 500 }),
    website: varchar({ length: 5000 }),
    personOfContact: varchar({ length: 1000 }),
    personOfContactEmail: varchar({ length: 500 }),
    personOfContactPhone: varchar({ length: 500 }),
    pan: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createVendorSchema = createInsertSchema(vendorModel);

export type Vendor = z.infer<typeof createVendorSchema>;

export type VendorT = typeof createVendorSchema._type;