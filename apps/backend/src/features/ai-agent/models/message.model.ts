import { integer, jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { threadModel } from "./thread.model.js";
import { userModel } from "@/features/user/models/user.model.js";
import { senderTypeEnum } from "@/features/user/models/helper.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messageModel = pgTable("messages", {
    id: serial().primaryKey(),
    threadId: integer("thread_id_fk").notNull().references(() => threadModel.id),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    sender: senderTypeEnum().notNull(),
    content: jsonb("content").notNull(), // Store structured response
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const messageRelations = relations(messageModel, ({ one }) => ({
    thread: one(threadModel, {
        fields: [messageModel.threadId],
        references: [threadModel.id],
    }),
    user: one(userModel, {
        fields: [messageModel.userId],
        references: [userModel.id],
    }),
}));

export const createMessageSchema = createInsertSchema(messageModel);

export type Message = z.infer<typeof createMessageSchema>;