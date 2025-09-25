import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { stateModel } from "../resources";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const postOfficeModel = pgTable("post_office", {
    id: serial().primaryKey(),
    legacyPostOfficeId: integer().notNull(),
    name: varchar({ length: 255 }).notNull(),
    stateId: integer("state_id_fk")
        .references(() => stateModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPostOfficeSchema = createInsertSchema(postOfficeModel);

export const postOfficeSchema = createSelectSchema(postOfficeModel);