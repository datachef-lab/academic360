import { boolean, date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

// Address, phone, and email live on the `address` model with a `branch_id_fk`
// pointing back here — same polymorphic-parent pattern used for vendors,
// publishers, institutions, etc. Do not add inline address fields to branches.
export const branchModel = pgTable("library_branches", {
    id: serial().primaryKey(),
    legacyBranchId: integer(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 100 }),
    openingDate: date(),
    isActive: boolean().notNull().default(true),
    remarks: varchar({ length: 1000 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBranchSchema = createInsertSchema(branchModel);

export type Branch = z.infer<typeof createBranchSchema>;

export type BranchT = typeof createBranchSchema._type;
