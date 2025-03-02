import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { streamModel } from "./stream.model.js";

export const courseModel = pgTable('courses', {
    id: serial().primaryKey(),
    streamId: integer("stream_id_fk").references(() => streamModel.id),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    codePrefix: varchar({ length: 10 }),
    universityCode: varchar({ length: 10 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const courseRelations = relations(courseModel, ({ one }) => ({
    stream: one(streamModel, {
        fields: [courseModel.streamId],
        references: [streamModel.id],
    })
}));

export const createCourseModel = createInsertSchema(courseModel);

export type Course = z.infer<typeof createCourseModel>;