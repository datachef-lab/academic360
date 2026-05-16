import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const bindingModel = pgTable("binding_types", {
    id: serial().primaryKey(),
    legacyBindingId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBindingSchema = createInsertSchema(bindingModel);

export type Binding = z.infer<typeof createBindingSchema>;

export type BindingT = typeof createBindingSchema._type;