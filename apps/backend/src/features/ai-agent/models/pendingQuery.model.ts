import { integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { threadModel } from "./thread.model.js";
import { userModel } from "@/features/user/models/user.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pendingQueryModel = pgTable("pending_queries", {
    id: serial().primaryKey(),
    threadId: integer("thread_id_fk").notNull().references(() => threadModel.id),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    functionName: varchar({ length: 255 }).notNull(),
    receivedParams: jsonb("received_params").default({}),
    missingParams: jsonb("missing_params").notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pendingQueryRelations = relations(pendingQueryModel, ({ one }) => ({
    thread: one(threadModel, {
        fields: [pendingQueryModel.threadId],
        references: [threadModel.id],
    }),
    user: one(userModel, {
        fields: [pendingQueryModel.userId],
        references: [userModel.id],
    }),
}));

export const createPendingQuerySchema = createInsertSchema(pendingQueryModel);

export type PendingQuery = z.infer<typeof createPendingQuerySchema>;