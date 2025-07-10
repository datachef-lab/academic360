import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { paperModel } from "./paper.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const topicModel = pgTable("topics", {
    id: serial().primaryKey(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    disabled: boolean().default(false),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createTopicSchema = createInsertSchema(topicModel);

export type Topic = z.infer<typeof createTopicSchema>;