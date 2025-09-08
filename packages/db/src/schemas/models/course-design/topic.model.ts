import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { paperModel } from "@/schemas/models/course-design";

export const topicModel = pgTable("topics", {
    id: serial().primaryKey(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    isActive: boolean().default(true),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createTopicSchema = createInsertSchema(topicModel) as z.ZodTypeAny;

export type Topic = z.infer<typeof createTopicSchema>;

export type TopicT = typeof createTopicSchema._type;