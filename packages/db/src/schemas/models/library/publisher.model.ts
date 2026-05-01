import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const publisherModel = pgTable("publishers", {
    id: serial().primaryKey(),
    legacyPublisherId: integer(),
    name: varchar({ length: 1000 }).notNull(),
    code: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPublisherSchema = createInsertSchema(publisherModel);

export type Publisher = z.infer<typeof createPublisherSchema>;

export type PublisherT = typeof createPublisherSchema._type;